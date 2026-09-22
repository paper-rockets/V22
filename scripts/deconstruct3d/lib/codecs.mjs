/**
 * Mesh decompression.
 *
 * Most GLBs in the wild are compressed - three quarters of this app's own model
 * library is Draco, and the rest is meshopt. Both decoders already ship inside
 * node_modules (three bundles Draco's wasm, meshoptimizer bundles its own), so
 * the deconstructor can open them without asking anyone to convert a file
 * first.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, '..', '..', '..');
const DRACO_DIR = path.join(PROJECT, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'draco', 'gltf');

let dracoModulePromise = null;

export function dracoAvailable() {
  return fs.existsSync(path.join(DRACO_DIR, 'draco_wasm_wrapper.js'));
}

async function getDraco() {
  if (!dracoModulePromise) {
    // three ships the decoder as a UMD script, but three's package.json says
    // "type": "module", so Node reads its .js files as ESM and the UMD tail
    // that assigns module.exports never runs. Evaluate it with a CommonJS
    // shape of its own instead.
    const source = fs.readFileSync(path.join(DRACO_DIR, 'draco_wasm_wrapper.js'), 'utf8');
    const shim = { exports: {} };
    const evaluate = new Function(
      'module', 'exports', 'require', '__dirname', '__filename', 'self', 'window', 'document',
      `${source}
return module.exports || (typeof DracoDecoderModule !== 'undefined' ? DracoDecoderModule : null);`
    );
    const factory = evaluate(shim, shim.exports, require, DRACO_DIR, path.join(DRACO_DIR, 'draco_wasm_wrapper.js'), undefined, undefined, undefined);
    if (typeof factory !== 'function') throw new Error('Could not load the bundled Draco decoder');
    const wasmBinary = fs.readFileSync(path.join(DRACO_DIR, 'draco_decoder.wasm'));
    dracoModulePromise = factory({ wasmBinary });
  }
  return dracoModulePromise;
}

const DRACO_ATTRIBUTE_TYPES = {
  POSITION: 'Float32Array',
  NORMAL: 'Float32Array',
  COLOR_0: 'Float32Array',
  TEXCOORD_0: 'Float32Array',
  TEXCOORD_1: 'Float32Array',
};

/**
 * Decodes one KHR_draco_mesh_compression primitive.
 * Returns { attributes: { POSITION: Float32Array, ... }, index: Uint32Array }.
 */
export async function decodeDraco(bytes, extension) {
  const draco = await getDraco();
  const decoder = new draco.Decoder();
  const buffer = new draco.DecoderBuffer();
  buffer.Init(new Int8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength), bytes.byteLength);

  try {
    const geometryType = decoder.GetEncodedGeometryType(buffer);
    if (geometryType !== draco.TRIANGULAR_MESH) {
      throw new Error('Draco primitive is not a triangular mesh');
    }
    const geometry = new draco.Mesh();
    const status = decoder.DecodeBufferToMesh(buffer, geometry);
    if (!status.ok() || geometry.ptr === 0) {
      throw new Error(`Draco decode failed: ${status.error_msg()}`);
    }

    const attributes = {};
    for (const [name, uniqueId] of Object.entries(extension.attributes)) {
      if (!(name in DRACO_ATTRIBUTE_TYPES)) continue;
      const attribute = decoder.GetAttributeByUniqueId(geometry, uniqueId);
      const components = attribute.num_components();
      const points = geometry.num_points();
      const values = points * components;
      const byteLength = values * Float32Array.BYTES_PER_ELEMENT;
      const ptr = draco._malloc(byteLength);
      decoder.GetAttributeDataArrayForAllPoints(geometry, attribute, draco.DT_FLOAT32, byteLength, ptr);
      attributes[name] = {
        array: new Float32Array(draco.HEAPF32.buffer, ptr, values).slice(),
        components,
      };
      draco._free(ptr);
    }

    const faces = geometry.num_faces();
    const indexBytes = faces * 3 * Uint32Array.BYTES_PER_ELEMENT;
    const indexPtr = draco._malloc(indexBytes);
    decoder.GetTrianglesUInt32Array(geometry, indexBytes, indexPtr);
    const index = new Uint32Array(draco.HEAPU32.buffer, indexPtr, faces * 3).slice();
    draco._free(indexPtr);

    draco.destroy(geometry);
    return { attributes, index };
  } finally {
    draco.destroy(buffer);
    draco.destroy(decoder);
  }
}

let meshoptReady = null;

/** Decodes one EXT_meshopt_compression buffer view. */
export async function decodeMeshopt(source, extension) {
  const { MeshoptDecoder } = require('meshoptimizer');
  if (!meshoptReady) meshoptReady = MeshoptDecoder.ready;
  await meshoptReady;
  const target = new Uint8Array(extension.count * extension.byteStride);
  MeshoptDecoder.decodeGltfBuffer(
    target,
    extension.count,
    extension.byteStride,
    source,
    extension.mode,
    extension.filter || 'NONE'
  );
  return target;
}

/**
 * glTF 2.0 / GLB reader.
 *
 * Reads the JSON + BIN chunks, resolves accessors (sparse ones and every
 * component type included), decompresses Draco and meshopt primitives, applies
 * the node hierarchy transforms, and merges everything into one flat indexed
 * triangle soup with POSITION / NORMAL / TEXCOORD_0 / COLOR_0 per vertex plus a
 * per-triangle material id.
 *
 * Nothing here is specific to one file: no hard-coded offsets, no assumed
 * attribute layout, no assumed compression.
 */

import fs from 'fs';
import { decodeDraco, decodeMeshopt, dracoAvailable } from './codecs.mjs';

const COMPONENT = {
  5120: { array: Int8Array, size: 1 },
  5121: { array: Uint8Array, size: 1 },
  5122: { array: Int16Array, size: 2 },
  5123: { array: Uint16Array, size: 2 },
  5125: { array: Uint32Array, size: 4 },
  5126: { array: Float32Array, size: 4 },
};

const NUM_COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

export async function readGLB(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 12 || buf.readUInt32LE(0) !== 0x46546c67) {
    throw new Error(`Not a binary glTF file: ${filePath}`);
  }
  const totalLength = buf.readUInt32LE(8);

  let json = null;
  let bin = null;
  let offset = 12;
  while (offset + 8 <= Math.min(totalLength, buf.length)) {
    const chunkLength = buf.readUInt32LE(offset);
    const chunkType = buf.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (chunkType === 0x4e4f534a) json = JSON.parse(buf.subarray(start, start + chunkLength).toString('utf8'));
    else if (chunkType === 0x004e4942) bin = buf.subarray(start, start + chunkLength);
    offset = start + chunkLength;
  }
  if (!json) throw new Error('GLB contains no JSON chunk');

  const required = json.extensionsRequired || [];
  if (required.includes('KHR_draco_mesh_compression') && !dracoAvailable()) {
    throw new Error('This model is Draco-compressed and the bundled decoder is missing from node_modules/three.');
  }

  const gltf = { json, bin, decodedViews: new Map() };

  // meshopt works at the buffer-view level, so decode those up front and every
  // accessor read below just works.
  const views = json.bufferViews || [];
  for (let i = 0; i < views.length; i++) {
    const ext = views[i].extensions?.EXT_meshopt_compression;
    if (!ext) continue;
    const source = bin.subarray(ext.byteOffset || 0, (ext.byteOffset || 0) + ext.byteLength);
    gltf.decodedViews.set(i, await decodeMeshopt(source, ext));
  }

  return gltf;
}

/** Raw bytes of a bufferView, decompressed if it was meshopt-encoded. */
export function bufferViewBytes(gltf, index) {
  const decoded = gltf.decodedViews.get(index);
  if (decoded) return decoded;
  const view = gltf.json.bufferViews[index];
  const start = view.byteOffset || 0;
  return gltf.bin.subarray(start, start + view.byteLength);
}

/**
 * Reads an accessor into a flat typed array of `count * numComponents` values.
 * Handles interleaved views (byteStride), sparse substitution and normalized
 * integer attributes.
 */
export function readAccessor(gltf, accessorIndex) {
  const acc = gltf.json.accessors[accessorIndex];
  const comp = COMPONENT[acc.componentType];
  if (!comp) throw new Error(`Unknown componentType ${acc.componentType}`);
  const n = NUM_COMPONENTS[acc.type];
  const out = new comp.array(acc.count * n);

  if (acc.bufferView !== undefined) {
    const bytes = bufferViewBytes(gltf, acc.bufferView);
    const view = gltf.json.bufferViews[acc.bufferView];
    const stride = view.byteStride || comp.size * n;
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const read = readerFor(acc.componentType, dv);
    const base = acc.byteOffset || 0;
    for (let i = 0; i < acc.count; i++) {
      const elem = base + i * stride;
      for (let c = 0; c < n; c++) out[i * n + c] = read(elem + c * comp.size);
    }
  }

  if (acc.sparse) {
    const s = acc.sparse;
    const idxComp = COMPONENT[s.indices.componentType];
    const idxBytes = bufferViewBytes(gltf, s.indices.bufferView);
    const valBytes = bufferViewBytes(gltf, s.values.bufferView);
    const idxView = new DataView(idxBytes.buffer, idxBytes.byteOffset, idxBytes.byteLength);
    const valView = new DataView(valBytes.buffer, valBytes.byteOffset, valBytes.byteLength);
    const readIdx = readerFor(s.indices.componentType, idxView);
    const readVal = readerFor(acc.componentType, valView);
    for (let i = 0; i < s.count; i++) {
      const target = readIdx((s.indices.byteOffset || 0) + i * idxComp.size);
      for (let c = 0; c < n; c++) {
        out[target * n + c] = readVal((s.values.byteOffset || 0) + (i * n + c) * comp.size);
      }
    }
  }

  if (acc.normalized && comp.array !== Float32Array) {
    const scale = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }[acc.componentType];
    const f = new Float32Array(out.length);
    for (let i = 0; i < out.length; i++) f[i] = Math.max(-1, out[i] / scale);
    return f;
  }
  return out;
}

function readerFor(componentType, dv) {
  switch (componentType) {
    case 5120: return (o) => dv.getInt8(o);
    case 5121: return (o) => dv.getUint8(o);
    case 5122: return (o) => dv.getInt16(o, true);
    case 5123: return (o) => dv.getUint16(o, true);
    case 5125: return (o) => dv.getUint32(o, true);
    case 5126: return (o) => dv.getFloat32(o, true);
    default: throw new Error(`Unknown componentType ${componentType}`);
  }
}

function multiply(a, b) {
  const out = new Float64Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function nodeMatrix(node) {
  if (node.matrix) return Float64Array.from(node.matrix);
  const t = node.translation || [0, 0, 0];
  const r = node.rotation || [0, 0, 0, 1];
  const s = node.scale || [1, 1, 1];
  const [x, y, z, w] = r;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  const m = new Float64Array(16);
  m[0] = (1 - (yy + zz)) * s[0]; m[1] = (xy + wz) * s[0]; m[2] = (xz - wy) * s[0]; m[3] = 0;
  m[4] = (xy - wz) * s[1]; m[5] = (1 - (xx + zz)) * s[1]; m[6] = (yz + wx) * s[1]; m[7] = 0;
  m[8] = (xz + wy) * s[2]; m[9] = (yz - wx) * s[2]; m[10] = (1 - (xx + yy)) * s[2]; m[11] = 0;
  m[12] = t[0]; m[13] = t[1]; m[14] = t[2]; m[15] = 1;
  return m;
}

const IDENTITY = Float64Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

/** Pulls one primitive's geometry out, whatever it is compressed with. */
async function primitiveGeometry(gltf, prim) {
  const dracoExt = prim.extensions?.KHR_draco_mesh_compression;
  if (dracoExt) {
    const bytes = bufferViewBytes(gltf, dracoExt.bufferView);
    const { attributes, index } = await decodeDraco(bytes, dracoExt);
    return {
      position: attributes.POSITION?.array || null,
      normal: attributes.NORMAL?.array || null,
      uv: attributes.TEXCOORD_0?.array || null,
      color: attributes.COLOR_0?.array || null,
      colorComponents: attributes.COLOR_0?.components || 0,
      index,
    };
  }
  const attr = prim.attributes;
  const colorAccessor = attr.COLOR_0 !== undefined ? gltf.json.accessors[attr.COLOR_0] : null;
  return {
    position: readAccessor(gltf, attr.POSITION),
    normal: attr.NORMAL !== undefined ? readAccessor(gltf, attr.NORMAL) : null,
    uv: attr.TEXCOORD_0 !== undefined ? readAccessor(gltf, attr.TEXCOORD_0) : null,
    color: attr.COLOR_0 !== undefined ? readAccessor(gltf, attr.COLOR_0) : null,
    colorComponents: colorAccessor ? NUM_COMPONENTS[colorAccessor.type] : 0,
    index: prim.indices !== undefined ? readAccessor(gltf, prim.indices) : null,
  };
}

/**
 * Flattens the default scene into one triangle soup in world space.
 * Returns { positions, normals, uvs, colors, indices, triMaterial, materials }.
 */
export async function flattenScene(gltf) {
  const json = gltf.json;
  const sceneIndex = json.scene ?? 0;
  const roots = json.scenes?.[sceneIndex]?.nodes ?? json.nodes?.map((_, i) => i) ?? [];

  const chunks = [];
  const visit = (nodeIndex, parentMatrix) => {
    const node = json.nodes[nodeIndex];
    const world = multiply(parentMatrix, nodeMatrix(node));
    if (node.mesh !== undefined) {
      for (const prim of json.meshes[node.mesh].primitives) {
        if (prim.mode !== undefined && prim.mode !== 4) continue; // triangles only
        chunks.push({ prim, world });
      }
    }
    for (const child of node.children || []) visit(child, world);
  };
  for (const r of roots) visit(r, IDENTITY);
  if (!chunks.length) throw new Error('Model contains no triangle geometry');

  let vertexTotal = 0;
  let indexTotal = 0;
  const parsed = [];
  for (const { prim, world } of chunks) {
    const geo = await primitiveGeometry(gltf, prim);
    const count = geo.position.length / 3;
    const triCount = geo.index ? geo.index.length / 3 : count / 3;
    vertexTotal += count;
    indexTotal += triCount * 3;
    parsed.push({ ...geo, count, triCount, world, material: prim.material ?? -1 });
  }

  const positions = new Float32Array(vertexTotal * 3);
  const normals = new Float32Array(vertexTotal * 3);
  const uvs = new Float32Array(vertexTotal * 2);
  const colors = new Float32Array(vertexTotal * 3).fill(1);
  const indices = new Uint32Array(indexTotal);
  const triMaterial = new Int16Array(indexTotal / 3);

  let vOff = 0, iOff = 0, tOff = 0;
  let anyNormals = true, anyUVs = true, anyColors = false;

  for (const p of parsed) {
    const m = p.world;
    if (!p.normal) anyNormals = false;
    if (!p.uv) anyUVs = false;
    if (p.color) anyColors = true;

    for (let i = 0; i < p.count; i++) {
      const x = p.position[i * 3], y = p.position[i * 3 + 1], z = p.position[i * 3 + 2];
      positions[(vOff + i) * 3] = m[0] * x + m[4] * y + m[8] * z + m[12];
      positions[(vOff + i) * 3 + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
      positions[(vOff + i) * 3 + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
      if (p.normal) {
        const nx = p.normal[i * 3], ny = p.normal[i * 3 + 1], nz = p.normal[i * 3 + 2];
        const tx = m[0] * nx + m[4] * ny + m[8] * nz;
        const ty = m[1] * nx + m[5] * ny + m[9] * nz;
        const tz = m[2] * nx + m[6] * ny + m[10] * nz;
        const len = Math.hypot(tx, ty, tz) || 1;
        normals[(vOff + i) * 3] = tx / len;
        normals[(vOff + i) * 3 + 1] = ty / len;
        normals[(vOff + i) * 3 + 2] = tz / len;
      }
      if (p.uv) {
        uvs[(vOff + i) * 2] = p.uv[i * 2];
        uvs[(vOff + i) * 2 + 1] = p.uv[i * 2 + 1];
      }
      if (p.color) {
        const c = p.colorComponents || 3;
        colors[(vOff + i) * 3] = p.color[i * c];
        colors[(vOff + i) * 3 + 1] = p.color[i * c + 1];
        colors[(vOff + i) * 3 + 2] = p.color[i * c + 2];
      }
    }
    for (let t = 0; t < p.triCount; t++) {
      for (let c = 0; c < 3; c++) {
        const local = p.index ? p.index[t * 3 + c] : t * 3 + c;
        indices[iOff + t * 3 + c] = vOff + local;
      }
      triMaterial[tOff + t] = p.material;
    }
    vOff += p.count;
    iOff += p.triCount * 3;
    tOff += p.triCount;
  }

  const mesh = {
    positions, normals, uvs, colors, indices, triMaterial,
    hasNormals: anyNormals,
    hasUVs: anyUVs,
    hasColors: anyColors,
    materials: json.materials || [],
  };
  if (!anyNormals) computeVertexNormals(mesh);
  return mesh;
}

/** Area-weighted smooth normals, for models exported without them. */
export function computeVertexNormals(mesh) {
  const { positions, indices, normals } = mesh;
  normals.fill(0);
  for (let t = 0; t < indices.length / 3; t++) {
    const a = indices[t * 3] * 3, b = indices[t * 3 + 1] * 3, c = indices[t * 3 + 2] * 3;
    const e1x = positions[b] - positions[a], e1y = positions[b + 1] - positions[a + 1], e1z = positions[b + 2] - positions[a + 2];
    const e2x = positions[c] - positions[a], e2y = positions[c + 1] - positions[a + 1], e2z = positions[c + 2] - positions[a + 2];
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;
    for (const v of [a, b, c]) {
      normals[v] += nx; normals[v + 1] += ny; normals[v + 2] += nz;
    }
  }
  for (let i = 0; i < normals.length; i += 3) {
    const l = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= l; normals[i + 1] /= l; normals[i + 2] /= l;
  }
  mesh.hasNormals = true;
}

/**
 * Resolves which image backs a material slot.
 * slot: 'baseColor' | 'metallicRoughness' | 'normal' | 'emissive'
 */
export function materialImage(gltf, materialIndex, slot) {
  const mat = gltf.json.materials?.[materialIndex];
  if (!mat) return null;
  const pbr = mat.pbrMetallicRoughness || {};
  const ref =
    slot === 'baseColor' ? pbr.baseColorTexture
      : slot === 'metallicRoughness' ? pbr.metallicRoughnessTexture
        : slot === 'normal' ? mat.normalTexture
          : mat.emissiveTexture;
  if (!ref) return null;
  const tex = gltf.json.textures?.[ref.index];
  if (!tex) return null;
  const source = tex.source ?? tex.extensions?.EXT_texture_webp?.source ?? tex.extensions?.KHR_texture_basisu?.source;
  if (source === undefined) return null;
  const image = gltf.json.images?.[source];
  const basis = tex.extensions?.KHR_texture_basisu !== undefined
    || image?.mimeType === 'image/ktx2';
  return { imageIndex: source, texCoord: ref.texCoord || 0, basis };
}

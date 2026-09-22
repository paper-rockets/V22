/**
 * Texture sampling for the deconstructor.
 *
 * glTF embeds textures as JPEG/PNG inside the BIN chunk. Node has no image
 * decoder, so we hand the bytes to Pillow once, cache the raw RGBA next to the
 * model, and sample it here with proper bilinear filtering + sRGB handling.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { bufferViewBytes, materialImage } from './glb.mjs';

const PY_DECODER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'decode_image.py');

export function decodeImageToRGBA(bytes, mimeType, cacheDir, maxSize = 2048) {
  fs.mkdirSync(cacheDir, { recursive: true });
  const hash = crypto.createHash('sha1').update(bytes).update(String(maxSize)).digest('hex').slice(0, 16);
  const rawPath = path.join(cacheDir, `${hash}.rgba`);
  const metaPath = path.join(cacheDir, `${hash}.json`);

  if (fs.existsSync(rawPath) && fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    return { data: fs.readFileSync(rawPath), width: meta.width, height: meta.height, cached: true };
  }

  const ext = mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg';
  const tmpImage = path.join(cacheDir, `${hash}${ext}`);
  fs.writeFileSync(tmpImage, bytes);
  const out = execFileSync('python', [PY_DECODER, tmpImage, rawPath, String(maxSize)], { encoding: 'utf8' });
  const [width, height] = out.trim().split(/\s+/).map(Number);
  fs.writeFileSync(metaPath, JSON.stringify({ width, height }));
  fs.unlinkSync(tmpImage);
  return { data: fs.readFileSync(rawPath), width, height, cached: false };
}

export class TextureMap {
  constructor({ data, width, height }) {
    this.data = data;
    this.width = width;
    this.height = height;
  }

  /** Bilinear sample, repeat wrap, glTF UV origin (v=0 at the top of the image). */
  sample(u, v, out = [0, 0, 0, 0]) {
    const w = this.width, h = this.height;
    let x = (((u % 1) + 1) % 1) * w - 0.5;
    let y = (((1 - v) % 1 + 1) % 1) * h - 0.5;
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const x1 = x0 + 1, y1 = y0 + 1;
    const wrapX = (i) => ((i % w) + w) % w;
    const wrapY = (i) => ((i % h) + h) % h;
    const ax = wrapX(x0), bx = wrapX(x1), ay = wrapY(y0), by = wrapY(y1);
    const d = this.data;
    const i00 = (ay * w + ax) * 4, i10 = (ay * w + bx) * 4;
    const i01 = (by * w + ax) * 4, i11 = (by * w + bx) * 4;
    const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
    for (let c = 0; c < 4; c++) {
      out[c] = d[i00 + c] * w00 + d[i10 + c] * w10 + d[i01 + c] * w01 + d[i11 + c] * w11;
    }
    return out;
  }
}

/** Loads every texture slot we care about for each material in the file. */
export function loadMaterialTextures(gltf, cacheDir, maxSize) {
  const images = gltf.json.images || [];
  const decoded = new Map();

  const getImage = (imageIndex) => {
    if (decoded.has(imageIndex)) return decoded.get(imageIndex);
    const img = images[imageIndex];
    let bytes;
    if (img.bufferView !== undefined) bytes = bufferViewBytes(gltf, img.bufferView);
    else if (img.uri && img.uri.startsWith('data:')) bytes = Buffer.from(img.uri.split(',')[1], 'base64');
    else throw new Error(`Image ${imageIndex} uses an external URI (${img.uri}) which is not supported`);
    const raw = decodeImageToRGBA(bytes, img.mimeType || 'image/jpeg', cacheDir, maxSize);
    const map = new TextureMap(raw);
    decoded.set(imageIndex, map);
    return map;
  };

  const unsupported = [];
  const perMaterial = (gltf.json.materials || []).map((mat, i) => {
    let base = materialImage(gltf, i, 'baseColor');
    let mr = materialImage(gltf, i, 'metallicRoughness');
    // KTX2 / Basis textures need a GPU transcoder we do not have offline; the
    // model still draws, using its material colour and any vertex colours.
    if (base?.basis) { unsupported.push(mat.name || `material_${i}`); base = null; }
    if (mr?.basis) mr = null;
    const pbr = mat.pbrMetallicRoughness || {};
    return {
      baseColor: base ? getImage(base.imageIndex) : null,
      baseColorUV: base ? base.texCoord : 0,
      metallicRoughness: mr ? getImage(mr.imageIndex) : null,
      baseColorFactor: pbr.baseColorFactor || [1, 1, 1, 1],
      metallicFactor: pbr.metallicFactor ?? 1,
      roughnessFactor: pbr.roughnessFactor ?? 1,
      alphaMode: mat.alphaMode || 'OPAQUE',
      name: mat.name || `material_${i}`,
    };
  });

  perMaterial.unsupportedTextures = unsupported;
  if (!perMaterial.length) {
    perMaterial.push({
      baseColor: null, baseColorUV: 0, metallicRoughness: null,
      baseColorFactor: [0.8, 0.8, 0.8, 1], metallicFactor: 0, roughnessFactor: 0.7,
      name: 'default',
    });
  }
  return perMaterial;
}

// ---- colour space helpers -------------------------------------------------

export function srgbToLinear(c) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

export function linearToSrgb255(x) {
  const c = x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(c * 255)));
}

export function hexOf(rLin, gLin, bLin) {
  return (
    '#' +
    [rLin, gLin, bLin]
      .map((v) => linearToSrgb255(v).toString(16).padStart(2, '0'))
      .join('')
  );
}

/** Linear sRGB -> OKLab, for perceptually meaningful colour distances. */
export function linearToOklab(r, g, b) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabDistance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** OKLab -> linear sRGB (inverse of linearToOklab). */
export function oklabToLinear(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

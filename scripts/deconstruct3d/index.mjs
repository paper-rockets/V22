#!/usr/bin/env node
/**
 * 3D model -> hand-drawn 3D stroke set.
 *
 * Reads any GLB (Draco and meshopt included), works out which of its surface a
 * viewer can actually see, wraps that surface in contour lines, and cuts those
 * lines into individual brush strokes carrying the texture's own colours - then
 * puts the hand back in: tremor, drift, pressure, overshoot, and the occasional
 * stroke that goes wrong.
 *
 * The output is the app's replay format, so the drawing is rebuilt stroke by
 * stroke by the real brush engine with no model in the scene.
 *
 * Usage:
 *   node scripts/deconstruct3d/index.mjs --model <file.glb> --strokes 2000
 *
 * Options:
 *   --model <path>     source GLB                                  (required)
 *   --out <path>       output JSON       (default public/demos/model-<preset>.json)
 *   --strokes <n>      how many strokes to spend, e.g. 500 .. 6000 (default 2000)
 *   --preset <name>    paint | lineart | hybrid                    (default paint)
 *   --fit <n>          world height of the drawing                 (default 3.6)
 *   --seed <int>       reproducible randomness                     (default 20260922)
 *   --texture <px>     texture decode resolution                   (default 2048)
 *   --hand <n>         0 = ruler straight, 1 = normal, 2 = shaky   (default 1)
 *   --accurate         match the model as closely as the budget allows:
 *                      exact texture colour, no stylistic shift, a steadier
 *                      hand and a tighter weave
 *   --no-cull          keep hidden interior geometry
 *   --no-calibrate     skip the stroke-count calibration pass
 *   --stats            print the per-pass breakdown
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readGLB, flattenScene } from './lib/glb.mjs';
import { loadMaterialTextures, srgbToLinear, linearToOklab, oklabDistance } from './lib/texture.mjs';
import {
  computeBounds, normalizeInPlace, triangleData, weldVertices, creaseEdges,
  makeRandom, makeNoise1D, buildAdjacency, smoothNormalField, closeMask,
} from './lib/mesh.mjs';
import { computeExposure, cacheKeyFor } from './lib/visibility.mjs';
import { chainEdges } from './lib/chain.mjs';
import { Painter, orderStrokes } from './lib/painter.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, '..', '..');
const CACHE = path.join(HERE, '.cache');

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const args = {
    model: null, out: null, strokes: 2000, preset: 'paint', fit: 3.6,
    seed: 20260922, texture: 2048, hand: 1, cull: true, calibrate: true, stats: false,
    accurate: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--model': args.model = next(); break;
      case '--out': args.out = next(); break;
      case '--strokes': args.strokes = Number(next()); break;
      case '--preset': args.preset = next(); break;
      case '--fit': args.fit = Number(next()); break;
      case '--seed': args.seed = Number(next()); break;
      case '--texture': args.texture = Number(next()); break;
      case '--hand': args.hand = Number(next()); break;
      case '--accurate': args.accurate = true; break;
      case '--no-cull': args.cull = false; break;
      case '--no-calibrate': args.calibrate = false; break;
      case '--stats': args.stats = true; break;
      case '--help': case '-h': printHelp(); process.exit(0); break;
      default: throw new Error(`Unknown option ${a}`);
    }
  }
  if (args.accurate) args.hand = Math.min(args.hand, 0.3);
  if (!args.model) throw new Error('--model <file.glb> is required');
  if (!(args.strokes > 0)) throw new Error('--strokes must be a positive number');
  return args;
}

function printHelp() {
  const src = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
  console.log(src.slice(src.indexOf('/**') + 3, src.indexOf('*/')).replace(/^ \* ?/gm, ''));
}

// --------------------------------------------------------------- pass plans
//
// Every spacing is a multiple of one number, the weave: how far apart the
// contour lines sit. Calibration solves for the weave that spends exactly the
// requested number of strokes, so the same command gives a comparable drawing
// of any model at any budget.

const WEAVE = { block: 1.7, form: 1.0, detail: 0.72, accent: 1.15, point: 0.45 };

function passPlan(preset, weave, budget, hand, accurate = false) {
  const w = {
    block: weave * WEAVE.block,
    form: weave,
    detail: weave * WEAVE.detail,
    accent: weave * WEAVE.accent,
    point: weave * WEAVE.point,
  };
  // A ribbon is 3 * size * pressure wide. Pressure also carries the taper and
  // the hand's variation, which average around 0.75, so the nominal size has
  // to be about 0.7 * spacing for neighbouring contours to actually meet
  // rather than leave a hairline of background between every pass.
  const h = (values) => {
    const out = { ...values };
    for (const k of ['wobble', 'drift', 'lift']) out[k] = (out[k] ?? 0) * hand;
    out.slip = (out.slip ?? 0) * hand;
    return out;
  };

  const underpaint = {
    name: 'underpaint',
    spacing: w.block,
    pointSpacing: w.point * 2.2,
    lengths: [0.7, 1.2, 1.8, 2.6],
    size: w.block * 0.44,
    sizeVariation: [0.75, 1.5],
    colorTolerance: 0.17,
    colorJitter: 0.03,
    valueShift: -0.015,
    chromaBoost: 0.92,
    gapRatio: [0.03, 0.4],
    minPoints: 4,
    share: 0.08,
    coverage: true,
    human: h({ wobble: 0.14, drift: 0.22, lift: 0.03, pressure: [0.55, 0.95], taper: [0.12, 0.3], overshoot: 0.3, slip: 0.04 }),
  };

  const form = {
    name: 'form',
    spacing: w.form,
    pointSpacing: w.point,
    lengths: [0.25, 0.45, 0.75, 1.2, 1.8],
    size: w.form * 0.72,
    sizeVariation: [0.8, 1.3],
    colorTolerance: 0.1,
    colorJitter: 0.018,
    gapRatio: [0.01, 0.28],
    minPoints: 3,
    breakAngle: 1.15,
    share: 0.42,
    coverage: true,
    human: h({ wobble: 0.09, drift: 0.12, lift: 0.02, pressure: [0.75, 1.0], taper: [0.05, 0.15], overshoot: 0.18, slip: 0.015 }),
  };

  const detail = {
    name: 'detail',
    spacing: w.detail,
    pointSpacing: w.point * 0.8,
    lengths: [0.07, 0.14, 0.26, 0.45],
    size: w.detail * 0.4,
    sizeVariation: [0.55, 1.15],
    colorTolerance: 0.038,
    colorJitter: 0.014,
    chromaBoost: 1.06,
    gapRatio: [0.04, 0.5],
    minPoints: 3,
    breakAngle: 0.95,
    phase: 0.37,
    filter: 'detail',
    share: 0.18,
    human: h({ wobble: 0.13, drift: 0.11, lift: 0.025, pressure: [0.7, 1.0], taper: [0.05, 0.14], overshoot: 0.25, slip: 0.02 }),
  };

  const accents = {
    name: 'accents',
    spacing: w.accent,
    pointSpacing: w.point * 0.6,
    lengths: [0.02, 0.04, 0.07],
    size: w.detail * 0.24,
    sizeVariation: [0.45, 1.1],
    colorTolerance: 0.03,
    colorJitter: 0.026,
    chromaBoost: 1.25,
    valueShift: 0.035,
    gapRatio: [0.5, 1.8],
    minPoints: 2,
    phase: 0.71,
    filter: 'accent',
    share: 0.06,
    human: h({ wobble: 0.2, drift: 0.16, lift: 0.04, pressure: [0.6, 1.0], taper: [0.05, 0.14], overshoot: 0.45, slip: 0.04 }),
  };

  const lines = {
    name: 'lines',
    source: 'creases',
    pointSpacing: w.point * 0.75,
    lengths: [0.12, 0.25, 0.45, 0.8],
    size: Math.max(0.0035, w.form * 0.1),
    sizeVariation: [0.7, 1.4],
    profile: 'ribbon',
    colorTolerance: 0.5,
    colorJitter: 0.015,
    valueShift: -0.1,
    chromaBoost: 0.8,
    gapRatio: [0.04, 0.45],
    minPoints: 2,
    breakAngle: 0.85,
    share: 0.26,
    human: h({ wobble: 0.16, drift: 0.14, lift: 0.05, pressure: [0.65, 1.0], taper: [0.06, 0.18], overshoot: 0.35, slip: 0.03 }),
  };

  let passes;
  if (preset === 'lineart') {
    passes = [
      { ...lines, share: 0.58, size: Math.max(0.004, w.form * 0.13) },
      {
        ...form,
        spacing: w.form * 2.2,
        size: Math.max(0.003, w.form * 0.1),
        profile: 'ribbon',
        lengths: [0.12, 0.25, 0.45, 0.8],
        gapRatio: [0.25, 1.1],
        valueShift: -0.06,
        share: 0.42,
        human: h({ wobble: 0.22, drift: 0.26, lift: 0.1, pressure: [0.5, 0.95], taper: [0.1, 0.28], overshoot: 0.7, slip: 0.04 }),
      },
    ];
  } else if (preset === 'hybrid') {
    passes = [
      { ...underpaint, share: 0.1 },
      { ...form, share: 0.34 },
      { ...detail, share: 0.16 },
      { ...lines, share: 0.34 },
      { ...accents, share: 0.06 },
    ];
  } else {
    passes = [underpaint, form, detail, accents, lines];
  }

  return passes.map((p) => ({
    ...p,
    // In accurate mode the paint reports the texture and nothing else: no
    // value shift, no chroma push, no per-stroke colour wobble, and a tighter
    // tolerance so a stroke never averages across two different colours.
    ...(accurate ? {
      colorJitter: 0,
      valueShift: 0,
      chromaBoost: 1,
      colorTolerance: Math.min(p.colorTolerance ?? 0.06, 0.03),
    } : null),
    // Coverage passes get headroom: trimming them is what leaves holes in the
    // paint. Everything else is decoration and can be cut to fit.
    maxStrokes: Math.max(1, Math.round(budget * p.share * (p.coverage ? 1.5 : 1))),
  }));
}

// --------------------------------------------------------------------- main

async function main() {
  const args = parseArgs(process.argv);
  const label = (s) => `  ${s.padEnd(34, '.')}`;
  const t0 = Date.now();
  console.log(`\n3D deconstructor  -  ${path.basename(args.model)}`);
  console.log(`  ${args.preset} / ${args.strokes} strokes / hand ${args.hand} / seed ${args.seed}\n`);

  // 1. Geometry -------------------------------------------------------------
  let t = Date.now();
  const gltf = await readGLB(args.model);
  const compression = (gltf.json.extensionsRequired || []).filter((e) => /draco|meshopt/i.test(e));
  const mesh = await flattenScene(gltf);
  console.log(label('mesh'), `${(mesh.indices.length / 3).toLocaleString()} triangles, ${(mesh.positions.length / 3).toLocaleString()} vertices${compression.length ? ` [${compression.join(' + ')}]` : ''}  (${Date.now() - t}ms)`);
  if (!mesh.hasUVs) console.log(label(''), 'no UVs - colouring from vertex colours / material factors');

  const sourceBounds = computeBounds(mesh.positions);
  const norm = normalizeInPlace(mesh.positions, { fitHeight: args.fit });
  const tri = triangleData(mesh.positions, mesh.indices);
  const weld = weldVertices(mesh.positions, 1e-5);
  mesh.remap = weld.remap;
  const adjacency = buildAdjacency(mesh.indices, weld.remap);
  console.log(label('normalised'), `x${norm.scale.toFixed(3)} -> ${norm.bounds.size.map((v) => v.toFixed(2)).join(' x ')}, surface area ${tri.totalArea.toFixed(1)}`);

  // 2. Textures -------------------------------------------------------------
  t = Date.now();
  const materials = loadMaterialTextures(gltf, CACHE, args.texture);
  const withMaps = materials.filter((m) => m.baseColor).length;
  console.log(label('textures'), `${materials.length} material(s), ${withMaps} with a colour map  (${Date.now() - t}ms)`);
  if (materials.unsupportedTextures?.length) {
    console.log(label(''), `KTX2/Basis textures cannot be decoded offline (${materials.unsupportedTextures.join(', ')})`);
  }

  // 3. What can actually be seen -------------------------------------------
  t = Date.now();
  let keep = new Uint8Array(tri.triCount).fill(1);
  if (args.cull) {
    const key = cacheKeyFor(args.model, fs.statSync(args.model).size, args.fit, tri.triCount, 'v3');
    const result = computeExposure({ positions: mesh.positions, indices: mesh.indices, tri }, {
      rays: 7, spreadDeg: 62, cacheKey: key, cacheDir: CACHE,
      onProgress: (done, total) => process.stdout.write(`\r  culling hidden geometry ........ ${Math.round((done / total) * 100)}%  `),
    });
    for (let i = 0; i < tri.triCount; i++) {
      if (result.exposure[i] < 0.08) keep[i] = 0;
      else if (result.flipped[i]) flipTriangleNormal(mesh, tri, i);
    }
    keep = closeMask(keep, adjacency, 2);
    const visible = count(keep);
    process.stdout.write('\r');
    console.log(label('visible surface'), `${visible.toLocaleString()} of ${tri.triCount.toLocaleString()} triangles, ${(((tri.triCount - visible) / tri.triCount) * 100).toFixed(1)}% sealed inside  ${result.cached ? '[cached]' : `(${Date.now() - t}ms)`}`);
  }
  const visibleArea = areaOf(tri, keep);

  // 4. Where the detail lives ----------------------------------------------
  t = Date.now();
  const creases = creaseEdges(mesh.positions, mesh.indices, { remap: weld.remap }, 38)
    .filter((e) => e.faces.some((f) => keep[f]));
  const nearCrease = new Uint8Array(tri.triCount);
  for (const e of creases) for (const f of e.faces) nearCrease[f] = 1;

  const contrast = textureContrast(mesh, tri, materials, keep);
  const detailFilter = new Uint8Array(tri.triCount);
  const accentFilter = new Uint8Array(tri.triCount);
  for (let i = 0; i < tri.triCount; i++) {
    if (!keep[i]) continue;
    if (contrast[i] > 0.055 || nearCrease[i]) detailFilter[i] = 1;
    if (contrast[i] > 0.13) accentFilter[i] = 1;
  }
  console.log(label('detail map'), `${creases.length.toLocaleString()} crease edges, ${count(detailFilter).toLocaleString()} detail / ${count(accentFilter).toLocaleString()} accent triangles  (${Date.now() - t}ms)`);

  // 5. Paint ----------------------------------------------------------------
  const normalField = smoothNormalField(tri, adjacency, 8);
  // Calibration draws from its own stream so the finished drawing depends only
  // on the seed, not on how many probe runs it took to hit the budget.
  const random = makeRandom(args.seed);
  const calibrationRandom = makeRandom(args.seed ^ 0x5bf03635);
  const noise = makeNoise1D(makeRandom(args.seed ^ 0x9e3779b9));
  const options = {
    coverage: args.accurate ? 1.3 : 1.18, gate: 0.78, gateOverlap: 0.07, normalField,
    // Past this the paint stops reading as strokes and starts reading as slabs,
    // so a budget too small for the model degrades into an open sketch rather
    // than a blob.
    maxWidth: args.fit * 0.055,
  };
  const painter = new Painter({ mesh, tri, materials, random, noise, options });
  const prober = new Painter({ mesh, tri, materials, random: calibrationRandom, noise, options });

  const creasePolylines = chainEdges(creases, mesh, weld.remap);
  const filters = { detail: detailFilter, accent: accentFilter };

  // Start from a weave in the right ballpark for the drawing's size; the solve
  // below finds the real one. Starting coarse keeps the early probes cheap.
  let weave = clampNumber(args.fit / 26, 0.006, 0.5);

  if (args.calibrate) {
    t = Date.now();
    // Solve against the coverage passes only. They are the ones that have to
    // be drawn in full - trim them and the paint gains holes - while detail,
    // accents and crease lines are decoration that can be cut to fit whatever
    // budget is left.
    const coveragePasses = passPlan(args.preset, 1, args.strokes, args.hand, args.accurate).filter((p) => p.coverage);
    const weaveTarget = Math.max(1, Math.round(coveragePasses.reduce((a, p) => a + args.strokes * p.share, 0)));

    // Stroke count falls as the weave widens, so bracket the answer and then
    // bisect in log space.
    const measure = (w) => {
      let total = 0;
      for (const pass of passPlan(args.preset, w, args.strokes, args.hand, args.accurate)) {
        if (!pass.coverage) continue;
        total += prober.runPass('calibrate', {
          ...pass,
          triangleFilter: pass.filter ? filters[pass.filter] : keep,
          dryRun: true,
        }).length;
      }
      return total;
    };

    // Invariant through the whole solve: count(lo) > target >= count(hi).
    let probes = 0;
    const count0 = measure(weave); probes++;
    let lo, hi;
    if (count0 > weaveTarget) {
      lo = weave;
      hi = weave;
      while (probes < 8) {
        hi = clampNumber(hi * 1.7, 0.003, 0.9);
        if (measure(hi) <= weaveTarget) { probes++; break; }
        lo = hi; probes++;
        if (hi >= 0.89) break;
      }
    } else {
      hi = weave;
      lo = weave;
      while (probes < 8) {
        lo = clampNumber(lo / 1.7, 0.003, 0.9);
        if (measure(lo) > weaveTarget) { probes++; break; }
        hi = lo; probes++;
        if (lo <= 0.0031) break;
      }
    }
    while (probes < 12 && hi / lo > 1.1) {
      const mid = Math.sqrt(lo * hi);
      if (measure(mid) > weaveTarget) lo = mid; else hi = mid;
      probes++;
    }
    // Land on the side that slightly over-draws: the per-pass caps trim the
    // excess, and a little overlap beats a gap.
    weave = lo;
    console.log(label('calibrated weave'), `${weave.toFixed(4)} world units between contours, ${probes} probes  (${Date.now() - t}ms)`);
  }

  const plan = passPlan(args.preset, weave, args.strokes, args.hand, args.accurate);
  for (const pass of plan) {
    t = Date.now();
    painter.runPass(pass.name, {
      ...pass,
      triangleFilter: pass.filter ? filters[pass.filter] : keep,
      polylines: pass.source === 'creases' ? creasePolylines : null,
    });
    const s = painter.stats[pass.name];
    console.log(label(`pass: ${pass.name}`), `${s.strokes.toLocaleString()} strokes from ${s.polylines.toLocaleString()} lines, ${s.points.toLocaleString()} points  (${Date.now() - t}ms)`);
  }

  // 6. Order and write ------------------------------------------------------
  const ordered = orderStrokes(painter.strokes, ['underpaint', 'form', 'detail', 'lines', 'accents'], random);
  const payload = ordered.map(serializeStroke);

  const outPath = args.out
    ? path.resolve(args.out)
    : path.join(PROJECT, 'public', 'demos', `model-${args.preset}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload));

  const points = payload.reduce((a, s) => a + s.points.length, 0);
  const lengths = ordered.map((s) => s.length).sort((a, b) => a - b);
  const widths = ordered.map((s) => s.size * 3).sort((a, b) => a - b);
  const pick = (arr, f) => arr[Math.floor((arr.length - 1) * f)];
  const manifest = {
    model: path.basename(args.model),
    preset: args.preset,
    targetStrokes: args.strokes,
    hand: args.hand,
    accurate: args.accurate,
    seed: args.seed,
    fit: args.fit,
    weave: +weave.toFixed(5),
    strokes: payload.length,
    points,
    compression,
    sourceBounds,
    bounds: norm.bounds,
    visibleArea: +visibleArea.toFixed(2),
    passes: painter.stats,
    strokeLength: {
      min: +lengths[0].toFixed(4), p25: +pick(lengths, 0.25).toFixed(4),
      median: +pick(lengths, 0.5).toFixed(4), p75: +pick(lengths, 0.75).toFixed(4),
      max: +lengths[lengths.length - 1].toFixed(4),
    },
    strokeWidth: {
      min: +widths[0].toFixed(4), median: +pick(widths, 0.5).toFixed(4),
      max: +widths[widths.length - 1].toFixed(4),
    },
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(outPath.replace(/\.json$/, '.manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n  ${payload.length.toLocaleString()} strokes / ${points.toLocaleString()} points`);
  console.log(`  length  ${manifest.strokeLength.min} .. ${manifest.strokeLength.max}  (median ${manifest.strokeLength.median})`);
  console.log(`  width   ${manifest.strokeWidth.min} .. ${manifest.strokeWidth.max}  (median ${manifest.strokeWidth.median})`);
  console.log(`  -> ${path.relative(PROJECT, outPath)}  ${(fs.statSync(outPath).size / 1048576).toFixed(1)} MB`);
  console.log(`  done in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
  if (args.stats) console.log(JSON.stringify(manifest.passes, null, 2));
}

function flipTriangleNormal(mesh, tri, i) {
  tri.normal[i * 3] *= -1; tri.normal[i * 3 + 1] *= -1; tri.normal[i * 3 + 2] *= -1;
  for (let c = 0; c < 3; c++) {
    const v = mesh.indices[i * 3 + c];
    mesh.normals[v * 3] *= -1; mesh.normals[v * 3 + 1] *= -1; mesh.normals[v * 3 + 2] *= -1;
  }
}

function count(mask) {
  let n = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i]) n++;
  return n;
}

function areaOf(tri, keep) {
  let a = 0;
  for (let i = 0; i < tri.triCount; i++) if (!keep || keep[i]) a += tri.area[i];
  return a;
}

const clampNumber = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/**
 * How much the texture changes across each triangle. High contrast means panel
 * gaps, trim, eyes - the places worth spending small strokes on.
 */
function textureContrast(mesh, tri, materials, keep) {
  const out = new Float32Array(tri.triCount);
  const rgba = [0, 0, 0, 0];
  const labs = [null, null, null];
  for (let t = 0; t < tri.triCount; t++) {
    if (keep && !keep[t]) continue;
    const mat = materials[mesh.triMaterial[t] ?? 0] || materials[0];
    if (!mat || !mat.baseColor) continue;
    for (let c = 0; c < 3; c++) {
      const v = mesh.indices[t * 3 + c];
      const s = mat.baseColor.sample(mesh.uvs[v * 2], mesh.uvs[v * 2 + 1], rgba);
      labs[c] = linearToOklab(srgbToLinear(s[0]), srgbToLinear(s[1]), srgbToLinear(s[2]));
    }
    out[t] = Math.max(
      oklabDistance(labs[0], labs[1]),
      oklabDistance(labs[1], labs[2]),
      oklabDistance(labs[2], labs[0])
    );
  }
  return out;
}

/** The app's replay stroke format. */
function serializeStroke(stroke, index) {
  return {
    id: `dx_${index.toString(36)}`,
    pass: stroke.pass,
    color: stroke.color,
    size: stroke.size,
    profile: stroke.profile,
    materialType: stroke.materialType,
    brushShape: 'round',
    opacity: stroke.opacity,
    roughness: stroke.roughness,
    metalness: stroke.metalness,
    pressureSensitivity: true,
    points: stroke.points.map((p) => ({
      x: round(p.x), y: round(p.y), z: round(p.z),
      nx: round3(p.nx), ny: round3(p.ny), nz: round3(p.nz),
      pressure: round3(p.pressure),
    })),
  };
}

const round = (v) => Math.round(v * 10000) / 10000;
const round3 = (v) => Math.round(v * 1000) / 1000;

main().catch((err) => {
  console.error(`\n  ${err.message}\n`);
  process.exit(1);
});

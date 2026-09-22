#!/usr/bin/env node
/**
 * Draws a 3D model the way a person draws it.
 *
 * Four stages, in the order an artist works: construction guides, then the
 * whole subject as a 3D wireframe sketch, then flat colour laid in patch by
 * patch, then the small marks that finish it. The strokes are written in that
 * order, so replaying the file animates the drawing like a time-lapse.
 *
 * Usage:
 *   node scripts/deconstruct3d/draw.mjs --model <file.glb> --strokes 2000
 *
 * Options:
 *   --model <path>    source GLB (Draco and meshopt included)     (required)
 *   --out <path>      output JSON     (default public/demos/drawing.json)
 *   --strokes <n>     total stroke budget                         (default 2000)
 *   --fit <n>         world height of the drawing                 (default 3.6)
 *   --seed <int>      reproducible randomness                     (default 20260922)
 *   --hand <n>        0 = ruler straight, 1 = normal, 2 = loose    (default 1)
 *   --patch <deg>     how far a fill patch may bend before it splits (default 26)
 *   --patch-color <n> how far its colour may drift                (default 0.07)
 *   --texture <px>    texture decode resolution                   (default 2048)
 *   --line-density <n> share of the model's edges worth drawing  (default 0.55)
 *   --lineart <mode>  auto (uses Blender if installed) | internal   (default auto)
 *   --crease <deg>    angle at which an edge counts as a line       (default 45)
 *   --no-contour      skip silhouette lines (keep creases only)
 *   --no-guides       skip the construction lines
 *   --no-cull         keep hidden interior geometry
 *   --stats           print the per-stage breakdown
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readGLB, flattenScene } from './lib/glb.mjs';
import { loadMaterialTextures } from './lib/texture.mjs';
import {
  computeBounds, normalizeInPlace, triangleData, weldVertices, creaseEdges,
  makeRandom, makeNoise1D, buildAdjacency, smoothNormalField, closeMask,
} from './lib/mesh.mjs';
import { computeExposure, cacheKeyFor } from './lib/visibility.mjs';
import { polylineLength } from './lib/chain.mjs';
import { segmentRegions } from './lib/regions.mjs';
import { Artist, regionBoundaryEdges, linesFromEdges } from './lib/artist.mjs';
import { bakeLineArt, projectOntoMesh, findBlender } from './lib/lineart.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, '..', '..');
const CACHE = path.join(HERE, '.cache');

function parseArgs(argv) {
  const args = {
    model: null, out: null, strokes: 2000, fit: 3.6, seed: 20260922, hand: 1,
    patch: 26, patchColor: 0.07, texture: 2048, guides: true, cull: true, stats: false,
    lineDensity: 0.55, lineart: 'auto', crease: 45, contour: true,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--model': args.model = next(); break;
      case '--out': args.out = next(); break;
      case '--strokes': args.strokes = Number(next()); break;
      case '--fit': args.fit = Number(next()); break;
      case '--seed': args.seed = Number(next()); break;
      case '--hand': args.hand = Number(next()); break;
      case '--patch': args.patch = Number(next()); break;
      case '--patch-color': args.patchColor = Number(next()); break;
      case '--texture': args.texture = Number(next()); break;
      case '--line-density': args.lineDensity = Number(next()); break;
      case '--lineart': args.lineart = next(); break;
      case '--crease': args.crease = Number(next()); break;
      case '--no-contour': args.contour = false; break;
      case '--no-guides': args.guides = false; break;
      case '--no-cull': args.cull = false; break;
      case '--stats': args.stats = true; break;
      case '--help': case '-h': {
        const src = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
        console.log(src.slice(src.indexOf('/**') + 3, src.indexOf('*/')).replace(/^ \* ?/gm, ''));
        process.exit(0);
      }
      default: throw new Error(`Unknown option ${a}`);
    }
  }
  if (!args.model) throw new Error('--model <file.glb> is required');
  return args;
}

// How the budget is spent, from a stroke-level breakdown of the reference
// artwork: most of it goes on flat colour, laid down twice - a base pass and a
// modulation pass that gives a surface its wear - with line work a fifth of the
// total and small accent marks the rest.
const SHARE = { guides: 0.01, lineart: 0.18, fill: 0.42, modulation: 0.28, details: 0.11 };

async function main() {
  const args = parseArgs(process.argv);
  const label = (s) => `  ${s.padEnd(32, '.')}`;
  const t0 = Date.now();
  console.log(`\ndrawing  -  ${path.basename(args.model)}`);
  console.log(`  ${args.strokes} strokes / hand ${args.hand} / seed ${args.seed}\n`);

  // ---------------------------------------------------------------- geometry
  let t = Date.now();
  const gltf = await readGLB(args.model);
  const compression = (gltf.json.extensionsRequired || []).filter((e) => /draco|meshopt/i.test(e));
  const mesh = await flattenScene(gltf);
  console.log(label('mesh'), `${(mesh.indices.length / 3).toLocaleString()} triangles${compression.length ? ` [${compression.join(' + ')}]` : ''}  (${Date.now() - t}ms)`);

  const sourceBounds = computeBounds(mesh.positions);
  const norm = normalizeInPlace(mesh.positions, { fitHeight: args.fit });
  const tri = triangleData(mesh.positions, mesh.indices);
  const weld = weldVertices(mesh.positions, 1e-5);
  mesh.remap = weld.remap;
  const adjacency = buildAdjacency(mesh.indices, weld.remap);
  const materials = loadMaterialTextures(gltf, CACHE, args.texture);
  if (materials.unsupportedTextures?.length) {
    console.log(label(''), `KTX2/Basis textures cannot be decoded offline (${materials.unsupportedTextures.join(', ')})`);
  }

  // ------------------------------------------------------- what can be seen
  t = Date.now();
  let keep = new Uint8Array(tri.triCount).fill(1);
  mesh.triFlip = new Uint8Array(tri.triCount);
  if (args.cull) {
    const key = cacheKeyFor(args.model, fs.statSync(args.model).size, args.fit, tri.triCount, 'v3');
    const result = computeExposure({ positions: mesh.positions, indices: mesh.indices, tri }, {
      rays: 7, spreadDeg: 62, cacheKey: key, cacheDir: CACHE,
      onProgress: (done, total) => process.stdout.write(`\r  culling hidden geometry ...... ${Math.round((done / total) * 100)}%  `),
    });
    for (let i = 0; i < tri.triCount; i++) {
      if (result.exposure[i] < 0.08) keep[i] = 0;
      else if (result.flipped[i]) {
        tri.normal[i * 3] *= -1; tri.normal[i * 3 + 1] *= -1; tri.normal[i * 3 + 2] *= -1;
        mesh.triFlip[i] = 1;
      }
    }
    keep = closeMask(keep, adjacency, 2);
    process.stdout.write('\r');
    const visible = countMask(keep);
    console.log(label('visible surface'), `${visible.toLocaleString()} of ${tri.triCount.toLocaleString()} triangles  ${result.cached ? '[cached]' : `(${Date.now() - t}ms)`}`);
  }

  // ------------------------------------------------------------- the patches
  t = Date.now();
  const normalField = smoothNormalField(tri, adjacency, 6);
  const random = makeRandom(args.seed);
  const noise = makeNoise1D(makeRandom(args.seed ^ 0x9e3779b9));
  const artist = new Artist({
    mesh, tri, materials, random, noise,
    options: { roughnessRange: [0.4, 0.95], metalnessRange: [0, 0.25] },
  });

  const totalArea = areaOf(tri, keep);
  const { regionOf, regions } = segmentRegions(
    mesh, tri, adjacency, keep, (x) => artist.colorOfTriangle(x),
    {
      normalTolerance: args.patch,
      colorTolerance: args.patchColor,
      alphaOfTriangle: (t) => artist.alphaOfTriangle(t),
      minArea: totalArea * 0.0008,
      normalField,
    }
  );
  const paintable = regions.filter((r) => r.triangles.length);
  console.log(label('patches'), `${paintable.length.toLocaleString()} flat colour patches, biggest ${(paintable[0]?.area / totalArea * 100).toFixed(1)}% of the surface  (${Date.now() - t}ms)`);

  // --------------------------------------------------------- the line sketch
  //
  // Only structural edges get a line. The reference breakdown is explicit that
  // colour-patch boundaries, soft shadow edges and broad faces are left
  // unlined; outlining everything is what makes a drawing look diagrammatic.
  t = Date.now();
  let sketchLines = [];
  let lineSource = 'creases';
  const blender = args.lineart === 'internal' ? null : findBlender();
  if (blender) {
    const baked = bakeLineArt(args.model, {
      crease: args.crease, contour: args.contour, cacheDir: CACHE, blender,
    });
    if (baked && baked.lines.length) {
      const c = sourceBounds.center;
      const k = norm.scale;
      const centre = [-0.08, 0.42, 0];
      sketchLines = projectOntoMesh(baked.lines, mesh, tri, (x, y, z) => [
        (x - c[0]) * k + centre[0],
        (y - c[1]) * k + centre[1],
        (z - c[2]) * k + centre[2],
      ], { maxDistance: args.fit * 0.01 });
      lineSource = baked.cached ? 'blender [cached]' : 'blender';
    }
  }
  if (!sketchLines.length) {
    const creases = creaseEdges(mesh.positions, mesh.indices, { remap: weld.remap }, args.crease)
      .filter((e) => e.faces.some((f) => keep[f]));
    sketchLines = linesFromEdges(creases, mesh, weld.remap).filter((p) => p.points.length >= 2);
  }

  const ranked = sketchLines
    .map((p) => ({ p, len: polylineLength(p.points) }))
    .sort((a, b) => b.len - a.len);
  const allLength = ranked.reduce((a, e) => a + e.len, 0);
  sketchLines = [];
  let taken = 0;
  for (const e of ranked) {
    if (taken > allLength * args.lineDensity) break;
    sketchLines.push(e.p);
    taken += e.len;
  }
  const totalLineLength = taken;
  console.log(label('sketch lines'), sketchLines.length.toLocaleString() + ' of ' + ranked.length.toLocaleString() + ' [' + lineSource + '], ' + totalLineLength.toFixed(1) + ' of ' + allLength.toFixed(1) + ' units of edge  (' + (Date.now() - t) + 'ms)');

  // ------------------------------------------------------------- the drawing
  const budget = {
    guides: Math.min(14, Math.max(4, Math.round(args.strokes * SHARE.guides))),
    lineart: Math.round(args.strokes * SHARE.lineart),
    fill: Math.round(args.strokes * SHARE.fill),
    modulation: Math.round(args.strokes * SHARE.modulation),
    details: Math.round(args.strokes * SHARE.details),
  };
  const hand = args.hand;
  const H = (v) => ({
    ...v,
    wobble: (v.wobble ?? 0) * hand,
    drift: (v.drift ?? 0) * hand,
    lift: (v.lift ?? 0) * hand,
    slip: (v.slip ?? 0) * hand,
  });

  const unit = args.fit;                    // everything scales with drawing size
  const bounds = norm.bounds;

  if (args.guides) {
    t = Date.now();
    const massLoops = sketchLines
      .map((p) => ({ p, len: polylineLength(p.points) }))
      .sort((a, b) => b.len - a.len)
      .slice(0, budget.guides * 3)
      .map((e) => e.p);
    artist.drawGuides(massLoops, bounds, {
      size: unit * 0.0009,
      maxStrokes: budget.guides,
      pointSpacing: unit * 0.09,
      opacity: 0.55,
      color: { flat: '#8f9aa8' },
      human: H({ wobble: 0.5, drift: 0.7, lift: 0.0, pressure: [0.35, 0.7], taper: [0.2, 0.4], overshoot: 1.6, slip: 0.1 }),
    });
    console.log(label('1 guides'), `${artist.stats.guides.strokes} construction lines  (${Date.now() - t}ms)`);
  }

  // The mean line length falls straight out of the budget: total edge length
  // divided by how many strokes we are allowed to spend on it.
  t = Date.now();
  const meanLine = Math.max(unit * 0.02, totalLineLength / Math.max(1, budget.lineart));
  artist.drawLineArt(sketchLines, {
    // typical line width 0.006 H, spanning 0.0025 H to 0.014 H - about a fifth
    // of a typical fill stroke, which is what gives the drawing its hierarchy
    size: unit * 0.002,
    sizeVariation: [0.45, 2.2],
    pointSpacing: Math.max(unit * 0.004, meanLine / 9),
    lengths: [meanLine * 0.45, meanLine * 0.9, meanLine * 1.6, meanLine * 2.6],
    gapRatio: [0.08, 0.22],
    minLength: unit * 0.012,
    breakAngle: 1.25,
    maxStrokes: budget.lineart,
    // 45 lightness points below the surface it sits on, and tinted toward that
    // surface rather than neutral black
    valueShift: -0.45,
    chromaBoost: 0.7,
    human: H({ wobble: 0.2, drift: 0.12, lift: 0.0, pressure: [0.7, 1.0], taper: [0.06, 0.14], overshoot: 0.1, slip: 0.03, endFloor: 0.5, swellAmount: 0.18 }),
  });
  console.log(label('2 line art'), artist.stats.lineart.strokes + ' lines  (' + (Date.now() - t) + 'ms)');

  // Fill strokes per patch is roughly overlap / widthOfShort, independent of
  // how big the patch is, so the budget sets that ratio directly.
  t = Date.now();
  const fillRegions = paintable;
  // Neighbouring passes overlap by 8-18% of their width in the reference, not
  // the 40% this used to use: too much overlap spends the budget painting the
  // same ground twice and leaves nothing for the rest of the model.
  const overlap = 1.15;
  const widthOfShort = clamp(
    (overlap * fillRegions.length) / Math.max(1, budget.fill), 0.16, 0.85
  );
  const fillHuman = {
    wobble: 0.25, drift: 0.1, lift: 0.0, pressure: [0.9, 1.0],
    taper: [0.05, 0.15], overshoot: 0.08, slip: 0.03,
    endFloor: 0.85, swellAmount: 0.18,
  };
  const fillShape = {
    widthOfShort,
    overlap,
    minWidth: unit * 0.012,
    maxWidth: unit * 0.095,
    pointSpacing: unit * 0.02,
    minArea: totalArea * 0.00004,
    minLength: unit * 0.035,
  };
  artist.drawFill(fillRegions, {
    ...fillShape,
    stage: 'fill',
    maxStrokes: budget.fill,
    colorJitter: 0.035,
    human: H(fillHuman),
  });
  console.log(label('3 fill'), artist.stats.fill.strokes + ' passes over ' + fillRegions.length + ' patches, width ' + (widthOfShort * 100).toFixed(0) + '% of each  (' + (Date.now() - t) + 'ms)');

  // Second coat, landing between the first coat's passes and carrying more
  // colour variation: this is the plaster wear, the roof courses and the
  // ripples. Without it a filled surface reads as a paint bucket.
  t = Date.now();
  artist.drawFill(fillRegions, {
    ...fillShape,
    stage: 'modulation',
    phase: 0.5,
    widthScale: 0.62,
    lift: 0.003,
    maxStrokes: budget.modulation,
    colorJitter: 0.06,
    human: H({ ...fillHuman, wobble: 0.32, slip: 0.04, swellAmount: 0.24 }),
  });
  console.log(label('4 modulation'), artist.stats.modulation.strokes + ' passes  (' + (Date.now() - t) + 'ms)');

  t = Date.now();
  artist.drawDetails(paintable, {
    size: unit * 0.006,
    sizeVariation: [0.7, 1.3],
    pointSpacing: unit * 0.01,
    minArea: totalArea * 0.00002,
    maxArea: totalArea * 0.002,
    perRegion: 3,
    maxStrokes: budget.details,
    chromaBoost: 1.08,
    human: H({ wobble: 0.12, drift: 0.1, lift: 0.0, pressure: [0.7, 1.0], taper: [0.05, 0.15], overshoot: 0.4, slip: 0.03 }),
  });
  console.log(label('5 details'), `${artist.stats.details.strokes} marks  (${Date.now() - t}ms)`);

  // ------------------------------------------------------------------ output
  const payload = artist.strokes.map((s, i) => ({
    id: `dx_${i.toString(36)}`,
    pass: s.stage,
    color: s.color,
    size: s.size,
    profile: s.profile,
    materialType: s.materialType,
    brushShape: 'round',
    opacity: s.opacity,
    roughness: s.roughness,
    metalness: s.metalness,
    pressureSensitivity: true,
    points: s.points.map((p) => ({
      x: round(p.x), y: round(p.y), z: round(p.z),
      nx: round3(p.nx), ny: round3(p.ny), nz: round3(p.nz),
      pressure: round3(p.pressure),
    })),
  }));

  const outPath = args.out ? path.resolve(args.out) : path.join(PROJECT, 'public', 'demos', 'drawing.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload));

  const points = payload.reduce((a, s) => a + s.points.length, 0);
  const lengths = artist.strokes.map((s) => s.length).sort((a, b) => a - b);
  const widths = artist.strokes.map((s) => s.size * 3).sort((a, b) => a - b);
  const pick = (arr, f) => arr[Math.floor((arr.length - 1) * f)] ?? 0;
  const manifest = {
    model: path.basename(args.model), strokes: payload.length, points,
    targetStrokes: args.strokes, seed: args.seed, hand: args.hand, fit: args.fit,
    compression, patches: paintable.length, sketchLines: sketchLines.length,
    sourceBounds, bounds: norm.bounds, stages: artist.stats,
    strokeLength: { min: +pick(lengths, 0).toFixed(4), median: +pick(lengths, 0.5).toFixed(4), max: +pick(lengths, 1).toFixed(4) },
    strokeWidth: { min: +pick(widths, 0).toFixed(4), median: +pick(widths, 0.5).toFixed(4), max: +pick(widths, 1).toFixed(4) },
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(outPath.replace(/\.json$/, '.manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n  ${payload.length.toLocaleString()} strokes / ${points.toLocaleString()} points`);
  console.log(`  length  ${manifest.strokeLength.min} .. ${manifest.strokeLength.max}  (median ${manifest.strokeLength.median})`);
  console.log(`  width   ${manifest.strokeWidth.min} .. ${manifest.strokeWidth.max}  (median ${manifest.strokeWidth.median})`);
  console.log(`  -> ${path.relative(PROJECT, outPath)}  ${(fs.statSync(outPath).size / 1048576).toFixed(1)} MB`);
  console.log(`  done in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
  if (args.stats) console.log(JSON.stringify(manifest.stages, null, 2));
}

function dedupeEdges(edges, remap) {
  const seen = new Set();
  const out = [];
  for (const e of edges) {
    const a = remap[e.a], b = remap[e.b];
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

function countMask(mask) {
  let n = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i]) n++;
  return n;
}

function areaOf(tri, keep) {
  let a = 0;
  for (let i = 0; i < tri.triCount; i++) if (!keep || keep[i]) a += tri.area[i];
  return a;
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const round = (v) => Math.round(v * 10000) / 10000;
const round3 = (v) => Math.round(v * 1000) / 1000;

main().catch((err) => {
  console.error(`\n  ${err.stack || err.message}\n`);
  process.exit(1);
});

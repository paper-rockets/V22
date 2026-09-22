import fs from 'fs';
import path from 'path';

const GLB_PATH = 'C:\\Users\\macie\\Downloads\\Meshy_AI_Apple_Seed_Cover_0922105525_texture.glb';
const TEXTURE_RGBA_PATH = 'e:\\X\\AiStudio Workflow\\V25\\scripts\\temp_texture_1024.rgba';
const OUTPUT_DIR = 'e:\\X\\AiStudio Workflow\\V25\\public\\demos';

// 1. Chaikin Curve Smoothing for natural hand-drawn stroke fluidity
function chaikinSmooth(points, iterations = 2) {
  if (points.length < 3) return points;
  let current = points;
  for (let it = 0; it < iterations; it++) {
    const next = [current[0]];
    for (let i = 0; i < current.length - 1; i++) {
      const p0 = current[i];
      const p1 = current[i + 1];
      const q = {
        x: 0.75 * p0.x + 0.25 * p1.x,
        y: 0.75 * p0.y + 0.25 * p1.y,
        z: 0.75 * p0.z + 0.25 * p1.z,
        u: 0.75 * p0.u + 0.25 * p1.u,
        v: 0.75 * p0.v + 0.25 * p1.v,
      };
      const r = {
        x: 0.25 * p0.x + 0.75 * p1.x,
        y: 0.25 * p0.y + 0.75 * p1.y,
        z: 0.25 * p0.z + 0.75 * p1.z,
        u: 0.25 * p0.u + 0.75 * p1.u,
        v: 0.25 * p0.v + 0.75 * p1.v,
      };
      next.push(q, r);
    }
    next.push(current[current.length - 1]);
    current = next;
  }
  return current;
}

async function run() {
  console.log('=== Generating Artist-Grade 3D Drawing (Short, Med, Long — NO Circles) ===');
  console.time('Total Generation');

  // Load GLB
  const fd = fs.openSync(GLB_PATH, 'r');
  const posBuf = Buffer.alloc(19629192);
  fs.readSync(fd, posBuf, 0, 19629192, 1716);
  const pos = new Float32Array(posBuf.buffer, posBuf.byteOffset, 1635766 * 3);

  const uvBuf = Buffer.alloc(13086128);
  fs.readSync(fd, uvBuf, 0, 13086128, 1716 + 39258384);
  const uvs = new Float32Array(uvBuf.buffer, uvBuf.byteOffset, 1635766 * 2);

  const idxBuf = Buffer.alloc(37285068);
  fs.readSync(fd, idxBuf, 0, 37285068, 1716 + 52344512);
  const indices = new Uint32Array(idxBuf.buffer, idxBuf.byteOffset, 9321267);
  fs.closeSync(fd);

  // Load Texture
  const rgba = fs.readFileSync(TEXTURE_RGBA_PATH);
  function getRGB(u, v) {
    u = ((u % 1) + 1) % 1;
    v = ((v % 1) + 1) % 1;
    const px = Math.min(1023, Math.max(0, Math.floor(u * 1024)));
    const py = Math.min(1023, Math.max(0, Math.floor((1 - v) * 1024)));
    const idx = (py * 1024 + px) * 4;
    return [rgba[idx], rgba[idx + 1], rgba[idx + 2]];
  }

  function getHex(u, v) {
    const [r, g, b] = getRGB(u, v);
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
  }

  // Centering transform: Target (-0.08, 0.42, 0)
  const TARGET_CENTER_X = -0.08;
  const TARGET_CENTER_Y = 0.42;
  const TARGET_CENTER_Z = 0.0;
  const MODEL_CENTER_Y = 1.5;

  function transform(x, y, z) {
    return {
      x: Number((x + TARGET_CENTER_X).toFixed(4)),
      y: Number(((y - MODEL_CENTER_Y) + TARGET_CENTER_Y).toFixed(4)),
      z: Number((z + TARGET_CENTER_Z).toFixed(4)),
    };
  }

  // Spatial Slicing Engine
  const yCount = 130, yMin = 0.05, yMax = 2.92;
  const dy = (yMax - yMin) / (yCount - 1);
  const ySlices = Array.from({ length: yCount }, () => []);

  const triCount = indices.length / 3;
  console.log(`Processing ${triCount} triangles...`);

  for (let t = 0; t < triCount; t++) {
    const i0 = indices[t * 3], i1 = indices[t * 3 + 1], i2 = indices[t * 3 + 2];
    const x0 = pos[i0*3], y0 = pos[i0*3+1], z0 = pos[i0*3+2];
    const x1 = pos[i1*3], y1 = pos[i1*3+1], z1 = pos[i1*3+2];
    const x2 = pos[i2*3], y2 = pos[i2*3+1], z2 = pos[i2*3+2];

    const u0 = uvs[i0*2], v0 = uvs[i0*2+1];
    const u1 = uvs[i1*2], v1 = uvs[i1*2+1];
    const u2 = uvs[i2*2], v2 = uvs[i2*2+1];

    const minY = Math.min(y0, y1, y2), maxY = Math.max(y0, y1, y2);
    const syStart = Math.max(0, Math.ceil((minY - yMin) / dy));
    const syEnd = Math.min(yCount - 1, Math.floor((maxY - yMin) / dy));

    for (let s = syStart; s <= syEnd; s++) {
      const val = yMin + s * dy;
      const pts = [];
      const test = (xa, ya, za, xb, yb, zb, ua, va, ub, vb) => {
        if ((ya - val) * (yb - val) <= 0 && ya !== yb) {
          const f = (val - ya) / (yb - ya);
          pts.push({ x: xa + f*(xb - xa), y: val, z: za + f*(zb - za), u: ua + f*(ub - ua), v: va + f*(vb - va) });
        }
      };
      test(x0, y0, z0, x1, y1, z1, u0, v0, u1, v1);
      test(x1, y1, z1, x2, y2, z2, u1, v1, u2, v2);
      test(x2, y2, z2, x0, y0, z0, u2, v2, u0, v0);
      if (pts.length >= 2) ySlices[s].push([pts[0], pts[1]]);
    }
  }

  // Chain and convert into ARTISTIC OPEN STROKES (Short, Med, Long — NO 360-degree circles)
  const artistStrokes = [];

  for (let s = 0; s < yCount; s++) {
    const segs = ySlices[s];
    if (segs.length === 0) continue;

    const used = new Uint8Array(segs.length);
    const cellSize = 0.025;
    const grid = new Map();
    function k(p) { return `${Math.round(p.x/cellSize)},${Math.round(p.y/cellSize)},${Math.round(p.z/cellSize)}`; }

    for (let i = 0; i < segs.length; i++) {
      const kA = k(segs[i][0]), kB = k(segs[i][1]);
      if (!grid.has(kA)) grid.set(kA, []);
      if (!grid.has(kB)) grid.set(kB, []);
      grid.get(kA).push({ s: i, e: 0 });
      grid.get(kB).push({ s: i, e: 1 });
    }

    for (let i = 0; i < segs.length; i++) {
      if (used[i]) continue;
      used[i] = 1;

      let chain = [segs[i][0], segs[i][1]];
      let tail = segs[i][1];

      while (true) {
        const cands = grid.get(k(tail)) || [];
        let bestDist = 0.025;
        let bestSeg = -1;
        let bestPt = null;

        for (const c of cands) {
          if (used[c.s]) continue;
          const match = c.e === 0 ? segs[c.s][0] : segs[c.s][1];
          const other = c.e === 0 ? segs[c.s][1] : segs[c.s][0];
          const d = Math.hypot(tail.x - match.x, tail.y - match.y, tail.z - match.z);
          if (d < bestDist) {
            bestDist = d;
            bestSeg = c.s;
            bestPt = other;
          }
        }

        if (bestSeg !== -1) {
          used[bestSeg] = 1;
          chain.push(bestPt);
          tail = bestPt;
        } else {
          break;
        }
      }

      // If chain forms a closed loop, CRITICALLY: BREAK IT INTO OPEN ARCS!
      // An artist NEVER draws closed 360 loops. They draw curved open arcs across the front/visible forms!
      const isClosed = Math.hypot(chain[0].x - tail.x, chain[0].y - tail.y, chain[0].z - tail.z) < 0.04;

      // Resample chain every 0.015m
      const smoothed = chaikinSmooth(chain, 2);
      const sampled = [smoothed[0]];
      let lastPt = smoothed[0];
      for (let j = 1; j < smoothed.length; j++) {
        const d = Math.hypot(smoothed[j].x - lastPt.x, smoothed[j].y - lastPt.y, smoothed[j].z - lastPt.z);
        if (d >= 0.015 || j === smoothed.length - 1) {
          sampled.push(smoothed[j]);
          lastPt = smoothed[j];
        }
      }

      if (sampled.length < 5) continue;

      if (isClosed) {
        // Break the closed loop into 2, 3, or 4 OPEN ARCS of varied lengths (short, med, long)!
        // Each arc covers an angle of ~70 to 110 degrees, leaving breathing room so it's NOT a circle!
        const totalPts = sampled.length;
        const numArcs = totalPts > 60 ? 4 : (totalPts > 30 ? 3 : 2);
        const arcLen = Math.floor(totalPts / numArcs);

        for (let a = 0; a < numArcs; a++) {
          const startIdx = a * arcLen;
          const count = Math.floor(arcLen * 0.75); // 75% arc length, 25% open gap -> OPEN ARCS, NO CIRCLES!
          const arcPts = [];
          for (let pIdx = 0; pIdx < count; pIdx++) {
            const idx = (startIdx + pIdx) % totalPts;
            arcPts.push(sampled[idx]);
          }

          if (arcPts.length >= 5) {
            // Determine stroke length category: short (0.04-0.08), medium (0.09-0.20), long (>0.20)
            let arcPhysicalLen = 0;
            for (let j = 1; j < arcPts.length; j++) {
              arcPhysicalLen += Math.hypot(arcPts[j].x - arcPts[j-1].x, arcPts[j].y - arcPts[j-1].y, arcPts[j].z - arcPts[j-1].z);
            }

            const cat = arcPhysicalLen < 0.08 ? 'short' : (arcPhysicalLen < 0.22 ? 'medium' : 'long');
            artistStrokes.push({ pts: arcPts, category: cat, type: 'form_arc' });
          }
        }
      } else {
        // Open contour (already open!)
        let physicalLen = 0;
        for (let j = 1; j < sampled.length; j++) {
          physicalLen += Math.hypot(sampled[j].x - sampled[j-1].x, sampled[j].y - sampled[j-1].y, sampled[j].z - sampled[j-1].z);
        }
        if (physicalLen >= 0.04) {
          const cat = physicalLen < 0.08 ? 'short' : (physicalLen < 0.22 ? 'medium' : 'long');
          artistStrokes.push({ pts: sampled, category: cat, type: 'contour_open' });
        }
      }
    }
  }

  console.log(`Generated ${artistStrokes.length} open form strokes from surface slices.`);

  // -------------------------------------------------------------
  // 2. LONGITUDINAL SURFACE STROKES (Tracing ALONG limbs, horns, wings)
  // -------------------------------------------------------------
  console.log('Extracting longitudinal flow strokes (horns, wings, limbs, hair)...');

  // We extract vertical & directional lines along the horns, wings, pilot hair, and limbs
  // by sampling vertical strips and chaining along Y and Z!
  const zSlices = Array.from({ length: 60 }, () => []);
  const zMin = -1.15, zMax = 1.15, dz = (zMax - zMin) / 59;

  for (let t = 0; t < triCount; t += 2) {
    const i0 = indices[t * 3], i1 = indices[t * 3 + 1], i2 = indices[t * 3 + 2];
    const x0 = pos[i0*3], y0 = pos[i0*3+1], z0 = pos[i0*3+2];
    const x1 = pos[i1*3], y1 = pos[i1*3+1], z1 = pos[i1*3+2];
    const x2 = pos[i2*3], y2 = pos[i2*3+1], z2 = pos[i2*3+2];

    const minZ = Math.min(z0, z1, z2), maxZ = Math.max(z0, z1, z2);
    const szStart = Math.max(0, Math.ceil((minZ - zMin) / dz));
    const szEnd = Math.min(59, Math.floor((maxZ - zMin) / dz));

    for (let s = szStart; s <= szEnd; s++) {
      const val = zMin + s * dz;
      const pts = [];
      const test = (xa, ya, za, xb, yb, zb, ua, va, ub, vb) => {
        if ((za - val) * (zb - val) <= 0 && za !== zb) {
          const f = (val - za) / (zb - za);
          pts.push({ x: xa + f*(xb - xa), y: ya + f*(yb - ya), z: val, u: ua + f*(ub - ua), v: va + f*(vb - va) });
        }
      };
      test(x0, y0, z0, x1, y1, z1, uvs[i0*2], uvs[i0*2+1], uvs[i1*2], uvs[i1*2+1]);
      test(x1, y1, z1, x2, y2, z2, uvs[i1*2], uvs[i1*2+1], uvs[i2*2], uvs[i2*2+1]);
      test(x2, y2, z2, x0, y0, z0, uvs[i2*2], uvs[i2*2+1], uvs[i0*2], uvs[i0*2+1]);
      if (pts.length >= 2) zSlices[s].push([pts[0], pts[1]]);
    }
  }

  for (let s = 0; s < 60; s++) {
    const segs = zSlices[s];
    if (segs.length === 0) continue;

    // Chain segments vertically
    const used = new Uint8Array(segs.length);
    for (let i = 0; i < segs.length; i++) {
      if (used[i]) continue;
      used[i] = 1;
      let chain = [segs[i][0], segs[i][1]];
      let tail = segs[i][1];

      for (let step = 0; step < 40; step++) {
        let bestDist = 0.035, bestIdx = -1, bestPt = null;
        for (let j = 0; j < segs.length; j++) {
          if (used[j]) continue;
          const d0 = Math.hypot(tail.x - segs[j][0].x, tail.y - segs[j][0].y, tail.z - segs[j][0].z);
          const d1 = Math.hypot(tail.x - segs[j][1].x, tail.y - segs[j][1].y, tail.z - segs[j][1].z);
          if (d0 < bestDist) { bestDist = d0; bestIdx = j; bestPt = segs[j][1]; }
          else if (d1 < bestDist) { bestDist = d1; bestIdx = j; bestPt = segs[j][0]; }
        }
        if (bestIdx !== -1) {
          used[bestIdx] = 1;
          chain.push(bestPt);
          tail = bestPt;
        } else {
          break;
        }
      }

      // Calculate length
      let pLen = 0;
      for (let j = 1; j < chain.length; j++) {
        pLen += Math.hypot(chain[j].x - chain[j-1].x, chain[j].y - chain[j-1].y, chain[j].z - chain[j-1].z);
      }

      // Keep open strokes between 0.08m and 0.45m (medium and long strokes)
      if (pLen >= 0.08 && pLen <= 0.55 && chain.length >= 6) {
        const smoothed = chaikinSmooth(chain, 2);
        const sampled = [smoothed[0]];
        let lastPt = smoothed[0];
        for (let j = 1; j < smoothed.length; j++) {
          const d = Math.hypot(smoothed[j].x - lastPt.x, smoothed[j].y - lastPt.y, smoothed[j].z - lastPt.z);
          if (d >= 0.018 || j === smoothed.length - 1) {
            sampled.push(smoothed[j]);
            lastPt = smoothed[j];
          }
        }
        if (sampled.length >= 5) {
          const cat = pLen < 0.22 ? 'medium' : 'long';
          artistStrokes.push({ pts: sampled, category: cat, type: 'longitudinal' });
        }
      }
    }
  }

  console.log(`Total strokes after longitudinal additions: ${artistStrokes.length}`);

  // -------------------------------------------------------------
  // 3. DEDICATED SHORT & MEDIUM DETAIL STROKES:
  // - Pilot Face, Eyes, Mouth, Hair Locks
  // - Mech Horn Spines
  // - Mech Gold Claws & Cockpit Collar Rim
  // - Wing Edges
  // -------------------------------------------------------------
  console.log('Crafting specialized feature strokes (face, hair, claws, gold collar)...');

  // A. Pilot Hair Locks (flowing from crown down)
  const crownX = 0.26, crownY = 1.65, crownZ = 0.50;
  for (let h = 0; h < 45; h++) {
    const angle = (h / 45) * Math.PI * 1.6 - 0.8;
    const len = 0.10 + 0.12 * Math.sin(h * 0.7);
    const strand = [];
    const strandCount = 7;
    for (let s = 0; s < strandCount; s++) {
      const t = s / (strandCount - 1);
      const rad = 0.08 + t * 0.05;
      const px = crownX + Math.cos(angle) * rad + 0.02 * Math.sin(t * 3);
      const py = crownY - t * len;
      const pz = crownZ + Math.sin(angle) * rad + 0.03 * t;
      strand.push({ x: px, y: py, z: pz, u: 0.65, v: 0.35 });
    }
    artistStrokes.push({ pts: strand, category: 'medium', type: 'pilot_hair' });
  }

  // B. Pilot Headband (white ribbon across brow)
  for (let b = 0; b < 4; b++) {
    const bY = 1.56 + b * 0.008;
    const band = [];
    for (let p = 0; p < 8; p++) {
      const ang = -0.3 + (p / 7) * 1.4;
      band.push({
        x: crownX + Math.cos(ang) * 0.085,
        y: bY,
        z: crownZ + Math.sin(ang) * 0.085 + 0.03,
        u: 0.1, v: 0.9, // White
      });
    }
    artistStrokes.push({ pts: band, category: 'short', type: 'pilot_headband' });
  }

  // C. Pilot Eyes, Eyebrows & Smile (delicate short dark strokes)
  // Left eye
  artistStrokes.push({
    pts: [
      { x: 0.28, y: 1.51, z: 0.63, u: 0.05, v: 0.05 },
      { x: 0.31, y: 1.515, z: 0.63, u: 0.05, v: 0.05 },
      { x: 0.33, y: 1.505, z: 0.625, u: 0.05, v: 0.05 },
    ],
    category: 'short',
    type: 'pilot_eye',
  });
  // Right eye
  artistStrokes.push({
    pts: [
      { x: 0.22, y: 1.505, z: 0.625, u: 0.05, v: 0.05 },
      { x: 0.24, y: 1.512, z: 0.63, u: 0.05, v: 0.05 },
      { x: 0.26, y: 1.508, z: 0.63, u: 0.05, v: 0.05 },
    ],
    category: 'short',
    type: 'pilot_eye',
  });
  // Eyebrows
  artistStrokes.push({
    pts: [
      { x: 0.21, y: 1.528, z: 0.62, u: 0.05, v: 0.05 },
      { x: 0.24, y: 1.535, z: 0.625, u: 0.05, v: 0.05 },
      { x: 0.26, y: 1.530, z: 0.62, u: 0.05, v: 0.05 },
    ],
    category: 'short',
    type: 'pilot_brow',
  });
  artistStrokes.push({
    pts: [
      { x: 0.28, y: 1.530, z: 0.62, u: 0.05, v: 0.05 },
      { x: 0.31, y: 1.537, z: 0.625, u: 0.05, v: 0.05 },
      { x: 0.34, y: 1.530, z: 0.62, u: 0.05, v: 0.05 },
    ],
    category: 'short',
    type: 'pilot_brow',
  });
  // Smile
  artistStrokes.push({
    pts: [
      { x: 0.25, y: 1.465, z: 0.635, u: 0.05, v: 0.05 },
      { x: 0.27, y: 1.460, z: 0.638, u: 0.05, v: 0.05 },
      { x: 0.29, y: 1.463, z: 0.635, u: 0.05, v: 0.05 },
    ],
    category: 'short',
    type: 'pilot_mouth',
  });

  // D. Mech Rabbit Horn Spines (Sweeping Long Curves)
  // Left horn spine (base to tip)
  const leftHornSpine = [];
  for (let i = 0; i <= 15; i++) {
    const t = i / 15;
    leftHornSpine.push({
      x: -0.22 - t * 0.25,
      y: 2.05 + t * 0.85,
      z: -0.05 - t * 0.65 - 0.08 * Math.sin(t * Math.PI),
      u: 0.25, v: 0.85, // White armor
    });
  }
  artistStrokes.push({ pts: leftHornSpine, category: 'long', type: 'horn_spine' });

  // Right horn spine (base to tip)
  const rightHornSpine = [];
  for (let i = 0; i <= 15; i++) {
    const t = i / 15;
    rightHornSpine.push({
      x: 0.22 + t * 0.25,
      y: 2.05 + t * 0.85,
      z: -0.05 - t * 0.65 - 0.08 * Math.sin(t * Math.PI),
      u: 0.25, v: 0.85,
    });
  }
  artistStrokes.push({ pts: rightHornSpine, category: 'long', type: 'horn_spine' });

  // E. Cockpit Golden Collar (framing the pilot)
  for (let c = 0; c < 8; c++) {
    const collar = [];
    const rad = 0.26 + c * 0.012;
    for (let p = 0; p < 12; p++) {
      const ang = -0.5 + (p / 11) * Math.PI * 1.3;
      collar.push({
        x: 0.12 + Math.cos(ang) * rad,
        y: 1.18 + 0.08 * Math.sin(ang),
        z: 0.42 + Math.sin(ang) * rad * 0.7,
        u: 0.85, v: 0.45, // Gold
      });
    }
    artistStrokes.push({ pts: collar, category: 'medium', type: 'gold_collar' });
  }

  // F. Mech Claw Tips (Sharp short curved gold strokes)
  // Left hand claws
  const clawOriginsLeft = [
    { x: -0.42, y: 0.85, z: 0.72 },
    { x: -0.38, y: 0.83, z: 0.76 },
    { x: -0.33, y: 0.82, z: 0.78 },
    { x: -0.28, y: 0.83, z: 0.75 },
  ];
  for (const o of clawOriginsLeft) {
    artistStrokes.push({
      pts: [
        { x: o.x, y: o.y, z: o.z, u: 0.85, v: 0.45 },
        { x: o.x + 0.02, y: o.y - 0.03, z: o.z + 0.03, u: 0.85, v: 0.45 },
        { x: o.x + 0.025, y: o.y - 0.06, z: o.z + 0.04, u: 0.85, v: 0.45 },
      ],
      category: 'short',
      type: 'gold_claw',
    });
  }
  // Right hand claws
  const clawOriginsRight = [
    { x: 0.65, y: 0.88, z: 0.78 },
    { x: 0.70, y: 0.87, z: 0.82 },
    { x: 0.75, y: 0.86, z: 0.84 },
    { x: 0.79, y: 0.87, z: 0.80 },
  ];
  for (const o of clawOriginsRight) {
    artistStrokes.push({
      pts: [
        { x: o.x, y: o.y, z: o.z, u: 0.85, v: 0.45 },
        { x: o.x + 0.02, y: o.y - 0.03, z: o.z + 0.03, u: 0.85, v: 0.45 },
        { x: o.x + 0.025, y: o.y - 0.06, z: o.z + 0.04, u: 0.85, v: 0.45 },
      ],
      category: 'short',
      type: 'gold_claw',
    });
  }

  // Target total strokes: 2,000 - 2,500
  // If we have more than 2,400, sample down gracefully; if fewer, keep all
  let finalRaw = artistStrokes;
  if (finalRaw.length > 2500) {
    const keepSpecial = finalRaw.filter(s => s.type !== 'form_arc');
    const formArcs = finalRaw.filter(s => s.type === 'form_arc');
    const targetFormCount = 2500 - keepSpecial.length;
    const stride = formArcs.length / targetFormCount;
    const sampledForm = [];
    for (let i = 0; i < targetFormCount; i++) {
      sampledForm.push(formArcs[Math.floor(i * stride)]);
    }
    finalRaw = [...keepSpecial, ...sampledForm];
  }

  console.log(`Final Stroke Count: ${finalRaw.length}`);
  const shortCount = finalRaw.filter(s => s.category === 'short').length;
  const medCount = finalRaw.filter(s => s.category === 'medium').length;
  const longCount = finalRaw.filter(s => s.category === 'long').length;
  console.log(`Distribution -> Short: ${shortCount}, Medium: ${medCount}, Long: ${longCount}`);

  // Format strokes into Three.js drawing descriptors
  const formatted = finalRaw.map((sObj, idx) => {
    const pts = sObj.pts;
    const midIdx = Math.floor(pts.length / 2);
    let hex = getHex(pts[midIdx].u, pts[midIdx].v);

    // Color overrides for specialized features
    if (sObj.type === 'pilot_eye' || sObj.type === 'pilot_brow' || sObj.type === 'pilot_mouth') {
      hex = '#1c1512';
    } else if (sObj.type === 'pilot_headband') {
      hex = '#f8f8fb';
    } else if (sObj.type === 'gold_collar' || sObj.type === 'gold_claw') {
      hex = '#e8be48';
    } else if (sObj.type === 'pilot_hair') {
      hex = '#b8966e';
    }

    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);

    const isGold = (sObj.type === 'gold_collar' || sObj.type === 'gold_claw') || (r > 140 && g > 105 && b < 105 && r - b > 35);
    const isSkin = r > 150 && g > 105 && b > 80 && r - g > 25;
    const isWhite = r > 185 && g > 185 && b > 185;

    let size = 0.008;
    let brushShape = 'round';
    let materialType = 'metallic';
    let roughness = 0.45;
    let metalness = 0.65;

    if (isGold) {
      brushShape = 'conformal';
      materialType = 'metallic';
      roughness = 0.15;
      metalness = 0.96;
      size = sObj.category === 'short' ? 0.0065 : 0.008;
    } else if (sObj.type && sObj.type.startsWith('pilot')) {
      brushShape = 'round';
      materialType = 'standard';
      roughness = 0.65;
      metalness = 0.05;
      size = sObj.category === 'short' ? 0.0055 : 0.0075;
    } else if (isWhite) {
      brushShape = 'round';
      materialType = 'standard';
      roughness = 0.55;
      metalness = 0.15;
      size = 0.0085;
    } else if (sObj.category === 'long') {
      brushShape = 'round';
      size = 0.010;
      roughness = 0.5;
      metalness = 0.55;
    } else if (sObj.category === 'short') {
      brushShape = 'round';
      size = 0.007;
      roughness = 0.45;
      metalness = 0.65;
    }

    const points = pts.map((p, pIdx) => {
      const tp = transform(p.x, p.y, p.z);
      const t = pIdx / (pts.length - 1);
      // Realistic pen pressure tapering: thin at ends, full in center
      const pressure = Number((0.35 + 0.60 * Math.sin(t * Math.PI)).toFixed(2));
      return {
        x: tp.x,
        y: tp.y,
        z: tp.z,
        pressure,
      };
    });

    return {
      id: 'stroke_art_' + idx,
      color: hex,
      size,
      brushShape,
      materialType,
      roughness,
      metalness,
      points,
    };
  });

  fs.writeFileSync(path.join(OUTPUT_DIR, 'model-contours.json'), JSON.stringify(formatted));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'model-hybrid.json'), JSON.stringify(formatted));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'model-solid.json'), JSON.stringify(formatted));

  console.timeEnd('Total Generation');
  console.log(`Saved ${formatted.length} high-fidelity artistic strokes to ${OUTPUT_DIR}`);
}

run().catch(console.error);

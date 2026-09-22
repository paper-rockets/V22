/**
 * The artist: draws a model the way a person draws, in the order a person
 * draws it.
 *
 *   1 guides    - a ground line and the big masses blocked in loosely, the
 *                 construction lines that go down before anything else
 *   2 line art  - the whole subject as a 3D wireframe sketch: every crease,
 *                 silhouette and colour boundary, in long confident lines
 *   3 fill      - flat colour laid in by the patch, a few very wide passes
 *                 each, the way a wall gets filled as one wall
 *   4 details   - the small marks that finish it: window panes, trim, signage
 *
 * The strokes come out in that order, so replaying the file animates the
 * drawing exactly like a time-lapse.
 */

import { chainSlice, resample, splitIntoStrokes, polylineLength, chainEdges } from './chain.mjs';
import { fillPasses } from './patchfill.mjs';
import { humanizeStroke, jitterColorOklab, clamp } from './humanize.mjs';
import { srgbToLinear, hexOf, linearToOklab, oklabDistance, oklabToLinear } from './texture.mjs';

export class Artist {
  constructor({ mesh, tri, materials, random, noise, options }) {
    this.mesh = mesh;
    this.tri = tri;
    this.materials = materials;
    this.random = random;
    this.noise = noise;
    this.options = options;
    this.strokes = [];
    this.stats = {};
    this._rgba = [0, 0, 0, 0];
  }

  // ---------------------------------------------------------------- colour

  colorAt(point) {
    const matIndex = this.mesh.triMaterial[point.tri] ?? 0;
    const mat = this.materials[matIndex] || this.materials[0];
    const factor = mat ? mat.baseColorFactor : [0.8, 0.8, 0.8, 1];
    if (mat && mat.baseColor) {
      const s = mat.baseColor.sample(point.u, point.v, this._rgba);
      return [
        srgbToLinear(s[0]) * factor[0],
        srgbToLinear(s[1]) * factor[1],
        srgbToLinear(s[2]) * factor[2],
      ];
    }
    const idx = this.mesh.indices;
    const col = this.mesh.colors;
    let r = 0, g = 0, b = 0;
    for (let c = 0; c < 3; c++) {
      const v = idx[point.tri * 3 + c];
      r += col[v * 3]; g += col[v * 3 + 1]; b += col[v * 3 + 2];
    }
    return [(r / 3) * factor[0], (g / 3) * factor[1], (b / 3) * factor[2]];
  }

  /** Base-colour alpha at a point, including the material's own factor. */
  alphaAt(point) {
    const matIndex = this.mesh.triMaterial[point.tri] ?? 0;
    const mat = this.materials[matIndex] || this.materials[0];
    if (!mat) return 1;
    if (mat.alphaMode === 'OPAQUE') return 1;
    const factor = mat.baseColorFactor[3] ?? 1;
    if (!mat.baseColor) return factor;
    const s = mat.baseColor.sample(point.u, point.v, this._rgba);
    return (s[3] / 255) * factor;
  }

  /** Mean alpha across a triangle, for segmentation. */
  alphaOfTriangle(t) {
    const idx = this.mesh.indices;
    const uvs = this.mesh.uvs;
    let u = 0, v = 0;
    for (let c = 0; c < 3; c++) {
      const vi = idx[t * 3 + c];
      u += uvs[vi * 2]; v += uvs[vi * 2 + 1];
    }
    return this.alphaAt({ tri: t, u: u / 3, v: v / 3 });
  }

  colorOfTriangle(t) {
    const idx = this.mesh.indices;
    const uvs = this.mesh.uvs;
    let u = 0, v = 0;
    for (let c = 0; c < 3; c++) {
      const vi = idx[t * 3 + c];
      u += uvs[vi * 2]; v += uvs[vi * 2 + 1];
    }
    return this.colorAt({ tri: t, u: u / 3, v: v / 3 });
  }

  surfaceAt(point) {
    const matIndex = this.mesh.triMaterial[point.tri] ?? 0;
    const mat = this.materials[matIndex] || this.materials[0];
    let roughness = mat ? mat.roughnessFactor : 0.7;
    let metalness = mat ? mat.metallicFactor : 0.1;
    if (mat && mat.metallicRoughness) {
      const s = mat.metallicRoughness.sample(point.u, point.v, this._rgba);
      roughness = (s[1] / 255) * mat.roughnessFactor;
      metalness = (s[2] / 255) * mat.metallicFactor;
    }
    const { roughnessRange = [0.4, 0.95], metalnessRange = [0, 0.25] } = this.options;
    return [
      roughnessRange[0] + roughness * (roughnessRange[1] - roughnessRange[0]),
      metalnessRange[0] + metalness * (metalnessRange[1] - metalnessRange[0]),
    ];
  }

  // ---------------------------------------------------------------- strokes

  /**
   * Shared tail end of every stage: put the hand in, read the colour off the
   * texture, lift the stroke clear of the ones it should sit above.
   */
  makeStroke(points, spec) {
    const {
      stage, size, profile = 'ribbon', lift = 0.002,
      colorJitter = 0, valueShift = 0, chromaBoost = 1, opacity = 1,
      human = {}, widthProfile = null,
    } = spec;

    if (widthProfile) for (let i = 0; i < points.length; i++) points[i].coverage = widthProfile(points[i], i, points.length);
    const shaped = humanizeStroke(points, { width: size * 3, random: this.random, noise: this.noise, ...human });
    if (!shaped || shaped.points.length < 2) return null;

    let r = 0, g = 0, b = 0, rough = 0, metal = 0, alpha = 0;
    for (const p of points) {
      const c = this.colorAt(p);
      // Weight colour by how visible each sample actually is. Averaging a
      // transparent white highlight into an opaque teal the ordinary way turns
      // water into flat grey paint; nobody can see the part with no alpha.
      const a = this.alphaAt(p);
      r += c[0] * a; g += c[1] * a; b += c[2] * a;
      const s = this.surfaceAt(p);
      rough += s[0]; metal += s[1];
      alpha += a;
    }
    const n = points.length;
    // Glass and water are see-through in the model, so the paint is too. Below
    // a whisper of alpha there is nothing worth drawing at all.
    const meanAlpha = alpha / n;
    if (meanAlpha < 0.12) return null;
    const weight = Math.max(alpha, 1e-6);
    r /= weight; g /= weight; b /= weight;
    let lab = linearToOklab(r, g, b);
    if (colorJitter) lab = jitterColorOklab(lab, this.random, colorJitter);
    lab[0] = clamp(lab[0] + valueShift, 0.02, 1.2);
    lab[1] *= chromaBoost;
    lab[2] *= chromaBoost;
    const lin = oklabToLinear(lab[0], lab[1], lab[2]);

    // Depth order is baked into the geometry, not left to draw order: fills sit
    // closest to the surface, line work above them, details above that. The
    // drawing then animates in the artist's order while still reading right.
    for (const p of shaped.points) {
      p.x += p.nx * lift; p.y += p.ny * lift; p.z += p.nz * lift;
    }

    return {
      stage,
      color: hexOf(Math.max(0, lin[0]), Math.max(0, lin[1]), Math.max(0, lin[2])),
      size: Number(size.toFixed(5)),
      profile,
      materialType: 'shaded',
      opacity: Number((opacity * meanAlpha).toFixed(3)),
      roughness: Number(clamp(rough / n, 0.05, 1).toFixed(3)),
      metalness: Number(clamp(metal / n, 0, 1).toFixed(3)),
      points: shaped.points,
      length: polylineLength(shaped.points),
    };
  }

  record(stage, strokes, extra = {}) {
    this.stats[stage] = {
      strokes: strokes.length,
      points: strokes.reduce((a, s) => a + s.points.length, 0),
      ...extra,
    };
    this.strokes.push(...strokes);
    return strokes;
  }

  // ------------------------------------------------------------ 1. guides

  /**
   * The lines that go down before the drawing does: a ground line under the
   * subject, and the biggest masses blocked in as loose outlines.
   */
  drawGuides(boundaryLoops, bounds, config) {
    const { size, maxStrokes, pointSpacing, human, color } = config;
    const out = [];

    // ground line, a little wider than the subject
    const [minX, minY, minZ] = bounds.min;
    const [maxX, , maxZ] = bounds.max;
    const width = (maxX - minX) * 0.62;
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const groundPoints = [];
    for (let i = 0; i <= 10; i++) {
      const f = i / 10;
      groundPoints.push({
        x: cx - width + f * width * 2, y: minY - (maxX - minX) * 0.02, z: cz,
        nx: 0, ny: 0, nz: 1, u: 0, v: 0, tri: 0, coverage: 1,
      });
    }
    const ground = this.makeStroke(groundPoints, {
      stage: 'guides', size, lift: 0, human, ...(color || {}),
    });
    if (ground) { ground.color = color?.flat || ground.color; out.push(ground); }

    // big masses, loosely blocked in
    for (const loop of boundaryLoops.slice(0, maxStrokes - 1)) {
      if (polylineLength(loop.points) < pointSpacing * 4) continue;
      const dense = resample(loop.points, pointSpacing);
      if (dense.length < 4) continue;
      for (const p of dense) p.coverage = 1;
      const stroke = this.makeStroke(dense, { stage: 'guides', size, lift: 0.004, human });
      if (!stroke) continue;
      if (color?.flat) stroke.color = color.flat;
      stroke.opacity = config.opacity ?? 1;
      out.push(stroke);
      if (out.length >= maxStrokes) break;
    }

    return this.record('guides', out);
  }

  // ---------------------------------------------------------- 2. line art

  /**
   * The wireframe sketch. Long, continuous, confident lines on every crease,
   * silhouette and colour boundary - this is what makes the drawing readable,
   * so it gets the largest share of the budget.
   */
  drawLineArt(polylines, config) {
    const {
      size, sizeVariation, pointSpacing, lengths, gapRatio, maxStrokes,
      valueShift, chromaBoost, human, minLength, breakAngle,
    } = config;

    const ordered = polylines
      .map((p) => ({ p, len: polylineLength(p.points) }))
      .filter((e) => e.len >= minLength)
      .sort((a, b) => b.len - a.len);

    const out = [];
    for (const { p } of ordered) {
      const dense = resample(p.points, pointSpacing);
      if (dense.length < 2) continue;
      for (const q of dense) q.coverage = 1;
      const pieces = splitIntoStrokes(dense, pointSpacing, {
        lengths, gapRatio, minPoints: 2, breakAngle,
      }, this.random);
      for (const piece of pieces) {
        const scale = sizeVariation[0] + this.random() * (sizeVariation[1] - sizeVariation[0]);
        const stroke = this.makeStroke(piece, {
          stage: 'lineart', size: size * scale, lift: 0.009,
          valueShift, chromaBoost, human,
        });
        if (stroke) out.push(stroke);
      }
      if (out.length >= maxStrokes) break;
    }

    return this.record('lineart', out.slice(0, maxStrokes), { sources: polylines.length });
  }

  // -------------------------------------------------------------- 3. fill

  /**
   * Flat colour, one patch at a time.
   *
   * Each patch is brushed along its own long axis with strokes wide enough to
   * overlap their neighbours, so the inside comes out solid instead of
   * striped. A wall ends up as a handful of passes, not four hundred.
   */
  drawFill(regions, config) {
    const {
      minWidth, maxWidth, widthOfShort, overlap, pointSpacing, maxStrokes,
      colorJitter, human, minArea, stage = 'fill', phase = 0, widthScale = 1,
      lift = 0.001, valueShift = 0, minLength = 0, colorTolerance = 0.06,
    } = config;

    // Every patch gets at least one pass, and the rest of the budget is shared
    // out by area. Leaving the small ones to the detail stage is what punched
    // the holes in the paint: they simply never got covered.
    const usable = regions.filter((r) => r.triangles.length && r.area >= minArea);
    const totalArea = usable.reduce((a, r) => a + r.area, 0) || 1;
    const spare = Math.max(0, maxStrokes - usable.length);
    const allowance = usable.map((r) => 1 + Math.round((spare * r.area) / totalArea));

    const out = [];
    for (let i = 0; i < usable.length; i++) {
      if (out.length >= maxStrokes) break;
      const region = usable[i];
      // A patch never gets a brush wider than the patch is: forcing a minimum
      // width on a small patch makes the stroke hang off both sides of it, and
      // a model's worth of those reads as a pile of shards.
      const span = region.frame.shortExtent;
      const floor = Math.min(minWidth, span * 0.9);
      const width = clamp(span * widthOfShort, floor, Math.min(maxWidth, span * 1.05)) * widthScale;

      const passes = fillPasses(this.mesh, this.tri, region, {
        width, overlap, pointSpacing, phase,
        colorTolerance,
        labOfCell: (grid, idx) => linearToOklab(...this.colorAt({
          tri: grid.face[idx], u: grid.tu[idx], v: grid.tv[idx],
        })),
        // A pass shorter than this reads as a chip of rubble rather than a
        // brush stroke, so it is not worth drawing at all.
        minRun: Math.max(width * 0.45, minLength),
      });
      // The broad passes go down first, the way a person blocks in a shape
      // before tidying its corners.
      passes.sort((a, b) => b.length - a.length);

      let made = 0;
      for (const pass of passes) {
        if (made >= allowance[i] || out.length >= maxStrokes) break;
        const stroke = this.makeStroke(pass.points, {
          stage,
          size: width / 3,
          lift,
          colorJitter,
          valueShift,
          human,
          widthProfile: () => 1,
        });
        if (stroke) { out.push(stroke); made++; }
      }
    }

    return this.record(stage, out, { regions: usable.length });
  }

  // ----------------------------------------------------------- 4. details

  /**
   * The last marks: small patches that are too fine to fill properly - window
   * panes, trim, signage, handles - each given a couple of short strokes.
   */
  drawDetails(regions, config) {
    const {
      size, sizeVariation, pointSpacing, maxStrokes, maxArea, minArea,
      chromaBoost, human, perRegion,
    } = config;

    const small = regions
      .filter((r) => r.area <= maxArea && r.area >= minArea && r.triangles.length)
      .sort((a, b) => b.area - a.area);

    const out = [];
    for (const region of small) {
      if (out.length >= maxStrokes) break;
      const width = clamp(region.frame.shortExtent * 0.55, size * 0.5, size * 3.5);
      const passes = fillPasses(this.mesh, this.tri, region, {
        width, overlap: 1.3, pointSpacing, minRun: width * 0.4,
      });
      passes.sort((a, b) => b.length - a.length);

      let made = 0;
      for (const pass of passes) {
        if (made >= perRegion || out.length >= maxStrokes) break;
        const scale = sizeVariation[0] + this.random() * (sizeVariation[1] - sizeVariation[0]);
        const stroke = this.makeStroke(pass.points, {
          stage: 'details', size: (width / 3) * scale, lift: 0.006, chromaBoost, human,
          widthProfile: () => 1,
        });
        if (stroke) { out.push(stroke); made++; }
      }
    }

    return this.record('details', out, { candidates: small.length });
  }
}

/**
 * Edges where one patch meets another, or meets nothing at all.
 *
 * These are the colour boundaries and the silhouette - the lines a person
 * draws to separate the door from the wall. Together with the creases they
 * make up the wireframe sketch.
 */
export function regionBoundaryEdges(mesh, tri, adjacency, regionOf, keep) {
  const edges = [];
  const seen = new Set();
  for (let t = 0; t < tri.triCount; t++) {
    if (keep && !keep[t]) continue;
    for (let e = 0; e < 3; e++) {
      const nb = adjacency[t * 3 + e];
      const outside = nb < 0 || (keep && !keep[nb]);
      if (!outside && regionOf[nb] === regionOf[t]) continue;
      const ia = mesh.indices[t * 3 + e];
      const ib = mesh.indices[t * 3 + ((e + 1) % 3)];
      const a = mesh.remap[ia], b = mesh.remap[ib];
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a: ia, b: ib, faces: [t] });
    }
  }
  return edges;
}

/** Chains a set of edges into the longest polylines it can. */
export function linesFromEdges(edges, mesh, remap) {
  return chainEdges(edges, mesh, remap);
}

/**
 * The painter: turns extracted contours into finished strokes, one pass at a
 * time, the way somebody actually works a surface up.
 *
 *   1 underpaint - wide loose sweeps that put the big shapes down
 *   2 form       - the main modelling pass wrapping the volumes
 *   3 detail     - short narrow strokes only where the texture has something
 *                  to say (panel gaps, gold trim, the face)
 *   4 lines      - broken ink over the creases and silhouette
 *   5 accents    - tiny flicks of the brightest and darkest notes
 */

import { chainSlice, resample, splitIntoStrokes, polylineLength } from './chain.mjs';
import { sliceAxis, familyMasks } from './slicer.mjs';
import { humanizeStroke, jitterColorOklab, clamp } from './humanize.mjs';
import { srgbToLinear, hexOf, linearToOklab, oklabDistance, oklabToLinear } from './texture.mjs';

export class Painter {
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

  /** Base colour at a point, in linear sRGB, including the material factor. */
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
    // No usable texture: fall back to the triangle's vertex colours (already
    // linear per the glTF spec) tinted by the material's base colour factor.
    const idx = this.mesh.indices;
    const col = this.mesh.colors;
    let r = 0, g = 0, b = 0;
    for (let c = 0; c < 3; c++) {
      const v = idx[point.tri * 3 + c];
      r += col[v * 3]; g += col[v * 3 + 1]; b += col[v * 3 + 2];
    }
    return [(r / 3) * factor[0], (g / 3) * factor[1], (b / 3) * factor[2]];
  }

  /**
   * Roughness / metalness at a point, from the packed glTF ORM texture.
   *
   * Both are compressed into the range paint actually lives in. A fully
   * metallic value is right for a rendered mech and wrong for a brush stroke:
   * the studio gives metals almost no environment to reflect, so anything
   * above ~0.3 just turns black and the texture's colour is lost.
   */
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
    const { roughnessRange = [0.35, 0.95], metalnessRange = [0, 0.3] } = this.options;
    return [
      roughnessRange[0] + roughness * (roughnessRange[1] - roughnessRange[0]),
      metalnessRange[0] + metalness * (metalnessRange[1] - metalnessRange[0]),
    ];
  }

  /**
   * Collects contour polylines across all three slicing axes at one spacing.
   * `triangleFilter` narrows a pass down to the triangles it cares about.
   */
  collectContours({ spacing, triangleFilter, phase = 0 }) {
    const families = familyMasks(this.tri, triangleFilter, this.options.normalField, {
      gate: this.options.gate,
      overlap: this.options.gateOverlap,
    });
    const result = [];
    for (const family of families) {
      if (!family.area) continue;
      const slices = sliceAxis(this.mesh, this.tri, {
        axis: family.axis, spacing, mask: family.mask, keep: triangleFilter, phase,
      });
      for (const slice of slices) {
        for (const poly of chainSlice(slice.segments)) {
          if (poly.points.length < 2) continue;
          result.push({ ...poly, axisIndex: slice.axisIndex, spacing });
        }
      }
    }
    return result;
  }

  /**
   * How much extra width this point needs so neighbouring contours touch.
   * Contours on a surface tilted away from the slice direction spread apart by
   * 1/sin(theta); pressure carries that back into the ribbon width.
   */
  coverageAt(point, axisIndex, spacing, nominalWidth) {
    const dot = Math.abs(axisIndex === 0 ? point.nx : axisIndex === 1 ? point.ny : point.nz);
    const sinTheta = Math.sqrt(Math.max(0.05, 1 - dot * dot));
    const needed = (spacing / sinTheta) * this.options.coverage;
    return clamp(needed / nominalWidth, 0.35, 1.0);
  }

  /** Marks the points where the texture colour changes enough to need a new stroke. */
  colorBreaks(points, tolerance) {
    const breaks = new Uint8Array(points.length);
    let ref = linearToOklab(...this.colorAt(points[0]));
    for (let i = 1; i < points.length; i++) {
      const lab = linearToOklab(...this.colorAt(points[i]));
      if (oklabDistance(lab, ref) > tolerance) {
        breaks[i] = 1;
        ref = lab;
      }
    }
    return breaks;
  }

  /**
   * Runs one painting pass and appends its strokes.
   */
  runPass(name, config) {
    const {
      spacing,
      pointSpacing,
      lengths,
      size,
      sizeVariation = [0.75, 1.4],
      triangleFilter = null,
      profile = 'ribbon',
      materialType = 'shaded',
      colorTolerance = 0.06,
      colorJitter = 0.02,
      valueShift = 0,
      chromaBoost = 1,
      opacity = 1,
      gapRatio = [0.02, 0.4],
      minPoints = 3,
      breakAngle = 0,
      human = {},
      phase = 0,
      polylines = null,
      maxStrokes = Infinity,
      minLength = 0,
      dryRun = false,
    } = config;

    const random = this.random;
    const source = polylines || this.collectContours({ spacing, triangleFilter, phase });
    const produced = [];

    for (const poly of source) {
      if (polylineLength(poly.points) < Math.max(minLength, pointSpacing * 2)) continue;
      const dense = resample(poly.points, pointSpacing);
      if (dense.length < minPoints) continue;

      const nominalWidth = 3 * size; // ribbon full width at pressure 1
      const axisIndex = poly.axisIndex ?? 1;
      for (const p of dense) p.coverage = this.coverageAt(p, axisIndex, poly.spacing ?? spacing, nominalWidth);

      const breaks = this.colorBreaks(dense, colorTolerance);
      const pieces = splitIntoStrokes(dense, pointSpacing, {
        lengths, gapRatio, minPoints, breakAngle, breaks,
      }, random);

      for (const piece of pieces) {
        const sizeScale = sizeVariation[0] + random() * (sizeVariation[1] - sizeVariation[0]);
        const maxSize = (this.options.maxWidth ?? Infinity) / 3;
        const strokeSize = Math.min(size * sizeScale, maxSize);
        const shaped = humanizeStroke(piece, {
          width: strokeSize * 3,
          random,
          noise: this.noise,
          ...human,
        });
        if (!shaped || shaped.points.length < 2) continue;

        // Average colour in linear light, then nudge it the way a reloaded
        // brush never matches the last one exactly.
        let r = 0, g = 0, b = 0, rough = 0, metal = 0;
        for (const p of piece) {
          const c = this.colorAt(p);
          r += c[0]; g += c[1]; b += c[2];
          const s = this.surfaceAt(p);
          rough += s[0]; metal += s[1];
        }
        const n = piece.length;
        let lab = linearToOklab(r / n, g / n, b / n);
        lab = jitterColorOklab(lab, random, colorJitter);
        lab[0] = clamp(lab[0] + valueShift, 0.02, 1.2);
        lab[1] *= chromaBoost;
        lab[2] *= chromaBoost;
        const lin = oklabToLinear(lab[0], lab[1], lab[2]);

        produced.push({
          pass: name,
          color: hexOf(Math.max(0, lin[0]), Math.max(0, lin[1]), Math.max(0, lin[2])),
          size: Number(strokeSize.toFixed(5)),
          profile,
          materialType,
          opacity,
          roughness: Number(clamp(rough / n, 0.05, 1).toFixed(3)),
          metalness: Number(clamp(metal / n, 0, 1).toFixed(3)),
          points: shaped.points,
          length: polylineLength(shaped.points),
          slipped: shaped.slipped,
        });
      }
    }

    // Trim to budget, keeping the strokes that carry the most of the form.
    let kept = produced;
    if (produced.length > maxStrokes) {
      kept = produced
        .map((s, i) => ({ s, w: s.length * (0.6 + this.random()) , i }))
        .sort((a, b) => b.w - a.w)
        .slice(0, maxStrokes)
        .map((e) => e.s);
    }

    if (dryRun) return produced;

    this.stats[name] = {
      polylines: source.length,
      strokes: kept.length,
      dropped: produced.length - kept.length,
      points: kept.reduce((a, s) => a + s.points.length, 0),
    };
    this.strokes.push(...kept);
    return kept;
  }
}

/**
 * Orders strokes the way the drawing would actually be made: pass by pass, and
 * within a pass sweeping around the model rather than hopping about at random.
 */
export function orderStrokes(strokes, passOrder, random) {
  const rank = new Map(passOrder.map((p, i) => [p, i]));
  return strokes
    .map((s) => {
      let cx = 0, cy = 0, cz = 0;
      for (const p of s.points) { cx += p.x; cy += p.y; cz += p.z; }
      const n = s.points.length;
      cx /= n; cy /= n; cz /= n;
      const angle = Math.atan2(cz, cx);
      return { s, rank: rank.get(s.pass) ?? 99, band: Math.floor(cy / 0.28), angle, jitter: random() };
    })
    .sort((a, b) =>
      a.rank - b.rank ||
      b.band - a.band ||
      a.angle - b.angle ||
      a.jitter - b.jitter
    )
    .map((e) => e.s);
}

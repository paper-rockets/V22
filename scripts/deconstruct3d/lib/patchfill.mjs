/**
 * Filling a patch the way a person fills a wall.
 *
 * Slicing the patch's geometry gives strokes that follow the raw triangle
 * boundary, so every pass comes out with a torn edge and the wall reads as
 * rubble. A person does the opposite: they see the shape flat, and pull the
 * brush straight across it from one edge to the other.
 *
 * So the patch is flattened onto its own plane and rasterised into a grid.
 * Each band across that grid becomes one clean stroke, clipped exactly to
 * where the patch actually is - holes, notches and all - and then lifted back
 * onto the surface using the height, normal and texture coordinate recorded in
 * each cell. Straight passes, honest edges, correct colour.
 */

const MAX_CELLS = 400;

export function rasterisePatch(mesh, tri, region, cellSize) {
  const { normal, longAxis, shortAxis } = region.frame;
  const origin = region.centroid;
  const { positions, normals, uvs, indices } = mesh;

  const project = (x, y, z) => {
    const dx = x - origin[0], dy = y - origin[1], dz = z - origin[2];
    return [
      dx * longAxis[0] + dy * longAxis[1] + dz * longAxis[2],
      dx * shortAxis[0] + dy * shortAxis[1] + dz * shortAxis[2],
      dx * normal[0] + dy * normal[1] + dz * normal[2],
    ];
  };

  // bounds in patch space
  let uMin = Infinity, uMax = -Infinity, vMin = Infinity, vMax = -Infinity;
  for (const t of region.triangles) {
    for (let c = 0; c < 3; c++) {
      const i = indices[t * 3 + c];
      const [u, v] = project(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      if (u < uMin) uMin = u; if (u > uMax) uMax = u;
      if (v < vMin) vMin = v; if (v > vMax) vMax = v;
    }
  }
  if (!isFinite(uMin) || uMax - uMin < 1e-6 || vMax - vMin < 1e-6) return null;

  // a margin of one cell keeps edge strokes from being clipped short
  uMin -= cellSize; uMax += cellSize; vMin -= cellSize; vMax += cellSize;
  let cell = cellSize;
  const needed = Math.max((uMax - uMin) / cell, (vMax - vMin) / cell);
  if (needed > MAX_CELLS) cell *= needed / MAX_CELLS;
  const cols = Math.max(1, Math.ceil((uMax - uMin) / cell));
  const rows = Math.max(1, Math.ceil((vMax - vMin) / cell));

  const filled = new Uint8Array(cols * rows);
  const height = new Float32Array(cols * rows);
  const nx = new Float32Array(cols * rows);
  const ny = new Float32Array(cols * rows);
  const nz = new Float32Array(cols * rows);
  const tu = new Float32Array(cols * rows);
  const tv = new Float32Array(cols * rows);
  const face = new Int32Array(cols * rows).fill(-1);

  for (const t of region.triangles) {
    const i0 = indices[t * 3], i1 = indices[t * 3 + 1], i2 = indices[t * 3 + 2];
    const a = project(positions[i0 * 3], positions[i0 * 3 + 1], positions[i0 * 3 + 2]);
    const b = project(positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2]);
    const c = project(positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2]);

    const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    if (Math.abs(area) < 1e-12) continue;
    const inv = 1 / area;

    const c0 = Math.max(0, Math.floor((Math.min(a[0], b[0], c[0]) - uMin) / cell));
    const c1 = Math.min(cols - 1, Math.ceil((Math.max(a[0], b[0], c[0]) - uMin) / cell));
    const r0 = Math.max(0, Math.floor((Math.min(a[1], b[1], c[1]) - vMin) / cell));
    const r1 = Math.min(rows - 1, Math.ceil((Math.max(a[1], b[1], c[1]) - vMin) / cell));

    for (let r = r0; r <= r1; r++) {
      const py = vMin + (r + 0.5) * cell;
      for (let col = c0; col <= c1; col++) {
        const px = uMin + (col + 0.5) * cell;
        const w0 = ((b[0] - px) * (c[1] - py) - (c[0] - px) * (b[1] - py)) * inv;
        const w1 = ((c[0] - px) * (a[1] - py) - (a[0] - px) * (c[1] - py)) * inv;
        const w2 = 1 - w0 - w1;
        if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
        const idx = r * cols + col;
        if (filled[idx]) continue;
        filled[idx] = 1;
        height[idx] = w0 * a[2] + w1 * b[2] + w2 * c[2];
        let x = w0 * normals[i0 * 3] + w1 * normals[i1 * 3] + w2 * normals[i2 * 3];
        let y = w0 * normals[i0 * 3 + 1] + w1 * normals[i1 * 3 + 1] + w2 * normals[i2 * 3 + 1];
        let z = w0 * normals[i0 * 3 + 2] + w1 * normals[i1 * 3 + 2] + w2 * normals[i2 * 3 + 2];
        if (mesh.triFlip && mesh.triFlip[t]) { x = -x; y = -y; z = -z; }
        const l = Math.hypot(x, y, z) || 1;
        nx[idx] = x / l; ny[idx] = y / l; nz[idx] = z / l;
        tu[idx] = w0 * uvs[i0 * 2] + w1 * uvs[i1 * 2] + w2 * uvs[i2 * 2];
        tv[idx] = w0 * uvs[i0 * 2 + 1] + w1 * uvs[i1 * 2 + 1] + w2 * uvs[i2 * 2 + 1];
        face[idx] = t;
      }
    }
  }

  return {
    cols, rows, cell, uMin, vMin, origin, normal, longAxis, shortAxis,
    filled, height, nx, ny, nz, tu, tv, face,
  };
}

/** Turns a cell back into a 3D point with its own normal, uv and depth. */
function cellPoint(grid, col, row, uOffset = 0.5) {
  const idx = row * grid.cols + col;
  const u = grid.uMin + (col + uOffset) * grid.cell;
  const v = grid.vMin + (row + 0.5) * grid.cell;
  const h = grid.height[idx];
  const { origin, longAxis, shortAxis, normal } = grid;
  return {
    x: origin[0] + longAxis[0] * u + shortAxis[0] * v + normal[0] * h,
    y: origin[1] + longAxis[1] * u + shortAxis[1] * v + normal[1] * h,
    z: origin[2] + longAxis[2] * u + shortAxis[2] * v + normal[2] * h,
    nx: grid.nx[idx], ny: grid.ny[idx], nz: grid.nz[idx],
    u: grid.tu[idx], v: grid.tv[idx],
    tri: grid.face[idx],
    coverage: 1,
  };
}

/**
 * Lays parallel passes across the patch.
 *
 * Each band is scanned for runs of patch, and every run becomes one stroke
 * that starts and stops exactly where the patch does. Bands are spaced closer
 * than a stroke is wide, so the passes overlap and the fill comes out solid.
 */
export function fillPasses(mesh, tri, region, {
  width, overlap, pointSpacing, minRun, phase = 0, labOfCell = null, colorTolerance = 0.06,
}) {
  const cellSize = Math.max(width / 5, region.frame.shortExtent / MAX_CELLS);
  const grid = rasterisePatch(mesh, tri, region, cellSize);
  if (!grid) return [];

  const spacing = width / overlap;
  const bandRows = Math.max(1, Math.round(spacing / grid.cell));
  const strokes = [];

  // Start half a band in, so the first pass sits inside the patch edge. A
  // phase offset lets a second pass land between the first pass's bands.
  const first = Math.floor(bandRows * (0.5 + phase)) % Math.max(1, bandRows);
  for (let row = first; row < grid.rows; row += bandRows) {
    let runStart = -1;
    let ref = null;
    const close = (runEnd) => {
      if (runStart < 0) return;
      if ((runEnd - runStart + 1) * grid.cell >= minRun) {
        strokes.push(runToStroke(grid, row, runStart, runEnd, pointSpacing));
      }
      runStart = -1;
      ref = null;
    };
    for (let col = 0; col <= grid.cols; col++) {
      const idx = row * grid.cols + col;
      const inside = col < grid.cols && grid.filled[idx];
      if (!inside) { close(col - 1); continue; }
      // A stroke carries one colour, so it has to stop where the colour does.
      // Running a single pass across a window frame averages the two together
      // and quietly erases every piece of trim on the model.
      if (labOfCell) {
        const lab = labOfCell(grid, idx);
        if (runStart >= 0 && ref && labDistance(lab, ref) > colorTolerance) {
          close(col - 1);
        }
        if (runStart < 0) ref = lab;
      }
      if (runStart < 0) runStart = col;
    }
    close(grid.cols - 1);
  }

  return strokes.filter((s) => s && s.points.length >= 2);
}

function labDistance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function runToStroke(grid, row, from, to, pointSpacing) {
  const cells = to - from + 1;
  const step = Math.max(1, Math.round(pointSpacing / grid.cell));
  const points = [];
  for (let col = from; col <= to; col += step) points.push(cellPoint(grid, col, row));
  // always finish exactly at the far edge of the run
  const last = points[points.length - 1];
  const end = cellPoint(grid, to, row, 1.0);
  if (!last || Math.hypot(end.x - last.x, end.y - last.y, end.z - last.z) > grid.cell * 0.4) {
    points.push(end);
  } else {
    points[points.length - 1] = end;
  }
  if (points.length) points[0] = cellPoint(grid, from, row, 0.0);
  return { points, length: cells * grid.cell };
}

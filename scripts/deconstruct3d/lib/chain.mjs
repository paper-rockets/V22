/**
 * Turns loose intersection segments into drawable polylines, then cuts those
 * polylines into stroke-sized pieces.
 */

/**
 * Links the segments of one slice into polylines.
 *
 * A plane through a closed surface always produces closed loops, so every
 * endpoint is normally shared by exactly two segments. Where interior geometry
 * has been culled away the loop has genuine open ends - those are the visible
 * arcs, and they are what we want to draw.
 */
export function chainSlice(segments) {
  const ends = new Map();
  for (let i = 0; i < segments.length; i++) {
    for (let e = 0; e < 2; e++) {
      const k = segments[i][e].key;
      let list = ends.get(k);
      if (!list) ends.set(k, (list = []));
      list.push({ seg: i, end: e });
    }
  }

  const used = new Uint8Array(segments.length);
  const polylines = [];

  const dirOf = (from, to) => {
    const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
    const l = Math.hypot(dx, dy, dz) || 1;
    return [dx / l, dy / l, dz / l];
  };

  const walk = (startSeg, startEnd) => {
    // startEnd is the endpoint we walk AWAY from
    const points = [segments[startSeg][startEnd], segments[startSeg][1 - startEnd]];
    used[startSeg] = 1;
    let tail = points[points.length - 1];
    let heading = dirOf(points[0], tail);
    for (;;) {
      const list = ends.get(tail.key);
      if (!list) break;
      // Where three or more segments meet, carry straight on. Taking whichever
      // one happened to be stored first sends the stroke zig-zagging back and
      // forth across the surface.
      let nextSeg = -1, nextEnd = -1, bestTurn = -2;
      for (const cand of list) {
        if (used[cand.seg]) continue;
        const seg = segments[cand.seg];
        const other = seg[1 - cand.end];
        const d = dirOf(tail, other);
        const turn = d[0] * heading[0] + d[1] * heading[1] + d[2] * heading[2];
        if (turn > bestTurn) { bestTurn = turn; nextSeg = cand.seg; nextEnd = cand.end; }
      }
      if (nextSeg < 0) break;
      used[nextSeg] = 1;
      const nextPoint = segments[nextSeg][1 - nextEnd];
      heading = dirOf(tail, nextPoint);
      points.push(nextPoint);
      tail = nextPoint;
      if (tail.key === points[0].key) break; // closed the loop
    }
    return points;
  };

  // Open ends first: an endpoint touched by only one segment can only be the
  // start of an arc, and starting there keeps arcs whole.
  for (const [, list] of ends) {
    const live = list.filter((c) => !used[c.seg]);
    if (live.length !== 1) continue;
    const { seg, end } = live[0];
    if (used[seg]) continue;
    const pts = walk(seg, end);
    if (pts.length >= 2) polylines.push({ points: pts, closed: false });
  }

  // Whatever is left is a closed loop.
  for (let i = 0; i < segments.length; i++) {
    if (used[i]) continue;
    const pts = walk(i, 0);
    if (pts.length >= 2) {
      const closed = pts[pts.length - 1].key === pts[0].key;
      polylines.push({ points: pts, closed });
    }
  }

  return polylines;
}

export function polylineLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].y - points[i - 1].y,
      points[i].z - points[i - 1].z
    );
  }
  return total;
}

function lerpPoint(a, b, f) {
  const nx = a.nx + f * (b.nx - a.nx);
  const ny = a.ny + f * (b.ny - a.ny);
  const nz = a.nz + f * (b.nz - a.nz);
  const l = Math.hypot(nx, ny, nz) || 1;
  return {
    x: a.x + f * (b.x - a.x),
    y: a.y + f * (b.y - a.y),
    z: a.z + f * (b.z - a.z),
    nx: nx / l, ny: ny / l, nz: nz / l,
    u: a.u + f * (b.u - a.u),
    v: a.v + f * (b.v - a.v),
    tri: f < 0.5 ? a.tri : b.tri,
  };
}

/** Uniform arc-length resample with all attributes carried along. */
export function resample(points, spacing) {
  if (points.length < 2) return points.slice();
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    cumulative.push(
      cumulative[i - 1] +
      Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y, points[i].z - points[i - 1].z)
    );
  }
  const total = cumulative[cumulative.length - 1];
  if (total < 1e-9) return [points[0]];
  const steps = Math.max(1, Math.round(total / spacing));
  const out = [];
  let seg = 0;
  for (let s = 0; s <= steps; s++) {
    const d = (s / steps) * total;
    while (seg < points.length - 2 && cumulative[seg + 1] < d) seg++;
    const span = cumulative[seg + 1] - cumulative[seg];
    const f = span > 1e-12 ? (d - cumulative[seg]) / span : 0;
    out.push(lerpPoint(points[seg], points[seg + 1], f));
  }
  return out;
}

/** Sub-range of a resampled polyline, by point index, inclusive. */
export function slicePoints(points, from, to) {
  return points.slice(Math.max(0, from), Math.min(points.length, to + 1));
}

/**
 * Splits a resampled polyline into stroke-length pieces.
 *
 * Lengths are drawn from the requested distribution and each cut leaves a
 * small random gap, because a person lifts the brush at slightly different
 * places every pass and never butts two strokes end to end perfectly.
 */
export function splitIntoStrokes(points, spacing, options, random) {
  const { lengths, gapRatio = [0.0, 0.5], minPoints = 3, breakAngle = 0, breaks = null } = options;
  const total = points.length;
  const pieces = [];
  let cursor = Math.floor(random() * Math.max(1, Math.round((lengths[0] / spacing) * 0.5)));

  // Optional hard break at corners sharper than breakAngle (radians)
  const corner = new Uint8Array(total);
  if (breakAngle > 0) {
    const cosLimit = Math.cos(breakAngle);
    for (let i = 1; i < total - 1; i++) {
      const ax = points[i].x - points[i - 1].x, ay = points[i].y - points[i - 1].y, az = points[i].z - points[i - 1].z;
      const bx = points[i + 1].x - points[i].x, by = points[i + 1].y - points[i].y, bz = points[i + 1].z - points[i].z;
      const la = Math.hypot(ax, ay, az) || 1, lb = Math.hypot(bx, by, bz) || 1;
      if ((ax * bx + ay * by + az * bz) / (la * lb) < cosLimit) corner[i] = 1;
    }
  }
  if (breaks) {
    for (let i = 0; i < total; i++) if (breaks[i]) corner[i] = 1;
  }

  while (cursor < total - 1) {
    const targetLength = lengths[Math.floor(random() * lengths.length)] * (0.65 + random() * 0.8);
    let count = Math.max(minPoints, Math.round(targetLength / spacing));
    let end = Math.min(total - 1, cursor + count);
    for (let i = cursor + minPoints; i < end; i++) {
      if (corner[i]) { end = i; break; }
    }
    if (end - cursor + 1 >= minPoints) pieces.push(slicePoints(points, cursor, end));
    const gap = gapRatio[0] + random() * (gapRatio[1] - gapRatio[0]);
    cursor = end + Math.max(0, Math.round((gap * targetLength) / spacing));
  }
  return pieces;
}

/**
 * Chains crease / boundary edges into continuous polylines.
 *
 * Creases are where a person puts their pen down: panel gaps, the folds of
 * armour, the edge where a shape turns away. Walking them into long lines
 * first means the dashes that come out later follow one edge instead of
 * scattering across several.
 */
export function chainEdges(edges, mesh, remap) {
  const adjacency = new Map();
  const push = (k, e) => {
    let list = adjacency.get(k);
    if (!list) adjacency.set(k, (list = []));
    list.push(e);
  };
  edges.forEach((e, i) => {
    push(remap[e.a], i);
    push(remap[e.b], i);
  });

  const used = new Uint8Array(edges.length);
  const polylines = [];

  const makePoint = (vertexIndex, triIndex) => ({
    x: mesh.positions[vertexIndex * 3],
    y: mesh.positions[vertexIndex * 3 + 1],
    z: mesh.positions[vertexIndex * 3 + 2],
    nx: mesh.normals[vertexIndex * 3] * (mesh.triFlip && mesh.triFlip[triIndex] ? -1 : 1),
    ny: mesh.normals[vertexIndex * 3 + 1] * (mesh.triFlip && mesh.triFlip[triIndex] ? -1 : 1),
    nz: mesh.normals[vertexIndex * 3 + 2] * (mesh.triFlip && mesh.triFlip[triIndex] ? -1 : 1),
    u: mesh.uvs[vertexIndex * 2],
    v: mesh.uvs[vertexIndex * 2 + 1],
    tri: triIndex,
  });

  const extend = (edgeIndex, fromVertex) => {
    const chain = [];
    let current = edgeIndex;
    let vertex = fromVertex;
    let heading = null;
    for (;;) {
      used[current] = 1;
      const e = edges[current];
      const other = remap[e.a] === vertex ? e.b : e.a;
      const point = makePoint(other, e.faces[0]);
      const previous = chain.length ? chain[chain.length - 1] : null;
      if (previous) {
        const dx = point.x - previous.x, dy = point.y - previous.y, dz = point.z - previous.z;
        const l = Math.hypot(dx, dy, dz) || 1;
        heading = [dx / l, dy / l, dz / l];
      }
      chain.push(point);
      const key = remap[other];
      const candidates = (adjacency.get(key) || []).filter((i) => !used[i]);
      if (!candidates.length) break;
      // At a junction, keep going the way the line was already going.
      let best = candidates[0];
      if (candidates.length > 1 && heading) {
        let bestTurn = -2;
        for (const c of candidates) {
          const ce = edges[c];
          const far = remap[ce.a] === key ? ce.b : ce.a;
          const dx = mesh.positions[far * 3] - point.x;
          const dy = mesh.positions[far * 3 + 1] - point.y;
          const dz = mesh.positions[far * 3 + 2] - point.z;
          const l = Math.hypot(dx, dy, dz) || 1;
          const turn = (dx / l) * heading[0] + (dy / l) * heading[1] + (dz / l) * heading[2];
          if (turn > bestTurn) { bestTurn = turn; best = c; }
        }
      }
      current = best;
      vertex = key;
    }
    return chain;
  };

  for (let i = 0; i < edges.length; i++) {
    if (used[i]) continue;
    const e = edges[i];
    const startKey = remap[e.a];
    const head = makePoint(e.a, e.faces[0]);
    const forward = extend(i, startKey);
    // walk backwards from the start as well so we get the whole edge run
    const backCandidates = (adjacency.get(startKey) || []).filter((j) => !used[j]);
    let backward = [];
    if (backCandidates.length) backward = extend(backCandidates[0], startKey).reverse();
    const points = [...backward, head, ...forward];
    if (points.length >= 2) polylines.push({ points, closed: false });
  }

  return polylines;
}

import * as THREE from 'three';
import { StrokePoint, BrushSettings, StrokeProfile } from '../types';

// ============================================================================
// Zero-Allocation Math & Vector Scratch Pools
// ============================================================================
class VectorPool {
  private pool: THREE.Vector3[] = [];
  private index = 0;

  public get(): THREE.Vector3 {
    if (this.index >= this.pool.length) {
      this.pool.push(new THREE.Vector3());
    }
    return this.pool[this.index++];
  }

  public reset(): void {
    this.index = 0;
  }
}

const _vecPool = new VectorPool();
const _scratchV1 = new THREE.Vector3();
const _scratchV2 = new THREE.Vector3();
const _scratchV3 = new THREE.Vector3();
const _scratchV4 = new THREE.Vector3();
const _scratchNorm = new THREE.Vector3();
const _scratchBinorm = new THREE.Vector3();
const _scratchTan = new THREE.Vector3();
const _scratchCenter = new THREE.Vector3();
const _scratchJitter = new THREE.Vector3();
const _scratchRadialDir = new THREE.Vector3();
const _scratchPos = new THREE.Vector3();
const _scratchArchNorm = new THREE.Vector3();
const _scratchTipDir = new THREE.Vector3();
const _scratchTipPos = new THREE.Vector3();
const _scratchChiselDir = new THREE.Vector3();

// Reusable working arrays to prevent garbage collection churn
let _workVertices: number[] = [];
let _workNormals: number[] = [];
let _workUvs: number[] = [];
let _workIndices: number[] = [];

/**
 * Volumetric Stroke Geometry Generator
 * Supports 4 distinct geometric profiles:
 * - Tube: 360-degree cylindrical 3D mesh with spherical end-caps (equal volume from all angles)
 * - Ribbon: Flat tape-like cross-section aligned with drawing surface / plane
 * - Marker / Chisel: Asymmetric rectangular profile with calligraphic angle variation
 * - Conformal: Arched dome cross-section snapped to surface curvature
 *
 * Fully optimized for zero-allocation real-time drawing & in-place dynamic vertex updates.
 */
export class ConformalBeadGenerator {
  private raycaster: THREE.Raycaster;

  constructor() {
    this.raycaster = new THREE.Raycaster();
  }

  /**
   * Builds volumetric stroke geometry from sampled points and brush profile settings
   */
  public generateGeometry(
    rawPoints: StrokePoint[],
    settings: BrushSettings,
    targetMeshes: THREE.Mesh[] = []
  ): THREE.BufferGeometry {
    const geom = new THREE.BufferGeometry();
    return this.updateBufferGeometry(geom, rawPoints, settings, targetMeshes);
  }

  /**
   * Zero-allocation in-place buffer update.
   * If targetGeom already contains allocated buffers with adequate capacity,
   * it updates the Float32Arrays directly and sets drawRange without GC allocations.
   */
  public updateBufferGeometry(
    targetGeom: THREE.BufferGeometry,
    rawPoints: StrokePoint[],
    settings: BrushSettings,
    targetMeshes: THREE.Mesh[] = []
  ): THREE.BufferGeometry {
    if (!rawPoints || rawPoints.length === 0) {
      targetGeom.setDrawRange(0, 0);
      return targetGeom;
    }

    _vecPool.reset();
    _workVertices.length = 0;
    _workNormals.length = 0;
    _workUvs.length = 0;
    _workIndices.length = 0;

    // Filter micro-jitter
    const filteredPoints: StrokePoint[] = [rawPoints[0]];
    for (let i = 1; i < rawPoints.length; i++) {
      const prev = filteredPoints[filteredPoints.length - 1];
      const curr = rawPoints[i];
      if (prev.position.distanceTo(curr.position) > 0.0008) {
        filteredPoints.push(curr);
      }
    }

    const profile: StrokeProfile = settings.profile || 'ribbon';

    // Handle single dab
    if (filteredPoints.length === 1) {
      this.populateDabData(filteredPoints[0], settings, profile);
      return this.applyDataToGeometry(targetGeom);
    }

    // Interpolate points along centripetal Catmull-Rom curve with surface snapping
    const { positions, normals, pressures } = this.resampleCurve(
      filteredPoints,
      settings.size,
      targetMeshes
    );
    const numPoints = positions.length;

    if (numPoints < 2) {
      this.populateDabData(filteredPoints[0], settings, profile);
      return this.applyDataToGeometry(targetGeom);
    }

    // Compute cumulative distances
    const cumulativeDistances: number[] = [0];
    let totalLength = 0;
    for (let i = 1; i < numPoints; i++) {
      totalLength += positions[i].distanceTo(positions[i - 1]);
      cumulativeDistances.push(totalLength);
    }

    const isSurfaceStroke = filteredPoints.some((p) => p.isSurfaceHit);

    const seq = settings.strokeSequenceIndex ?? 0;
    // Adaptive normal-offset bias: p_offset = p_base + n_plane * (i * epsilon) where epsilon ~ 0.0005
    const seqElevation = (seq % 2000) * 0.0005;
    const baseOffset = (settings.surfaceOffset ?? 0.0045) + seqElevation;
    const taperLength = Math.max(0.01, settings.taperLength ?? 0.05);

    // Compute continuous Bishop Rotation Minimizing Frames (RMF) using Double Reflection Method
    const { tangents, normals: bishopNormals, binormals: bishopBinormals } =
      ConformalBeadGenerator.computeBishopRMF(positions, normals, isSurfaceStroke);

    switch (profile) {
      case 'tube':
        this.populateTubeData(
          positions,
          bishopNormals,
          bishopBinormals,
          tangents,
          pressures,
          cumulativeDistances,
          totalLength,
          settings,
          baseOffset,
          taperLength
        );
        break;
      case 'ribbon':
        this.populateRibbonData(
          positions,
          bishopNormals,
          bishopBinormals,
          tangents,
          pressures,
          cumulativeDistances,
          totalLength,
          settings,
          baseOffset,
          taperLength
        );
        break;
      case 'marker':
        this.populateMarkerData(
          positions,
          bishopNormals,
          bishopBinormals,
          tangents,
          pressures,
          cumulativeDistances,
          totalLength,
          settings,
          baseOffset,
          taperLength
        );
        break;
      case 'conformal':
      default:
        this.populateConformalData(
          positions,
          bishopNormals,
          bishopBinormals,
          tangents,
          pressures,
          cumulativeDistances,
          totalLength,
          settings,
          targetMeshes,
          baseOffset,
          taperLength
        );
        break;
    }

    return this.applyDataToGeometry(targetGeom);
  }

  /**
   * Uploads working vertex and index data to target BufferGeometry using dynamic draw buffers
   */
  private applyDataToGeometry(geom: THREE.BufferGeometry): THREE.BufferGeometry {
    const vCount = _workVertices.length;
    const iCount = _workIndices.length;
    const vertexCount = Math.floor(vCount / 3);

    // A malformed pointer sample must never turn into an exploded mesh. This
    // matters most on Android, where coalesced stylus/touch events can arrive
    // during a visual-viewport resize. Failing closed keeps the in-progress
    // stroke hidden instead of sending invalid vertices or indices to the GPU.
    let geometryIsValid = vCount % 3 === 0 && iCount % 3 === 0;
    let maxIndex = 0;
    for (let i = 0; geometryIsValid && i < vCount; i++) {
      geometryIsValid = Number.isFinite(_workVertices[i]);
    }
    for (let i = 0; geometryIsValid && i < iCount; i++) {
      const index = _workIndices[i];
      geometryIsValid = Number.isInteger(index) && index >= 0 && index < vertexCount;
      if (index > maxIndex) maxIndex = index;
    }
    if (!geometryIsValid) {
      console.warn('[stroke] Suppressed invalid dynamic geometry');
      geom.setDrawRange(0, 0);
      return geom;
    }

    // Preserve analytical normals if already generated (e.g. radial tube normals).
    // Only compute area-weighted face normals if normals were not provided.
    if (_workNormals.length !== vCount) {
      _workNormals.length = vCount;
      for (let i = 0; i < vCount; i++) {
        _workNormals[i] = 0;
      }
      for (let i = 0; i < iCount; i += 3) {
        const iA = _workIndices[i] * 3;
        const iB = _workIndices[i + 1] * 3;
        const iC = _workIndices[i + 2] * 3;

        const ax = _workVertices[iA], ay = _workVertices[iA + 1], az = _workVertices[iA + 2];
        const bx = _workVertices[iB], by = _workVertices[iB + 1], bz = _workVertices[iB + 2];
        const cx = _workVertices[iC], cy = _workVertices[iC + 1], cz = _workVertices[iC + 2];

        const abx = bx - ax, aby = by - ay, abz = bz - az;
        const acx = cx - ax, acy = cy - ay, acz = cz - az;

        const fnx = aby * acz - abz * acy;
        const fny = abz * acx - abx * acz;
        const fnz = abx * acy - aby * acx;

        _workNormals[iA] += fnx; _workNormals[iA + 1] += fny; _workNormals[iA + 2] += fnz;
        _workNormals[iB] += fnx; _workNormals[iB + 1] += fny; _workNormals[iB + 2] += fnz;
        _workNormals[iC] += fnx; _workNormals[iC + 1] += fny; _workNormals[iC + 2] += fnz;
      }
      const numVertices = Math.floor(vCount / 3);
      for (let i = 0; i < numVertices; i++) {
        const idx = i * 3;
        const nx = _workNormals[idx];
        const ny = _workNormals[idx + 1];
        const nz = _workNormals[idx + 2];
        const len = Math.hypot(nx, ny, nz);
        if (len > 1e-6) {
          _workNormals[idx] = nx / len;
          _workNormals[idx + 1] = ny / len;
          _workNormals[idx + 2] = nz / len;
        } else {
          _workNormals[idx] = 0;
          _workNormals[idx + 1] = 1;
          _workNormals[idx + 2] = 0;
        }
      }
    }

    let posAttr = geom.getAttribute('position') as THREE.BufferAttribute | undefined;
    let normAttr = geom.getAttribute('normal') as THREE.BufferAttribute | undefined;
    let uvAttr = geom.getAttribute('uv') as THREE.BufferAttribute | undefined;
    let indexAttr = geom.getIndex();

    // Reallocate or reuse position buffer
    if (!posAttr || posAttr.array.length < vCount) {
      const newCapacity = Math.max(vCount * 1.5, 768);
      const newPosArr = new Float32Array(newCapacity);
      newPosArr.set(_workVertices);
      posAttr = new THREE.BufferAttribute(newPosArr, 3);
      posAttr.setUsage(THREE.DynamicDrawUsage);
      geom.setAttribute('position', posAttr);

      const newNormArr = new Float32Array(newCapacity);
      newNormArr.set(_workNormals);
      normAttr = new THREE.BufferAttribute(newNormArr, 3);
      normAttr.setUsage(THREE.DynamicDrawUsage);
      geom.setAttribute('normal', normAttr);

      const newUvArr = new Float32Array((newCapacity / 3) * 2);
      newUvArr.set(_workUvs);
      uvAttr = new THREE.BufferAttribute(newUvArr, 2);
      uvAttr.setUsage(THREE.DynamicDrawUsage);
      geom.setAttribute('uv', uvAttr);
    } else {
      (posAttr.array as Float32Array).set(_workVertices);
      posAttr.needsUpdate = true;

      (normAttr!.array as Float32Array).set(_workNormals);
      normAttr!.needsUpdate = true;

      (uvAttr!.array as Float32Array).set(_workUvs);
      uvAttr!.needsUpdate = true;
    }

    // Reallocate or reuse index buffer. Most strokes have fewer than 65,536
    // vertices, so Uint16 keeps them compatible with WebGL 1 Android drivers
    // that do not reliably support UNSIGNED_INT element indices. Uint32 is
    // reserved for the rare genuinely large geometry.
    const IndexArray = maxIndex <= 65535 ? Uint16Array : Uint32Array;
    const hasCompatibleIndexType = indexAttr?.array instanceof IndexArray;
    if (!indexAttr || indexAttr.array.length < iCount || !hasCompatibleIndexType) {
      const newIndexCapacity = Math.max(Math.ceil(iCount * 1.5), 512);
      const newIndexArr = new IndexArray(newIndexCapacity);
      newIndexArr.set(_workIndices);
      indexAttr = new THREE.BufferAttribute(newIndexArr, 1);
      indexAttr.setUsage(THREE.DynamicDrawUsage);
      geom.setIndex(indexAttr);
    } else {
      (indexAttr.array as Uint32Array).set(_workIndices);
      indexAttr.needsUpdate = true;
    }

    geom.setDrawRange(0, iCount);
    geom.computeBoundingSphere();
    geom.computeBoundingBox();

    return geom;
  }

  /**
   * Computes continuous surface-aligned orthogonal frames (Darboux/Bishop) along curve.
   * Eliminates unwanted twist, ribbon self-intersection (hourglass knots), and inflection flips.
   */
  public static computeBishopRMF(
    positions: THREE.Vector3[],
    initialNormals: THREE.Vector3[],
    isSurfaceStroke: boolean = false
  ): { tangents: THREE.Vector3[]; normals: THREE.Vector3[]; binormals: THREE.Vector3[] } {
    const n = positions.length;
    if (n < 2) {
      const defaultT = _vecPool.get().set(0, 0, 1);
      const defaultN = _vecPool.get().copy(initialNormals[0] || _scratchV1.set(0, 1, 0)).normalize();
      const defaultB = _vecPool.get().crossVectors(defaultT, defaultN).normalize();
      return { tangents: [defaultT], normals: [defaultN], binormals: [defaultB] };
    }

    const tangents: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const t = _vecPool.get();
      if (i === 0) {
        t.subVectors(positions[1], positions[0]);
      } else if (i === n - 1) {
        t.subVectors(positions[n - 1], positions[n - 2]);
      } else {
        t.subVectors(positions[i + 1], positions[i - 1]);
      }
      if (t.lengthSq() < 1e-8) {
        if (i > 0 && tangents[i - 1]) {
          t.copy(tangents[i - 1]);
        } else if (i < n - 1) {
          t.subVectors(positions[i + 1], positions[i]);
          if (t.lengthSq() < 1e-8) t.set(1, 0, 0);
          else t.normalize();
        } else {
          t.set(1, 0, 0);
        }
      } else {
        t.normalize();
      }
      tangents.push(t);
    }

    const normals: THREE.Vector3[] = [];
    const binormals: THREE.Vector3[] = [];

    // Frame 0 initialization: build an orthonormal frame (t0, norm0, binorm0)
    const t0 = tangents[0];
    const targetNorm0 = initialNormals[0] || _scratchV1.set(0, 1, 0);
    const norm0 = _vecPool.get();

    norm0.copy(targetNorm0).sub(_scratchV1.copy(t0).multiplyScalar(t0.dot(targetNorm0)));
    if (norm0.lengthSq() < 1e-4) {
      norm0.crossVectors(t0, _scratchV1.set(0, 1, 0));
      if (norm0.lengthSq() < 1e-4) {
        norm0.crossVectors(t0, _scratchV1.set(0, 0, 1));
      }
    }
    norm0.normalize();
    if (targetNorm0.lengthSq() > 0.1 && norm0.dot(targetNorm0) < 0) {
      norm0.negate();
    }
    const binorm0 = _vecPool.get().crossVectors(t0, norm0).normalize();
    norm0.crossVectors(binorm0, t0).normalize();

    normals.push(norm0);
    binormals.push(binorm0);

    // Continuous frame construction
    for (let i = 1; i < n; i++) {
      const prevT = tangents[i - 1];
      const prevN = normals[i - 1];
      const prevB = binormals[i - 1];
      const currT = tangents[i];
      const currN = _vecPool.get();

      if (!isSurfaceStroke) {
        // Double Reflection Method (Wang et al. 2008) for Rotation-Minimizing Frames (RMF):
        // Eliminates artificial twist accumulation and ribbon hourglass knots across 3D space.
        const v1 = _scratchV1.subVectors(positions[i], positions[i - 1]);
        const c1 = v1.lengthSq();
        if (c1 > 1e-10) {
          const n_L = _scratchV2.copy(prevN).addScaledVector(v1, (-2.0 / c1) * v1.dot(prevN));
          const t_L = _scratchV3.copy(prevT).addScaledVector(v1, (-2.0 / c1) * v1.dot(prevT));
          const v2 = _scratchV4.subVectors(currT, t_L);
          const c2 = v2.lengthSq();
          if (c2 > 1e-10) {
            currN.copy(n_L).addScaledVector(v2, (-2.0 / c2) * v2.dot(n_L)).normalize();
          } else {
            currN.copy(n_L).normalize();
          }
        } else {
          currN.copy(prevN);
        }
      } else {
        // Surface-attached conformal frame: frame normal tracks the 3D model surface smoothly
        const surfN = initialNormals[i] || prevN;
        currN.copy(surfN).sub(_scratchV1.copy(currT).multiplyScalar(currT.dot(surfN)));
        if (currN.lengthSq() < 1e-4) {
          currN.copy(prevN).sub(_scratchV1.copy(currT).multiplyScalar(currT.dot(prevN)));
        }
        if (currN.lengthSq() < 1e-4) {
          currN.crossVectors(currT, _scratchV1.set(0, 1, 0));
        }
        currN.normalize();
        if (currN.dot(surfN) < 0) {
          currN.negate();
        }
      }

      // Compute binormal as tangent cross normal
      const currB = _vecPool.get().crossVectors(currT, currN).normalize();

      // Ensure smooth phase continuity across consecutive samples
      if (currB.dot(prevB) < 0) {
        currB.negate();
      }
      currN.crossVectors(currB, currT).normalize();

      normals.push(currN);
      binormals.push(currB);
    }

    return { tangents, normals, binormals };
  }

  /**
   * 1. Tube Profile: Full 3D Cylindrical Geometry
   */
  private populateTubeData(
    positions: THREE.Vector3[],
    normals: THREE.Vector3[],
    binormals: THREE.Vector3[],
    tangents: THREE.Vector3[],
    pressures: number[],
    cumulativeDistances: number[],
    totalLength: number,
    settings: BrushSettings,
    baseOffset: number,
    taperLength: number
  ): void {
    const numPoints = positions.length;
    const radialSegments = 16;

    const jitterStrength = settings.jitterStrength ?? (settings.spatialJitterEnabled ? 0.25 : 0.0);
    const jitterFreq = settings.jitterFrequency ?? 8.0;
    const jitterAxis = settings.jitterAxis || 'binormal';

    const prevRingVertices: THREE.Vector3[] = [];
    for (let j = 0; j < radialSegments; j++) {
      prevRingVertices.push(new THREE.Vector3());
    }

    for (let i = 0; i < numPoints; i++) {
      const pos = positions[i];
      const normal = normals[i];
      const binormal = binormals[i];
      const t = totalLength > 0 ? cumulativeDistances[i] / totalLength : i / (numPoints - 1);

      let taper = 1.0;
      if (settings.brushShape === 'line' && settings.taperLength && settings.taperLength > 0.01) {
        const effTaper = Math.min(0.35, settings.taperLength);
        if (t < effTaper) {
          taper = Math.sin((t / effTaper) * (Math.PI * 0.5));
        } else if (t > 1.0 - effTaper) {
          taper = Math.sin(((1.0 - t) / effTaper) * (Math.PI * 0.5));
        }
        taper = Math.max(0.08, Math.min(1.0, taper));
      }

      const pressureScale = settings.pressureSensitivity ? Math.max(0.2, pressures[i]) : 1.0;
      const radius = settings.size * pressureScale * taper;

      // Spatial Jitter offset along Bishop frame axes
      _scratchJitter.set(0, 0, 0);
      if (jitterStrength > 0.001) {
        const phase = (cumulativeDistances[i] || i * 0.01) * jitterFreq;
        const noiseNorm = Math.sin(phase * 13.7 + Math.cos(phase * 7.9)) * jitterStrength * radius * 0.5;
        const noiseBinorm = Math.cos(phase * 19.1 + Math.sin(phase * 11.3)) * jitterStrength * radius * 0.5;
        if (jitterAxis === 'normal' || jitterAxis === 'omnidirectional') _scratchJitter.addScaledVector(normal, noiseNorm);
        if (jitterAxis === 'binormal' || jitterAxis === 'omnidirectional') _scratchJitter.addScaledVector(binormal, noiseBinorm);
      }

      _scratchCenter.copy(pos).addScaledVector(normal, baseOffset + radius).add(_scratchJitter);

      // Compute segment directions to previous and next slice centers
      let hasPrev = i > 0;
      let hasNext = i < numPoints - 1;
      let prevLen = 0, nextLen = 0;
      let prevDirX = 0, prevDirY = 0, prevDirZ = 0;
      let nextDirX = 0, nextDirY = 0, nextDirZ = 0;

      if (hasPrev) {
        const dx = pos.x - positions[i - 1].x;
        const dy = pos.y - positions[i - 1].y;
        const dz = pos.z - positions[i - 1].z;
        prevLen = Math.hypot(dx, dy, dz);
        if (prevLen > 1e-6) {
          prevDirX = dx / prevLen;
          prevDirY = dy / prevLen;
          prevDirZ = dz / prevLen;
        } else {
          hasPrev = false;
        }
      }

      if (hasNext) {
        const dx = positions[i + 1].x - pos.x;
        const dy = positions[i + 1].y - pos.y;
        const dz = positions[i + 1].z - pos.z;
        nextLen = Math.hypot(dx, dy, dz);
        if (nextLen > 1e-6) {
          nextDirX = dx / nextLen;
          nextDirY = dy / nextLen;
          nextDirZ = dz / nextLen;
        } else {
          hasNext = false;
        }
      }

      const currentRing: THREE.Vector3[] = [];
      for (let j = 0; j < radialSegments; j++) {
        const theta = (j / radialSegments) * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        _scratchRadialDir.copy(binormal).multiplyScalar(cosT).addScaledVector(normal, sinT).normalize();
        const rx = _scratchRadialDir.x;
        const ry = _scratchRadialDir.y;
        const rz = _scratchRadialDir.z;

        // Prevent self-intersection by clamping radial reach on the inside of bends
        // so vertices never cross the midpoint planes between consecutive slices.
        let effRadius = radius;
        if (hasPrev) {
          const backProj = -(rx * prevDirX + ry * prevDirY + rz * prevDirZ);
          if (backProj > 0.05) {
            const maxR = (prevLen * 0.45) / backProj;
            if (maxR < effRadius) effRadius = Math.max(radius * 0.2, maxR);
          }
        }
        if (hasNext) {
          const fwdProj = rx * nextDirX + ry * nextDirY + rz * nextDirZ;
          if (fwdProj > 0.05) {
            const maxR = (nextLen * 0.45) / fwdProj;
            if (maxR < effRadius) effRadius = Math.max(radius * 0.2, maxR);
          }
        }

        const vert = _scratchPos.copy(_scratchCenter).addScaledVector(_scratchRadialDir, effRadius).clone();

        prevRingVertices[j].copy(vert);
        currentRing.push(vert);

        _workVertices.push(vert.x, vert.y, vert.z);
        _workNormals.push(_scratchRadialDir.x, _scratchRadialDir.y, _scratchRadialDir.z);
        _workUvs.push(j / radialSegments, t);
      }
    }

    // Cylindrical ring faces with outward-facing counter-clockwise winding
    for (let i = 0; i < numPoints - 1; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const nextJ = (j + 1) % radialSegments;
        const a = i * radialSegments + j;
        const b = (i + 1) * radialSegments + j;
        const c = (i + 1) * radialSegments + nextJ;
        const d = i * radialSegments + nextJ;

        _workIndices.push(a, d, b);
        _workIndices.push(d, c, b);
      }
    }

    // Spherical Start and End Caps
    this.addSphericalEndCap(_workVertices, _workNormals, _workUvs, _workIndices, positions[0], normals[0], binormals[0], tangents[0], 0, radialSegments, settings.size * pressures[0], baseOffset, true);
    this.addSphericalEndCap(_workVertices, _workNormals, _workUvs, _workIndices, positions[numPoints - 1], normals[numPoints - 1], binormals[numPoints - 1], tangents[numPoints - 1], (numPoints - 1) * radialSegments, radialSegments, settings.size * pressures[numPoints - 1], baseOffset, false);
  }

  /**
   * 2. Ribbon Profile: Flat Tape-Like Cross Section
   */
  private populateRibbonData(
    positions: THREE.Vector3[],
    normals: THREE.Vector3[],
    binormals: THREE.Vector3[],
    tangents: THREE.Vector3[],
    pressures: number[],
    cumulativeDistances: number[],
    totalLength: number,
    settings: BrushSettings,
    baseOffset: number,
    taperLength: number
  ): void {
    const numPoints = positions.length;

    const jitterStrength = settings.jitterStrength ?? (settings.spatialJitterEnabled ? 0.25 : 0.0);
    const jitterFreq = settings.jitterFrequency ?? 8.0;
    const jitterAxis = settings.jitterAxis || 'binormal';

    const prevLeft = new THREE.Vector3();
    const prevRight = new THREE.Vector3();

    for (let i = 0; i < numPoints; i++) {
      const pos = positions[i];
      const normal = normals[i];
      const binormal = binormals[i];
      const t = totalLength > 0 ? cumulativeDistances[i] / totalLength : i / (numPoints - 1);

      let taper = 1.0;
      if (settings.brushShape === 'line' && settings.taperLength && settings.taperLength > 0.01) {
        const effTaper = Math.min(0.35, settings.taperLength);
        if (t < effTaper) {
          taper = Math.sin((t / effTaper) * (Math.PI * 0.5));
        } else if (t > 1.0 - effTaper) {
          taper = Math.sin(((1.0 - t) / effTaper) * (Math.PI * 0.5));
        }
        taper = Math.max(0.08, Math.min(1.0, taper));
      }

      const pressureScale = settings.pressureSensitivity ? Math.max(0.2, pressures[i]) : 1.0;
      const widthMultiplier = Math.max(0.5, Math.min(25.0, settings.brushWidthMultiplier ?? (settings.brushShape === 'wide_flat' ? 3.0 : 1.0)));
      const width = settings.size * pressureScale * taper * 1.5 * widthMultiplier;

      // Spatial Jitter offset along Bishop frame axes
      _scratchJitter.set(0, 0, 0);
      if (jitterStrength > 0.001) {
        const phase = (cumulativeDistances[i] || i * 0.01) * jitterFreq;
        const noiseNorm = Math.sin(phase * 13.7 + Math.cos(phase * 7.9)) * jitterStrength * width * 0.5;
        const noiseBinorm = Math.cos(phase * 19.1 + Math.sin(phase * 11.3)) * jitterStrength * width * 0.5;
        if (jitterAxis === 'normal' || jitterAxis === 'omnidirectional') _scratchJitter.addScaledVector(normal, noiseNorm);
        if (jitterAxis === 'binormal' || jitterAxis === 'omnidirectional') _scratchJitter.addScaledVector(binormal, noiseBinorm);
      }

      // Dynamic curvature clearance lift for flat ribbons on convex models so outer edges never submerge
      const curvatureLift = Math.max(0, width * 0.05);
      const effectiveBaseOffset = baseOffset + curvatureLift;

      _scratchCenter.copy(pos).addScaledVector(normal, effectiveBaseOffset).add(_scratchJitter);
      let effLeftWidth = width;
      let effRightWidth = width;
      if (i > 0) {
        const seg = _scratchV3.subVectors(pos, positions[i - 1]);
        const segLen = seg.length();
        if (segLen > 1e-6) {
          const segDir = seg.normalize();
          const bDot = binormal.dot(segDir);
          if (-bDot > 0.05) {
            const maxW = (segLen * 0.45) / (-bDot);
            if (maxW < effLeftWidth) effLeftWidth = Math.max(width * 0.2, maxW);
          }
          if (bDot > 0.05) {
            const maxW = (segLen * 0.45) / bDot;
            if (maxW < effRightWidth) effRightWidth = Math.max(width * 0.2, maxW);
          }
        }
      }

      const left = _scratchV1.copy(_scratchCenter).addScaledVector(binormal, -effLeftWidth);
      const right = _scratchV2.copy(_scratchCenter).addScaledVector(binormal, effRightWidth);

      prevLeft.copy(left);
      prevRight.copy(right);

      _workVertices.push(left.x, left.y, left.z);
      _workNormals.push(normal.x, normal.y, normal.z);
      _workUvs.push(0.0, t);

      _workVertices.push(right.x, right.y, right.z);
      _workNormals.push(normal.x, normal.y, normal.z);
      _workUvs.push(1.0, t);
    }

    for (let i = 0; i < numPoints - 1; i++) {
      const a = i * 2;
      const b = (i + 1) * 2;
      const c = (i + 1) * 2 + 1;
      const d = i * 2 + 1;

      // Outward-facing counter-clockwise winding
      _workIndices.push(a, d, b);
      _workIndices.push(d, c, b);
    }

    // Add smooth rounded start and end caps for clean brush tip appearance (zero arrowhead artifacts)
    const isRoundCap = settings.brushShape === 'round' || settings.brushShape === 'wide_flat';
    if (isRoundCap && numPoints >= 2) {
      const startWidth = settings.size * (settings.pressureSensitivity ? Math.max(0.2, pressures[0]) : 1.0) * 1.5 * (settings.brushWidthMultiplier ?? (settings.brushShape === 'wide_flat' ? 3.0 : 1.0));
      const endWidth = settings.size * (settings.pressureSensitivity ? Math.max(0.2, pressures[numPoints - 1]) : 1.0) * 1.5 * (settings.brushWidthMultiplier ?? (settings.brushShape === 'wide_flat' ? 3.0 : 1.0));
      this.addRoundedRibbonCap(_workVertices, _workNormals, _workUvs, _workIndices, positions[0], normals[0], binormals[0], tangents[0], startWidth, baseOffset, true, 0, 1);
      this.addRoundedRibbonCap(_workVertices, _workNormals, _workUvs, _workIndices, positions[numPoints - 1], normals[numPoints - 1], binormals[numPoints - 1], tangents[numPoints - 1], endWidth, baseOffset, false, (numPoints - 1) * 2, (numPoints - 1) * 2 + 1);
    }
  }

  /**
   * 3. Marker / Chisel Profile: Asymmetric Calligraphic Rectangular Profile
   */
  /**
   * 3. Marker / Chisel Profile: Full Flat Calligraphic Ribbon Snapped Flush to Model Surface
   */
  private populateMarkerData(
    positions: THREE.Vector3[],
    normals: THREE.Vector3[],
    binormals: THREE.Vector3[],
    tangents: THREE.Vector3[],
    pressures: number[],
    cumulativeDistances: number[],
    totalLength: number,
    settings: BrushSettings,
    baseOffset: number,
    taperLength: number
  ): void {
    const numPoints = positions.length;

    const chiselAngleRad = ((settings.chiselAngle ?? 45) * Math.PI) / 180;
    const aspectRatio = settings.aspectRatio ?? 3.5;
    const jitterStrength = settings.jitterStrength ?? (settings.spatialJitterEnabled ? 0.25 : 0.0);
    const jitterFreq = settings.jitterFrequency ?? 8.0;
    const jitterAxis = settings.jitterAxis || 'binormal';

    const prevLeft = new THREE.Vector3();
    const prevRight = new THREE.Vector3();

    for (let i = 0; i < numPoints; i++) {
      const pos = positions[i];
      const normal = normals[i];
      const binormal = binormals[i];
      const tangent = tangents[i];
      const t = totalLength > 0 ? cumulativeDistances[i] / totalLength : i / (numPoints - 1);

      let taper = 1.0;
      if (settings.brushShape === 'line' && settings.taperLength && settings.taperLength > 0.01) {
        const effTaper = Math.min(0.35, settings.taperLength);
        if (t < effTaper) {
          taper = Math.sin((t / effTaper) * (Math.PI * 0.5));
        } else if (t > 1.0 - effTaper) {
          taper = Math.sin(((1.0 - t) / effTaper) * (Math.PI * 0.5));
        }
        taper = Math.max(0.08, Math.min(1.0, taper));
      }

      const pressureScale = settings.pressureSensitivity ? Math.max(0.2, pressures[i]) : 1.0;
      const widthMultiplier = Math.max(0.5, Math.min(25.0, settings.brushWidthMultiplier ?? (settings.brushShape === 'wide_flat' ? 3.0 : 1.0)));
      const baseRadius = settings.size * pressureScale * taper;

      // Calligraphic width modulation based on travel direction vs chisel angle:
      // When travel is perpendicular to the nib, width is maximum; when parallel, width is minimum.
      const strokeDirAngle = Math.atan2(tangent.y, tangent.x);
      const angleDelta = strokeDirAngle - chiselAngleRad;
      const calligraphicFactor = 0.35 + 0.65 * Math.abs(Math.sin(angleDelta));

      const width = baseRadius * aspectRatio * 0.7 * widthMultiplier * calligraphicFactor;

      // Flat surface direction vector: strictly in the surface tangent/binormal plane so marker lies completely flat on the model!
      const cosAngle = Math.cos(chiselAngleRad);
      const sinAngle = Math.sin(chiselAngleRad);
      const dirNib = _scratchV1.copy(binormal).multiplyScalar(cosAngle).addScaledVector(tangent, sinAngle * 0.25).normalize();

      _scratchJitter.set(0, 0, 0);
      if (jitterStrength > 0.001) {
        const phase = (cumulativeDistances[i] || i * 0.01) * jitterFreq;
        const noiseNorm = Math.sin(phase * 13.7 + Math.cos(phase * 7.9)) * jitterStrength * width * 0.5;
        const noiseBinorm = Math.cos(phase * 19.1 + Math.sin(phase * 11.3)) * jitterStrength * width * 0.5;
        if (jitterAxis === 'normal' || jitterAxis === 'omnidirectional') _scratchJitter.addScaledVector(normal, noiseNorm);
        if (jitterAxis === 'binormal' || jitterAxis === 'omnidirectional') _scratchJitter.addScaledVector(binormal, noiseBinorm);
      }

      // Minimal curvature clearance lift so flat marker ribbons on convex models never submerge
      const curvatureLift = Math.max(0, width * 0.03);
      const effectiveBaseOffset = baseOffset + curvatureLift;

      _scratchCenter.copy(pos).addScaledVector(normal, effectiveBaseOffset).add(_scratchJitter);

      let effLeftWidth = width;
      let effRightWidth = width;
      if (i > 0) {
        const seg = _scratchTipDir.subVectors(pos, positions[i - 1]);
        const segLen = seg.length();
        if (segLen > 1e-6) {
          const segDir = seg.normalize();
          const dDot = dirNib.dot(segDir);
          if (-dDot > 0.05) {
            const maxW = (segLen * 0.45) / (-dDot);
            if (maxW < effLeftWidth) effLeftWidth = Math.max(width * 0.2, maxW);
          }
          if (dDot > 0.05) {
            const maxW = (segLen * 0.45) / dDot;
            if (maxW < effRightWidth) effRightWidth = Math.max(width * 0.2, maxW);
          }
        }
      }

      // Flat 2-point calligraphic ribbon profile lying flush on model
      const left = _scratchV2.copy(_scratchCenter).addScaledVector(dirNib, -effLeftWidth);
      const right = _scratchV3.copy(_scratchCenter).addScaledVector(dirNib, effRightWidth);

      prevLeft.copy(left);
      prevRight.copy(right);

      _workVertices.push(left.x, left.y, left.z);
      _workNormals.push(normal.x, normal.y, normal.z);
      _workUvs.push(0.0, t);

      _workVertices.push(right.x, right.y, right.z);
      _workNormals.push(normal.x, normal.y, normal.z);
      _workUvs.push(1.0, t);
    }

    for (let i = 0; i < numPoints - 1; i++) {
      const a = i * 2;
      const b = (i + 1) * 2;
      const c = (i + 1) * 2 + 1;
      const d = i * 2 + 1;

      // Double-sided friendly winding
      _workIndices.push(a, d, b);
      _workIndices.push(d, c, b);
    }
  }

  /**
   * 4. Conformal Profile: Arched Dome Snapped to Surface
   */
  private populateConformalData(
    positions: THREE.Vector3[],
    normals: THREE.Vector3[],
    binormals: THREE.Vector3[],
    tangents: THREE.Vector3[],
    pressures: number[],
    cumulativeDistances: number[],
    totalLength: number,
    settings: BrushSettings,
    targetMeshes: THREE.Mesh[],
    baseOffset: number,
    taperLength: number
  ): void {
    const numPoints = positions.length;
    const segmentsAcross = Math.max(3, settings.archSegments || 5);
    const uValues: number[] = [];
    for (let j = 0; j < segmentsAcross; j++) {
      uValues.push(-1.0 + (2.0 * j) / (segmentsAcross - 1));
    }

    const domeFactor = settings.domeFactor || 0.22;
    const jitterStrength = settings.jitterStrength ?? (settings.spatialJitterEnabled ? 0.25 : 0.0);
    const jitterFreq = settings.jitterFrequency ?? 8.0;
    const jitterAxis = settings.jitterAxis || 'binormal';

    for (let i = 0; i < numPoints; i++) {
      const pos = positions[i];
      const normal = normals[i];
      const binormal = binormals[i];
      const t = totalLength > 0 ? cumulativeDistances[i] / totalLength : i / (numPoints - 1);

      let taper = 1.0;
      if (settings.brushShape === 'line' && settings.taperLength && settings.taperLength > 0.01) {
        const effTaper = Math.min(0.35, settings.taperLength);
        if (t < effTaper) {
          taper = Math.sin((t / effTaper) * (Math.PI * 0.5));
        } else if (t > 1.0 - effTaper) {
          taper = Math.sin(((1.0 - t) / effTaper) * (Math.PI * 0.5));
        }
        taper = Math.max(0.08, Math.min(1.0, taper));
      }

      const pressureScale = settings.pressureSensitivity ? Math.max(0.2, pressures[i]) : 1.0;
      const ringRadius = settings.size * pressureScale * taper;

      _scratchJitter.set(0, 0, 0);
      if (jitterStrength > 0.001) {
        const phase = (cumulativeDistances[i] || i * 0.01) * jitterFreq;
        const noiseNorm = Math.sin(phase * 13.7 + Math.cos(phase * 7.9)) * jitterStrength * ringRadius * 0.5;
        const noiseBinorm = Math.cos(phase * 19.1 + Math.sin(phase * 11.3)) * jitterStrength * ringRadius * 0.5;
        if (jitterAxis === 'normal' || jitterAxis === 'omnidirectional') _scratchJitter.addScaledVector(normal, noiseNorm);
        if (jitterAxis === 'binormal' || jitterAxis === 'omnidirectional') _scratchJitter.addScaledVector(binormal, noiseBinorm);
      }

      for (let j = 0; j < segmentsAcross; j++) {
        const u = uValues[j];
        const domeHeight = baseOffset + ringRadius * domeFactor * Math.sqrt(Math.max(0, 1.0 - u * u));
        const lateralOffset = u * ringRadius;

        _scratchPos.copy(pos)
          .addScaledVector(binormal, lateralOffset)
          .addScaledVector(normal, domeHeight)
          .add(_scratchJitter);

        _scratchArchNorm.copy(normal).addScaledVector(binormal, u * 0.4).normalize();

        _workVertices.push(_scratchPos.x, _scratchPos.y, _scratchPos.z);
        _workNormals.push(_scratchArchNorm.x, _scratchArchNorm.y, _scratchArchNorm.z);
        _workUvs.push((u + 1.0) * 0.5, t);
      }
    }

    for (let i = 0; i < numPoints - 1; i++) {
      for (let j = 0; j < segmentsAcross - 1; j++) {
        const a = i * segmentsAcross + j;
        const b = (i + 1) * segmentsAcross + j;
        const c = (i + 1) * segmentsAcross + (j + 1);
        const d = i * segmentsAcross + (j + 1);

        _workIndices.push(a, d, b);
        _workIndices.push(d, c, b);
      }
    }

    // Add Start and End Caps
    this.addEndCap(_workVertices, _workNormals, _workUvs, _workIndices, positions[0], normals[0], binormals[0], tangents[0], 0, segmentsAcross, settings.size * pressures[0], baseOffset, true);
    this.addEndCap(_workVertices, _workNormals, _workUvs, _workIndices, positions[numPoints - 1], normals[numPoints - 1], binormals[numPoints - 1], tangents[numPoints - 1], (numPoints - 1) * segmentsAcross, segmentsAcross, settings.size * pressures[numPoints - 1], baseOffset, false);
  }

  private addEndCap(
    vertices: number[],
    geomNormals: number[],
    uvs: number[],
    indices: number[],
    centerPos: THREE.Vector3,
    normal: THREE.Vector3,
    binormal: THREE.Vector3,
    tangent: THREE.Vector3,
    ringStartIndex: number,
    segmentsAcross: number,
    radius: number,
    baseOffset: number,
    isStart: boolean
  ): void {
    _scratchTipDir.copy(tangent);
    if (isStart) _scratchTipDir.negate();

    // Clean baseline cap closure flush with surface offset (zero arrowhead spear artifact)
    _scratchTipPos.copy(centerPos)
      .addScaledVector(normal, baseOffset);

    const tipVertexIdx = vertices.length / 3;
    vertices.push(_scratchTipPos.x, _scratchTipPos.y, _scratchTipPos.z);
    geomNormals.push(normal.x, normal.y, normal.z);
    uvs.push(0.5, isStart ? 0.0 : 1.0);

    for (let j = 0; j < segmentsAcross - 1; j++) {
      const ringA = ringStartIndex + j;
      const ringB = ringStartIndex + j + 1;
      if (isStart) {
        indices.push(tipVertexIdx, ringA, ringB);
      } else {
        indices.push(tipVertexIdx, ringB, ringA);
      }
    }
  }

  /**
   * Adds smooth semicircular fan end-cap to flat ribbon profiles
   * eliminating sharp flat/arrowhead start & end edges.
   */
  private addRoundedRibbonCap(
    vertices: number[],
    geomNormals: number[],
    uvs: number[],
    indices: number[],
    centerPos: THREE.Vector3,
    normal: THREE.Vector3,
    binormal: THREE.Vector3,
    tangent: THREE.Vector3,
    width: number,
    baseOffset: number,
    isStart: boolean,
    leftIdx: number,
    rightIdx: number
  ): void {
    const segments = 8;
    const centerIdx = vertices.length / 3;
    _scratchCenter.copy(centerPos).addScaledVector(normal, baseOffset);
    vertices.push(_scratchCenter.x, _scratchCenter.y, _scratchCenter.z);
    geomNormals.push(normal.x, normal.y, normal.z);
    uvs.push(0.5, isStart ? 0.0 : 1.0);

    const arcIndices: number[] = [isStart ? leftIdx : rightIdx];

    for (let k = 1; k < segments; k++) {
      const frac = k / segments;
      const angle = frac * Math.PI;

      // Start cap sweeps smoothly from left (-binormal) to right (+binormal) bulging backward (-tangent)
      // End cap sweeps smoothly from right (+binormal) to left (-binormal) bulging forward (+tangent)
      const latOffset = isStart
        ? -Math.cos(angle) * width
        : Math.cos(angle) * width;
      const longOffset = isStart
        ? -Math.sin(angle) * width
        : Math.sin(angle) * width;

      _scratchPos.copy(_scratchCenter)
        .addScaledVector(binormal, latOffset)
        .addScaledVector(tangent, longOffset);

      const vIdx = vertices.length / 3;
      vertices.push(_scratchPos.x, _scratchPos.y, _scratchPos.z);
      geomNormals.push(normal.x, normal.y, normal.z);
      uvs.push(isStart ? frac : 1.0 - frac, isStart ? 0.0 : 1.0);
      arcIndices.push(vIdx);
    }
    arcIndices.push(isStart ? rightIdx : leftIdx);

    for (let k = 0; k < arcIndices.length - 1; k++) {
      const a = arcIndices[k];
      const b = arcIndices[k + 1];
      indices.push(centerIdx, a, b);
    }
  }

  private addSphericalEndCap(
    vertices: number[],
    geomNormals: number[],
    uvs: number[],
    indices: number[],
    centerPos: THREE.Vector3,
    normal: THREE.Vector3,
    binormal: THREE.Vector3,
    tangent: THREE.Vector3,
    ringStartIndex: number,
    radialSegments: number,
    radius: number,
    baseOffset: number,
    isStart: boolean
  ): void {
    _scratchTipDir.copy(tangent);
    if (isStart) _scratchTipDir.negate();

    _scratchTipPos.copy(centerPos)
      .addScaledVector(normal, baseOffset + radius)
      .addScaledVector(_scratchTipDir, radius);

    const tipIdx = vertices.length / 3;
    vertices.push(_scratchTipPos.x, _scratchTipPos.y, _scratchTipPos.z);
    geomNormals.push(_scratchTipDir.x, _scratchTipDir.y, _scratchTipDir.z);
    uvs.push(0.5, isStart ? 0.0 : 1.0);

    for (let j = 0; j < radialSegments; j++) {
      const nextJ = (j + 1) % radialSegments;
      const a = ringStartIndex + j;
      const b = ringStartIndex + nextJ;
      if (isStart) {
        indices.push(tipIdx, b, a);
      } else {
        indices.push(tipIdx, a, b);
      }
    }
  }

  private populateDabData(
    point: StrokePoint,
    settings: BrushSettings,
    profile: StrokeProfile
  ): void {
    const normal = _scratchNorm.copy(point.normal).normalize();
    const pressureScale = settings.pressureSensitivity ? Math.max(0.3, point.pressure) : 1.0;
    const radius = settings.size * pressureScale;
    const seq = settings.strokeSequenceIndex ?? 0;
    const seqElevation = (seq % 2000) * 0.0005;
    const baseOffset = (settings.surfaceOffset ?? 0.0015) + seqElevation;

    let tangent = _scratchTan.set(0, 1, 0);
    if (Math.abs(normal.y) > 0.9) {
      tangent.set(1, 0, 0);
    }
    const binormal = _scratchBinorm.crossVectors(normal, tangent).normalize();
    tangent.crossVectors(binormal, normal).normalize();

    const radialSegments = profile === 'marker' ? 4 : 16;
    const centerPos = _scratchCenter.copy(point.position).addScaledVector(normal, baseOffset);

    _workVertices.push(centerPos.x, centerPos.y, centerPos.z);
    _workNormals.push(normal.x, normal.y, normal.z);
    _workUvs.push(0.5, 0.5);

    for (let s = 0; s < radialSegments; s++) {
      const theta = (s / radialSegments) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      _scratchPos.copy(centerPos)
        .addScaledVector(tangent, cosT * radius)
        .addScaledVector(binormal, sinT * radius);

      _workVertices.push(_scratchPos.x, _scratchPos.y, _scratchPos.z);
      _workNormals.push(normal.x, normal.y, normal.z);
      _workUvs.push(0.5 + cosT * 0.5, 0.5 + sinT * 0.5);
    }

    for (let s = 0; s < radialSegments; s++) {
      const nextS = (s + 1) % radialSegments;
      _workIndices.push(0, 1 + s, 1 + nextS);
    }
  }

  /**
   * Resamples raw points using centripetal Catmull-Rom spline interpolation,
   * equidistant arc-length sampling, and 7-point Gaussian velocity smoothing.
   */
  private resampleCurve(
    points: StrokePoint[],
    brushSize: number,
    targetMeshes: THREE.Mesh[] = []
  ): { positions: THREE.Vector3[]; normals: THREE.Vector3[]; pressures: number[]; velocities: number[] } {
    if (points.length < 2) {
      return {
        positions: points.map((p) => _vecPool.get().copy(p.position)),
        normals: points.map((p) => _vecPool.get().copy(p.normal)),
        pressures: points.map((p) => p.pressure),
        velocities: [0],
      };
    }

    // 1. Calculate raw instantaneous velocities
    const rawVelocities: number[] = [0];
    for (let i = 1; i < points.length; i++) {
      const dt = Math.max(1, points[i].time - points[i - 1].time) * 0.001;
      const dist = points[i].position.distanceTo(points[i - 1].position);
      rawVelocities.push(dist / dt);
    }

    // 2. 7-point Gaussian-weighted velocity kernel [1, 4, 8, 12, 8, 4, 1] / 38
    const kernel = [1, 4, 8, 12, 8, 4, 1];
    const smoothedVelocities: number[] = [];

    for (let i = 0; i < points.length; i++) {
      let vSum = 0;
      let wSum = 0;
      for (let k = -3; k <= 3; k++) {
        const idx = i + k;
        if (idx >= 0 && idx < points.length) {
          const w = kernel[k + 3];
          vSum += rawVelocities[idx] * w;
          wSum += w;
        }
      }
      smoothedVelocities.push(wSum > 0 ? vSum / wSum : rawVelocities[i]);
    }

    // 3. Start/End Whip Clamping
    if (smoothedVelocities.length >= 6) {
      const refVStart = smoothedVelocities[3] || 1.0;
      for (let i = 0; i < 3; i++) {
        smoothedVelocities[i] = Math.min(smoothedVelocities[i], refVStart * 1.5);
      }
      const endIdx = smoothedVelocities.length - 1;
      const refVEnd = smoothedVelocities[endIdx - 3] || 1.0;
      for (let i = endIdx - 2; i <= endIdx; i++) {
        smoothedVelocities[i] = Math.min(smoothedVelocities[i], refVEnd * 1.5);
      }
    }

    const vectorPoints = points.map((p) => p.position.clone());
    const nPts = vectorPoints.length;
    if (nPts >= 3 && brushSize > 0.003) {
      for (let iter = 0; iter < 2; iter++) {
        for (let i = 1; i < nPts - 1; i++) {
          const pPrev = vectorPoints[i - 1];
          const pCurr = vectorPoints[i];
          const pNext = vectorPoints[i + 1];

          const d1 = pCurr.distanceTo(pPrev);
          const d2 = pNext.distanceTo(pCurr);
          if (d1 < 1e-6 || d2 < 1e-6) continue;

          const v1x = (pCurr.x - pPrev.x) / d1, v1y = (pCurr.y - pPrev.y) / d1, v1z = (pCurr.z - pPrev.z) / d1;
          const v2x = (pNext.x - pCurr.x) / d2, v2y = (pNext.y - pCurr.y) / d2, v2z = (pNext.z - pCurr.z) / d2;
          const dot = Math.max(-1, Math.min(1, v1x * v2x + v1y * v2y + v1z * v2z));
          if (dot < 0.94) {
            const blend = Math.min(0.4, (0.94 - dot) * 0.7);
            pCurr.x += ((pPrev.x + pNext.x) * 0.5 - pCurr.x) * blend;
            pCurr.y += ((pPrev.y + pNext.y) * 0.5 - pCurr.y) * blend;
            pCurr.z += ((pPrev.z + pNext.z) * 0.5 - pCurr.z) * blend;
          }
        }
      }
    }

    const curve = new THREE.CatmullRomCurve3(vectorPoints, false, 'centripetal', 0.5);

    // Cumulative input distances for accurate property interpolation
    const inputCumulative: number[] = [0];
    let totalInputDist = 0;
    for (let i = 1; i < points.length; i++) {
      totalInputDist += points[i].position.distanceTo(points[i - 1].position);
      inputCumulative.push(totalInputDist);
    }

    const curveLength = curve.getLength();
    const stepSize = Math.max(0.006, Math.min(0.035, brushSize * 0.35));
    const divisions = Math.max(12, Math.min(1024, Math.ceil(curveLength / stepSize)));

    const rawPoints = curve.getSpacedPoints(divisions);
    const sampledPositions: THREE.Vector3[] = [];
    const sampledNormals: THREE.Vector3[] = [];
    const sampledPressures: number[] = [];
    const sampledVelocities: number[] = [];

    let inputIdx = 0;
    for (let i = 0; i <= divisions; i++) {
      const s = totalInputDist > 0 ? (i / divisions) * totalInputDist : 0;

      while (inputIdx < points.length - 2 && inputCumulative[inputIdx + 1] < s) {
        inputIdx++;
      }

      const d0 = inputCumulative[inputIdx];
      const d1 = inputCumulative[Math.min(points.length - 1, inputIdx + 1)] || totalInputDist;
      const segSpan = Math.max(1e-6, d1 - d0);
      const frac = Math.max(0, Math.min(1, (s - d0) / segSpan));

      const normA = points[inputIdx].normal;
      const normB = points[Math.min(points.length - 1, inputIdx + 1)].normal;
      const interpNorm = _vecPool.get().copy(normA).lerp(normB, frac).normalize();
      const pos = _vecPool.get().copy(rawPoints[i]);

      sampledPositions.push(pos);
      sampledNormals.push(interpNorm);

      const pressA = points[inputIdx].pressure ?? 1.0;
      const pressB = points[Math.min(points.length - 1, inputIdx + 1)].pressure ?? 1.0;
      sampledPressures.push(pressA + (pressB - pressA) * frac);

      const velA = smoothedVelocities[inputIdx] || 0;
      const velB = smoothedVelocities[Math.min(points.length - 1, inputIdx + 1)] || 0;
      sampledVelocities.push(velA + (velB - velA) * frac);
    }

    return {
      positions: sampledPositions,
      normals: sampledNormals,
      pressures: sampledPressures,
      velocities: sampledVelocities,
    };
  }
}


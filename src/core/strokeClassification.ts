import * as THREE from 'three';
import { StrokePoint } from '../types';

/**
 * Result of transparent-stroke classification.
 * Isolated strokes keep native depth sorting; overlapping strokes use WBOIT.
 */
export type StrokeTransparencyClass = 'sorted' | 'wboit';

export interface StrokeSpatialData {
  mesh: THREE.Mesh;
  boundingBox: THREE.Box3;
  boundingSphere: THREE.Sphere;
  isSelfIntersecting: boolean;
  transparencyClass: StrokeTransparencyClass;
}

/**
 * Event-driven spatial classifier used by hybrid WBOIT rendering. Its results
 * are stored on each mesh and consumed without recomputation during frames.
 */
export class StrokeClassifier {
  /**
   * Fast polyline self-intersection check. Sampling keeps the work bounded for
   * long strokes while still catching loops and crossings that need WBOIT.
   */
  public static checkSelfIntersection(points: StrokePoint[], strokeWidth: number): boolean {
    if (!points || points.length < 8) return false;

    const count = points.length;
    const thresholdSq = Math.max(0.0001, (strokeWidth * 1.25) * (strokeWidth * 1.25));
    const step = count > 120 ? Math.ceil(count / 60) : (count > 40 ? 2 : 1);
    const minIndexGap = Math.max(6, Math.floor(8 / step));

    for (let i = 0; i < count; i += step) {
      const posA = points[i].position;
      for (let j = i + minIndexGap * step; j < count; j += step) {
        const posB = points[j].position;
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const dz = posA.z - posB.z;
        if (dx * dx + dy * dy + dz * dz < thresholdSq) return true;
      }
    }

    return false;
  }

  /**
   * Classifies transparent mesh instances after a stroke, visibility, or layer
   * change. The renderer then routes each mesh without doing this work per frame.
   */
  public static classifyStrokes(
    strokes: StrokeSpatialData[],
    globalModeOverride: 'auto' | 'wboit' | 'sorted' = 'auto'
  ): void {
    if (globalModeOverride === 'wboit' || globalModeOverride === 'sorted') {
      for (const item of strokes) {
        item.transparencyClass = globalModeOverride;
        item.mesh.userData.transparencyClass = globalModeOverride;
      }
      return;
    }

    for (const item of strokes) {
      item.transparencyClass = item.isSelfIntersecting ? 'wboit' : 'sorted';
    }

    // Broad-phase sweep-and-prune: sort by the scene axis with the greatest
    // spread, then test only AABBs whose intervals are still active. This
    // avoids an unconditional all-pairs pass while retaining the exact sphere
    // and AABB checks that decide whether a mesh needs WBOIT.
    const sceneBounds = new THREE.Box3();
    for (const item of strokes) sceneBounds.union(item.boundingBox);
    const sceneSize = sceneBounds.getSize(new THREE.Vector3());
    const axis: 'x' | 'y' | 'z' =
      sceneSize.x >= sceneSize.y && sceneSize.x >= sceneSize.z ? 'x' :
      sceneSize.y >= sceneSize.z ? 'y' : 'z';
    const sortedByAxis = [...strokes].sort(
      (a, b) => a.boundingBox.min[axis] - b.boundingBox.min[axis]
    );
    const active: StrokeSpatialData[] = [];

    for (const item of sortedByAxis) {
      const minAxis = item.boundingBox.min[axis];
      let activeWrite = 0;

      for (let i = 0; i < active.length; i++) {
        const candidate = active[i];
        if (candidate.boundingBox.max[axis] < minAxis) continue;

        active[activeWrite++] = candidate;
        const radiusSum = item.boundingSphere.radius + candidate.boundingSphere.radius;
        if (item.boundingSphere.center.distanceToSquared(candidate.boundingSphere.center) > radiusSum * radiusSum) {
          continue;
        }
        if (item.boundingBox.intersectsBox(candidate.boundingBox)) {
          item.transparencyClass = 'wboit';
          candidate.transparencyClass = 'wboit';
        }
      }

      active.length = activeWrite;
      active.push(item);
    }

    for (const item of strokes) {
      item.mesh.userData.transparencyClass = item.transparencyClass;
    }
  }
}

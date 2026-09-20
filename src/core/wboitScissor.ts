import * as THREE from 'three';

export interface ScreenScissorRect {
  x: number;
  y: number;
  width: number;
  height: number;
  coverageFraction: number;
}

/**
 * Projects visible WBOIT geometry to the accumulation target. The engine owns
 * cache invalidation; this helper performs a single fresh calculation.
 */
export class WboitScissorHelper {
  private static scratchBox = new THREE.Box3();
  private static scratchSphere = new THREE.Sphere();
  private static scratchCorner = new THREE.Vector3();
  private static scratchViewCorner = new THREE.Vector3();
  private static scratchFrustum = new THREE.Frustum();
  private static scratchProjScreenMatrix = new THREE.Matrix4();

  public static pruneMeshesAgainstFrustum(
    meshes: THREE.Mesh[],
    camera: THREE.Camera,
    outVisible: THREE.Mesh[]
  ): THREE.Mesh[] {
    outVisible.length = 0;
    if (meshes.length === 0) return outVisible;

    camera.updateMatrixWorld();
    this.scratchProjScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.scratchFrustum.setFromProjectionMatrix(this.scratchProjScreenMatrix);

    for (const mesh of meshes) {
      if (!mesh.visible || !mesh.geometry) continue;
      const geometry = mesh.geometry;
      if (!geometry.boundingSphere) geometry.computeBoundingSphere();
      if (geometry.boundingSphere) {
        this.scratchSphere.copy(geometry.boundingSphere).applyMatrix4(mesh.matrixWorld);
        if (!this.scratchFrustum.intersectsSphere(this.scratchSphere)) continue;
      }
      if (!geometry.boundingBox) geometry.computeBoundingBox();
      if (!geometry.boundingBox) continue;
      this.scratchBox.copy(geometry.boundingBox).applyMatrix4(mesh.matrixWorld);
      if (this.scratchFrustum.intersectsBox(this.scratchBox)) outVisible.push(mesh);
    }

    return outVisible;
  }

  public static computeScissor(
    meshes: THREE.Mesh[],
    camera: THREE.Camera,
    targetWidth: number,
    targetHeight: number,
    paddingPixels: number = 8
  ): ScreenScissorRect | null {
    if (meshes.length === 0 || targetWidth <= 0 || targetHeight <= 0) return null;

    const isPerspective = (camera as THREE.PerspectiveCamera).isPerspectiveCamera;
    const nearPlane = (camera as THREE.PerspectiveCamera).near || 0.1;
    const minZView = -nearPlane * 1.001;
    const fullTarget = (): ScreenScissorRect => ({
      x: 0,
      y: 0,
      width: targetWidth,
      height: targetHeight,
      coverageFraction: 1,
    });
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let visibleCount = 0;

    for (const mesh of meshes) {
      if (!mesh.visible || !mesh.geometry?.boundingBox) continue;
      this.scratchBox.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);
      const bMin = this.scratchBox.min;
      const bMax = this.scratchBox.max;
      if (
        !Number.isFinite(bMin.x) || !Number.isFinite(bMin.y) || !Number.isFinite(bMin.z) ||
        !Number.isFinite(bMax.x) || !Number.isFinite(bMax.y) || !Number.isFinite(bMax.z)
      ) {
        // Never under-bound a malformed stroke: a full target is safe and is
        // subsequently bypassed by the engine's broad-coverage threshold.
        return fullTarget();
      }
      visibleCount++;

      for (let corner = 0; corner < 8; corner++) {
        this.scratchCorner.set(
          (corner & 1) ? bMax.x : bMin.x,
          (corner & 2) ? bMax.y : bMin.y,
          (corner & 4) ? bMax.z : bMin.z
        );
        if (isPerspective) {
          this.scratchViewCorner.copy(this.scratchCorner).applyMatrix4(camera.matrixWorldInverse);
          if (this.scratchViewCorner.z > minZView) this.scratchViewCorner.z = minZView;
          this.scratchCorner.copy(this.scratchViewCorner).applyMatrix4(camera.projectionMatrix);
        } else {
          this.scratchCorner.project(camera);
        }
        const pxX = (Math.max(-1, Math.min(1, this.scratchCorner.x)) + 1) * 0.5 * targetWidth;
        const pxY = (Math.max(-1, Math.min(1, this.scratchCorner.y)) + 1) * 0.5 * targetHeight;
        if (!Number.isFinite(pxX) || !Number.isFinite(pxY)) return fullTarget();
        minX = Math.min(minX, pxX);
        minY = Math.min(minY, pxY);
        maxX = Math.max(maxX, pxX);
        maxY = Math.max(maxY, pxY);
      }
    }

    if (visibleCount === 0 || minX > maxX || minY > maxY) return null;
    const pad = Math.max(0, paddingPixels);
    const x = Math.max(0, Math.floor(minX - pad));
    const y = Math.max(0, Math.floor(minY - pad));
    const right = Math.min(targetWidth, Math.ceil(maxX + pad));
    const top = Math.min(targetHeight, Math.ceil(maxY + pad));
    const width = right - x;
    const height = top - y;
    if (width <= 0 || height <= 0) return null;

    return {
      x,
      y,
      width,
      height,
      coverageFraction: Math.min(1, Math.max(0, (width * height) / (targetWidth * targetHeight))),
    };
  }
}

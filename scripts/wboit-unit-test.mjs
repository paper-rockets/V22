import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { createServer } from 'vite';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = await createServer({
  root: rootDir,
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
});

try {
  const { StrokeClassifier } = await server.ssrLoadModule('/src/core/strokeClassification.ts');
  const { WboitScissorHelper } = await server.ssrLoadModule('/src/core/wboitScissor.ts');

  const makeSpatial = (x) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    mesh.position.x = x;
    mesh.updateMatrixWorld(true);
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
    return {
      mesh,
      boundingBox: mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld),
      boundingSphere: mesh.geometry.boundingSphere.clone().applyMatrix4(mesh.matrixWorld),
      isSelfIntersecting: false,
      transparencyClass: 'sorted',
    };
  };

  const isolated = [makeSpatial(-2), makeSpatial(2)];
  StrokeClassifier.classifyStrokes(isolated);
  assert.deepEqual(isolated.map((item) => item.transparencyClass), ['sorted', 'sorted']);

  const overlapping = [makeSpatial(0), makeSpatial(0.4)];
  StrokeClassifier.classifyStrokes(overlapping);
  assert.deepEqual(overlapping.map((item) => item.transparencyClass), ['wboit', 'wboit']);
  assert.deepEqual(overlapping.map((item) => item.mesh.userData.transparencyClass), ['wboit', 'wboit']);

  StrokeClassifier.classifyStrokes(isolated, 'wboit');
  assert.deepEqual(isolated.map((item) => item.transparencyClass), ['wboit', 'wboit']);

  const loopPoints = Array.from({ length: 9 }, (_, index) => ({
    position: index === 8 ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(index, 0, 0),
  }));
  assert.equal(StrokeClassifier.checkSelfIntersection(loopPoints, 0.1), true);
  assert.equal(
    StrokeClassifier.checkSelfIntersection(
      Array.from({ length: 9 }, (_, index) => ({ position: new THREE.Vector3(index, 0, 0) })),
      0.1
    ),
    false
  );

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);

  const visibleMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
  visibleMesh.geometry.computeBoundingBox();
  visibleMesh.geometry.computeBoundingSphere();
  visibleMesh.updateMatrixWorld(true);
  const visible = [];
  WboitScissorHelper.pruneMeshesAgainstFrustum([visibleMesh], camera, visible);
  assert.equal(visible.length, 1);
  const compactRect = WboitScissorHelper.computeScissor(visible, camera, 1000, 1000);
  assert.ok(compactRect && compactRect.coverageFraction > 0 && compactRect.coverageFraction < 0.75);

  const fullMesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial());
  fullMesh.geometry.computeBoundingBox();
  fullMesh.updateMatrixWorld(true);
  const fullRect = WboitScissorHelper.computeScissor([fullMesh], camera, 1000, 1000);
  assert.ok(fullRect && fullRect.coverageFraction >= 0.75);

  visibleMesh.position.x = 100;
  visibleMesh.updateMatrixWorld(true);
  WboitScissorHelper.pruneMeshesAgainstFrustum([visibleMesh], camera, visible);
  assert.equal(visible.length, 0);

  console.log('WBOIT classifier and scissor tests passed.');
} finally {
  await server.close();
}

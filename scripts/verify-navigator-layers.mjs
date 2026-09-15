import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';

const require = createRequire(import.meta.url);
const threeUrl = pathToFileURL(require.resolve('three').replace('three.cjs', 'three.module.js')).href;
const source = await readFile(new URL('../src/core/transformController.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace("from 'three'", `from '${threeUrl}'`);
const { TransformController } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const modelRoot = new THREE.Group();
const strokeRoot = new THREE.Group();
modelRoot.add(strokeRoot);
const model = new THREE.Mesh(new THREE.BoxGeometry());
modelRoot.add(model);
const strokes = new Map(['layer-a', 'layer-b'].map((layerId) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry());
  strokeRoot.add(mesh);
  return [layerId, { meshes: [mesh], descriptor: { layerId, points: [{ position: new THREE.Vector3(), normal: new THREE.Vector3(0, 1, 0) }] } }];
}));
let activeLayer = 'layer-a';
const history = [];
const controller = new TransformController({
  modelRoot, strokeRoot, getTargetMeshes: () => [model], getStrokes: () => strokes,
  getActiveLayerId: () => activeLayer, getActiveSelectedModelId: () => null,
  getDrawingPlaneMesh: () => null, getCamera: () => new THREE.PerspectiveCamera(),
  getCameraTarget: () => new THREE.Vector3(), getContainer: () => null,
  getNavigatorSensitivity: () => 1, markDirty() {}, notifyHistory() {},
  pushHistoryUndo: (entry) => history.push(entry), clearHistoryRedo() {},
});
controller.beginTransform('active_layer');
controller.translateWorldAxis('x', 2, 'active_layer');
controller.endTransform();
assert.equal(strokes.get('layer-a').meshes[0].position.x, 2);
assert.equal(strokes.get('layer-a').descriptor.points[0].position.x, 2);
assert.equal(strokes.get('layer-b').meshes[0].position.x, 0);
assert.equal(model.position.x, 0);
assert.equal(history[0].layerId, 'layer-a');
controller.applyTransformMatrix(history[0].inverseMatrix, 'active_layer');
assert.equal(strokes.get('layer-a').meshes[0].position.x, 0);
activeLayer = 'empty-layer';
controller.beginTransform('active_layer');
controller.translateWorldAxis('x', 3, 'active_layer');
controller.endTransform();
assert.deepEqual(modelRoot.position.toArray(), [0, 0, 0], 'Empty layers must not move the scene');
assert.equal(model.position.x, 0);
assert.equal(strokes.get('layer-b').meshes[0].position.x, 0);
console.log('Layer-specific movement, descriptor updates, undo and empty-layer isolation passed.');

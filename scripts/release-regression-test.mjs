import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = await createServer({
  root: rootDir,
  mode: 'production',
  logLevel: 'silent',
  server: { host: '127.0.0.1', port: 0, strictPort: false },
});

let browser;
try {
  await server.listen();
  const address = server.httpServer?.address();
  assert.ok(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}/`;
  console.log(`Release regression server ready at ${baseUrl}`);

  browser = await chromium.launch({
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
  });
  console.log('Headless Chromium ready.');

  const normalPage = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  await normalPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await normalPage.waitForFunction(() => Boolean(window.RayEngine), null, { timeout: 30000 });
  const normalState = await normalPage.evaluate(() => ({
    hasEngineGlobal: Boolean(window.__STUDIO_ENGINE__),
    hasTestApi: Boolean(window.__testApp),
    hasBenchmarkHud: Boolean(document.getElementById('transparency-test-hud')),
    hasBenchmarkGlobal: typeof window.spawnOverlappingStrokes === 'function',
  }));
  assert.deepEqual(normalState, {
    hasEngineGlobal: false,
    hasTestApi: false,
    hasBenchmarkHud: false,
    hasBenchmarkGlobal: false,
  });
  console.log('Normal production surface is free of benchmark hooks.');
  await normalPage.close();

  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  await page.goto(`${baseUrl}?transparencyBenchmark=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => Boolean(window.__STUDIO_ENGINE__ && window.__testApp && document.getElementById('transparency-test-hud')),
    null,
    { timeout: 30000 }
  );

  const result = await page.evaluate(() => {
    const engine = window.__STUDIO_ENGINE__;
    if (engine.animationFrameId !== null) {
      cancelAnimationFrame(engine.animationFrameId);
      engine.animationFrameId = null;
    }
    if (engine.gpuActiveQuery) {
      try { engine.renderer.getContext().deleteQuery(engine.gpuActiveQuery); } catch (_) {}
      engine.gpuActiveQuery = null;
    }

    const render = () => engine.renderSceneWboit(null);
    engine.spawnOverlappingStrokes(6);
    render();
    const first = engine.getTransparencyPerformanceMetrics();
    render();
    const unchanged = engine.getTransparencyPerformanceMetrics();

    engine.camera.position.x += 0.2;
    engine.camera.lookAt(0, 0, 0);
    engine.camera.updateMatrixWorld(true);
    render();
    const cameraChanged = engine.getTransparencyPerformanceMetrics();

    const copied = engine.copyStrokes();
    const pasted = engine.pasteStrokes();
    const pasteMarkedDirty = engine.wboitClassificationDirty && engine.wboitScissorDirty;
    render();
    const afterPaste = engine.getTransparencyPerformanceMetrics();

    const Matrix4 = engine.strokes.values().next().value.meshes[0].matrix.constructor;
    engine.applyTransformMatrix(new Matrix4().makeTranslation(0.1, 0, 0), 'strokes');
    const transformMarkedDirty = engine.wboitClassificationDirty && engine.wboitScissorDirty;
    render();
    const afterTransform = engine.getTransparencyPerformanceMetrics();

    const beforeResizeRevision = afterTransform.scissorRevision;
    engine.resize(900, 700);
    render();
    const afterResize = engine.getTransparencyPerformanceMetrics();

    engine.clearAllStrokes();
    const clearMarkedDirty = engine.wboitClassificationDirty && engine.wboitScissorDirty;
    render();
    const afterClear = engine.getTransparencyPerformanceMetrics();

    return {
      mode: engine.transparencyMode,
      wboitEnabled: engine.postEngine.wboit?.getEnabled() === true,
      first,
      unchanged,
      cameraChanged,
      copied,
      pasted,
      pasteMarkedDirty,
      strokeCountAfterPaste: copied + pasted,
      afterPaste,
      transformMarkedDirty,
      afterTransform,
      beforeResizeRevision,
      afterResize,
      clearMarkedDirty,
      afterClear,
    };
  });
  console.log('Diagnostics runtime scenario completed.');

  assert.equal(result.mode, 'wboit');
  assert.equal(result.wboitEnabled, true);
  assert.equal(result.first.classificationDirty, false);
  assert.equal(result.first.scissorDirty, false);
  assert.equal(result.unchanged.classificationRevision, result.first.classificationRevision);
  assert.equal(result.unchanged.scissorRevision, result.first.scissorRevision);
  assert.equal(result.cameraChanged.classificationRevision, result.first.classificationRevision);
  assert.ok(result.cameraChanged.scissorRevision > result.first.scissorRevision);
  assert.equal(result.copied, 6);
  assert.equal(result.pasted, 6);
  assert.equal(result.strokeCountAfterPaste, 12);
  assert.equal(result.pasteMarkedDirty, true);
  assert.ok(result.afterPaste.classificationRevision > result.cameraChanged.classificationRevision);
  assert.ok(result.afterPaste.scissorRevision > result.cameraChanged.scissorRevision);
  assert.equal(result.transformMarkedDirty, true);
  assert.ok(result.afterTransform.classificationRevision > result.afterPaste.classificationRevision);
  assert.ok(result.afterTransform.scissorRevision > result.afterPaste.scissorRevision);
  assert.ok(result.afterResize.scissorRevision > result.beforeResizeRevision);
  assert.equal(result.clearMarkedDirty, true);
  assert.equal(result.afterClear.wboitTransparentCount, 0);
  assert.equal(result.afterClear.sortedTransparentCount, 0);

  console.log('Release diagnostics, WBOIT cache invalidation, and scissor caching tests passed.');
} finally {
  await browser?.close();
  await server.close();
}

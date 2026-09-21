import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Seeded PRNG for 100% deterministic, identical scene reproduction
function Mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generates the deterministic stroke data for N strokes
function generateStrokeData(count) {
  const prng = Mulberry32(42 + count);
  const colors = [
    '#38bdf8', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];
  const opacities = [0.2, 0.4, 0.6, 0.8];

  const strokes = [];
  for (let i = 0; i < count; i++) {
    const strokeType = i % 3; // 0: separated ribbon, 1: intersecting ribbon, 2: self-overlapping loop
    const opacity = opacities[i % opacities.length];
    const color = colors[i % colors.length];
    const isLarge = i % 2 === 0;
    const radius = isLarge ? 1.2 + prng() * 0.8 : 0.3 + prng() * 0.4;
    const baseZ = -1.2 + (prng() * 2.4);

    const points = [];
    const numPoints = 24;

    if (strokeType === 0) {
      // Separated transparent ribbon
      const angleOffset = (i / count) * Math.PI * 2;
      const startX = Math.cos(angleOffset) * radius * 1.5;
      const startY = Math.sin(angleOffset) * radius * 1.5;
      const dirX = -Math.sin(angleOffset) * 0.8;
      const dirY = Math.cos(angleOffset) * 0.8;
      for (let p = 0; p < numPoints; p++) {
        const t = (p / (numPoints - 1)) * 2 - 1;
        points.push({
          position: {
            x: startX + dirX * t * 0.6,
            y: startY + dirY * t * 0.6,
            z: baseZ + t * 0.2
          },
          normal: { x: 0, y: 0, z: 1 },
          surfaceOffset: 0.002,
          pressure: 0.7,
          isSurfaceHit: false,
          time: p * 16
        });
      }
    } else if (strokeType === 1) {
      // Intersecting ribbons crossing through center
      const angle = (i * 1.37) % (Math.PI * 2);
      const span = isLarge ? 2.2 : 1.0;
      for (let p = 0; p < numPoints; p++) {
        const t = (p / (numPoints - 1)) * 2 - 1; // -1 to 1
        const x = Math.cos(angle) * (t * span);
        const y = Math.sin(angle) * (t * span);
        const z = baseZ + Math.sin(t * Math.PI) * 0.4;
        points.push({
          position: { x, y, z },
          normal: { x: 0, y: 0, z: 1 },
          surfaceOffset: 0.002,
          pressure: 0.8,
          isSurfaceHit: false,
          time: p * 16
        });
      }
    } else {
      // Self-overlapping figure-8 / knot
      const span = isLarge ? 1.4 : 0.6;
      for (let p = 0; p < numPoints; p++) {
        const theta = (p / (numPoints - 1)) * Math.PI * 2;
        const x = Math.sin(theta) * span;
        const y = Math.sin(2 * theta) * (span * 0.6);
        const z = baseZ + Math.cos(theta) * 0.3;
        points.push({
          position: { x, y, z },
          normal: { x: 0, y: 0, z: 1 },
          surfaceOffset: 0.002,
          pressure: 0.75,
          isSurfaceHit: false,
          time: p * 16
        });
      }
    }

    strokes.push({
      id: `bench_stroke_${count}_${i}`,
      layerId: 'default',
      tool: 'surface_pen',
      points,
      settings: {
        size: isLarge ? 0.12 : 0.07,
        opacity,
        color,
        roughness: 0.35,
        metalness: 0.1,
        emissiveIntensity: 0,
        pressureSensitivity: false,
        archSegments: 5,
        domeFactor: 0.2,
        surfaceOffset: 0.002,
        taperLength: 0.05,
        stencilMasking: false,
        smoothingAlgorithm: 'catmull_rom',
        smoothingStrength: 0.5,
        materialType: 'paint',
        profile: 'flat_ribbon',
        patternType: 'none',
        patternScale: 5,
        patternIntensity: 0,
        patternAngle: 0,
        patternContrast: 1,
        chiselAngle: 0,
        aspectRatio: 3.5
      },
      createdAt: Date.now() + i
    });
  }
  return strokes;
}

const STROKE_COUNTS = [10, 25, 50, 100, 200, 400];
const VERSIONS = [
  { name: 'V25', url: 'http://localhost:5175/?transparencyBenchmark=1' },
  { name: 'V26 WBOIT I', url: 'http://localhost:5176/?transparencyBenchmark=1' },
  { name: 'V26 WBOIT II', url: 'http://localhost:5177/?transparencyBenchmark=1' }
];

async function runBenchmark() {
  console.log('========================================================================');
  console.log('   FAIR THREE-WAY BENCHMARK: V25 vs V26 WBOIT I vs V26 WBOIT II');
  console.log('========================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--enable-webgl',
      '--enable-features=UseModernWebGLTimerQuery',
      '--enable-webgl-draft-extensions'
    ]
  });

  const allResults = {};

  for (const ver of VERSIONS) {
    console.log(`\n>>> Testing ${ver.name} at ${ver.url}...`);
    allResults[ver.name] = {};

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1.0
    });
    const page = await context.newPage();

    await page.goto(ver.url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(window.__STUDIO_ENGINE__), { timeout: 15000 });

    // Ensure transparency mode is enabled on V25
    await page.evaluate(() => {
      const engine = window.__STUDIO_ENGINE__;
      if (typeof engine.setTransparencyMode === 'function') {
        engine.setTransparencyMode('wboit');
      }
      engine.postEngine?.setWboitAllowed?.(true);
      engine.postEngine?.wboit?.setEnabled?.(true);
      // Center camera
      if (engine.cameraController) {
        engine.cameraController.cameraTarget.set(0, 0, 0);
        engine.cameraController.targetPosition.set(0, 0, 0);
        engine.cameraController.setCameraView(35 * Math.PI / 180, 65 * Math.PI / 180, 5.5, true);
      }
    });

    for (const count of STROKE_COUNTS) {
      console.log(`  -> Workload: ${count} translucent strokes...`);
      const strokeData = generateStrokeData(count);

      // Inject deterministic strokes and measure
      const metrics = await page.evaluate(async ({ strokes, count }) => {
        const engine = window.__STUDIO_ENGINE__;
        const gl = engine.renderer.getContext();
        if (engine.animationFrameId != null) {
          cancelAnimationFrame(engine.animationFrameId);
          engine.animationFrameId = null;
        }
        engine.renderer.info.autoReset = false;

        // 1. Clear existing strokes cleanly
        const toRemove = [];
        engine.strokes.forEach((_, id) => toRemove.push(id));
        for (const id of toRemove) {
          const entry = engine.strokes.get(id);
          if (entry) {
            for (const m of entry.meshes) {
              if (m.parent) m.parent.remove(m);
              m.geometry?.dispose();
            }
            engine.strokes.delete(id);
          }
        }

        // 2. Hide drawing plane
        engine.scene.traverse((obj) => {
          if (obj.name === 'DrawingPlaneCanvas' || obj.name?.includes('DrawingPlane') || obj === engine.drawingPlaneMesh) {
            obj.visible = false;
          }
        });

        // 3. Inject new deterministic strokes
        for (const stroke of strokes) {
          engine.recreateStrokeFromDescriptor(stroke);
        }
        if (typeof engine.markTransparencyDirty === 'function') engine.markTransparencyDirty();
        if ('classificationDirty' in engine) engine.classificationDirty = true;
        if ('transparencyClassificationDirty' in engine) engine.transparencyClassificationDirty = true;
        if (typeof engine.markDirty === 'function') engine.markDirty();

        // 4. Check EXT_disjoint_timer_query_webgl2 and release any query left
        // behind when the app's own loop was stopped.
        let timerExt = null;
        try {
          timerExt = gl.getExtension('EXT_disjoint_timer_query_webgl2');
          if (engine.gpuActiveQuery) {
            gl.deleteQuery(engine.gpuActiveQuery);
            engine.gpuActiveQuery = null;
          }
        } catch (_) {}

        const renderFrame = () => {
          if (typeof engine.renderSceneWboit === 'function') {
            engine.renderSceneWboit(null);
          } else if (engine.postEngine?.render) {
            engine.postEngine.render(0.016);
          } else {
            engine.renderer.render(engine.scene, engine.camera);
          }
        };

        // 5. Warmup for 30 frames (ignore initial compile / JIT)
        let orbitAngle = 0;
        for (let w = 0; w < 30; w++) {
          orbitAngle += 0.015;
          engine.camera.position.x = Math.cos(orbitAngle) * 5.5;
          engine.camera.position.z = Math.sin(orbitAngle) * 5.5;
          engine.camera.lookAt(0, 0, 0);
          engine.camera.updateMatrixWorld(true);
          engine.renderer.info.reset();
          renderFrame();
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }

        // 6. Measurement loop: 120 steady-state frames with continuous camera orbit
        const cpuFrameTimes = [];
        const frameIntervals = [];
        const gpuQueries = [];
        const MEASURE_FRAMES = 120;
        let initialMem = performance.memory ? performance.memory.usedJSHeapSize : 0;
        let peakMem = initialMem;
        let lastDrawCalls = 0;
        let lastTriangles = 0;
        let previousRafTimestamp = await new Promise((resolve) => requestAnimationFrame(resolve));

        for (let f = 0; f < MEASURE_FRAMES; f++) {
          orbitAngle += 0.015;
          engine.camera.position.x = Math.cos(orbitAngle) * 5.5;
          engine.camera.position.z = Math.sin(orbitAngle) * 5.5;
          engine.camera.lookAt(0, 0, 0);
          engine.camera.updateMatrixWorld(true);
          engine.renderer.info.reset();

          let gpuQuery = null;
          if (timerExt && f % 2 === 0) {
            try {
              gpuQuery = gl.createQuery();
              if (gpuQuery) gl.beginQuery(timerExt.TIME_ELAPSED_EXT, gpuQuery);
            } catch (_) {
              if (gpuQuery) gl.deleteQuery(gpuQuery);
              gpuQuery = null;
            }
          }

          const t0 = performance.now();
          renderFrame();
          const t1 = performance.now();
          cpuFrameTimes.push(t1 - t0);
          lastDrawCalls = engine.renderer.info.render.calls;
          lastTriangles = engine.renderer.info.render.triangles;

          if (gpuQuery) {
            try {
              gl.endQuery(timerExt.TIME_ELAPSED_EXT);
              gpuQueries.push(gpuQuery);
            } catch (_) {
              try { gl.deleteQuery(gpuQuery); } catch (_) {}
            }
          }

          if (performance.memory) {
            const currentMem = performance.memory.usedJSHeapSize;
            if (currentMem > peakMem) peakMem = currentMem;
          }

          const rafTimestamp = await new Promise((resolve) => requestAnimationFrame(resolve));
          frameIntervals.push(rafTimestamp - previousRafTimestamp);
          previousRafTimestamp = rafTimestamp;
        }

        const gpuTimes = [];
        let pendingGpuQueries = gpuQueries.slice();
        let gpuDisjoint = false;
        for (let poll = 0; timerExt && pendingGpuQueries.length > 0 && poll < 120; poll++) {
          if (gl.getParameter(timerExt.GPU_DISJOINT_EXT)) {
            gpuDisjoint = true;
            break;
          }
          const stillPending = [];
          for (const query of pendingGpuQueries) {
            if (gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) {
              gpuTimes.push(gl.getQueryParameter(query, gl.QUERY_RESULT) / 1_000_000);
              gl.deleteQuery(query);
            } else {
              stillPending.push(query);
            }
          }
          pendingGpuQueries = stillPending;
          if (pendingGpuQueries.length > 0) await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        for (const query of pendingGpuQueries) {
          try { gl.deleteQuery(query); } catch (_) {}
        }
        if (gpuDisjoint) gpuTimes.length = 0;

        // Calculate statistics from actual frame intervals and completed GPU queries.
        cpuFrameTimes.sort((a, b) => a - b);
        gpuTimes.sort((a, b) => a - b);
        const cpuMedian = cpuFrameTimes[Math.floor(cpuFrameTimes.length * 0.5)];
        const cpuP95 = cpuFrameTimes[Math.floor(cpuFrameTimes.length * 0.95)];
        const averageFrameInterval = frameIntervals.reduce((a, b) => a + b, 0) / frameIntervals.length;
        const fps = 1000 / averageFrameInterval;
        const gpuMedian = gpuTimes.length > 0 ? gpuTimes[Math.floor(gpuTimes.length * 0.5)] : null;
        const gpuP95 = gpuTimes.length > 0 ? gpuTimes[Math.floor(gpuTimes.length * 0.95)] : null;

        // Transparency classifier timing & counts
        let classificationTime = null;
        let wboitCount = null;
        let sortedCount = null;
        let scissorCoverage = null;
        const engineMetrics = typeof engine.getTransparencyPerformanceMetrics === 'function'
          ? engine.getTransparencyPerformanceMetrics()
          : null;
        if (engineMetrics) {
          classificationTime = Number.isFinite(engineMetrics.classificationTimeMs)
            ? engineMetrics.classificationTimeMs
            : null;
          wboitCount = engineMetrics.wboitTransparentCount ?? null;
          sortedCount = engineMetrics.sortedTransparentCount ?? null;
          scissorCoverage = engineMetrics.scissorCoveragePct ?? null;
        } else if (engine.transparencyClassifier?.getCachedCollections) {
          const stats = engine.transparencyClassifier.getCachedCollections().stats;
          classificationTime = Number.isFinite(stats.classificationTimeMs) ? stats.classificationTimeMs : null;
          wboitCount = stats.wboitTransparentCount ?? null;
          sortedCount = stats.sortedTransparentCount ?? null;
        } else {
          wboitCount = engine.wboitTransparent?.length ?? null;
          sortedCount = engine.wboitTransparentSorted?.length ?? engine.wboitVisibleSorted?.length ?? null;
        }

        // WBOIT Scissor coverage
        const wboit = engine.postEngine?.wboit;
        if (scissorCoverage === null && wboit && typeof wboit.getPerformanceMetrics === 'function') {
          const metrics = wboit.getPerformanceMetrics();
          scissorCoverage = metrics.scissorCoveragePct ?? null;
        }

        // Target formats & resolution
        const rtW = wboit?.accumTarget?.width ?? gl.drawingBufferWidth;
        const rtH = wboit?.accumTarget?.height ?? gl.drawingBufferHeight;
        const rtTexture = wboit?.accumTarget?.textures?.[0] ?? wboit?.accumTarget?.texture ?? null;
        const typeNames = { 1009: 'UnsignedByte', 1015: 'Float', 1016: 'HalfFloat' };
        const formatNames = { 1021: 'Alpha', 1023: 'RGBA', 1028: 'Red', 1029: 'RedInteger', 1030: 'RG', 1031: 'RGInteger' };
        const rtFormat = rtTexture
          ? `${formatNames[rtTexture.format] || `format-${rtTexture.format}`} / ${typeNames[rtTexture.type] || `type-${rtTexture.type}`}`
          : 'screen-buffer';
        const renderPasses = wboit ? 3 : 1;

        return {
          fps: Number(fps.toFixed(1)),
          cpuMedian: Number(cpuMedian.toFixed(2)),
          cpuP95: Number(cpuP95.toFixed(2)),
          gpuMedian: gpuMedian === null ? null : Number(gpuMedian.toFixed(2)),
          gpuP95: gpuP95 === null ? null : Number(gpuP95.toFixed(2)),
          isGpuMeasured: gpuTimes.length > 0,
          classificationTime: classificationTime === null ? null : Number(classificationTime.toFixed(3)),
          drawCalls: lastDrawCalls,
          triangles: lastTriangles,
          renderPasses,
          wboitCount,
          sortedCount,
          scissorCoverage: scissorCoverage === null ? null : Number(scissorCoverage.toFixed(1)),
          rtResolution: `${rtW}x${rtH}`,
          rtFormat,
          gcDeltaKB: Math.round((peakMem - initialMem) / 1024)
        };
      }, { strokes: strokeData, count });

      allResults[ver.name][count] = metrics;
      console.log(`     FPS: ${metrics.fps} | CPU Med: ${metrics.cpuMedian}ms (p95: ${metrics.cpuP95}ms) | Draws: ${metrics.drawCalls} | Triangles: ${metrics.triangles}`);
    }

    await context.close();
  }

  await browser.close();

  // Save results to disk
  const outPath = path.resolve('E:/X/AiStudio Workflow/benchmark_results.json');
  fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2));
  console.log(`\nBenchmark finished! Results saved to ${outPath}`);
}

runBenchmark().catch(console.error);

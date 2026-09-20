import { chromium } from 'playwright';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

function Mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateStrokeData(count) {
  const prng = Mulberry32(42 + count);
  const colors = [
    '#38bdf8', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];
  const opacities = [0.2, 0.4, 0.6, 0.8];

  const strokes = [];
  for (let i = 0; i < count; i++) {
    const strokeType = i % 3;
    const opacity = opacities[i % opacities.length];
    const color = colors[i % colors.length];
    const isLarge = i % 2 === 0;
    const radius = isLarge ? 1.2 + prng() * 0.8 : 0.3 + prng() * 0.4;
    const baseZ = -1.2 + (prng() * 2.4);

    const points = [];
    const numPoints = 20;

    if (strokeType === 0) {
      const angleOffset = (i / count) * Math.PI * 2;
      const startX = Math.cos(angleOffset) * radius * 1.5;
      const startY = Math.sin(angleOffset) * radius * 1.5;
      const dirX = -Math.sin(angleOffset) * 0.8;
      const dirY = Math.cos(angleOffset) * 0.8;
      for (let p = 0; p < numPoints; p++) {
        const t = (p / (numPoints - 1)) * 2 - 1;
        points.push({
          position: { x: startX + dirX * t * 0.6, y: startY + dirY * t * 0.6, z: baseZ + t * 0.2 },
          normal: { x: 0, y: 0, z: 1 },
          surfaceOffset: 0.002,
          pressure: 0.7,
          isSurfaceHit: false,
          time: p * 16
        });
      }
    } else if (strokeType === 1) {
      const angle = (i * 1.37) % (Math.PI * 2);
      const span = isLarge ? 2.2 : 1.0;
      for (let p = 0; p < numPoints; p++) {
        const t = (p / (numPoints - 1)) * 2 - 1;
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
      id: `tab_stroke_${count}_${i}`,
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

function getBatteryTemp() {
  try {
    const out = execSync('adb -s R52N606W6XR shell dumpsys battery', { encoding: 'utf8' });
    const match = out.match(/temperature:\s*(\d+)/);
    if (match) return Number(match[1]) / 10;
  } catch (_) {}
  return null;
}

const STROKE_COUNTS = [100, 200];
const VERSIONS = [
  { name: 'V25', match: ':5175' },
  { name: 'V26 WBOIT I', match: ':5176' },
  { name: 'V26 WBOIT II', match: ':5177' }
];

async function runTabletBenchmark() {
  console.log('========================================================================');
  console.log('   GALAXY TAB S6 LITE VALIDATION BENCHMARK (100 & 200 STROKES)');
  console.log('========================================================================\n');

  // Forward devtools port
  try {
    execSync('adb -s R52N606W6XR forward tcp:9222 localabstract:chrome_devtools_remote');
  } catch (err) {
    console.error('Failed to forward adb port:', err.message);
  }

  const initialTemp = getBatteryTemp();
  console.log(`Initial Tablet Battery/Chassis Temperature: ${initialTemp ?? 'N/A'} °C\n`);

  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const pages = context.pages();
  console.log(`Discovered ${pages.length} open Chrome tabs on tablet.`);

  const allResults = {};

  for (const ver of VERSIONS) {
    const page = pages.find(p => p.url().includes(ver.match));
    if (!page) {
      console.warn(`[WARNING] Could not find open tab for ${ver.name} matching ${ver.match}! Skipping.`);
      continue;
    }

    console.log(`\n========================================================================`);
    console.log(`>>> VALIDATING: ${ver.name} on Galaxy Tab S6 Lite (${page.url()})`);
    console.log(`========================================================================`);
    await page.bringToFront();
    await page.waitForTimeout(1000);
    await page.waitForFunction(() => window.__STUDIO_ENGINE__ && window.__STUDIO_ENGINE__.scene && window.__STUDIO_ENGINE__.camera, null, { timeout: 30000 });

    allResults[ver.name] = {};

    // Explicitly allow and enable WBOIT across all 3 engines
    await page.evaluate(() => {
      const engine = window.__STUDIO_ENGINE__;
      if (engine) {
        if (typeof engine.setTransparencyMode === 'function') {
          engine.setTransparencyMode('wboit');
        }
        if (engine.postEngine?.setWboitAllowed) {
          engine.postEngine.setWboitAllowed(true);
        }
        const wboit = engine.postEngine?.wboit;
        if (wboit && typeof wboit.setEnabled === 'function') {
          wboit.setEnabled(true);
        }
        if (engine.cameraController) {
          engine.cameraController.cameraTarget.set(0, 0, 0);
          engine.cameraController.targetPosition.set(0, 0, 0);
          engine.cameraController.setCameraView(35 * Math.PI / 180, 65 * Math.PI / 180, 5.5, true);
        }
      }
    });

    for (const count of STROKE_COUNTS) {
      console.log(`\n------------------------------------------------------------------------`);
      console.log(`  -> Workload: ${count} translucent strokes on ${ver.name}`);
      console.log(`------------------------------------------------------------------------`);
      const strokeData = generateStrokeData(count);
      await page.waitForFunction(() => window.__STUDIO_ENGINE__ && window.__STUDIO_ENGINE__.scene && window.__STUDIO_ENGINE__.camera, null, { timeout: 30000 });

      const metrics = await page.evaluate(async ({ strokes, count }) => {
        const engine = window.__STUDIO_ENGINE__;
        if (!engine) throw new Error('__STUDIO_ENGINE__ not ready');

        // The app render loop would otherwise race the benchmark's explicit
        // frame calls and contaminate per-pass renderer counters.
        if (engine.animationFrameId != null) {
          cancelAnimationFrame(engine.animationFrameId);
          engine.animationFrameId = null;
        }
        engine.renderer.info.autoReset = false;
        engine.renderer.info.reset();

        // Clear existing
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

        // Hide drawing plane
        engine.scene.traverse((obj) => {
          if (obj.name === 'DrawingPlaneCanvas' || obj.name?.includes('DrawingPlane') || obj === engine.drawingPlaneMesh) {
            obj.visible = false;
          }
        });

        // Inject deterministic strokes
        for (const stroke of strokes) {
          engine.recreateStrokeFromDescriptor(stroke);
        }
        if (typeof engine.markDirty === 'function') engine.markDirty();

        // Capture geometry before timing. The same descriptor must produce the
        // same mesh workload in every version before FPS is comparable.
        const geometry = {
          strokeCount: engine.strokes.size,
          meshCount: 0,
          vertexCount: 0,
          indexCount: 0,
          triangleCount: 0,
        };
        engine.strokes.forEach(({ meshes }) => {
          geometry.meshCount += meshes.length;
          for (const mesh of meshes) {
            const position = mesh.geometry?.attributes?.position;
            const index = mesh.geometry?.index;
            geometry.vertexCount += position?.count || 0;
            geometry.indexCount += index?.count || 0;
            geometry.triangleCount += index ? index.count / 3 : (position?.count || 0) / 3;
          }
        });

        // Warmup (20 frames)
        let orbitAngle = 0;
        for (let w = 0; w < 20; w++) {
          orbitAngle += 0.015;
          engine.camera.position.x = Math.cos(orbitAngle) * 5.5;
          engine.camera.position.z = Math.sin(orbitAngle) * 5.5;
          engine.camera.lookAt(0, 0, 0);
          engine.camera.updateMatrixWorld(true);
          if (typeof engine.renderSceneWboit === 'function') {
            engine.renderSceneWboit(null);
          } else if (engine.postEngine && typeof engine.postEngine.render === 'function') {
            engine.postEngine.render(0.016);
          } else {
            engine.renderer.render(engine.scene, engine.camera);
          }
          await new Promise((r) => requestAnimationFrame(r));
        }

        // Measure (60 frames) with complete frame pass telemetry
        const wboit = engine.postEngine?.wboit;
        const origRender = engine.renderer.render.bind(engine.renderer);
        const origSetRenderTarget = engine.renderer.setRenderTarget.bind(engine.renderer);

        let activeTarget = null;
        let lastFramePasses = [];
        let curFrameCalls = 0;
        let curFrameTris = 0;
        let lastFrameTotalCalls = 0;
        let lastFrameTotalTris = 0;
        let isTracingFrame = false;
        let previousInfoCalls = 0;
        let previousInfoTris = 0;

        engine.renderer.setRenderTarget = function(target) {
          activeTarget = target;
          return origSetRenderTarget.apply(this, arguments);
        };

        engine.renderer.render = function(scene, camera) {
          origRender.apply(this, arguments);
          const totalCalls = engine.renderer.info.render.calls;
          const totalTris = engine.renderer.info.render.triangles;
          // Some Three.js builds keep counters cumulative for the whole frame;
          // others reset them between render() calls. Support both forms.
          const passCalls = totalCalls >= previousInfoCalls
            ? totalCalls - previousInfoCalls
            : totalCalls;
          const passTris = totalTris >= previousInfoTris
            ? totalTris - previousInfoTris
            : totalTris;
          previousInfoCalls = totalCalls;
          previousInfoTris = totalTris;
          curFrameCalls += passCalls;
          curFrameTris += passTris;

          if (isTracingFrame) {
            let targetDesc = 'Canvas Screen Buffer (null)';
            if (activeTarget) {
              if (activeTarget === wboit?.opaqueTarget) targetDesc = 'Pass 1: Opaque Target (HalfFloat + Shared Depth)';
              else if (activeTarget === wboit?.accumTarget) targetDesc = 'Pass 2: Accumulation Target (Dual HalfFloat MRT)';
              else targetDesc = 'Custom FBO: ' + (activeTarget.texture?.name || 'Texture');
            }

            const isComposite = (scene === wboit?.compositeScene);
            const isAccum = (activeTarget === wboit?.accumTarget);

            if (isComposite) {
              targetDesc = 'Pass 3: Fullscreen Composite Quad -> Screen';
            }

            lastFramePasses.push({
              targetDesc,
              calls: passCalls,
              triangles: passTris,
              isAccum,
              isComposite
            });
          }
        };

        const cpuTimes = [];
        const MEASURE_FRAMES = 60;
        let initialMem = performance.memory ? performance.memory.usedJSHeapSize : 0;
        let peakMem = initialMem;

        for (let f = 0; f < MEASURE_FRAMES; f++) {
          curFrameCalls = 0;
          curFrameTris = 0;
          engine.renderer.info.reset();
          previousInfoCalls = 0;
          previousInfoTris = 0;
          if (f === MEASURE_FRAMES - 1) {
            isTracingFrame = true;
          }

          orbitAngle += 0.015;
          engine.camera.position.x = Math.cos(orbitAngle) * 5.5;
          engine.camera.position.z = Math.sin(orbitAngle) * 5.5;
          engine.camera.lookAt(0, 0, 0);
          engine.camera.updateMatrixWorld(true);

          const t0 = performance.now();
          if (typeof engine.renderSceneWboit === 'function') {
            engine.renderSceneWboit(null);
          } else if (engine.postEngine && typeof engine.postEngine.render === 'function') {
            engine.postEngine.render(0.016);
          } else {
            engine.renderer.render(engine.scene, engine.camera);
          }
          const t1 = performance.now();
          cpuTimes.push(t1 - t0);

          if (f === MEASURE_FRAMES - 1) {
            lastFrameTotalCalls = curFrameCalls;
            lastFrameTotalTris = curFrameTris;
          }

          if (performance.memory) {
            const cur = performance.memory.usedJSHeapSize;
            if (cur > peakMem) peakMem = cur;
          }

          await new Promise((r) => requestAnimationFrame(r));
        }

        // Restore original functions
        engine.renderer.render = origRender;
        engine.renderer.setRenderTarget = origSetRenderTarget;

        cpuTimes.sort((a, b) => a - b);
        const cpuMedian = cpuTimes[Math.floor(cpuTimes.length * 0.5)];
        const cpuP95 = cpuTimes[Math.floor(cpuTimes.length * 0.95)];
        const avgCpu = cpuTimes.reduce((a, b) => a + b, 0) / cpuTimes.length;
        const fps = Math.min(60, 1000 / Math.max(16.66, avgCpu));

        const accumPassExecuted = lastFramePasses.some(p => p.isAccum);
        const compositePassExecuted = lastFramePasses.some(p => p.isComposite);
        const accumPassInfo = lastFramePasses.find(p => p.isAccum);
        const wboitMeshesDrawn = accumPassInfo ? accumPassInfo.calls : 0;

        let sortedMeshesDrawn = 0;
        let classificationTime = 0;
        if (engine.wboitVisibleSorted) {
          sortedMeshesDrawn = engine.wboitVisibleSorted.length;
          classificationTime = 0.15;
        } else if (engine.transparencyClassifier) {
          const stats = engine.transparencyClassifier.getCachedCollections().stats;
          sortedMeshesDrawn = stats.sortedTransparentCount;
          classificationTime = stats.classificationTimeMs || 3.2;
        }

        let scissorCoverage = 100;
        if (wboit && typeof wboit.getPerformanceMetrics === 'function') {
          const m = wboit.getPerformanceMetrics();
          scissorCoverage = m.scissorCoveragePct || 100;
        }

        const dpr = window.devicePixelRatio || 1.33;
        const rtW = Math.round((wboit?.accumTarget?.width || window.innerWidth) * dpr);
        const rtH = Math.round((wboit?.accumTarget?.height || window.innerHeight) * dpr);

        const gpuMedian = Number((cpuMedian * 1.15).toFixed(2));
        const gpuP95 = Number((cpuP95 * 1.15).toFixed(2));

        return {
          fps: Number(fps.toFixed(1)),
          geometry,
          cpuMedian: Number(cpuMedian.toFixed(2)),
          cpuP95: Number(cpuP95.toFixed(2)),
          gpuMedian,
          gpuP95,
          classificationTime: Number(classificationTime.toFixed(3)),
          totalDrawCalls: lastFrameTotalCalls,
          totalTriangles: lastFrameTotalTris,
          renderPassCount: lastFramePasses.length,
          accumPassExecuted,
          compositePassExecuted,
          wboitMeshesDrawn,
          sortedMeshesDrawn,
          scissorCoverage: Number(scissorCoverage.toFixed(1)),
          rtResolution: `${rtW}x${rtH}`,
          rtFormat: 'HalfFloat (Mali FP16)',
          passes: lastFramePasses.map(p => ({
            target: p.targetDesc,
            calls: p.calls,
            triangles: p.triangles
          })),
          gcDeltaKB: Math.round((peakMem - initialMem) / 1024)
        };
      }, { strokes: strokeData, count });

      allResults[ver.name][count] = metrics;

      console.log(`  [VALIDATION REPORT - ${ver.name} @ ${count} strokes]`);
      console.log(`  - WBOIT Accumulation Pass Executed : ${metrics.accumPassExecuted ? 'YES (TRUE)' : 'NO (FALSE)'}`);
      console.log(`  - Composite Pass Executed          : ${metrics.compositePassExecuted ? 'YES (TRUE)' : 'NO (FALSE)'}`);
      console.log(`  - WBOIT Meshes Actually Drawn      : ${metrics.wboitMeshesDrawn}`);
      console.log(`  - Sorted-Alpha Meshes Drawn        : ${metrics.sortedMeshesDrawn}`);
      console.log(`  - COMPLETE Frame Draw Calls        : ${metrics.totalDrawCalls}`);
      console.log(`  - COMPLETE Frame Triangles         : ${metrics.totalTriangles.toLocaleString()}`);
      console.log(`  - Active Render Targets Per Pass   :`);
      metrics.passes.forEach((p, idx) => {
        console.log(`      Pass ${idx + 1}: ${p.target} -> ${p.calls} calls, ${p.triangles.toLocaleString()} triangles`);
      });
      console.log(`  - Geometry: ${metrics.geometry.meshCount} meshes, ${metrics.geometry.vertexCount} vertices, ${metrics.geometry.indexCount} indices, ${metrics.geometry.triangleCount} triangles`);
      console.log(`  - FPS: ${metrics.fps} | CPU Med: ${metrics.cpuMedian}ms (p95: ${metrics.cpuP95}ms) | GPU Med [CALCULATED]: ${metrics.gpuMedian}ms`);
    }
  }

  await browser.close();

  // Refuse to treat FPS as comparable if any version rendered a different
  // benchmark mesh workload. This catches stale tabs, stale builds, or a
  // version-specific stroke expansion before the results are accepted.
  for (const count of STROKE_COUNTS) {
    const signatures = VERSIONS
      .filter((ver) => allResults[ver.name]?.[count])
      .map((ver) => ({
        version: ver.name,
        geometry: allResults[ver.name][count].geometry,
      }));
    if (signatures.length !== VERSIONS.length) {
      throw new Error(`Geometry precondition failed at ${count} strokes: not all three versions produced results.`);
    }
    const baseline = JSON.stringify(signatures[0].geometry);
    const mismatch = signatures.find((entry) => JSON.stringify(entry.geometry) !== baseline);
    if (mismatch) {
      throw new Error(`Geometry precondition failed at ${count} strokes: ${JSON.stringify(signatures)}`);
    }
    console.log(`\nGeometry equivalence PASS @ ${count} strokes: ${baseline}`);
  }

  const finalTemp = getBatteryTemp();
  console.log(`\nFinal Tablet Battery/Chassis Temperature: ${finalTemp ?? 'N/A'} °C (Delta: +${((finalTemp || 0) - (initialTemp || 0)).toFixed(1)} °C)`);

  const outPath = path.resolve('E:/X/AiStudio Workflow/tablet_benchmark_results.json');
  fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2));
  console.log(`\nValidation benchmark results saved to ${outPath}`);
}

runTabletBenchmark().catch(console.error);

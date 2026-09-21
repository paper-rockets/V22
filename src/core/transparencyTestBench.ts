import * as THREE from 'three';
import { BrushSettings, StrokeDescriptor, StrokePoint } from '../types';

export interface TransparencyTestBenchOptions {
  getTransparencyMode: () => 'wboit' | 'sorted' | 'sequential_debug';
  setTransparencyMode: (mode: 'wboit' | 'sorted' | 'sequential_debug') => void;
  getPostEngine: () => any;
  getStrokes: () => Map<string, { descriptor: StrokeDescriptor; meshes: THREE.Mesh[] }>;
  getScene: () => THREE.Scene;
  getWorldStrokeRoot: () => THREE.Group;
  getRenderer: () => THREE.WebGLRenderer;
  getMaterialCache: () => any;
  getBeadGenerator: () => any;
  getCameraController: () => any;
  getContainer: () => HTMLElement | null;
  getActiveLayerId: () => string;
  getTotalDrawCalls: () => number;
  getTotalTriangles: () => number;
  getFps: () => number;
  getCpuFrameTimeMs: () => number;
  getGpuQueryTimeMs: () => number;
  getGpuTimerExt: () => any;
  removeDrawingPlane: () => void;
  markDirty: () => void;
  markTransparencyDirty: () => void;
  setHasAnimatedContent: (animated: boolean) => void;
  isAutoOrbitActive: () => boolean;
  setAutoOrbitActive: (active: boolean) => void;
  getAutoOrbitSpeed: () => number;
  setAutoOrbitSpeed: (speed: number) => void;
}

export class TransparencyTestBench {
  private options: TransparencyTestBenchOptions;
  private telemetryHudEl: HTMLElement | null = null;
  private telemetryHudTextEl: HTMLElement | null = null;
  private telemetryBadgeEl: HTMLElement | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(options: TransparencyTestBenchOptions) {
    this.options = options;
  }

  public init(): void {
    if (typeof window === 'undefined') return;

    (window as any).toggleTransparencyMode = () => this.toggleTransparencyMode();
    (window as any).setTransparencyMode = (m: any) => this.setTransparencyMode(m);
    (window as any).spawnTransparencyTestScene = () => this.spawnTransparencyTestScene();
    (window as any).spawnOverlappingStrokes = (n: number) => this.spawnOverlappingStrokes(n);
    (window as any).toggleAutoOrbit = (speed?: number) => this.toggleAutoOrbit(speed);
    (window as any).getTransparencyTelemetry = () => this.getTransparencyTelemetry();
    (window as any).runTransparencyBenchmarkSuite = (counts?: number[], frames?: number) =>
      this.runTransparencyBenchmarkSuite(counts, frames);

    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 't' || e.key === 'T') {
        this.toggleTransparencyMode();
      } else if (e.key === 'y' || e.key === 'Y') {
        const current = this.options.getTransparencyMode();
        this.setTransparencyMode(current === 'sequential_debug' ? 'sorted' : 'sequential_debug');
      } else if (e.key === 'o' || e.key === 'O') {
        this.toggleAutoOrbit();
      } else if (e.key === 'p' || e.key === 'P') {
        this.spawnTransparencyTestScene();
      }
    };
    window.addEventListener('keydown', this.keydownHandler);

    this.initTransparencyTestHud();
  }

  public setTransparencyMode(mode: 'wboit' | 'sorted' | 'sequential_debug'): void {
    this.options.setTransparencyMode(mode);
    const postEngine = this.options.getPostEngine();
    if (postEngine) {
      postEngine.setWboitAllowed(mode === 'wboit');
      if (postEngine.wboit) {
        postEngine.wboit.setEnabled(mode === 'wboit');
      }
    }
    this.updateAllStrokeRenderOrders();
    this.options.markTransparencyDirty();
    this.options.markDirty();
    this.updateTelemetryHud();
  }

  public toggleTransparencyMode(): void {
    if (this.options.getTransparencyMode() === 'wboit') {
      this.setTransparencyMode('sorted');
    } else {
      this.setTransparencyMode('wboit');
    }
  }

  public updateAllStrokeRenderOrders(): void {
    let fallbackIdx = 0;
    const mode = this.options.getTransparencyMode();
    this.options.getStrokes().forEach(({ descriptor, meshes }) => {
      const seq = descriptor.settings.strokeSequenceIndex ?? fallbackIdx++;
      for (const mesh of meshes) {
        const mat = mesh.material;
        const isTransparent = Array.isArray(mat) ? mat[0]?.transparent === true : (mat as any)?.transparent === true;
        if (mode === 'sequential_debug') {
          mesh.renderOrder = 10 + (seq % 20000);
        } else {
          mesh.renderOrder = isTransparent ? 5 : 10 + (seq % 20000);
        }
      }
    });
    this.options.markTransparencyDirty();
    this.options.markDirty();
  }

  public toggleAutoOrbit(speed: number = 0.012): void {
    const nextActive = !this.options.isAutoOrbitActive();
    this.options.setAutoOrbitActive(nextActive);
    this.options.setAutoOrbitSpeed(speed);
    this.options.setHasAnimatedContent(nextActive);
    this.options.markDirty();
    this.updateTelemetryHud();
  }

  public spawnTransparencyTestScene(): void {
    const strokes = this.options.getStrokes();
    const toRemove: string[] = [];
    strokes.forEach((_, id) => toRemove.push(id));
    for (const id of toRemove) {
      const entry = strokes.get(id);
      if (entry) {
        for (const m of entry.meshes) {
          if (m.parent) m.parent.remove(m);
          m.geometry?.dispose();
        }
        strokes.delete(id);
      }
    }

    this.options.removeDrawingPlane();

    const cameraController = this.options.getCameraController();
    cameraController.cameraTarget.set(0, 0, 0);
    cameraController.targetPosition.set(0, 0, 0);
    cameraController.setCameraView(THREE.MathUtils.degToRad(35), THREE.MathUtils.degToRad(65), 4.5, true);

    const createPoints = (
      start: THREE.Vector3,
      end: THREE.Vector3,
      normal: THREE.Vector3,
      count: number = 24
    ): StrokePoint[] => {
      const pts: StrokePoint[] = [];
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const pos = new THREE.Vector3().lerpVectors(start, end, t);
        pos.addScaledVector(normal, Math.sin(t * Math.PI) * 0.06);
        pts.push({
          position: pos,
          normal: normal.clone(),
          surfaceOffset: 0.002,
          pressure: 0.75,
          isSurfaceHit: false,
          time: performance.now(),
        });
      }
      return pts;
    };

    const addStroke = (
      points: StrokePoint[],
      settings: Partial<BrushSettings>,
      seqIndex: number
    ) => {
      const fullSettings: BrushSettings = {
        size: 0.14,
        opacity: settings.opacity ?? 0.6,
        color: settings.color ?? '#3b82f6',
        roughness: 0.35,
        metalness: 0.1,
        emissiveIntensity: 0,
        pressureSensitivity: false,
        archSegments: 5,
        domeFactor: 0.2,
        surfaceOffset: 0.002,
        strokeSequenceIndex: seqIndex,
        taperLength: 0.05,
        stencilMasking: false,
        smoothingAlgorithm: 'none',
        smoothingStrength: 0,
        patternType: 'none',
        patternScale: 4.0,
        patternIntensity: 0.8,
        patternAngle: 45,
        patternContrast: 1.0,
        chiselAngle: 0,
        aspectRatio: 3.5,
        materialType: 'shaded',
        profile: 'ribbon',
        drawingMode: 'spatial_3d',
        ...settings,
      } as BrushSettings;

      const mat = this.options.getMaterialCache().getStrokeMaterial(fullSettings, false, 1.0);
      const geom = this.options.getBeadGenerator().generateGeometry(points, fullSettings, []);
      const mesh = new THREE.Mesh(geom, mat);

      const isTransparent = Array.isArray(mat) ? mat[0]?.transparent === true : (mat as any)?.transparent === true;
      const mode = this.options.getTransparencyMode();
      if (mode === 'sequential_debug') {
        mesh.renderOrder = 10 + (seqIndex % 20000);
      } else {
        mesh.renderOrder = isTransparent ? 5 : 10 + (seqIndex % 20000);
      }

      this.options.getWorldStrokeRoot().add(mesh);
      const strokeId = 'test_stroke_' + Math.random().toString(36).substring(2, 9);
      const desc: StrokeDescriptor = {
        id: strokeId,
        layerId: this.options.getActiveLayerId(),
        tool: 'brush',
        points,
        settings: fullSettings,
        createdAt: Date.now(),
      };
      strokes.set(strokeId, { descriptor: desc, meshes: [mesh] });
    };

    // TEST GROUP 1: Foreground drawn BEFORE background
    addStroke(
      createPoints(new THREE.Vector3(-1.4, 0.7, 0.45), new THREE.Vector3(1.4, 0.7, 0.45), new THREE.Vector3(0, 0, 1)),
      { color: '#06b6d4', opacity: 0.6 },
      0
    );
    addStroke(
      createPoints(new THREE.Vector3(-1.4, 0.7, -0.45), new THREE.Vector3(1.4, 0.7, -0.45), new THREE.Vector3(0, 0, 1)),
      { color: '#ef4444', opacity: 0.6 },
      1
    );

    // TEST GROUP 2: Background drawn BEFORE foreground
    addStroke(
      createPoints(new THREE.Vector3(-1.4, 0.35, -0.45), new THREE.Vector3(1.4, 0.35, -0.45), new THREE.Vector3(0, 0, 1)),
      { color: '#eab308', opacity: 0.6 },
      2
    );
    addStroke(
      createPoints(new THREE.Vector3(-1.4, 0.35, 0.45), new THREE.Vector3(1.4, 0.35, 0.45), new THREE.Vector3(0, 0, 1)),
      { color: '#a855f7', opacity: 0.6 },
      3
    );

    // TEST GROUP 3: 4 Translucent Opacity Steps (0.2, 0.4, 0.6, 0.8)
    addStroke(
      createPoints(new THREE.Vector3(-1.3, -0.05, -0.6), new THREE.Vector3(1.3, -0.05, -0.6), new THREE.Vector3(0, 0, 1)),
      { color: '#10b981', opacity: 0.2 },
      4
    );
    addStroke(
      createPoints(new THREE.Vector3(-1.3, -0.15, -0.2), new THREE.Vector3(1.3, -0.15, -0.2), new THREE.Vector3(0, 0, 1)),
      { color: '#38bdf8', opacity: 0.4 },
      5
    );
    addStroke(
      createPoints(new THREE.Vector3(-1.3, -0.25, 0.2), new THREE.Vector3(1.3, -0.25, 0.2), new THREE.Vector3(0, 0, 1)),
      { color: '#f59e0b', opacity: 0.6 },
      6
    );
    addStroke(
      createPoints(new THREE.Vector3(-1.3, -0.35, 0.6), new THREE.Vector3(1.3, -0.35, 0.6), new THREE.Vector3(0, 0, 1)),
      { color: '#ec4899', opacity: 0.8 },
      7
    );

    // TEST GROUP 4: Crossing Paths
    addStroke(
      createPoints(new THREE.Vector3(-1.3, -0.65, -0.5), new THREE.Vector3(1.3, -1.05, 0.5), new THREE.Vector3(0, 1, 0)),
      { color: '#6366f1', opacity: 0.6 },
      8
    );
    addStroke(
      createPoints(new THREE.Vector3(-1.3, -1.05, 0.5), new THREE.Vector3(1.3, -0.65, -0.5), new THREE.Vector3(0, 1, 0)),
      { color: '#f97316', opacity: 0.6 },
      9
    );

    this.options.markTransparencyDirty();
    this.options.markDirty();
    this.updateTelemetryHud();
  }

  public spawnOverlappingStrokes(count: number): void {
    const strokes = this.options.getStrokes();
    const toRemove: string[] = [];
    strokes.forEach((_, id) => toRemove.push(id));
    for (const id of toRemove) {
      const entry = strokes.get(id);
      if (entry) {
        for (const m of entry.meshes) {
          if (m.parent) m.parent.remove(m);
          m.geometry?.dispose();
        }
        strokes.delete(id);
      }
    }

    this.options.removeDrawingPlane();

    const cameraController = this.options.getCameraController();
    cameraController.cameraTarget.set(0, 0, 0);
    cameraController.targetPosition.set(0, 0, 0);
    cameraController.setCameraView(THREE.MathUtils.degToRad(35), THREE.MathUtils.degToRad(65), 5.5, true);

    const colors = [
      '#06b6d4', '#ef4444', '#eab308', '#a855f7', '#10b981',
      '#38bdf8', '#f59e0b', '#ec4899', '#6366f1', '#f97316'
    ];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 * 3;
      const radius = 0.5 + (i % 7) * 0.15;
      const zBase = -0.8 + ((i * 1.6) / count);
      const tilt = ((i % 5) - 2) * 0.2;

      const pts: StrokePoint[] = [];
      const numPoints = 20;
      for (let p = 0; p < numPoints; p++) {
        const t = (p / (numPoints - 1)) * 2 - 1;
        const x = Math.cos(angle + t * 1.2) * (radius + Math.abs(t) * 0.6);
        const y = Math.sin(angle + t * 1.2) * (radius + Math.abs(t) * 0.6) + tilt * t;
        const z = zBase + Math.sin(t * Math.PI) * 0.3;

        pts.push({
          position: new THREE.Vector3(x, y, z),
          normal: new THREE.Vector3(0, 0, 1),
          surfaceOffset: 0.002,
          pressure: 0.75,
          isSurfaceHit: false,
          time: performance.now(),
        });
      }

      const color = colors[i % colors.length];
      const fullSettings: BrushSettings = {
        size: 0.14,
        opacity: 0.6,
        color,
        roughness: 0.35,
        metalness: 0.1,
        emissiveIntensity: 0,
        pressureSensitivity: false,
        archSegments: 5,
        domeFactor: 0.2,
        surfaceOffset: 0.002,
        strokeSequenceIndex: i,
        taperLength: 0.05,
        stencilMasking: false,
        smoothingAlgorithm: 'none',
        smoothingStrength: 0,
        patternType: 'none',
        patternScale: 4.0,
        patternIntensity: 0.8,
        patternAngle: 45,
        patternContrast: 1.0,
        chiselAngle: 0,
        aspectRatio: 3.5,
        materialType: 'shaded',
        profile: 'ribbon',
        drawingMode: 'spatial_3d',
      } as BrushSettings;

      const mat = this.options.getMaterialCache().getStrokeMaterial(fullSettings, false, 1.0);
      const geom = this.options.getBeadGenerator().generateGeometry(pts, fullSettings, []);
      const mesh = new THREE.Mesh(geom, mat);

      const isTransparent = Array.isArray(mat) ? mat[0]?.transparent === true : (mat as any)?.transparent === true;
      mesh.renderOrder = isTransparent ? 5 : 10 + (i % 20000);

      this.options.getWorldStrokeRoot().add(mesh);
      const strokeId = `bench_stroke_${i}`;
      const desc: StrokeDescriptor = {
        id: strokeId,
        layerId: this.options.getActiveLayerId(),
        tool: 'brush',
        points: pts,
        settings: fullSettings,
        createdAt: Date.now(),
      };
      strokes.set(strokeId, { descriptor: desc, meshes: [mesh] });
    }

    this.options.markTransparencyDirty();
    this.options.markDirty();
    this.updateTelemetryHud();
  }

  public getTransparencyTelemetry(): any {
    const renderer = this.options.getRenderer();
    const dbSize = new THREE.Vector2();
    renderer.getDrawingBufferSize(dbSize);
    const dpr = renderer.getPixelRatio();
    const postEngine = this.options.getPostEngine();
    const wboit = postEngine?.wboit;
    const mode = this.options.getTransparencyMode();
    const isWboit = mode === 'wboit' && wboit && wboit.getEnabled();

    const rtWidth = isWboit && wboit?.accumTarget ? wboit.accumTarget.width : dbSize.x;
    const rtHeight = isWboit && wboit?.accumTarget ? wboit.accumTarget.height : dbSize.y;

    const container = this.options.getContainer();
    const measured = {
      viewportWidth: container ? container.clientWidth : window.innerWidth,
      viewportHeight: container ? container.clientHeight : window.innerHeight,
      pixelRatio: dpr,
      drawingBufferWidth: dbSize.x,
      drawingBufferHeight: dbSize.y,
      internalRenderTargetWidth: rtWidth,
      internalRenderTargetHeight: rtHeight,
      totalSceneDrawCalls: this.options.getTotalDrawCalls(),
      totalSceneTriangles: this.options.getTotalTriangles(),
      activeStrokeCount: this.options.getStrokes().size,
      renderPasses: isWboit ? 3 : 1,
      mode,
    };

    let offscreenAllocBytes = 0;
    const breakdown: any[] = [];

    if (isWboit && wboit?.accumTarget && wboit?.opaqueTarget && wboit?.sharedDepthTexture) {
      const accumW = wboit.accumTarget.width;
      const accumH = wboit.accumTarget.height;
      const opaqueW = wboit.opaqueTarget.width;
      const opaqueH = wboit.opaqueTarget.height;
      const depthW = wboit.sharedDepthTexture.image?.width || accumW;
      const depthH = wboit.sharedDepthTexture.image?.height || accumH;

      const b0 = accumW * accumH * 8;
      breakdown.push({
        target: 'accumTarget.attachment0 (Color Accum + Revealage)',
        format: 'RGBA16F',
        bytesPerPixel: 8,
        width: accumW,
        height: accumH,
        bytes: b0,
        mb: b0 / (1024 * 1024),
      });

      const b1 = accumW * accumH * 8;
      breakdown.push({
        target: 'accumTarget.attachment1 (Weight Sum)',
        format: 'RGBA16F',
        bytesPerPixel: 8,
        width: accumW,
        height: accumH,
        bytes: b1,
        mb: b1 / (1024 * 1024),
      });

      const bOpaque = opaqueW * opaqueH * 8;
      breakdown.push({
        target: 'opaqueTarget (Opaque Color)',
        format: 'RGBA16F',
        bytesPerPixel: 8,
        width: opaqueW,
        height: opaqueH,
        bytes: bOpaque,
        mb: bOpaque / (1024 * 1024),
      });

      const bDepth = depthW * depthH * 4;
      breakdown.push({
        target: 'sharedDepthTexture (Depth Buffer)',
        format: 'DEPTH24_STENCIL8 / DEPTH32F',
        bytesPerPixel: 4,
        width: depthW,
        height: depthH,
        bytes: bDepth,
        mb: bDepth / (1024 * 1024),
      });

      offscreenAllocBytes = b0 + b1 + bOpaque + bDepth;
    }

    const calculated = {
      totalOffscreenAllocatedBytes: offscreenAllocBytes,
      totalOffscreenAllocatedMB: offscreenAllocBytes / (1024 * 1024),
      targetsBreakdown: breakdown,
      theoreticalBandwidthPerFrameMB: isWboit ? (rtWidth * rtHeight * 56) / (1024 * 1024) : 0,
    };

    return {
      mode,
      measured,
      calculated,
    };
  }

  public async runTransparencyBenchmarkSuite(
    strokeCounts: number[] = [50, 100, 200],
    framesPerTest: number = 100
  ): Promise<any> {
    const results: any[] = [];
    const modes: ('sorted' | 'wboit')[] = ['sorted', 'wboit'];

    this.options.setAutoOrbitActive(true);
    this.options.setHasAnimatedContent(true);

    for (const count of strokeCounts) {
      this.spawnOverlappingStrokes(count);
      await new Promise((r) => setTimeout(r, 500));

      for (const mode of modes) {
        this.setTransparencyMode(mode);
        for (let w = 0; w < 20; w++) {
          await new Promise((r) => requestAnimationFrame(r));
        }

        const cpuSamples: number[] = [];
        const rafSamples: number[] = [];
        let prevTime = performance.now();

        for (let f = 0; f < framesPerTest; f++) {
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
              const now = performance.now();
              const rafDt = now - prevTime;
              prevTime = now;
              rafSamples.push(rafDt);
              cpuSamples.push(this.options.getCpuFrameTimeMs());
              resolve();
            });
          });
        }

        const computeStats = (arr: number[]) => {
          const sorted = [...arr].sort((a, b) => a - b);
          const p50 = sorted[Math.floor(sorted.length * 0.5)];
          const p95 = sorted[Math.floor(sorted.length * 0.95)];
          const min = sorted[0];
          const max = sorted[sorted.length - 1];
          const sum = sorted.reduce((a, b) => a + b, 0);
          const mean = sum / sorted.length;
          return { p50, p95, min, max, mean };
        };

        const cpuStats = computeStats(cpuSamples);
        const rafStats = computeStats(rafSamples);
        const telem = this.getTransparencyTelemetry();

        results.push({
          strokeCount: count,
          mode,
          cpuFrameTime: cpuStats,
          rafFrameTime: rafStats,
          fps: Math.round(1000 / rafStats.mean),
          measured: telem.measured,
          calculated: telem.calculated,
        });
      }
    }

    console.log('BENCHMARK_COMPLETE:', JSON.stringify(results));
    (window as any).__lastBenchmarkResults = results;
    return results;
  }

  private initTransparencyTestHud(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('transparency-test-hud')) return;

    const hud = document.createElement('div');
    hud.id = 'transparency-test-hud';
    hud.style.position = 'fixed';
    hud.style.top = '12px';
    hud.style.left = '12px';
    hud.style.zIndex = '999999';
    hud.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, monospace';
    hud.style.fontSize = '12px';
    hud.style.lineHeight = '1.35';
    hud.style.color = '#f1f5f9';
    hud.style.backgroundColor = 'rgba(15, 23, 42, 0.90)';
    hud.style.backdropFilter = 'blur(10px)';
    (hud.style as any).webkitBackdropFilter = 'blur(10px)';
    hud.style.border = '1px solid rgba(255, 255, 255, 0.18)';
    hud.style.borderRadius = '10px';
    hud.style.padding = '10px 14px';
    hud.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5)';
    hud.style.userSelect = 'none';
    hud.style.maxWidth = '360px';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.marginBottom = '8px';

    const title = document.createElement('span');
    title.textContent = 'TRANSPARENCY BENCHMARK';
    title.style.fontWeight = '700';
    title.style.letterSpacing = '0.04em';
    title.style.fontSize = '11px';
    title.style.color = '#94a3b8';

    const badge = document.createElement('span');
    badge.id = 'transparency-hud-badge';
    badge.style.padding = '2px 8px';
    badge.style.borderRadius = '6px';
    badge.style.fontWeight = '700';
    badge.style.fontSize = '11px';
    header.appendChild(title);
    header.appendChild(badge);
    hud.appendChild(header);

    const stats = document.createElement('div');
    stats.id = 'transparency-hud-stats';
    stats.style.marginBottom = '10px';
    stats.style.fontFamily = 'monospace';
    stats.style.fontSize = '11px';
    stats.style.color = '#cbd5e1';
    hud.appendChild(stats);

    const btnRow = document.createElement('div');
    btnRow.style.display = 'grid';
    btnRow.style.gridTemplateColumns = '1fr 1fr';
    btnRow.style.gap = '6px';

    const makeBtn = (text: string, onClick: () => void, highlight: boolean = false) => {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.style.padding = '6px 8px';
      btn.style.fontSize = '11px';
      btn.style.fontWeight = '600';
      btn.style.borderRadius = '6px';
      btn.style.border = highlight ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)';
      btn.style.backgroundColor = highlight ? '#0284c7' : 'rgba(255, 255, 255, 0.08)';
      btn.style.color = '#ffffff';
      btn.style.cursor = 'pointer';
      btn.style.touchAction = 'manipulation';
      btn.onclick = onClick;
      return btn;
    };

    const toggleModeBtn = makeBtn('Toggle Mode (T)', () => this.toggleTransparencyMode(), true);
    const testSceneBtn = makeBtn('Test Scene (P)', () => this.spawnTransparencyTestScene());
    const autoOrbitBtn = makeBtn('Auto-Orbit (O)', () => this.toggleAutoOrbit());
    const oldV22Btn = makeBtn('Old V22 Mode (Y)', () => {
      const cur = this.options.getTransparencyMode();
      this.setTransparencyMode(cur === 'sequential_debug' ? 'sorted' : 'sequential_debug');
    });

    btnRow.appendChild(toggleModeBtn);
    btnRow.appendChild(testSceneBtn);
    btnRow.appendChild(autoOrbitBtn);
    btnRow.appendChild(oldV22Btn);
    hud.appendChild(btnRow);

    document.body.appendChild(hud);
    this.telemetryHudEl = hud;
    this.telemetryHudTextEl = stats;
    this.telemetryBadgeEl = badge;
    this.updateTelemetryHud();
  }

  public updateTelemetryHud(): void {
    if (!this.telemetryBadgeEl || !this.telemetryHudTextEl) return;

    const mode = this.options.getTransparencyMode();
    if (mode === 'wboit') {
      this.telemetryBadgeEl.textContent = 'MODE A: WBOIT';
      this.telemetryBadgeEl.style.backgroundColor = '#0e7490';
      this.telemetryBadgeEl.style.color = '#e0f2fe';
    } else if (mode === 'sorted') {
      this.telemetryBadgeEl.textContent = 'MODE B: SORTED';
      this.telemetryBadgeEl.style.backgroundColor = '#15803d';
      this.telemetryBadgeEl.style.color = '#dcfce7';
    } else {
      this.telemetryBadgeEl.textContent = 'MODE C: OLD V22';
      this.telemetryBadgeEl.style.backgroundColor = '#b45309';
      this.telemetryBadgeEl.style.color = '#fef3c7';
    }

    const gpuTimerExt = this.options.getGpuTimerExt();
    const gpuQueryTimeMs = this.options.getGpuQueryTimeMs();
    const gpuStr = gpuTimerExt
      ? `${gpuQueryTimeMs.toFixed(2)} ms`
      : 'N/A (timer query disabled)';

    const sortDetail =
      mode === 'wboit'
        ? 'MRT Accum + Revealage Quad'
        : mode === 'sorted'
        ? 'Three.js Native Painter (b.z - a.z)'
        : 'Sequential RenderOrder (Order Locked)';

    const telem = this.getTransparencyTelemetry();
    const calls = this.options.getTotalDrawCalls();
    const tris = this.options.getTotalTriangles();
    const passes = telem.measured.renderPasses === 3 ? '3 Passes (Opaque + MRT + Quad)' : '1 Pass (Direct Forward)';
    const offscreenBW = mode === 'wboit'
      ? `${telem.measured.internalRenderTargetWidth}x${telem.measured.internalRenderTargetHeight} (~${telem.calculated.totalOffscreenAllocatedMB.toFixed(1)} MB VRAM)`
      : `Swapchain ${telem.measured.drawingBufferWidth}x${telem.measured.drawingBufferHeight} (0 MB Offscreen)`;

    this.telemetryHudTextEl.innerHTML = `
      <div><strong>FPS:</strong> ${this.options.getFps()} ${this.options.getFps() >= 58 ? '✓' : ''} | <strong>CPU Frame:</strong> ${this.options.getCpuFrameTimeMs().toFixed(1)} ms</div>
      <div><strong>GPU Query:</strong> ${gpuStr}</div>
      <div><strong>Draw Calls:</strong> ${calls} | <strong>Triangles:</strong> ${tris.toLocaleString()}</div>
      <div><strong>Passes:</strong> ${passes}</div>
      <div><strong>Bandwidth:</strong> ${offscreenBW}</div>
      <div><strong>Strokes:</strong> ${this.options.getStrokes().size} | <strong>Auto-Orbit:</strong> ${this.options.isAutoOrbitActive() ? 'ON' : 'OFF'}</div>
      <div style="margin-top: 4px; color: #94a3b8; font-size: 10px;">Sort: ${sortDetail}</div>
    `;
  }

  public dispose(): void {
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }

    if (this.telemetryHudEl && this.telemetryHudEl.parentNode) {
      this.telemetryHudEl.parentNode.removeChild(this.telemetryHudEl);
      this.telemetryHudEl = null;
    }
    this.telemetryHudTextEl = null;
    this.telemetryBadgeEl = null;

    if (typeof window !== 'undefined') {
      delete (window as any).toggleTransparencyMode;
      delete (window as any).setTransparencyMode;
      delete (window as any).spawnTransparencyTestScene;
      delete (window as any).spawnOverlappingStrokes;
      delete (window as any).toggleAutoOrbit;
      delete (window as any).getTransparencyTelemetry;
      delete (window as any).runTransparencyBenchmarkSuite;
    }
  }
}

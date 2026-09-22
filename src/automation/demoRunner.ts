import * as THREE from 'three';
import { StudioEngine } from '../core/studioEngine';
import { BrushSettings, Layer, SymmetryMode, ToolType, StrokeDescriptor } from '../types';
import {
  DemoScene,
  DemoStep,
  DeviceTarget,
  PointerVisualState,
  StrokeMotionDef,
} from './types';
import {
  easeInOutCubic,
  generateHumanStrokePath,
} from './humanMotion';
import { resolveTargetPosition, getCurrentDeviceTarget } from './uiMap';
import {
  CURATED_BRUSHES,
  applyCuratedBrush,
} from '../presets/curatedBrushes';

export interface DemoRunnerOptions {
  engine: StudioEngine;
  setTool: (tool: ToolType) => void;
  setBrushSettings: (fn: (prev: BrushSettings) => BrushSettings) => void;
  getBrushSettings: () => BrushSettings;
  getActiveLayer: () => Layer;
  getSymmetry: () => SymmetryMode;
  onUpdatePointer: (state: PointerVisualState) => void;
  onStepChange?: (stepIndex: number, totalSteps: number, description?: string) => void;
  onSceneComplete?: (scene: DemoScene) => void;
  deviceTarget?: DeviceTarget;
}

export class DemoRunner {
  private engine: StudioEngine;
  private setTool: (tool: ToolType) => void;
  private setBrushSettings: (fn: (prev: BrushSettings) => BrushSettings) => void;
  private getBrushSettings: () => BrushSettings;
  private getActiveLayer: () => Layer;
  private getSymmetry: () => SymmetryMode;
  private onUpdatePointer: (state: PointerVisualState) => void;
  private onStepChange?: (stepIndex: number, totalSteps: number, description?: string) => void;
  private onSceneComplete?: (scene: DemoScene) => void;
  private deviceTarget: DeviceTarget;

  private isRunning = false;
  private isPausedState = false;
  private cancelRequested = false;
  private skipRequested = false;
  private activeScene: DemoScene | null = null;
  private insertedObjects: THREE.Object3D[] = [];

  private pointerState: PointerVisualState = {
    visible: false,
    x: 600,
    y: 400,
    isDown: false,
    isDragging: false,
    pointerType: 'mouse',
    ripple: false,
    rippleKey: 0,
    secondaryTouch: null,
    callout: null,
  };

  private currentBrushSettings: BrushSettings;

  constructor(options: DemoRunnerOptions) {
    this.engine = options.engine;
    this.setTool = options.setTool;
    this.setBrushSettings = options.setBrushSettings;
    this.getBrushSettings = options.getBrushSettings;
    this.getActiveLayer = options.getActiveLayer;
    this.getSymmetry = options.getSymmetry;
    this.onUpdatePointer = options.onUpdatePointer;
    this.onStepChange = options.onStepChange;
    this.onSceneComplete = options.onSceneComplete;
    this.deviceTarget = options.deviceTarget || getCurrentDeviceTarget();
    this.pointerState.pointerType = this.deviceTarget === 'desktop' ? 'mouse' : 'touch';
    this.currentBrushSettings = { ...options.getBrushSettings() };
  }

  public setDeviceTarget(target: DeviceTarget) {
    this.deviceTarget = target;
    this.pointerState.pointerType = target === 'desktop' ? 'mouse' : 'touch';
    this.updatePointer();
  }

  public isBusy(): boolean {
    return this.isRunning;
  }

  public isPaused(): boolean {
    return this.isPausedState;
  }

  public pause() {
    this.isPausedState = true;
  }

  public resume() {
    this.isPausedState = false;
  }

  public skip() {
    this.skipRequested = true;
  }

  public stop() {
    this.cancelRequested = true;
    this.isRunning = false;
    this.isPausedState = false;
    this.hidePointer();
    this.cleanupDemoObjects();
  }

  public async playScene(scene: DemoScene): Promise<void> {
    if (this.isRunning) {
      this.stop();
      await this.sleep(100);
    }

    this.isRunning = true;
    this.isPausedState = false;
    this.cancelRequested = false;
    this.skipRequested = false;
    this.activeScene = scene;

    this.pointerState.pointerType = this.deviceTarget === 'desktop' ? 'mouse' : 'touch';
    this.pointerState.visible = true;
    this.pointerState.callout = null;
    this.updatePointer();

    const totalSteps = scene.steps.length;

    for (let i = 0; i < totalSteps; i++) {
      if (this.cancelRequested) break;

      this.skipRequested = false;
      const step = scene.steps[i];
      this.onStepChange?.(i + 1, totalSteps, `Step ${i + 1}: ${step.type}`);

      await this.waitWhilePaused();
      if (this.cancelRequested) break;

      await this.executeStep(step);
      if (this.cancelRequested) break;
    }

    this.hidePointer();
    this.isRunning = false;
    if (!this.cancelRequested) {
      this.onSceneComplete?.(scene);
    }
  }

  private async executeStep(step: DemoStep): Promise<void> {
    switch (step.type) {
      case 'CLEAR_SCENE': {
        this.cleanupDemoObjects();
        this.engine.clearAllStrokes();
        await this.sleep(200);
        break;
      }

      case 'CALLOUT': {
        this.pointerState.callout = { title: step.title, subtitle: step.subtitle };
        this.updatePointer();
        await this.sleep(step.durationMs || 1500);
        this.pointerState.callout = null;
        this.updatePointer();
        break;
      }

      case 'WAIT': {
        await this.sleep(step.durationMs);
        break;
      }

      case 'MOVE_POINTER': {
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const targetX = Math.round(step.x * winW);
        const targetY = Math.round(step.y * winH);
        await this.animatePointerMove(targetX, targetY, step.durationMs || 350);
        break;
      }

      case 'TAP': {
        if (step.pauseBeforeMs) await this.sleep(step.pauseBeforeMs);

        const pos = resolveTargetPosition(step.target, this.deviceTarget);
        await this.animatePointerMove(pos.x, pos.y, 320);

        // Pre-click hover pause (human deliberate timing)
        await this.sleep(120);

        // Click Ripple & Down
        this.pointerState.isDown = true;
        this.pointerState.ripple = true;
        this.pointerState.rippleKey = Date.now();
        this.updatePointer();

        // Apply semantic action
        this.applySemanticAction(step.target);

        await this.sleep(180);
        this.pointerState.isDown = false;
        this.pointerState.ripple = false;
        this.updatePointer();

        // Post-click move-away (cursor does not block UI)
        if (this.deviceTarget === 'desktop') {
          const awayY = Math.max(80, pos.y - 45);
          await this.animatePointerMove(pos.x, awayY, 200);
        }

        if (step.pauseAfterMs) await this.sleep(step.pauseAfterMs);
        break;
      }

      case 'DRAW_STROKE': {
        await this.executeDrawStroke(step.stroke);
        break;
      }

      case 'ORBIT_CAMERA': {
        await this.executeOrbitCamera(step.deltaTheta, step.deltaPhi, step.durationMs);
        break;
      }

      case 'SET_TOOL': {
        this.setTool(step.tool as ToolType);
        await this.sleep(150);
        break;
      }

      case 'SET_BRUSH': {
        this.currentBrushSettings = { ...this.currentBrushSettings, ...step.settings };
        this.setBrushSettings((prev) => ({ ...prev, ...step.settings }));
        await this.sleep(150);
        break;
      }

      case 'SELECT_STROKE': {
        const strokeIds = this.engine.getStrokeIds();
        if (strokeIds.length > 0) {
          const targetId = step.strokeId || strokeIds[strokeIds.length - 1];
          this.engine.setSelectedStrokes([targetId]);
        }
        await this.sleep(150);
        break;
      }

      case 'TRANSLATE_SELECTION': {
        const mat = new THREE.Matrix4().makeTranslation(step.deltaX, step.deltaY, step.deltaZ);
        this.engine.applyTransformMatrix(mat, 'selected_strokes');
        if (step.durationMs) await this.sleep(step.durationMs);
        break;
      }

      case 'INSERT_OBJECT': {
        this.insertObject(step.objectType);
        await this.sleep(300);
        break;
      }

      case 'REPLAY_3D_MODEL': {
        await this.executeReplay3DModel(step);
        break;
      }
    }
  }

  private applySemanticAction(target: string) {
    const t = target.toLowerCase();
    if (t === 'draw') {
      this.setTool('brush');
    } else if (t === 'erase') {
      this.setTool('eraser');
    } else if (t === 'select') {
      this.setTool('select');
      const strokeIds = this.engine.getStrokeIds();
      if (strokeIds.length > 0) {
        const lastId = strokeIds[strokeIds.length - 1];
        this.engine.setSelectedStrokes([lastId]);
      }
    } else if (t === 'surface') {
      const b = CURATED_BRUSHES.find((item) => item.id === 'conformal_bead');
      if (b) {
        this.currentBrushSettings = applyCuratedBrush(b, this.currentBrushSettings);
        this.setBrushSettings((prev) => applyCuratedBrush(b, prev));
      }
    } else if (t === 'open-air') {
      const b = CURATED_BRUSHES.find((item) => item.id === 'spatial_pipe');
      if (b) {
        this.currentBrushSettings = applyCuratedBrush(b, this.currentBrushSettings);
        this.setBrushSettings((prev) => applyCuratedBrush(b, prev));
      }
    } else if (t === 'flat-brush') {
      const b = CURATED_BRUSHES.find((item) => item.id === 'streamline_ink');
      if (b) {
        this.currentBrushSettings = applyCuratedBrush(b, this.currentBrushSettings);
        this.setBrushSettings((prev) => applyCuratedBrush(b, prev));
      }
    } else if (t === 'marker-brush') {
      const b = CURATED_BRUSHES.find((item) => item.id === 'chisel_marker');
      if (b) {
        this.currentBrushSettings = applyCuratedBrush(b, this.currentBrushSettings);
        this.setBrushSettings((prev) => applyCuratedBrush(b, prev));
      }
    } else if (t === 'fine-pen') {
      const b = CURATED_BRUSHES.find((item) => item.id === 'drafting_wire');
      if (b) {
        this.currentBrushSettings = applyCuratedBrush(b, this.currentBrushSettings);
        this.setBrushSettings((prev) => applyCuratedBrush(b, prev));
      }
    } else if (t === 'neon-glow') {
      const b = CURATED_BRUSHES.find((item) => item.id === 'neon_cable');
      if (b) {
        this.currentBrushSettings = applyCuratedBrush(b, this.currentBrushSettings);
        this.setBrushSettings((prev) => applyCuratedBrush(b, prev));
      }
    }
  }

  private async executeDrawStroke(stroke: StrokeMotionDef): Promise<void> {
    if (stroke.pauseBeforeMs) await this.sleep(stroke.pauseBeforeMs);

    const winW = window.innerWidth;
    const winH = window.innerHeight;

    // 1. Move to start position
    const startPoint = stroke.points[0];
    const startPixelX = Math.round(startPoint.x * winW);
    const startPixelY = Math.round(startPoint.y * winH);
    await this.animatePointerMove(startPixelX, startPixelY, 280);

    // 2. Touch down
    this.pointerState.isDown = true;
    this.pointerState.isDragging = true;
    this.updatePointer();

    const brush = this.currentBrushSettings || this.getBrushSettings();
    const layer = this.getActiveLayer();
    const symmetry = this.getSymmetry();

    // Three.js normalized device coordinates (-1..1)
    const normX = (startPixelX / winW) * 2 - 1;
    const normY = -(startPixelY / winH) * 2 + 1;
    const initialPressure = typeof stroke.pressure === 'number' ? stroke.pressure : 0.4;

    this.engine.startStroke(normX, normY, brush, 'brush', layer, initialPressure, symmetry);

    // 3. Generate human motion path samples
    const samples = generateHumanStrokePath(
      stroke.points,
      stroke.durationMs,
      stroke.pressure,
      stroke.microVariation ?? 0.003
    );

    const startTime = performance.now();
    let currentSampleIdx = 0;

    await new Promise<void>((resolve) => {
      const animateFrame = (now: number) => {
        if (this.cancelRequested || this.skipRequested) {
          resolve();
          return;
        }

        const elapsed = now - startTime;
        while (
          currentSampleIdx < samples.length &&
          samples[currentSampleIdx].timeMs <= elapsed
        ) {
          const sample = samples[currentSampleIdx];
          const px = Math.round(sample.x * winW);
          const py = Math.round(sample.y * winH);
          const nX = (px / winW) * 2 - 1;
          const nY = -(py / winH) * 2 + 1;

          this.pointerState.x = px;
          this.pointerState.y = py;
          this.engine.addStrokePoint(nX, nY, brush, 'brush', sample.pressure, symmetry);
          currentSampleIdx++;
        }

        this.updatePointer();

        if (elapsed < stroke.durationMs && currentSampleIdx < samples.length) {
          requestAnimationFrame(animateFrame);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animateFrame);
    });

    // 4. Release stroke
    this.engine.endStroke(brush, 'brush', layer.id, symmetry);
    this.pointerState.isDown = false;
    this.pointerState.isDragging = false;
    this.updatePointer();

    // Move pointer slightly away from the artwork after stroke completes
    if (this.deviceTarget === 'desktop') {
      const restX = Math.min(winW - 50, this.pointerState.x + 35);
      const restY = Math.min(winH - 50, this.pointerState.y + 35);
      await this.animatePointerMove(restX, restY, 200);
    }

    if (stroke.pauseAfterMs) await this.sleep(stroke.pauseAfterMs);
  }

  private async executeOrbitCamera(
    deltaTheta: number,
    deltaPhi: number,
    durationMs: number
  ): Promise<void> {
    const isTouch = this.deviceTarget !== 'desktop';
    const centerX = window.innerWidth * 0.5;
    const centerY = window.innerHeight * 0.5;

    // Contact indicators for touch gesture (2 subtle fingers)
    if (isTouch) {
      this.pointerState.visible = true;
      this.pointerState.x = centerX - 40;
      this.pointerState.y = centerY;
      this.pointerState.secondaryTouch = { x: centerX + 40, y: centerY };
      this.updatePointer();
    }

    const startTime = performance.now();
    let prevTheta = 0;
    let prevPhi = 0;

    await new Promise<void>((resolve) => {
      const animateFrame = (now: number) => {
        if (this.cancelRequested || this.skipRequested) {
          resolve();
          return;
        }

        const elapsed = Math.min(durationMs, now - startTime);
        const t = easeInOutCubic(elapsed / durationMs);

        const currentTheta = deltaTheta * t;
        const currentPhi = deltaPhi * t;

        const stepTheta = currentTheta - prevTheta;
        const stepPhi = currentPhi - prevPhi;

        this.engine.orbitCamera(stepTheta, stepPhi);

        prevTheta = currentTheta;
        prevPhi = currentPhi;

        if (isTouch) {
          // Slight rotating contact points
          const angle = currentTheta * 0.4;
          const r = 40;
          this.pointerState.x = centerX - Math.cos(angle) * r;
          this.pointerState.y = centerY - Math.sin(angle) * r;
          this.pointerState.secondaryTouch = {
            x: centerX + Math.cos(angle) * r,
            y: centerY + Math.sin(angle) * r,
          };
          this.updatePointer();
        }

        if (elapsed < durationMs) {
          requestAnimationFrame(animateFrame);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animateFrame);
    });

    if (isTouch) {
      await this.sleep(150);
      this.pointerState.secondaryTouch = null;
      this.updatePointer();
    }
  }

  private insertObject(type: 'sphere' | 'cube' | 'mannequin' | 'plane') {
    if (type === 'sphere') {
      const geom = new THREE.SphereGeometry(0.35, 32, 32);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xd4d4d8,
        roughness: 0.5,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = 'DemoSphere';
      this.engine.addPrimitiveToScene(mesh, 'DemoSphere');
      this.insertedObjects.push(mesh);
    } else if (type === 'mannequin') {
      const group = new THREE.Group();
      group.name = 'DemoMannequin';
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.6,
      });

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 24), bodyMat);
      head.position.set(0, 0.42, 0);
      group.add(head);

      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.35, 16), bodyMat);
      torso.position.set(0, 0.18, 0);
      group.add(torso);

      const hips = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), bodyMat);
      hips.position.set(0, -0.05, 0);
      group.add(hips);

      this.engine.addPrimitiveToScene(group, 'DemoMannequin');
      this.insertedObjects.push(group);
    }
  }

  private cleanupDemoObjects() {
    for (const obj of this.insertedObjects) {
      try {
        if (obj.parent) obj.parent.remove(obj);
      } catch (_) {}
    }
    this.insertedObjects = [];
  }

  private async animatePointerMove(
    toX: number,
    toY: number,
    durationMs = 300
  ): Promise<void> {
    const fromX = this.pointerState.x;
    const fromY = this.pointerState.y;
    const startTime = performance.now();

    await new Promise<void>((resolve) => {
      const animate = (now: number) => {
        if (this.cancelRequested || this.skipRequested) {
          this.pointerState.x = toX;
          this.pointerState.y = toY;
          this.updatePointer();
          resolve();
          return;
        }

        const elapsed = Math.min(durationMs, now - startTime);
        const t = easeInOutCubic(elapsed / durationMs);

        this.pointerState.x = Math.round(fromX + (toX - fromX) * t);
        this.pointerState.y = Math.round(fromY + (toY - fromY) * t);
        this.updatePointer();

        if (elapsed < durationMs) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  private hidePointer() {
    this.pointerState.visible = false;
    this.pointerState.callout = null;
    this.pointerState.secondaryTouch = null;
    this.pointerState.isDown = false;
    this.pointerState.isDragging = false;
    this.updatePointer();
  }

  private updatePointer() {
    this.onUpdatePointer({ ...this.pointerState });
  }

  private async executeReplay3DModel(step: {
    datasetUrl: string;
    title: string;
    speedMs?: number;
    orbitWhileDrawing?: boolean;
  }): Promise<void> {
    this.pointerState.callout = { title: step.title, subtitle: 'Sculpting 3D drawing in space...' };
    this.pointerState.visible = true;
    this.updatePointer();

    this.setTool('brush');
    this.engine.setDrawingPlaneVisible(false);
    await this.sleep(400);

    let strokesData: any[] = [];
    try {
      const resp = await fetch(step.datasetUrl);
      strokesData = await resp.json();
    } catch (err) {
      console.error('Failed to load 3D model dataset:', err);
      return;
    }

    if (!Array.isArray(strokesData) || strokesData.length === 0) return;

    const layer = this.getActiveLayer();
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const speed = step.speedMs ?? 10;

    for (let sIdx = 0; sIdx < strokesData.length; sIdx++) {
      if (this.cancelRequested || this.skipRequested) break;

      const strokeDef = strokesData[sIdx];
      if (!strokeDef.points || strokeDef.points.length < 2) continue;

      if (sIdx % 30 === 0 || sIdx === strokesData.length - 1) {
        this.pointerState.callout = {
          title: step.title,
          subtitle: `Drawing stroke ${sIdx + 1} of ${strokesData.length}...`,
        };
        const camera = this.engine.getCamera();
        const p0 = strokeDef.points[0];
        const p0Vec = new THREE.Vector3(p0.x, p0.y, p0.z).project(camera);
        this.pointerState.x = Math.round(((p0Vec.x + 1) / 2) * winW);
        this.pointerState.y = Math.round(((-p0Vec.y + 1) / 2) * winH);
        this.pointerState.isDown = true;
        this.pointerState.isDragging = true;
        this.updatePointer();
      }

      // Configure brush for this stroke descriptor
      const strokeBrush: BrushSettings = {
        ...this.currentBrushSettings,
        color: strokeDef.color,
        size: strokeDef.size || 0.008,
        brushShape: strokeDef.brushShape || 'round',
        materialType: strokeDef.materialType || 'metallic',
        roughness: strokeDef.roughness ?? 0.5,
        metalness: strokeDef.metalness ?? 0.6,
        drawingMode: 'spatial_3d',
      };

      // Build 3D stroke descriptor and add to engine
      const desc: StrokeDescriptor = {
        id: strokeDef.id || 'stroke_' + Math.random().toString(36).substring(2, 9),
        layerId: layer.id,
        tool: 'brush',
        points: strokeDef.points.map((pt: any) => ({
          position: new THREE.Vector3(pt.x, pt.y, pt.z),
          normal: new THREE.Vector3(pt.nx || 0, pt.ny || 1, pt.nz || 0),
          surfaceOffset: 0.002,
          pressure: pt.pressure ?? 0.85,
          isSurfaceHit: false,
          time: performance.now(),
        })),
        settings: strokeBrush,
        createdAt: Date.now(),
      };
      this.engine.recreateStrokeFromDescriptor(desc);

      if (step.orbitWhileDrawing && sIdx % 10 === 0) {
        this.engine.orbitCamera(0.012, 0);
      }

      // Yield every 8 strokes to allow Three.js canvas to render smoothly at high throughput
      if (sIdx % 8 === 0) {
        await this.sleep(speed > 0 ? speed : 1);
      }
    }

    this.pointerState.callout = {
      title: 'Drawing Complete',
      subtitle: 'True 3D drawing created in space with zero 3D model loaded.',
    };
    this.updatePointer();
    await this.sleep(1500);

    // Orbit showcase
    await this.executeOrbitCamera(Math.PI * 1.5, 0.15, 3800);
    this.pointerState.callout = null;
    this.updatePointer();
  }

  private async waitWhilePaused(): Promise<void> {
    while (this.isPausedState && !this.cancelRequested) {
      await this.sleep(100);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

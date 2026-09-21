import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { StrokeDescriptor } from '../types';
import { MediaRecorderService } from './mediaRecorderService';
import { ensureGeometryLinearVertexColors } from './colorMath';

export interface MediaCaptureControllerOptions {
  getCanvas: () => HTMLCanvasElement;
  renderScene: (target?: THREE.WebGLRenderTarget | null) => void;
  getCursorDecalVisible: () => boolean;
  setCursorDecalVisible: (visible: boolean) => void;
  getCutoutOutlineVisible: () => boolean;
  setCutoutOutlineVisible: (visible: boolean) => void;
  getStrokes: () => Map<string, { descriptor: StrokeDescriptor; meshes: THREE.Mesh[] }>;
  getCameraSpherical: () => { theta: number; phi: number; radius: number };
  setCameraView: (theta: number, phi: number, radius: number, instant: boolean) => void;
  getModelRoot?: () => THREE.Object3D;
  getStrokeRoot?: () => THREE.Object3D;
}

export class MediaCaptureController {
  private options: MediaCaptureControllerOptions;

  constructor(options: MediaCaptureControllerOptions) {
    this.options = options;
  }

  /**
   * Capture high-res screenshot
   */
  public captureSnapshot(): string {
    const prevCursor = this.options.getCursorDecalVisible();
    const prevCutout = this.options.getCutoutOutlineVisible();

    this.options.setCursorDecalVisible(false);
    this.options.setCutoutOutlineVisible(false);
    this.options.renderScene(null);

    const canvas = this.options.getCanvas();
    const dataUrl = canvas.toDataURL('image/png');

    this.options.setCursorDecalVisible(prevCursor);
    this.options.setCutoutOutlineVisible(prevCutout);
    return dataUrl;
  }

  /**
   * Records a 360-degree turntable spin video around the active model/drawing
   */
  public async recordTurntableVideo(options: {
    durationSec?: number;
    fps?: number;
    onProgress?: (progress: number) => void;
    signal?: AbortSignal;
  } = {}): Promise<{ blob: Blob; mimeType: string; extension: string }> {
    const durationSec = options.durationSec ?? 6;
    const fps = options.fps ?? 60;
    const recorder = new MediaRecorderService();

    const canvas = this.options.getCanvas();
    const started = recorder.startRecording(canvas, fps);
    if (!started) {
      throw new Error('Canvas video recording is not supported in this browser environment.');
    }

    const prevCursor = this.options.getCursorDecalVisible();
    const prevCutout = this.options.getCutoutOutlineVisible();
    this.options.setCursorDecalVisible(false);
    this.options.setCutoutOutlineVisible(false);

    const origSpherical = this.options.getCameraSpherical();
    const origTheta = origSpherical.theta;
    const origPhi = origSpherical.phi;
    const origRadius = origSpherical.radius;

    const totalFrames = Math.max(30, Math.round(durationSec * fps));
    const frameIntervalMs = 1000 / fps;

    try {
      for (let f = 0; f <= totalFrames; f++) {
        if (options.signal?.aborted) {
          recorder.cancelRecording();
          throw new Error('Turntable recording aborted');
        }

        const t = f / totalFrames;
        const currentTheta = origTheta + t * Math.PI * 2;
        this.options.setCameraView(currentTheta, origPhi, origRadius, true);
        this.options.renderScene(null);

        if (options.onProgress) {
          options.onProgress(Math.min(100, Math.round(t * 100)));
        }

        await new Promise((r) => setTimeout(r, frameIntervalMs));
      }

      const result = await recorder.stopRecording();
      return result;
    } finally {
      // Restore camera & decorations
      this.options.setCameraView(origTheta, origPhi, origRadius, true);
      this.options.setCursorDecalVisible(prevCursor);
      this.options.setCutoutOutlineVisible(prevCutout);
      this.options.renderScene(null);
    }
  }

  /**
   * Records a stroke-by-stroke timelapse reconstruction video
   */
  public async recordTimelapseVideo(options: {
    durationSec?: number;
    fps?: number;
    onProgress?: (progress: number) => void;
    signal?: AbortSignal;
  } = {}): Promise<{ blob: Blob; mimeType: string; extension: string }> {
    const durationSec = options.durationSec ?? 8;
    const fps = options.fps ?? 60;
    const recorder = new MediaRecorderService();

    const canvas = this.options.getCanvas();
    const started = recorder.startRecording(canvas, fps);
    if (!started) {
      throw new Error('Canvas video recording is not supported in this browser environment.');
    }

    const prevCursor = this.options.getCursorDecalVisible();
    const prevCutout = this.options.getCutoutOutlineVisible();
    this.options.setCursorDecalVisible(false);
    this.options.setCutoutOutlineVisible(false);

    const strokesMap = this.options.getStrokes();
    const strokeEntries = Array.from(strokesMap.values());
    const totalStrokes = strokeEntries.length;

    try {
      if (totalStrokes === 0) {
        // Just render a few frames if empty
        for (let i = 0; i < 30; i++) {
          this.options.renderScene(null);
          await new Promise((r) => setTimeout(r, 1000 / fps));
        }
        return await recorder.stopRecording();
      }

      // Hide all stroke meshes initially
      for (const entry of strokeEntries) {
        for (const m of entry.meshes) {
          m.visible = false;
        }
      }
      this.options.renderScene(null);

      // Brief pause at the beginning (blank slate)
      for (let i = 0; i < 15; i++) {
        this.options.renderScene(null);
        await new Promise((r) => setTimeout(r, 1000 / fps));
      }

      const totalSteps = totalStrokes;
      const stepIntervalMs = Math.max(16, (durationSec * 1000 * 0.8) / totalSteps);

      for (let s = 0; s < totalSteps; s++) {
        if (options.signal?.aborted) {
          recorder.cancelRecording();
          throw new Error('Timelapse recording aborted');
        }

        const entry = strokeEntries[s];
        for (const m of entry.meshes) {
          m.visible = true;
        }
        this.options.renderScene(null);

        if (options.onProgress) {
          options.onProgress(Math.min(95, Math.round(((s + 1) / totalSteps) * 95)));
        }

        await new Promise((r) => setTimeout(r, stepIntervalMs));
      }

      // Hold final complete frame for 1 second
      const holdFrames = Math.round(fps * 1.0);
      for (let i = 0; i < holdFrames; i++) {
        this.options.renderScene(null);
        await new Promise((r) => setTimeout(r, 1000 / fps));
      }

      if (options.onProgress) options.onProgress(100);

      const result = await recorder.stopRecording();
      return result;
    } finally {
      // Ensure all strokes are restored to visible
      for (const entry of strokeEntries) {
        for (const m of entry.meshes) {
          m.visible = true;
        }
      }
      this.options.setCursorDecalVisible(prevCursor);
      this.options.setCutoutOutlineVisible(prevCutout);
      this.options.renderScene(null);
    }
  }

  /**
   * Export Combined Scene to GLB
   */
  public async exportGLB(): Promise<Blob> {
    const exportScene = new THREE.Scene();

    const modelRoot = this.options.getModelRoot ? this.options.getModelRoot() : null;
    if (modelRoot) {
      const modelClone = modelRoot.clone(true);
      this.prepareExportMaterials(modelClone);
      exportScene.add(modelClone);
    }

    const strokeRoot = this.options.getStrokeRoot ? this.options.getStrokeRoot() : null;
    if (strokeRoot) {
      const strokeClone = strokeRoot.clone(true);
      this.prepareExportMaterials(strokeClone);
      exportScene.add(strokeClone);
    }

    const exporter = new GLTFExporter();
    return new Promise((resolve, reject) => {
      exporter.parse(
        exportScene,
        (gltf) => {
          const blob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' });
          resolve(blob);
        },
        reject,
        { binary: true }
      );
    });
  }

  /**
   * Converts runtime-only shader materials into portable, static color data.
   */
  private prepareExportMaterials(root: THREE.Object3D): void {
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry || !mesh.material) return;
      mesh.geometry = mesh.geometry.clone();

      const bakeShaderMaterial = (source: THREE.Material): THREE.Material => {
        const src = source as any;
        const shader = src.isShaderMaterial === true;
        let color = new THREE.Color(0xffffff);
        if (src.color?.isColor) {
          color.copy(src.color);
        }
        if (shader && src.uniforms) {
          const candidate = src.uniforms.uColor?.value
            || src.uniforms.u_color?.value
            || src.uniforms.u_tint?.value;
          if (candidate?.isColor) color.copy(candidate);
          else if (candidate?.isVector3) color.setRGB(
            THREE.MathUtils.clamp(candidate.x, 0, 1),
            THREE.MathUtils.clamp(candidate.y, 0, 1),
            THREE.MathUtils.clamp(candidate.z, 0, 1),
          );
          const position = mesh.geometry.getAttribute('position');
          if (position && !mesh.geometry.getAttribute('color')) {
            const encodedColor = color.clone().convertLinearToSRGB();
            const colors = new Float32Array(position.count * 3);
            for (let i = 0; i < position.count; i++) {
              colors[i * 3] = encodedColor.r;
              colors[i * 3 + 1] = encodedColor.g;
              colors[i * 3 + 2] = encodedColor.b;
            }
            mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            ensureGeometryLinearVertexColors(mesh.geometry);
          }
          return new THREE.MeshBasicMaterial({
            color: 0xffffff,
            vertexColors: !!mesh.geometry.getAttribute('color'),
            transparent: src.transparent === true || Number(src.opacity ?? 1) < 1,
            opacity: Number(src.opacity ?? 1),
            side: src.side ?? THREE.DoubleSide,
            depthTest: src.depthTest !== false,
            depthWrite: src.depthWrite !== false,
          });
        }

        const cloned = source.clone();
        if ('map' in src && src.map) (cloned as any).map = src.map;
        return cloned;
      };

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((material) => bakeShaderMaterial(material));
      } else {
        mesh.material = bakeShaderMaterial(mesh.material);
      }
    });
  }

  /**
   * Export Combined Scene to OBJ
   */
  public exportOBJ(): string {
    const exportScene = new THREE.Scene();
    const modelRoot = this.options.getModelRoot ? this.options.getModelRoot() : null;
    if (modelRoot) {
      exportScene.add(modelRoot.clone(true));
    }
    const strokeRoot = this.options.getStrokeRoot ? this.options.getStrokeRoot() : null;
    if (strokeRoot) {
      exportScene.add(strokeRoot.clone(true));
    }

    const exporter = new OBJExporter();
    return exporter.parse(exportScene);
  }
}

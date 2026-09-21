import * as THREE from 'three';

export interface XREngineOptions {
  renderer: THREE.WebGLRenderer;
  helperRoot: THREE.Group;
  modelRoot: THREE.Group;
  onDirty: () => void;
  onTransparencyDirty?: () => void;
}

export class XREngine {
  private renderer: THREE.WebGLRenderer;
  private helperRoot: THREE.Group;
  private modelRoot: THREE.Group;
  private onDirty: () => void;
  private onTransparencyDirty?: () => void;

  private xrSession: any = null;
  private isSimulatedAR: boolean = false;
  private arFloorGrid: THREE.GridHelper | null = null;

  constructor(options: XREngineOptions) {
    this.renderer = options.renderer;
    this.helperRoot = options.helperRoot;
    this.modelRoot = options.modelRoot;
    this.onDirty = options.onDirty;
    this.onTransparencyDirty = options.onTransparencyDirty;
  }

  public getFloorGrid(): THREE.GridHelper | null {
    return this.arFloorGrid;
  }

  public getIsSimulatedAR(): boolean {
    return this.isSimulatedAR;
  }

  public getXRSession(): any {
    return this.xrSession;
  }

  /**
   * Initializes WebXR immersive AR session with real-world hit-testing
   */
  public async startWebXRSession(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('xr' in navigator) || !(navigator as any).xr) {
      return false;
    }

    try {
      const isSupported = await (navigator as any).xr.isSessionSupported('immersive-ar');
      if (!isSupported) return false;

      const session = await (navigator as any).xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay', 'light-estimation'],
      });

      this.xrSession = session;
      this.renderer.xr.enabled = true;
      await this.renderer.xr.setSession(session);

      session.addEventListener('end', () => {
        this.stopWebXRSession();
      });

      return true;
    } catch (e) {
      console.warn('WebXR start error:', e);
      return false;
    }
  }

  public stopWebXRSession(): void {
    if (this.xrSession) {
      try {
        this.xrSession.end();
      } catch (_) {}
      this.xrSession = null;
    }
    this.renderer.xr.enabled = false;
  }

  /**
   * Activates Realistic Simulated AR Floor Mode on Desktop / non-XR devices
   */
  public enableSimulatedARMode(enabled: boolean): void {
    this.isSimulatedAR = enabled;
    if (enabled) {
      if (!this.arFloorGrid) {
        this.arFloorGrid = new THREE.GridHelper(12, 24, 0x6366f1, 0x312e81);
        this.arFloorGrid.position.y = -1.2;
        this.helperRoot.add(this.arFloorGrid);
      }
      this.arFloorGrid.visible = true;
    } else if (this.arFloorGrid) {
      this.arFloorGrid.visible = false;
    }
    this.onDirty();
  }

  /**
   * Adjusts Y-Axis Levitation (Floor Elevation Offset)
   */
  public setARSceneElevation(elevation: number): void {
    this.modelRoot.position.y = elevation;
    this.modelRoot.updateMatrixWorld(true);
    this.onTransparencyDirty?.();
    this.onDirty();
  }

  /**
   * Releases resources, ends any active XR session, and cleans up grid helper.
   */
  public dispose(): void {
    this.stopWebXRSession();
    if (this.arFloorGrid) {
      if (this.arFloorGrid.parent) {
        this.arFloorGrid.parent.remove(this.arFloorGrid);
      }
      this.arFloorGrid.geometry?.dispose();
      if (Array.isArray(this.arFloorGrid.material)) {
        this.arFloorGrid.material.forEach((m) => m.dispose());
      } else {
        this.arFloorGrid.material?.dispose();
      }
      this.arFloorGrid = null;
    }
  }
}

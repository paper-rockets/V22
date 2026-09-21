import * as THREE from 'three';
import {
  ActiveGuideReference,
  BentGuideConfig,
  CollisionGuideMeshConfig,
  LoftSurfaceConfig,
  ScaffoldProxyType,
  StrokeDescriptor,
} from '../types';
import { LoftGuideEngine } from './loftEngine';
import { ScaffoldingEngine } from './scaffoldingEngine';

export interface GuideControllerOptions {
  loftEngine: LoftGuideEngine;
  scaffoldingEngine: ScaffoldingEngine;
  getCamera: () => THREE.Camera;
  getCameraTarget: () => THREE.Vector3;
  getStrokes: () => Map<string, { descriptor: StrokeDescriptor; meshes: THREE.Mesh[] }>;
  getActiveLayerId: () => string;
  addPrimitiveToScene: (mesh: THREE.Mesh, name: string) => void;
  markDirty: () => void;
}

export class GuideController {
  private options: GuideControllerOptions;

  public customMirrorOrigin: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public customMirrorNormal: THREE.Vector3 = new THREE.Vector3(1, 0, 0);
  public customMirrorEnabled: boolean = false;

  public activeGuide: ActiveGuideReference | null = null;
  private onActiveGuideChangeCallbacks: Set<(guide: ActiveGuideReference | null) => void> = new Set();

  constructor(options: GuideControllerOptions) {
    this.options = options;
  }

  // ==========================================
  // CUSTOM MIRROR PLANE
  // ==========================================

  public setCustomMirrorPlane(
    origin: { x: number; y: number; z: number },
    normal: { x: number; y: number; z: number },
    enabled: boolean
  ): void {
    this.customMirrorOrigin.set(origin.x, origin.y, origin.z);
    this.customMirrorNormal.set(normal.x, normal.y, normal.z).normalize();
    this.customMirrorEnabled = enabled;

    this.options.loftEngine.createOrUpdateMirrorPlaneMesh(
      this.customMirrorOrigin,
      this.customMirrorNormal,
      enabled,
      0.4
    );
  }

  public toggleCustomMirrorPlane(enabled: boolean): void {
    this.customMirrorEnabled = enabled;
    this.options.loftEngine.createOrUpdateMirrorPlaneMesh(
      this.customMirrorOrigin,
      this.customMirrorNormal,
      enabled,
      0.4
    );
  }

  public getCameraOrientationForMirror(): {
    target: { x: number; y: number; z: number };
    normal: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
  } {
    const camera = this.options.getCamera();
    const cameraTarget = this.options.getCameraTarget();
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward).negate(); // View normal facing camera
    return {
      target: { x: cameraTarget.x, y: cameraTarget.y, z: cameraTarget.z },
      normal: { x: forward.x, y: forward.y, z: forward.z },
      rotation: { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z },
    };
  }

  // ==========================================
  // BENT 3D GUIDES
  // ==========================================

  public createPresetBentGuide(
    preset: 'wave' | 'arch' | 'spiral' | 'saddle',
    width: number = 0.35,
    opacity: number = 0.5
  ): BentGuideConfig {
    const guide = this.options.loftEngine.createPresetGuide(preset, width, opacity);
    if (guide) {
      this.setActiveGuide({ type: 'bent', id: guide.id, name: guide.name });
    }
    return guide;
  }

  public createBentGuideFromSelectedStroke(
    width: number = 0.35,
    opacity: number = 0.5
  ): BentGuideConfig | null {
    const activeLayerId = this.options.getActiveLayerId();
    let latestStroke: StrokeDescriptor | null = null;
    for (const entry of this.options.getStrokes().values()) {
      if (entry.descriptor.layerId === activeLayerId) {
        if (!latestStroke || entry.descriptor.createdAt > latestStroke.createdAt) {
          latestStroke = entry.descriptor;
        }
      }
    }

    if (!latestStroke || latestStroke.points.length < 2) return null;
    const curvePoints = latestStroke.points.map((p) => p.position);
    const guide = this.options.loftEngine.createBentGuideFromPoints(
      curvePoints,
      `Scaffold from ${latestStroke.id}`,
      width,
      opacity
    );
    if (guide) {
      this.setActiveGuide({ type: 'bent', id: guide.id, name: guide.name });
    }
    return guide;
  }

  public removeBentGuide(id: string): void {
    if (this.activeGuide?.id === id) {
      this.setActiveGuide(null);
    }
    this.options.loftEngine.removeBentGuide(id);
    this.options.markDirty();
  }

  public updateBentGuideParameters(id: string, params: Partial<BentGuideConfig>): BentGuideConfig | null {
    return this.options.loftEngine.updateBentGuideParameters(id, params);
  }

  public toggleBentGuideVisibility(id: string, visible: boolean): void {
    this.options.loftEngine.toggleGuideVisibility(id, visible);
  }

  public getBentGuides(): BentGuideConfig[] {
    return this.options.loftEngine.getGuides();
  }

  // ==========================================
  // MULTI-CURVE LOFTING & SURFACE SKINNING
  // ==========================================

  public getActiveLayerCurves(): { id: string; name: string; points: THREE.Vector3[] }[] {
    const list: { id: string; name: string; points: THREE.Vector3[] }[] = [];
    const activeLayerId = this.options.getActiveLayerId();
    let idx = 1;
    for (const entry of this.options.getStrokes().values()) {
      if (entry.descriptor.layerId === activeLayerId && entry.descriptor.points.length >= 2) {
        list.push({
          id: entry.descriptor.id,
          name: `Curve #${idx++} (${entry.descriptor.points.length} pts)`,
          points: entry.descriptor.points.map((p) => p.position.clone()),
        });
      }
    }
    return list;
  }

  public createLoftedSurface(
    id: string,
    name: string,
    curves: THREE.Vector3[][],
    options: {
      tension?: number;
      divisionsU?: number;
      divisionsV?: number;
      opacity?: number;
      color?: string | number;
      wireframe?: boolean;
    } = {}
  ): LoftSurfaceConfig | null {
    const loft = this.options.loftEngine.createLoftedSurfaceBetweenCurves(id, name, curves, options);
    this.options.markDirty();
    return loft;
  }

  public getLoftedSurfaces(): LoftSurfaceConfig[] {
    return this.options.loftEngine.getLoftedSurfaces();
  }

  public removeLoftedSurface(id: string): void {
    this.options.loftEngine.removeLoftedSurface(id);
    this.options.markDirty();
  }

  public toggleLoftedSurfaceVisibility(id: string, visible: boolean): void {
    this.options.loftEngine.toggleLoftedSurfaceVisibility(id, visible);
    this.options.markDirty();
  }

  public bakeLoftedSurfaceToModel(id: string, name: string): THREE.Mesh | null {
    const geom = this.options.loftEngine.bakeLoftedSurfaceToGeometry(id);
    if (!geom) return null;

    const existing = this.options.loftEngine.getLoftedSurfaces().find((s) => s.id === id);
    const color = existing?.color ?? 0x38bdf8;

    const mat = new THREE.MeshStandardMaterial({
      color: typeof color === 'string' ? new THREE.Color(color) : color,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geom, mat);
    this.options.addPrimitiveToScene(mesh, name || `Loft ${id}`);

    // Clean up the temporary guide representation
    this.options.loftEngine.removeLoftedSurface(id);
    this.options.markDirty();
    return mesh;
  }

  // ==========================================
  // ACTIVE GUIDE & MANIFOLD HUD ENGINE
  // ==========================================

  public getActiveGuide(): ActiveGuideReference | null {
    return this.activeGuide;
  }

  public setActiveGuide(guide: ActiveGuideReference | null): void {
    this.activeGuide = guide;
    this.onActiveGuideChangeCallbacks.forEach((cb) => {
      try { cb(guide); } catch {}
    });
    this.options.markDirty();
  }

  public subscribeActiveGuideChange(cb: (guide: ActiveGuideReference | null) => void): () => void {
    this.onActiveGuideChangeCallbacks.add(cb);
    return () => this.onActiveGuideChangeCallbacks.delete(cb);
  }

  public getActiveGuideMesh(): THREE.Object3D | null {
    if (!this.activeGuide) return null;
    if (this.activeGuide.type === 'bent') {
      const bent = this.options.loftEngine.getGuides().find((g) => g.id === this.activeGuide!.id);
      return bent?.manifoldMesh || null;
    } else if (this.activeGuide.type === 'scaffold') {
      const scaffold = this.options.scaffoldingEngine.getScaffolds().find((s) => s.id === this.activeGuide!.id);
      return scaffold?.mesh || null;
    }
    return null;
  }

  public removeActiveGuide(): void {
    if (!this.activeGuide) return;
    if (this.activeGuide.type === 'bent') {
      this.removeBentGuide(this.activeGuide.id);
    } else {
      this.removeScaffold(this.activeGuide.id);
    }
  }

  // ==========================================
  // SCAFFOLDING & COLLISION MESH ENGINE
  // ==========================================

  public getScaffoldingEngine(): ScaffoldingEngine {
    return this.options.scaffoldingEngine;
  }

  public createProxyScaffold(type: ScaffoldProxyType, name?: string): CollisionGuideMeshConfig {
    const scaffold = this.options.scaffoldingEngine.createProxyScaffold(type, name);
    if (scaffold) {
      this.setActiveGuide({ type: 'scaffold', id: scaffold.id, name: scaffold.name });
    }
    return scaffold;
  }

  public loadCollisionMeshFromObject(object: THREE.Object3D, name: string = 'Collision Guide'): CollisionGuideMeshConfig {
    const scaffold = this.options.scaffoldingEngine.loadCollisionMeshFromObject(object, name);
    if (scaffold) {
      this.setActiveGuide({ type: 'scaffold', id: scaffold.id, name: scaffold.name });
    }
    return scaffold;
  }

  public removeScaffold(id: string): void {
    if (this.activeGuide?.id === id) {
      this.setActiveGuide(null);
    }
    this.options.scaffoldingEngine.removeScaffold(id);
    this.options.markDirty();
  }

  public updateScaffold(id: string, updates: Partial<CollisionGuideMeshConfig>): CollisionGuideMeshConfig | null {
    return this.options.scaffoldingEngine.updateScaffold(id, updates);
  }

  public getScaffolds(): CollisionGuideMeshConfig[] {
    return this.options.scaffoldingEngine.getScaffolds();
  }
}

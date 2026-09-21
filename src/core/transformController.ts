import * as THREE from 'three';
import { TransformTargetScope, PerfectViewType, StrokeDescriptor } from '../types';

export interface TransformUndoItem {
  scope: TransformTargetScope;
  inverseMatrix: THREE.Matrix4;
  layerId?: string;
  strokeIds?: string[];
}

/** Pins a transform to the exact layer or lines it started on, so undo moves the same things back. */
export interface TransformTargets {
  layerId?: string;
  strokeIds?: string[];
}

export interface TransformRedoItem {
  scope: TransformTargetScope;
  forwardMatrix: THREE.Matrix4;
  layerId?: string;
}

export interface TransformContext {
  modelRoot: THREE.Group;
  strokeRoot: THREE.Group;
  getTargetMeshes: () => THREE.Mesh[];
  getStrokes: () => Map<string, { descriptor: StrokeDescriptor; meshes: THREE.Mesh[] }>;
  getActiveLayerId: () => string;
  getSelectedStrokeIds: () => string[];
  getActiveSelectedModelId: () => string | null;
  getDrawingPlaneMesh: () => THREE.Mesh | null;
  getCamera: () => THREE.PerspectiveCamera;
  getCameraTarget: () => THREE.Vector3;
  getContainer: () => HTMLElement | null;
  getNavigatorSensitivity: () => number;
  markDirty: () => void;
  markTransparencyDirty: () => void;
  notifyHistory: () => void;
  pushHistoryUndo: (entry: {
    kind: 'transform';
    scope: TransformTargetScope;
    inverseMatrix: THREE.Matrix4;
    forwardMatrix: THREE.Matrix4;
    layerId?: string;
    strokeIds?: string[];
    timestamp: number;
  }) => void;
  clearHistoryRedo: () => void;
  getActiveGuideMesh?: () => THREE.Object3D | null;
  getGuideRoot?: () => THREE.Group;
  getScaffoldRoot?: () => THREE.Group;
}

export class TransformController {
  private ctx: TransformContext;

  public transformActiveScope: TransformTargetScope = 'all';
  private transformActiveTargets: TransformTargets = {};
  public currentTransformTotalMatrix: THREE.Matrix4 = new THREE.Matrix4();
  /** Bumped on every applied transform so on-screen selection frames know to re-measure. */
  public revision = 0;
  private readonly _padScratch = new THREE.Vector3();
  private readonly _objectBoxScratch = new THREE.Box3();
  public transformUndoStack: TransformUndoItem[] = [];
  public transformRedoStack: TransformRedoItem[] = [];

  constructor(ctx: TransformContext) {
    this.ctx = ctx;
  }

  public clearHistory(): void {
    this.transformUndoStack.length = 0;
    this.transformRedoStack.length = 0;
  }

  /**
   * Calculates the geometric bounding center of the targeted selection (model, strokes, or active layer)
   */
  public getSelectionCenter(scope: TransformTargetScope = 'all'): THREE.Vector3 {
    const box = this.getSelectionBox(scope);
    if (box.isEmpty()) {
      return this.ctx.getCameraTarget().clone();
    }
    return box.getCenter(new THREE.Vector3());
  }

  /**
   * World-space bounds of exactly what a transform with this scope would move.
   * Empty when there is nothing to move.
   */
  public getSelectionBox(scope: TransformTargetScope = 'all', out: THREE.Box3 = new THREE.Box3()): THREE.Box3 {
    const box = out.makeEmpty();
    let hasContent = false;

    const targetMeshes = this.ctx.getTargetMeshes();
    const activeSelectedModelId = this.ctx.getActiveSelectedModelId();
    const strokes = this.ctx.getStrokes();
    const activeLayerId = this.ctx.getActiveLayerId();

    // Lines are measured from their points: stroke geometry buffers are
    // over-allocated, and the unused vertices at the origin would stretch the box.
    const expandByStroke = (descriptor: StrokeDescriptor) => {
      if (descriptor.points.length === 0) return;
      const pad = Math.max(0.01, (descriptor.settings?.size ?? 0.02) / 2);
      for (const p of descriptor.points) {
        box.min.min(this._padScratch.copy(p.position).subScalar(pad));
        box.max.max(this._padScratch.copy(p.position).addScalar(pad));
      }
      hasContent = true;
    };
    const expandByModels = (objects: THREE.Object3D[]) => {
      for (const object of objects) {
        const objectBox = this._objectBoxScratch.setFromObject(object);
        if (objectBox.isEmpty()) continue;
        box.union(objectBox);
        hasContent = true;
      }
    };
    const modelChildren = () => this.ctx.modelRoot.children.filter((c) => c !== this.ctx.strokeRoot);

    if (scope === 'model') {
      // Mirrors applyTransformMatrix: with no model picked, every model moves.
      const targetModel = activeSelectedModelId
        ? this.ctx.modelRoot.children.find((c) => c.uuid === activeSelectedModelId)
        : undefined;
      if (targetModel) expandByModels([targetModel]);
      else if (activeSelectedModelId === null && modelChildren().length > 0) expandByModels(modelChildren());
      else if (targetMeshes.length > 0) expandByModels(targetMeshes);
    }

    if (scope === 'all') {
      expandByModels(modelChildren());
    }

    if (scope === 'strokes' || scope === 'all') {
      strokes.forEach(({ descriptor }) => expandByStroke(descriptor));
    }

    if (scope === 'active_layer') {
      strokes.forEach(({ descriptor }) => {
        if (descriptor.layerId === activeLayerId) expandByStroke(descriptor);
      });
    }

    if (scope === 'selected_strokes') {
      for (const id of this.ctx.getSelectedStrokeIds()) {
        const entry = strokes.get(id);
        if (entry) expandByStroke(entry.descriptor);
      }
    }

    if (scope === 'guide') {
      const guideMesh = this.ctx.getActiveGuideMesh?.();
      if (guideMesh) {
        box.setFromObject(guideMesh);
        if (!box.isEmpty()) hasContent = true;
      } else {
        const guideRoot = this.ctx.getGuideRoot?.();
        const scaffoldRoot = this.ctx.getScaffoldRoot?.();
        if (guideRoot && guideRoot.children.length > 0) {
          box.setFromObject(guideRoot);
          if (!box.isEmpty()) hasContent = true;
        } else if (scaffoldRoot && scaffoldRoot.children.length > 0) {
          box.setFromObject(scaffoldRoot);
          if (!box.isEmpty()) hasContent = true;
        }
      }
    }

    if (!hasContent) box.makeEmpty();
    return box;
  }

  /**
   * Computes the 3D world anchor that corresponds precisely to the exact screen center crosshair
   */
  public getScreenCenterWorldAnchor(targetCenter?: THREE.Vector3): THREE.Vector3 {
    const center = targetCenter || this.getSelectionCenter(this.transformActiveScope);
    const camera = this.ctx.getCamera();
    const camDir = camera.getWorldDirection(new THREE.Vector3()).normalize();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camDir, center);
    const ray = new THREE.Ray(camera.position, camDir);
    const anchor = new THREE.Vector3();
    const hit = ray.intersectPlane(plane, anchor);
    return hit ? anchor : center.clone();
  }

  /**
   * Begins a continuous transformation gesture, tracking undo state
   */
  public beginTransform(scope: TransformTargetScope = 'all'): void {
    this.transformActiveScope = scope;
    this.transformActiveTargets = {
      layerId: this.ctx.getActiveLayerId(),
      strokeIds: scope === 'selected_strokes' ? [...this.ctx.getSelectedStrokeIds()] : undefined,
    };
    this.currentTransformTotalMatrix.identity();
    if (scope === 'model') this.rememberPickedModelHome();
  }

  /**
   * Concludes a transformation gesture and commits undo state
   */
  public endTransform(): void {
    if (!this.currentTransformTotalMatrix.equals(new THREE.Matrix4())) {
      // Never pollute undo history with camera navigation / orbit / pan movements!
      if ((this.transformActiveScope as string) !== 'camera') {
        const inv = this.currentTransformTotalMatrix.clone().invert();
        const fwd = this.currentTransformTotalMatrix.clone();
        const layerId = this.transformActiveTargets.layerId ?? this.ctx.getActiveLayerId();
        const strokeIds = this.transformActiveTargets.strokeIds;
        this.ctx.pushHistoryUndo({
          kind: 'transform',
          scope: this.transformActiveScope,
          inverseMatrix: inv,
          forwardMatrix: fwd,
          layerId,
          strokeIds,
          timestamp: Date.now(),
        });
        this.transformRedoStack = [];
        this.ctx.clearHistoryRedo();
        this.ctx.notifyHistory();
      }
    }
  }

  /**
   * Applies an arbitrary 4x4 matrix transformation across target meshes, strokes, and descriptors
   */
  public applyTransformMatrix(
    matrix: THREE.Matrix4,
    scope: TransformTargetScope = 'all',
    targets?: TransformTargets
  ): void {
    this.currentTransformTotalMatrix.premultiply(matrix);
    this.revision++;

    const targetMeshes = this.ctx.getTargetMeshes();
    const activeSelectedModelId = this.ctx.getActiveSelectedModelId();
    const strokes = this.ctx.getStrokes();
    const activeLayerId = targets?.layerId ?? this.ctx.getActiveLayerId();

    if (scope === 'model') {
      if (activeSelectedModelId) {
        const targetModel = this.ctx.modelRoot.children.find((c) => c.uuid === activeSelectedModelId);
        if (targetModel) {
          targetModel.applyMatrix4(matrix);
          targetModel.updateMatrixWorld(true);
          targetModel.traverse((child) => {
            if (child instanceof THREE.Mesh && child.geometry) {
              child.geometry.computeBoundingSphere();
              child.geometry.computeBoundingBox();
            }
          });
        }
      } else {
        const modelChildren = this.ctx.modelRoot.children.filter((c) => c !== this.ctx.strokeRoot);
        if (modelChildren.length > 0) {
          modelChildren.forEach((child) => {
            child.applyMatrix4(matrix);
            child.updateMatrixWorld(true);
            child.traverse((c) => {
              if (c instanceof THREE.Mesh && c.geometry) {
                c.geometry.computeBoundingSphere();
                c.geometry.computeBoundingBox();
              }
            });
          });
        } else {
          targetMeshes.forEach((mesh) => {
            mesh.applyMatrix4(matrix);
            mesh.updateMatrixWorld(true);
            if (mesh.geometry) {
              mesh.geometry.computeBoundingSphere();
              mesh.geometry.computeBoundingBox();
            }
          });
        }
      }
    } else if (scope === 'all') {
      this.ctx.modelRoot.applyMatrix4(matrix);
      this.ctx.modelRoot.updateMatrixWorld(true);
      targetMeshes.forEach((mesh) => {
        if (mesh.geometry) {
          mesh.geometry.computeBoundingSphere();
          mesh.geometry.computeBoundingBox();
        }
      });
      // strokeRoot is already a child of modelRoot, so child meshes transform together.
      // Update descriptor points for geometry export / raycasting synchronization
      strokes.forEach(({ descriptor }) => {
        descriptor.points.forEach((p) => {
          p.position.applyMatrix4(matrix);
          p.normal.transformDirection(matrix).normalize();
        });
      });
    } else if (scope === 'strokes') {
      this.ctx.strokeRoot.applyMatrix4(matrix);
      this.ctx.strokeRoot.updateMatrixWorld(true);
      strokes.forEach(({ descriptor }) => {
        descriptor.points.forEach((p) => {
          p.position.applyMatrix4(matrix);
          p.normal.transformDirection(matrix).normalize();
        });
      });
    } else if (scope === 'active_layer') {
      strokes.forEach(({ descriptor, meshes }) => {
        if (descriptor.layerId === activeLayerId) {
          meshes.forEach((mesh) => {
            mesh.applyMatrix4(matrix);
            mesh.updateMatrixWorld(true);
          });
          descriptor.points.forEach((p) => {
            p.position.applyMatrix4(matrix);
            p.normal.transformDirection(matrix).normalize();
          });
        }
      });
      // An empty layer is an empty selection. Never move unrelated scene
      // objects as a fallback for a layer-specific gesture.
    } else if (scope === 'selected_strokes') {
      const ids = targets?.strokeIds ?? this.ctx.getSelectedStrokeIds();
      for (const id of ids) {
        const entry = strokes.get(id);
        if (!entry) continue;
        entry.meshes.forEach((mesh) => {
          mesh.applyMatrix4(matrix);
          mesh.updateMatrixWorld(true);
        });
        entry.descriptor.points.forEach((p) => {
          p.position.applyMatrix4(matrix);
          p.normal.transformDirection(matrix).normalize();
        });
      }
    } else if (scope === 'guide') {
      const guideMesh = this.ctx.getActiveGuideMesh?.();
      if (guideMesh) {
        guideMesh.applyMatrix4(matrix);
        guideMesh.updateMatrixWorld(true);
        guideMesh.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry) {
            child.geometry.computeBoundingSphere?.();
            child.geometry.computeBoundingBox?.();
          }
        });
      } else {
        const guideRoot = this.ctx.getGuideRoot?.();
        const scaffoldRoot = this.ctx.getScaffoldRoot?.();
        if (guideRoot && guideRoot.children.length > 0) {
          guideRoot.applyMatrix4(matrix);
          guideRoot.updateMatrixWorld(true);
        } else if (scaffoldRoot && scaffoldRoot.children.length > 0) {
          scaffoldRoot.applyMatrix4(matrix);
          scaffoldRoot.updateMatrixWorld(true);
        }
      }
    }
    if (
      scope === 'all' ||
      scope === 'strokes' ||
      scope === 'active_layer' ||
      scope === 'selected_strokes'
    ) {
      this.ctx.markTransparencyDirty();
    }
    this.ctx.markDirty();
  }

  /**
   * 2D Screen-Space Planar Translation:
   * Moves selection parallel to the current camera view plane with 1:1 screen-to-world mapping.
   */
  public translateScreenSpace(
    deltaScreenX: number,
    deltaScreenY: number,
    scope: TransformTargetScope = 'all',
    isLocked: boolean = false
  ): void {
    let dx = deltaScreenX;
    let dy = deltaScreenY;

    // Locked Constraints: Enforce strict orthogonal 4-way vector movement
    if (isLocked) {
      if (Math.abs(dx) > Math.abs(dy)) {
        dy = 0;
      } else {
        dx = 0;
      }
    }

    const camera = this.ctx.getCamera();
    const targetCenter = this.getSelectionCenter(scope);
    const dist = Math.max(0.5, camera.position.distanceTo(targetCenter));
    const vHeight = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const container = this.ctx.getContainer();
    const factor = (vHeight / (container?.clientHeight || 800)) * this.ctx.getNavigatorSensitivity();

    const forward = camera.getWorldDirection(new THREE.Vector3()).normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();

    const worldDelta = new THREE.Vector3()
      .addScaledVector(right, dx * factor)
      .addScaledVector(up, -dy * factor);

    const transMatrix = new THREE.Matrix4().makeTranslation(worldDelta.x, worldDelta.y, worldDelta.z);
    this.applyTransformMatrix(transMatrix, scope);
  }

  /**
   * Direct manipulation move: the selection stays under the finger or cursor,
   * so this ignores navigator sensitivity.
   */
  public translateScreenExact(deltaScreenX: number, deltaScreenY: number, scope: TransformTargetScope = 'all'): void {
    const camera = this.ctx.getCamera() as THREE.Camera;
    const container = this.ctx.getContainer();
    const viewHeightPx = container?.clientHeight || 800;
    let worldPerPixel: number;
    if ((camera as THREE.OrthographicCamera).isOrthographicCamera) {
      const ortho = camera as THREE.OrthographicCamera;
      worldPerPixel = (ortho.top - ortho.bottom) / ortho.zoom / viewHeightPx;
    } else {
      const persp = camera as THREE.PerspectiveCamera;
      const dist = Math.max(0.05, persp.position.distanceTo(this.getSelectionCenter(scope)));
      worldPerPixel = (2 * dist * Math.tan(THREE.MathUtils.degToRad(persp.fov / 2))) / viewHeightPx;
    }
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1).normalize();
    const worldDelta = new THREE.Vector3()
      .addScaledVector(right, deltaScreenX * worldPerPixel)
      .addScaledVector(up, -deltaScreenY * worldPerPixel);
    this.applyTransformMatrix(new THREE.Matrix4().makeTranslation(worldDelta.x, worldDelta.y, worldDelta.z), scope);
  }

  /**
   * Direct manipulation move from one pointer position to another (normalized
   * device coordinates). Lines and layers slide along the drawing canvas so
   * they stay on its surface; everything else slides parallel to the screen.
   * Either way the grabbed point stays under the finger or cursor.
   */
  public dragSelection(
    fromNdcX: number,
    fromNdcY: number,
    toNdcX: number,
    toNdcY: number,
    scope: TransformTargetScope = 'all'
  ): void {
    const camera = this.ctx.getCamera();
    const center = this.getSelectionCenter(scope);
    const cameraForward = camera.getWorldDirection(new THREE.Vector3()).normalize();
    let normal = cameraForward.clone();
    const plane = this.ctx.getDrawingPlaneMesh();
    if (plane && plane.visible && (scope === 'active_layer' || scope === 'selected_strokes')) {
      const planeNormal = new THREE.Vector3(0, 0, 1)
        .applyQuaternion(plane.getWorldQuaternion(new THREE.Quaternion()))
        .normalize();
      // A canvas seen nearly edge-on would turn tiny pointer moves into huge jumps.
      if (Math.abs(planeNormal.dot(cameraForward)) > 0.25) normal = planeNormal;
    }
    const dragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, center);
    const raycaster = new THREE.Raycaster();
    const from = new THREE.Vector3();
    const to = new THREE.Vector3();
    raycaster.setFromCamera(new THREE.Vector2(fromNdcX, fromNdcY), camera);
    if (!raycaster.ray.intersectPlane(dragPlane, from)) return;
    raycaster.setFromCamera(new THREE.Vector2(toNdcX, toNdcY), camera);
    if (!raycaster.ray.intersectPlane(dragPlane, to)) return;
    const delta = to.sub(from);
    if (delta.lengthSq() < 1e-12) return;
    this.applyTransformMatrix(new THREE.Matrix4().makeTranslation(delta.x, delta.y, delta.z), scope);
  }

  /**
   * Direct manipulation turn: spins the selection about its own center, around
   * the line of sight. A positive angle is clockwise on screen, matching
   * Math.atan2 in screen pixels (y down).
   */
  public rotateAroundViewAxis(deltaAngleRad: number, scope: TransformTargetScope = 'all'): void {
    if (Math.abs(deltaAngleRad) < 1e-6) return;
    const camera = this.ctx.getCamera();
    const center = this.getSelectionCenter(scope);
    // Rotating about the direction the camera looks (away from the viewer) turns clockwise on screen.
    const forward = camera.getWorldDirection(new THREE.Vector3()).normalize();
    let axis = forward;
    const plane = this.ctx.getDrawingPlaneMesh();
    if (plane && plane.visible && (scope === 'active_layer' || scope === 'selected_strokes')) {
      // Lines on the canvas turn within the canvas, so they stay on its surface.
      const planeNormal = new THREE.Vector3(0, 0, 1)
        .applyQuaternion(plane.getWorldQuaternion(new THREE.Quaternion()))
        .normalize();
      const facing = planeNormal.dot(forward);
      if (Math.abs(facing) > 0.25) axis = facing >= 0 ? planeNormal : planeNormal.negate();
    }
    const finalMat = new THREE.Matrix4()
      .makeTranslation(center.x, center.y, center.z)
      .multiply(new THREE.Matrix4().makeRotationAxis(axis, deltaAngleRad))
      .multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
    this.applyTransformMatrix(finalMat, scope);
  }

  /**
   * 2D Screen-Space Scaling:
   * Anchored precisely to the exact center of the screen (crosshair).
   */
  public scaleScreenSpace(
    scaleFactorX: number,
    scaleFactorY: number,
    scope: TransformTargetScope = 'all',
    isLocked: boolean = false
  ): void {
    let sx = scaleFactorX;
    let sy = scaleFactorY;

    // Locked Constraints: Uniform proportions
    if (isLocked) {
      const avg = (sx + sy) / 2;
      sx = avg;
      sy = avg;
    }

    // If both axes are scaling or if locked, scale depth proportionally; otherwise keep depth at 1.0
    const isUniform = isLocked || (Math.abs(sx - 1.0) > 0.0001 && Math.abs(sy - 1.0) > 0.0001);
    const sz = isUniform ? (sx + sy) / 2 : 1.0;
    const anchor = this.getScreenCenterWorldAnchor(this.getSelectionCenter(scope));

    const camera = this.ctx.getCamera();
    const forward = camera.getWorldDirection(new THREE.Vector3()).normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();

    const rotMatrix = new THREE.Matrix4().makeBasis(right, up, forward.clone().negate());
    const rotInv = rotMatrix.clone().invert();

    const toAnchor = new THREE.Matrix4().makeTranslation(-anchor.x, -anchor.y, -anchor.z);
    const fromAnchor = new THREE.Matrix4().makeTranslation(anchor.x, anchor.y, anchor.z);
    const scaleMatrix = new THREE.Matrix4().makeScale(sx, sy, sz);

    const finalMat = new THREE.Matrix4()
      .multiply(fromAnchor)
      .multiply(rotMatrix)
      .multiply(scaleMatrix)
      .multiply(rotInv)
      .multiply(toAnchor);

    this.applyTransformMatrix(finalMat, scope);
  }

  /**
   * 2D Screen-Center Rotation:
   * Spins selection around the screen's center crosshair along the view axis.
   */
  public rotateScreenSpace(
    deltaAngleRad: number,
    scope: TransformTargetScope = 'all',
    isLocked: boolean = false
  ): void {
    let angle = deltaAngleRad * this.ctx.getNavigatorSensitivity();

    // Locked Constraints: Quantize into exact 15-degree increments (PI / 12)
    if (isLocked) {
      const step = Math.PI / 12;
      angle = Math.round(angle / step) * step;
      if (Math.abs(angle) < 0.0001) return;
    }

    const anchor = this.getScreenCenterWorldAnchor();
    const camera = this.ctx.getCamera();
    const camDir = camera.getWorldDirection(new THREE.Vector3()).normalize();

    const toAnchor = new THREE.Matrix4().makeTranslation(-anchor.x, -anchor.y, -anchor.z);
    const fromAnchor = new THREE.Matrix4().makeTranslation(anchor.x, anchor.y, anchor.z);
    const rotMat = new THREE.Matrix4().makeRotationAxis(camDir, -angle);

    const finalMat = new THREE.Matrix4()
      .multiply(fromAnchor)
      .multiply(rotMat)
      .multiply(toAnchor);

    this.applyTransformMatrix(finalMat, scope);
  }

  /**
   * 3D Global Absolute Translation:
   * Dragging Red (X), Green (Y), or Blue (Z) moves object strictly along global axis.
   */
  public translateWorldAxis(
    axis: 'x' | 'y' | 'z',
    deltaWorld: number,
    scope: TransformTargetScope = 'all'
  ): void {
    const sens = this.ctx.getNavigatorSensitivity();
    const vec = new THREE.Vector3(
      axis === 'x' ? deltaWorld * sens : 0,
      axis === 'y' ? deltaWorld * sens : 0,
      axis === 'z' ? deltaWorld * sens : 0
    );
    const transMat = new THREE.Matrix4().makeTranslation(vec.x, vec.y, vec.z);
    this.applyTransformMatrix(transMat, scope);
  }

  /**
   * 3D Global Axis Rotation:
   * Rotating Red (X), Green (Y), or Blue (Z) arcs spins around the object's geometric center.
   */
  public rotateWorldAxis(
    axis: 'x' | 'y' | 'z',
    deltaAngleRad: number,
    scope: TransformTargetScope = 'all',
    isLocked: boolean = false
  ): void {
    let angle = deltaAngleRad * this.ctx.getNavigatorSensitivity();
    if (isLocked) {
      const step = Math.PI / 12; // 15 degrees
      angle = Math.round(angle / step) * step;
      if (Math.abs(angle) < 0.0001) return;
    }

    const center = this.getSelectionCenter(scope);
    const axisVec = new THREE.Vector3(
      axis === 'x' ? 1 : 0,
      axis === 'y' ? 1 : 0,
      axis === 'z' ? 1 : 0
    );

    const toCenter = new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z);
    const fromCenter = new THREE.Matrix4().makeTranslation(center.x, center.y, center.z);
    const rotMat = new THREE.Matrix4().makeRotationAxis(axisVec, angle);

    const finalMat = new THREE.Matrix4()
      .multiply(fromCenter)
      .multiply(rotMat)
      .multiply(toCenter);

    this.applyTransformMatrix(finalMat, scope);
  }

  /**
   * 3D Trackball Rotation:
   * Dragging central sphere enables freeform, non-linear rotation around object geometric center.
   */
  public rotateTrackball(
    deltaX: number,
    deltaY: number,
    scope: TransformTargetScope = 'all'
  ): void {
    const center = this.getSelectionCenter(scope);
    const rotSpeed = 0.005 * this.ctx.getNavigatorSensitivity();
    const camera = this.ctx.getCamera();

    const forward = camera.getWorldDirection(new THREE.Vector3()).normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();

    const qX = new THREE.Quaternion().setFromAxisAngle(up, deltaX * rotSpeed);
    const qY = new THREE.Quaternion().setFromAxisAngle(right, deltaY * rotSpeed);
    const deltaQ = qX.multiply(qY);

    const toCenter = new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z);
    const fromCenter = new THREE.Matrix4().makeTranslation(center.x, center.y, center.z);
    const rotMat = new THREE.Matrix4().makeRotationFromQuaternion(deltaQ);

    const finalMat = new THREE.Matrix4()
      .multiply(fromCenter)
      .multiply(rotMat)
      .multiply(toCenter);

    this.applyTransformMatrix(finalMat, scope);
    this.ctx.markDirty();
  }

  /**
   * 2D Translation on the Existing Plane Surface:
   * Moves targeted plane or selection strictly along its local surface axes
   * (Up/Down along local Y, Left/Right along local X).
   */
  public translateOnPlane(
    deltaX: number,
    deltaY: number,
    scope: TransformTargetScope = 'all'
  ): void {
    let right = new THREE.Vector3(1, 0, 0);
    let up = new THREE.Vector3(0, 1, 0);

    const drawingPlaneMesh = this.ctx.getDrawingPlaneMesh();
    const plane = drawingPlaneMesh || (this.ctx.modelRoot.getObjectByName('DrawingPlaneCanvas') as THREE.Mesh);
    if (plane) {
      const planeQuat = new THREE.Quaternion();
      plane.getWorldQuaternion(planeQuat);
      right = new THREE.Vector3(1, 0, 0).applyQuaternion(planeQuat).normalize();
      up = new THREE.Vector3(0, 1, 0).applyQuaternion(planeQuat).normalize();
    } else {
      const camera = this.ctx.getCamera();
      const forward = camera.getWorldDirection(new THREE.Vector3()).normalize();
      right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
      up = new THREE.Vector3().crossVectors(right, forward).normalize();
    }

    const step = 0.08 * this.ctx.getNavigatorSensitivity();
    const worldDelta = new THREE.Vector3()
      .addScaledVector(right, deltaX * step)
      .addScaledVector(up, deltaY * step);

    const transMatrix = new THREE.Matrix4().makeTranslation(worldDelta.x, worldDelta.y, worldDelta.z);
    this.applyTransformMatrix(transMatrix, scope);
    this.ctx.markDirty();
  }

  /**
   * 2D Rotation on the Existing Plane Surface:
   * Rotates targeted plane or selection around its face normal (in-plane spin).
   */
  public rotateOnPlane(
    deltaAngleRad: number,
    scope: TransformTargetScope = 'all',
    isLocked: boolean = false
  ): void {
    let angle = deltaAngleRad * this.ctx.getNavigatorSensitivity();
    if (isLocked) {
      const step = Math.PI / 12; // 15 degrees
      angle = Math.round(angle / step) * step;
      if (Math.abs(angle) < 0.0001) return;
    }

    const center = this.getSelectionCenter(scope);
    let normal = new THREE.Vector3(0, 0, 1);

    const drawingPlaneMesh = this.ctx.getDrawingPlaneMesh();
    const plane = drawingPlaneMesh || (this.ctx.modelRoot.getObjectByName('DrawingPlaneCanvas') as THREE.Mesh);
    if (plane) {
      const planeQuat = new THREE.Quaternion();
      plane.getWorldQuaternion(planeQuat);
      normal = new THREE.Vector3(0, 0, 1).applyQuaternion(planeQuat).normalize();
    } else {
      normal = this.ctx.getCamera().getWorldDirection(new THREE.Vector3()).normalize().negate();
    }

    const toCenter = new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z);
    const fromCenter = new THREE.Matrix4().makeTranslation(center.x, center.y, center.z);
    const rotMat = new THREE.Matrix4().makeRotationAxis(normal, angle);

    const finalMat = new THREE.Matrix4()
      .multiply(fromCenter)
      .multiply(rotMat)
      .multiply(toCenter);

    this.applyTransformMatrix(finalMat, scope);
    this.ctx.markDirty();
  }

  /**
   * Aligns targeted drawing plane surface directly facing the current camera
   */
  public alignSurfaceToCamera(scope: TransformTargetScope = 'all'): void {
    const camQuat = this.ctx.getCamera().quaternion.clone();
    const drawingPlaneMesh = this.ctx.getDrawingPlaneMesh();
    const plane = drawingPlaneMesh || (this.ctx.modelRoot.getObjectByName('DrawingPlaneCanvas') as THREE.Mesh);
    if (plane) {
      plane.quaternion.copy(camQuat);
      plane.updateMatrixWorld(true);
    } else {
      this.ctx.modelRoot.quaternion.copy(camQuat);
      this.ctx.modelRoot.updateMatrixWorld(true);
    }
    this.ctx.markDirty();
  }

  /**
   * Sets exact surface orientation (pitch and roll angles in degrees)
   */
  public setSurfaceOrientation(pitchDeg: number, rollDeg: number, scope: TransformTargetScope = 'all'): void {
    const DEG = Math.PI / 180;
    const drawingPlaneMesh = this.ctx.getDrawingPlaneMesh();
    const plane = drawingPlaneMesh || (this.ctx.modelRoot.getObjectByName('DrawingPlaneCanvas') as THREE.Mesh);
    const target = (plane && (scope === 'all' || (scope as string) === 'plane')) ? plane : this.ctx.modelRoot;
    if (target) {
      this.beginTransform(scope);
      const e = new THREE.Euler().setFromQuaternion(target.quaternion, 'YXZ');
      target.quaternion.setFromEuler(new THREE.Euler(pitchDeg * DEG, e.y, rollDeg * DEG, 'YXZ'));
      target.updateMatrixWorld(true);
      this.endTransform();
      this.ctx.markDirty();
    }
  }

  /**
   * Translates targeted objects along a specific 3D axis (wrapper for translateWorldAxis)
   */
  public translateAxis3D(
    axis: 'x' | 'y' | 'z',
    deltaWorld: number,
    scope: TransformTargetScope = 'all'
  ): void {
    this.translateWorldAxis(axis, deltaWorld, scope);
  }

  /**
   * Rotates targeted objects along a specific 3D axis (wrapper for rotateWorldAxis)
   */
  public rotateAxis3D(
    axis: 'x' | 'y' | 'z',
    deltaAngleRad: number,
    scope: TransformTargetScope = 'all',
    isLocked: boolean = false
  ): void {
    this.rotateWorldAxis(axis, deltaAngleRad, scope, isLocked);
  }

  /**
   * Scales targeted objects along a specific axis ('x', 'y', 'z') or 'uniform'
   * around the selection centroid.
   * If isLocked is true, enforces uniform proportions.
   */
  public scaleAxis(
    axis: 'x' | 'y' | 'z' | 'uniform',
    factor: number,
    scope: TransformTargetScope = 'all',
    isLocked: boolean = false
  ): void {
    const center = this.getSelectionCenter(scope);
    const toCenter = new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z);
    const fromCenter = new THREE.Matrix4().makeTranslation(center.x, center.y, center.z);

    let sx = 1.0;
    let sy = 1.0;
    let sz = 1.0;

    if (isLocked || axis === 'uniform') {
      sx = factor;
      sy = factor;
      sz = factor;
    } else if (axis === 'y') {
      sy = factor;
    } else if (axis === 'x') {
      sx = factor;
    } else if (axis === 'z') {
      sz = factor;
    }

    const scaleMat = new THREE.Matrix4().makeScale(sx, sy, sz);
    const finalMat = new THREE.Matrix4().multiply(fromCenter).multiply(scaleMat).multiply(toCenter);
    this.applyTransformMatrix(finalMat, scope);
  }

  /**
   * Scales targeted objects uniformly or along an axis around selection center
   */
  public scaleAxis3D(
    factor: number,
    scope: TransformTargetScope = 'all'
  ): void {
    this.scaleAxis('uniform', factor, scope, false);
  }

  /**
   * Snaps model bottom bounding box to ground plane (Y = 0)
   */
  public snapModelToGround(): void {
    const box = new THREE.Box3().setFromObject(this.ctx.modelRoot);
    if (!box.isEmpty()) {
      const minY = box.min.y;
      this.ctx.modelRoot.position.y -= minY;
      this.ctx.modelRoot.updateMatrixWorld(true);
      this.ctx.markTransparencyDirty();
      this.ctx.markDirty();
    }
  }

  /**
   * Snaps the active 3D model or primitive to rest flush on the ground grid (y = -1.2)
   */
  public snapActiveToGround(targetScope: TransformTargetScope = 'model'): void {
    const groundY = -1.2;
    // Measure exactly what will move, so a layer or picked lines land on the
    // ground rather than being offset by some unrelated model's height.
    const box = this.getSelectionBox(targetScope);
    if (box.isEmpty()) return;

    const deltaY = groundY - box.min.y;
    if (Math.abs(deltaY) > 0.0005) {
      this.beginTransform(targetScope);
      const matrix = new THREE.Matrix4().makeTranslation(0, deltaY, 0);
      this.applyTransformMatrix(matrix, targetScope);
      this.endTransform();
      this.ctx.markDirty();
    }
  }

  /**
   * Lifts a selection that has sunk through the ground back onto it, and does
   * nothing at all to one that is resting on the ground or floating above it.
   *
   * Meant to be called while a drag is still open, so settling down is part of
   * the same undo step as the move rather than a second one.
   */
  public liftOntoGround(scope: TransformTargetScope = 'model'): boolean {
    const groundY = -1.2;
    const box = this.getSelectionBox(scope);
    if (box.isEmpty()) return false;
    const deltaY = groundY - box.min.y;
    if (deltaY <= 0.0005) return false;
    this.applyTransformMatrix(new THREE.Matrix4().makeTranslation(0, deltaY, 0), scope);
    this.ctx.markDirty();
    return true;
  }

  /**
   * Smoothly orients the actual 3D model or drawing canvas plane directly (WITHOUT moving camera)
   */
  public orientModelOrSurface(view: PerfectViewType, scope: TransformTargetScope = 'all'): void {
    switch (view) {
      case 'front':
        this.ctx.modelRoot.rotation.set(0, 0, 0);
        break;
      case 'back':
        this.ctx.modelRoot.rotation.set(0, Math.PI, 0);
        break;
      case 'top':
        this.ctx.modelRoot.rotation.set(Math.PI / 2, 0, 0);
        break;
      case 'bottom':
        this.ctx.modelRoot.rotation.set(-Math.PI / 2, 0, 0);
        break;
      case 'right':
        this.ctx.modelRoot.rotation.set(0, -Math.PI / 2, 0);
        break;
      case 'left':
        this.ctx.modelRoot.rotation.set(0, Math.PI / 2, 0);
        break;
      case 'isometric':
        this.ctx.modelRoot.rotation.set(-Math.PI * 0.15, Math.PI * 0.25, 0);
        break;
    }
    this.ctx.modelRoot.updateMatrixWorld(true);
    this.ctx.markTransparencyDirty();
    this.ctx.markDirty();
  }

  /**
   * Rotates the 3D model or drawing surface smoothly (WITHOUT moving camera)
   */
  public rotateModelOrSurface(deltaX: number, deltaY: number, scope: TransformTargetScope = 'all'): void {
    this.rotateTrackball(deltaX, deltaY, scope);
  }

  /**
   * Scales the 3D model or drawing surface (WITHOUT moving camera)
   */
  public scaleModelOrSurface(scaleFactor: number, scope: TransformTargetScope = 'all'): void {
    const factor = Math.max(0.5, Math.min(2.0, scaleFactor));
    this.ctx.modelRoot.scale.multiplyScalar(factor);
    this.ctx.modelRoot.updateMatrixWorld(true);
    this.ctx.markTransparencyDirty();
    this.ctx.markDirty();
  }

  private getPickedModel(): THREE.Object3D | undefined {
    const id = this.ctx.getActiveSelectedModelId();
    return id ? this.ctx.modelRoot.children.find((c) => c.uuid === id) : undefined;
  }

  /** Remembers where the picked model sat before its first move, so Reset can return it there. */
  private rememberPickedModelHome(): void {
    const model = this.getPickedModel();
    if (model && !model.userData.homeMatrix) {
      model.updateMatrix();
      model.userData.homeMatrix = model.matrix.clone();
    }
  }

  /**
   * Puts only the picked model back where it was before it was first moved.
   * Recorded as one undo step. Returns false when there is nothing to put back.
   */
  public resetPickedModel(): boolean {
    const model = this.getPickedModel();
    const home = model?.userData.homeMatrix as THREE.Matrix4 | undefined;
    if (!model || !home) return false;
    model.updateMatrix();
    if (model.matrix.equals(home)) return false;
    const back = home.clone().multiply(model.matrix.clone().invert());
    this.beginTransform('model');
    this.applyTransformMatrix(back, 'model');
    this.endTransform();
    return true;
  }
}

export type DeviceTarget = 'desktop' | 'tablet' | 'phone';

export type DemoCategory =
  | 'Learn'
  | 'Draw'
  | 'Control'
  | 'Build'
  | 'Present'
  | 'Export';

export interface PressureCurve {
  start?: number;
  middle?: number;
  end?: number;
}

export interface StrokePointDef {
  /** Relative canvas coordinate 0..1 or absolute pixel */
  x: number;
  y: number;
  pressure?: number;
}

export interface StrokeMotionDef {
  intent?: string;
  durationMs: number;
  /** Normalized path points in 0..1 screen space */
  points: StrokePointDef[];
  pressure?: PressureCurve | number;
  smoothing?: 'human' | 'raw';
  microVariation?: number;
  pauseBeforeMs?: number;
  pauseAfterMs?: number;
}

export type DemoStep =
  | {
      type: 'TAP';
      /** Semantic target name like 'draw', 'surface', 'open-air', 'brush-picker', etc. */
      target: string;
      pauseBeforeMs?: number;
      pauseAfterMs?: number;
    }
  | {
      type: 'HOVER';
      target: string;
      durationMs?: number;
    }
  | {
      type: 'MOVE_POINTER';
      /** Normalized viewport coordinates (0..1) */
      x: number;
      y: number;
      durationMs?: number;
    }
  | {
      type: 'DRAW_STROKE';
      stroke: StrokeMotionDef;
    }
  | {
      type: 'ORBIT_CAMERA';
      deltaTheta: number;
      deltaPhi: number;
      durationMs: number;
    }
  | {
      type: 'SET_TOOL';
      tool: string;
    }
  | {
      type: 'SET_BRUSH';
      settings: Record<string, any>;
    }
  | {
      type: 'INSERT_OBJECT';
      objectType: 'sphere' | 'cube' | 'mannequin' | 'plane';
    }
  | {
      type: 'CALLOUT';
      title: string;
      subtitle?: string;
      durationMs?: number;
    }
  | {
      type: 'WAIT';
      durationMs: number;
    }
  | {
      type: 'TRANSLATE_SELECTION';
      deltaX: number;
      deltaY: number;
      deltaZ: number;
      durationMs?: number;
    }
  | {
      type: 'SELECT_STROKE';
      strokeId?: string;
    }
  | {
      type: 'CLEAR_SCENE';
    }
  | {
      type: 'REPLAY_3D_MODEL';
      datasetUrl: string;
      title: string;
      speedMs?: number;
      orbitWhileDrawing?: boolean;
    };

export interface DemoScene {
  id: string;
  number: number;
  title: string;
  featureTaught: string;
  category: DemoCategory;
  goal: string;
  deviceTargets: DeviceTarget[];
  steps: DemoStep[];
  endStateDescription?: string;
}

export interface PointerVisualState {
  visible: boolean;
  x: number;
  y: number;
  isDown: boolean;
  isDragging: boolean;
  pointerType: 'mouse' | 'touch';
  ripple: boolean;
  rippleKey: number;
  secondaryTouch: { x: number; y: number } | null;
  callout: { title: string; subtitle?: string } | null;
}

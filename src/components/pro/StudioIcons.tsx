import React from 'react';
import {
  MousePointer2,
  Pencil,
  Eraser,
  Pipette,
  Boxes,
  Atom,
  Layers,
  Sun,
  PaintbrushVertical,
  Box,
  Undo2,
  Redo2,
  Save,
  Folder,
  Settings,
  Maximize2,
  Minimize2,
  SunMedium,
  ChevronRight,
  Palette,
  PaintBucket,
  Scissors,
  Star,
  Ruler,
  Spline,
  CircleDashed,
  RotateCcw,
  ArrowDownToLine,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Move,
  RefreshCw,
  Check,
  Compass,
  Circle,
  Cylinder,
  Torus,
  Triangle,
  Square,
  Upload,
  Droplet,
  Focus,
  Camera,
  User,
  FlipHorizontal2,
  Zap,
  Grid,
  Activity,
  ArrowDownNarrowWide,
  Minus,
  Maximize,
} from 'lucide-react';

export type IP = { className?: string; strokeWidth?: number; style?: React.CSSProperties };

const wrap = (Comp: React.ComponentType<any>): React.FC<IP> => {
  const Icon: React.FC<IP> = ({ className = 'w-5 h-5', strokeWidth = 1.35, style, ...props }) => (
    <Comp
      className={className}
      strokeWidth={strokeWidth}
      width="1em"
      height="1em"
      style={style}
      {...props}
    />
  );
  Icon.displayName = 'StudioIcon';
  return Icon;
};

// ── Rail icons (Lucide) ──────────────────────────────────────
export const IcPointer = wrap(MousePointer2);
export const IcDraw = wrap(Pencil);
export const IcErase = wrap(Eraser);
export const IcSample = wrap(Pipette);
export const IcCreate = wrap(Boxes);
export const IcDeform = wrap(Spline);
export const IcLayers = wrap(Layers);
export const IcSun = wrap(Sun);
export const IcBrush = wrap(PaintbrushVertical);

// ── Top bar icons (Lucide) ─────────────────────────────────
export const IcScene = wrap(Box);
export const IcUndo = wrap(Undo2);
export const IcRedo = wrap(Redo2);
export const IcSave = wrap(Save);
export const IcSessions = wrap(Folder);
export const IcSettings = wrap(Settings);
export const IcFullscreen = wrap(Maximize2);
export const IcExitFullscreen = wrap(Minimize2);
export const IcIllumination = wrap(SunMedium);

// ── Chevrons / collapse (Lucide) ───────────────────────────
export const IcChevronRight = wrap(ChevronRight);

// ── Draw panel icons (Lucide) ──────────────────────────────
export const IcPalette = wrap(Palette);
export const IcFlatPaint = wrap(PaintBucket);
export const IcLitForm = wrap(SunMedium);
export const IcGlow = wrap(Sun);
export const IcCutout = wrap(Scissors);
export const IcStar = wrap(Star);
export const IcRuler = wrap(Ruler);
export const IcCurve = wrap(Spline);

// ── Select panel icons (Lucide) ────────────────────────────
export const IcLasso = wrap(CircleDashed);
export const IcReset = wrap(RotateCcw);
export const IcSnapGround = wrap(ArrowDownToLine);
export const IcCopy = wrap(Copy);
export const IcDelete = wrap(Trash2);
export const IcLock = wrap(Lock);
export const IcUnlock = wrap(Unlock);
export const IcEye = wrap(Eye);
export const IcEyeOff = wrap(EyeOff);
export const IcAxis = wrap(Move);
export const IcRefresh = wrap(RefreshCw);
export const IcCheck = wrap(Check);
export const IcSparkle = wrap(Atom);
export const IcCompass = wrap(Compass);

// ── Create panel icons (primitives - Lucide) ────────────────
export const IcCube = wrap(Box);
export const IcSphere = wrap(Circle);
export const IcCylinder = wrap(Cylinder);
export const IcTorus = wrap(Torus);
export const IcCapsule = wrap(Cylinder);
export const IcCone = wrap(Triangle);
export const IcPyramid = wrap(Triangle);
export const IcDisk = wrap(Circle);
export const IcPlane = wrap(Square);
export const IcModelLibrary = wrap(Folder);
export const IcImport = wrap(Upload);
export const IcTexture = wrap(Palette);
export const IcClay = wrap(Droplet);
export const IcOrigin = wrap(Focus);

// ── Deform panel icons (Lucide) ─────────────────────────────
export const IcMove = wrap(Move);
export const IcGuide = wrap(Spline);
export const IcMirror = wrap(FlipHorizontal2);
export const IcSimplify = wrap(Scissors);
export const IcCamera = wrap(Camera);
export const IcBend = wrap(Spline);
export const IcArmature = wrap(User);
export const IcMirrorSettings = wrap(FlipHorizontal2);
export const IcAlignView = wrap(Box);
export const IcSimplifySettings = wrap(Scissors);
export const IcQuickSimplify = wrap(Scissors);

// ── Brush type icons (Lucide) ───────────────────────────────
export const IcBrushClay = wrap(Droplet);
export const IcBrushBuild = wrap(Box);
export const IcBrushMove = wrap(Move);
export const IcBrushInflate = wrap(Maximize);
export const IcBrushPinch = wrap(Minus);
export const IcBrushCrease = wrap(Spline);
export const IcBrushFlatten = wrap(ArrowDownNarrowWide);
export const IcBrushSmooth = wrap(Spline);
export const IcBrushRibbon = wrap(PaintbrushVertical);
export const IcBrushTube = wrap(Cylinder);
export const IcBrushMarker = wrap(Pencil);
export const IcBrushWire = wrap(Activity);
export const IcBrushNeon = wrap(Zap);
export const IcBrushStipple = wrap(Grid);

export const BRUSH_ICON_MAP: Record<string, React.FC<IP>> = {
  clay: IcBrushClay,
  build: IcBrushBuild,
  move: IcBrushMove,
  inflate: IcBrushInflate,
  pinch: IcBrushPinch,
  crease: IcBrushCrease,
  flatten: IcBrushFlatten,
  smooth: IcBrushSmooth,
  streamline_ink: IcBrushRibbon,
  spatial_pipe: IcBrushTube,
  chisel_marker: IcBrushMarker,
  drafting_wire: IcBrushWire,
  neon_cable: IcBrushNeon,
  stipple_texture: IcBrushStipple,
};

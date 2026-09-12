import React from 'react';
import {
  CursorPointer,
  DesignPencil,
  Erase,
  ColorPicker,
  ViewGrid,
  Axes,
  MultiplePages,
  SunLight,
  BoxIso,
  Undo,
  Redo,
  FloppyDisk,
  Folder,
  Settings,
  Expand,
  Collapse,
  NavArrowRight,
  Palette,
  FillColor,
  MagicWand,
  Cut,
  Star,
  Ruler,
  CurveArray,
  SelectWindow,
  Restart,
  Copy,
  Trash,
  Lock,
  LockSlash,
  Eye,
  EyeClosed,
  Refresh,
  Check,
  Compass,
  Cube,
  Sphere,
  Cylinder,
  Import,
  Mirror,
  Camera,
  Activity,
  Flash,
  DesignNib,
  AlignBottomBox,
  Box3dThreePoints,
  Compress,
  CompressLines,
  CubeDots,
  DeCompress,
  Drag,
  Droplet,
  ProjectCurve3d,
  Reduce,
  ScaleFrameEnlarge,
  SelectPoint3d,
  SineWave,
  Sparks,
  ViewStructureDown,
  Accessibility,
  CompactDisc,
  ConstrainedSurface,
  ExpandLines,
  Triangle,
} from 'iconoir-react';

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

// ── Rail icons ──────────────────────────────────────────────
export const IcPointer = wrap(CursorPointer);
export const IcDraw = wrap(DesignPencil);
export const IcErase = wrap(Erase);
export const IcSample = wrap(ColorPicker);
export const IcCreate = wrap(Box3dThreePoints);
export const IcDeform = wrap(ScaleFrameEnlarge);
export const IcLayers = wrap(ViewStructureDown);
export const IcSun = wrap(SunLight);

// ── Top bar icons (Iconoir) ─────────────────────────────────
export const IcScene = wrap(BoxIso);
export const IcUndo = wrap(Undo);
export const IcRedo = wrap(Redo);
export const IcSave = wrap(FloppyDisk);
export const IcSessions = wrap(Folder);
export const IcSettings = wrap(Settings);
export const IcFullscreen = wrap(Expand);
export const IcExitFullscreen = wrap(Collapse);
export const IcIllumination = wrap(SunLight);

// ── Chevrons / collapse (Iconoir) ───────────────────────────
export const IcChevronRight = wrap(NavArrowRight);

// ── Draw panel icons (Iconoir) ──────────────────────────────
export const IcPalette = wrap(Palette);
export const IcFlatPaint = wrap(FillColor);
export const IcLitForm = wrap(MagicWand);
export const IcGlow = wrap(SunLight);
export const IcCutout = wrap(Cut);
export const IcStar = wrap(Star);
export const IcRuler = wrap(Ruler);
export const IcCurve = wrap(CurveArray);

// ── Select panel icons (Iconoir) ────────────────────────────
export const IcLasso = wrap(SelectWindow);
export const IcReset = wrap(Restart);
export const IcSnapGround = wrap(AlignBottomBox);
export const IcCopy = wrap(Copy);
export const IcDelete = wrap(Trash);
export const IcLock = wrap(Lock);
export const IcUnlock = wrap(LockSlash);
export const IcEye = wrap(Eye);
export const IcEyeOff = wrap(EyeClosed);
export const IcAxis = wrap(Axes);
export const IcRefresh = wrap(Refresh);
export const IcCheck = wrap(Check);
export const IcSparkle = wrap(Sparks);
export const IcCompass = wrap(Compass);

// ── Create panel icons (primitives) ─────────────────────────
export const IcCube = wrap(Cube);
export const IcSphere = wrap(Sphere);
export const IcCylinder = wrap(Cylinder);
export const IcTorus = wrap(CompactDisc);
export const IcCapsule = wrap(Cylinder);
export const IcCone = wrap(Triangle);
export const IcPyramid = wrap(Triangle);
export const IcDisk = wrap(CompactDisc);
export const IcModelLibrary = wrap(Folder);
export const IcImport = wrap(Import);
export const IcTexture = wrap(Palette);
export const IcClay = wrap(Droplet);
export const IcOrigin = wrap(SelectPoint3d);

// ── Deform panel icons ──────────────────────────────────────
export const IcMove = wrap(Axes);
export const IcGuide = wrap(ProjectCurve3d);
export const IcMirror = wrap(Mirror);
export const IcSimplify = wrap(CompressLines);
export const IcCamera = wrap(Camera);
export const IcBend = wrap(ProjectCurve3d);
export const IcArmature = wrap(Accessibility);
export const IcMirrorSettings = wrap(Mirror);
export const IcAlignView = wrap(Camera);
export const IcSimplifySettings = wrap(CompressLines);
export const IcQuickSimplify = wrap(CompressLines);

// ── Brush type icons ────────────────────────────────────────
export const IcBrushClay = wrap(Droplet);

export const IcBrushBuild = wrap(ExpandLines);

export const IcBrushMove = wrap(Drag);

export const IcBrushInflate = wrap(DeCompress);

export const IcBrushPinch = wrap(Compress);

export const IcBrushCrease = wrap(ConstrainedSurface);

export const IcBrushFlatten = wrap(Reduce);

export const IcBrushSmooth = wrap(SineWave);

export const IcBrushRibbon = wrap(ProjectCurve3d);
export const IcBrushTube = wrap(Cylinder);
export const IcBrushMarker = wrap(DesignNib);
export const IcBrushWire = wrap(Activity);
export const IcBrushNeon = wrap(Flash);
export const IcBrushStipple = wrap(CubeDots);

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

import React from 'react';
import * as Iconoir from 'iconoir-react';

export interface LucideProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
  color?: string;
  className?: string;
}

export type LucideIcon = React.FC<LucideProps>;

const w = (Component: React.ComponentType<any>): LucideIcon => {
  const Wrapped: React.FC<LucideProps> = ({
    size,
    strokeWidth = 1.5,
    color = 'currentColor',
    className = '',
    style,
    ...rest
  }) => {
    return (
      <Component
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        color={color}
        className={className}
        style={style}
        {...rest}
      />
    );
  };
  Wrapped.displayName = Component?.displayName || 'IconoirLucideIcon';
  return Wrapped;
};

// ── Mapped Icons (100% Iconoir replacements) ────────────────
export const Activity = w(Iconoir.Activity);
export const AlertCircle = w(Iconoir.WarningCircle);
export const ArrowDown = w(Iconoir.ArrowDown);
export const ArrowLeft = w(Iconoir.ArrowLeft);
export const ArrowRight = w(Iconoir.ArrowRight);
export const ArrowUp = w(Iconoir.ArrowUp);
export const Bookmark = w(Iconoir.Bookmark);
export const Box = w(Iconoir.Cube);
export const Camera = w(Iconoir.Camera);
export const Car = w(Iconoir.Car);
export const Check = w(Iconoir.Check);
export const CheckCircle = w(Iconoir.CheckCircle);
export const CheckCircle2 = w(Iconoir.CheckCircle);
export const ChevronDown = w(Iconoir.NavArrowDown);
export const ChevronLeft = w(Iconoir.NavArrowLeft);
export const ChevronRight = w(Iconoir.NavArrowRight);
export const ChevronUp = w(Iconoir.NavArrowUp);
export const Circle = w(Iconoir.Circle);
export const Clipboard = w(Iconoir.ClipboardCheck);
export const Clock = w(Iconoir.Clock);
export const Cloud = w(Iconoir.Cloud);
export const CloudFog = w(Iconoir.Fog);
export const CloudRain = w(Iconoir.Rain);
export const CloudSun = w(Iconoir.CloudSunny);
export const Compass = w(Iconoir.Compass);
export const Contrast = w(Iconoir.HalfMoon);
export const Copy = w(Iconoir.Copy);
export const CornerDownRight = w(Iconoir.ArrowDownRight);
export const Cpu = w(Iconoir.Cpu);
export const Crosshair = w(Iconoir.CenterAlign);
export const Cuboid = w(Iconoir.BoxIso);
export const Delete = w(Iconoir.Erase);
export const Download = w(Iconoir.Download);
export const Droplet = w(Iconoir.Droplet);
export const Edit2 = w(Iconoir.EditPencil);
export const Edit3 = w(Iconoir.DesignPencil);
export const Expand = w(Iconoir.Expand);
export const Eye = w(Iconoir.Eye);
export const EyeOff = w(Iconoir.EyeClosed);
export const FileCode = w(Iconoir.Code);
export const Film = w(Iconoir.MediaVideo);
export const Flame = w(Iconoir.FireFlame);
export const Folder = w(Iconoir.Folder);
export const FolderArchive = w(Iconoir.Archive);
export const FolderDown = w(Iconoir.Folder);
export const FolderHeart = w(Iconoir.Folder);
export const FolderOpen = w(Iconoir.Folder);
export const FolderPlus = w(Iconoir.FolderPlus);
export const FolderTree = w(Iconoir.FolderSettings);
export const Gauge = w(Iconoir.DashboardSpeed);
export const Glasses = w(Iconoir.Glasses);
export const Grid = w(Iconoir.ViewGrid);
export const GripHorizontal = w(Iconoir.MoreHoriz);
export const GripVertical = w(Iconoir.MoreVert);
export const Hand = w(Iconoir.DragHandGesture);
export const HardDrive = w(Iconoir.HardDrive);
export const Hash = w(Iconoir.Hashtag);
export const HelpCircle = w(Iconoir.HelpCircle);
export const Image = w(Iconoir.MediaImage);
export const Info = w(Iconoir.InfoCircle);
export const Layers = w(Iconoir.ViewStructureDown);
export const Layers2 = w(Iconoir.ViewStructureDown);
export const Loader2 = w(Iconoir.SystemRestart);
export const Lock = w(Iconoir.Lock);
export const Magnet = w(Iconoir.Magnet);
export const Maximize = w(Iconoir.Expand);
export const Maximize2 = w(Iconoir.Expand);
export const Minimize = w(Iconoir.Collapse);
export const Minimize2 = w(Iconoir.Collapse);
export const Minus = w(Iconoir.Minus);
export const Monitor = w(Iconoir.PcCheck);
export const Moon = w(Iconoir.HalfMoon);
export const MoreHorizontal = w(Iconoir.MoreHoriz);
export const MoreVertical = w(Iconoir.MoreVert);
export const Move = w(Iconoir.Axes);
export const MoveHorizontal = w(Iconoir.ArrowSeparate);
export const MoveVertical = w(Iconoir.ArrowSeparateVertical);
export const Paintbrush = w(Iconoir.DesignPencil);
export const Palette = w(Iconoir.Palette);
export const PanelLeft = w(Iconoir.SidebarExpand);
export const Pause = w(Iconoir.Pause);
export const PenTool = w(Iconoir.DesignNib);
export const Pin = w(Iconoir.Pin);
export const PinOff = w(Iconoir.PinSlash);
export const Pipette = w(Iconoir.ColorPicker);
export const Play = w(Iconoir.Play);
export const Plus = w(Iconoir.Plus);
export const Redo = w(Iconoir.Redo);
export const Redo2 = w(Iconoir.Redo);
export const RefreshCw = w(Iconoir.Refresh);
export const RotateCcw = w(Iconoir.RotateCameraLeft);
export const RotateCw = w(Iconoir.RotateCameraRight);
export const Ruler = w(Iconoir.Ruler);
export const Save = w(Iconoir.FloppyDisk);
export const Scissors = w(Iconoir.Cut);
export const Search = w(Iconoir.Search);
export const Settings = w(Iconoir.Settings);
export const Shapes = w(Iconoir.Box3dThreePoints);
export const Shield = w(Iconoir.Shield);
export const ShieldAlert = w(Iconoir.ShieldAlert);
export const ShieldCheck = w(Iconoir.ShieldCheck);
export const Shrink = w(Iconoir.Collapse);
export const Shuffle = w(Iconoir.Shuffle);
export const Sliders = w(Iconoir.Settings);
export const SlidersHorizontal = w(Iconoir.Settings);
export const Smartphone = w(Iconoir.SmartphoneDevice);
export const Sparkles = w(Iconoir.Sparks);
export const Spline = w(Iconoir.ProjectCurve3d);
export const Square = w(Iconoir.Frame);
export const Sun = w(Iconoir.SunLight);
export const SunMedium = w(Iconoir.SunLight);
export const Sunrise = w(Iconoir.SunLight);
export const Sunset = w(Iconoir.SunLight);
export const Tablet = w(Iconoir.PenTablet);
export const Tag = w(Iconoir.Label);
export const Touchpad = w(Iconoir.SquareCursor);
export const Trash = w(Iconoir.Trash);
export const Trash2 = w(Iconoir.Trash);
export const Tv = w(Iconoir.Tv);
export const Undo = w(Iconoir.Undo);
export const Undo2 = w(Iconoir.Undo);
export const Unlock = w(Iconoir.LockSlash);
export const Upload = w(Iconoir.Upload);
export const User = w(Iconoir.User);
export const Volume2 = w(Iconoir.SoundHigh);
export const Wand2 = w(Iconoir.MagicWand);
export const Waves = w(Iconoir.CurveArray);
export const Wind = w(Iconoir.Wind);
export const X = w(Iconoir.Xmark);
export const Zap = w(Iconoir.Flash);
export const ZoomIn = w(Iconoir.ZoomIn);
export const ZoomOut = w(Iconoir.ZoomOut);

// Default export for safety
export default {
  Activity, AlertCircle, ArrowDown, ArrowLeft, ArrowRight, ArrowUp,
  Bookmark, Box, Camera, Car, Check, CheckCircle, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Circle, Clipboard,
  Clock, Cloud, CloudFog, CloudRain, CloudSun, Compass, Contrast, Copy,
  CornerDownRight, Cpu, Crosshair, Cuboid, Delete, Download, Droplet,
  Edit2, Edit3, Expand, Eye, EyeOff, FileCode, Film, Flame, Folder,
  FolderArchive, FolderDown, FolderHeart, FolderOpen, FolderPlus,
  FolderTree, Gauge, Glasses, Grid, GripHorizontal, GripVertical, Hand,
  HardDrive, Hash, HelpCircle, Image, Info, Layers, Layers2, Loader2,
  Lock, Magnet, Maximize, Maximize2, Minimize, Minimize2, Minus, Monitor,
  Moon, MoreHorizontal, MoreVertical, Move, MoveHorizontal, MoveVertical,
  Paintbrush, Palette, PanelLeft, Pause, PenTool, Pin, PinOff, Pipette,
  Play, Plus, Redo, Redo2, RefreshCw, RotateCcw, RotateCw, Ruler, Save,
  Scissors, Search, Settings, Shapes, Shield, ShieldAlert, ShieldCheck,
  Shrink, Shuffle, Sliders, SlidersHorizontal, Smartphone, Sparkles,
  Spline, Square, Sun, SunMedium, Sunrise, Sunset, Tablet, Tag, Touchpad,
  Trash, Trash2, Tv, Undo, Undo2, Unlock, Upload, User, Volume2, Wand2,
  Waves, Wind, X, Zap, ZoomIn, ZoomOut,
};

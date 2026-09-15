import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import {
  Atom,
  Box,
  Check,
  ChevronDown,
  Copy,
  Layers,
  Maximize2,
  Minimize2,
  Paintbrush,
  Palette,
  Pin,
  Pipette,
  Sliders,
  SunMedium,
  X,
  Zap,
} from 'lucide-react';
import {
  generateHarmonies,
  generateOKLCHGradient,
  hexToOklch,
  hexToRgb,
  hsvToRgb,
  oklchToHex,
  posterizeOKLCH,
  rgbToHex,
  rgbToHsv,
} from '../core/colorMath';
import { normalizeHexColor } from '../core/materialCache';
import { ALL_MATERIAL_PRESETS, createMatCap } from '../presets/materialPresets';
import { BrushSettings } from '../types';
import { haptics } from '../utils/haptics';
import { MenuSegmentedToggle, getMenuSurfaceClasses } from './ui/MenuPrimitives';

interface ColorStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** True while this panel intentionally leaves the canvas and its chrome usable. */
  onInteractionModeChange?: (allowsWorkspaceInteraction: boolean) => void;
  currentColor: string;
  onChangeColor: (hex: string) => void;
  onApplyBrushSettings?: (settings: Partial<BrushSettings>) => void;
  onApplyToModel?: (material: THREE.Material) => void;
  onSampleFromScreen?: () => void;
  theme?: 'light' | 'dark';
  activeLookName?: string;
  currentMatcapUrl?: string;
  materialType?: string;
}

export interface RecentStudioItem {
  type: 'color' | 'shader';
  hex?: string;
  presetId?: string;
  name?: string;
  url?: string;
}

type TabType = 'wheel' | 'oklch' | 'harmonies' | 'shaders';
type HarmonyMode = 'complementary' | 'analogous';

const WHEEL_SIZE = 176;
const RING_WIDTH = 18;
const LAST_USED_COLORS_STORAGE_KEY = 'remix3d.colorStudioLastUsed';
const CURATED_PALETTES = {
  'Drafting Neon': ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185', '#34d399', '#facc15'],
  'Clay & Terracotta': ['#b45309', '#d97706', '#f59e0b', '#78350f', '#92400e', '#ea580c', '#c2410c'],
  'Nordic Architecture': ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#f8fafc'],
  'Cyberpunk Synth': ['#06b6d4', '#ec4899', '#8b5cf6', '#10b981', '#f43f5e', '#a855f7', '#3b82f6'],
  'Monochrome & Ink': ['#000000', '#18181b', '#27272a', '#52525b', '#71717a', '#a1a1aa', '#ffffff'],
};
const QUICK_SHADER_NAMES = [
  'Flat Graphic White',
  'Toon Classic 2-Tone',
  'Crystal Clear Glass',
  'Prism Rainbow Glass',
  'Summer Ocean Water',
  'Polished Gold Ingot',
  'Burnished Copper',
  'Electric Neon Cyan',
  'Hot Molten Lava',
  'Toon Manga Ink & White',
];
const QUICK_SHADER_LABEL_MAP: Record<string, string> = {
  'Flat Graphic White': 'Clay',
  'Toon Classic 2-Tone': 'Toon',
  'Crystal Clear Glass': 'Gloss',
  'Prism Rainbow Glass': 'Prism',
  'Summer Ocean Water': 'Water',
  'Polished Gold Ingot': 'Metal',
  'Burnished Copper': 'Copper',
  'Electric Neon Cyan': 'Glow',
  'Hot Molten Lava': 'Lava',
  'Toon Manga Ink & White': 'Ink',
};
const PRESET_REPRESENTATIVE_COLORS: Record<string, string> = {
  'Flat Graphic White': '#ffffff',
  'Toon Classic 2-Tone': '#e0e7ff',
  'Crystal Clear Glass': '#67e8f9',
  'Prism Rainbow Glass': '#f472b6',
  'Summer Ocean Water': '#38bdf8',
  'Polished Gold Ingot': '#facc15',
  'Burnished Copper': '#fb923c',
  'Electric Neon Cyan': '#00f7ff',
  'Hot Molten Lava': '#ff4500',
  'Toon Manga Ink & White': '#27272a',
};
const DEFAULT_VERTEX_SHADER = `
precision mediump float;
varying vec3 v_normal;
varying vec2 v_uv;
void main() {
  v_normal = normalize(normalMatrix * normal);
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const ColorStudioModal: React.FC<ColorStudioModalProps> = ({
  isOpen,
  onClose,
  onInteractionModeChange,
  currentColor,
  onChangeColor,
  onApplyBrushSettings,
  onApplyToModel,
  onSampleFromScreen,
  theme = 'dark',
  brushSettings,
  activeLookName: propActiveLookName,
  currentMatcapUrl: propCurrentMatcapUrl,
  materialType: propMaterialType,
}) => {
  const isLight = theme === 'light';
  const effectiveActiveLookName = propActiveLookName ?? brushSettings?.activeLookName;
  const effectiveMaterialType = propMaterialType ?? brushSettings?.materialType;
  const effectivePreviewUrl = propCurrentMatcapUrl ?? brushSettings?.previewUrl ?? brushSettings?.matcapUrl;

  const [activeTab, setActiveTab] = useState<TabType>('wheel');
  const [isPinned, setIsPinned] = useState(() => {
    try {
      return localStorage.getItem('remix3d.colorStudioPinned') === 'true';
    } catch {
      return false;
    }
  });
  const [isMiniMode, setIsMiniMode] = useState(() => {
    try {
      return localStorage.getItem('remix3d.colorStudioMini') === 'true';
    } catch {
      return false;
    }
  });
  // A pinned studio is explicitly a companion panel ("Keep open while drawing").
  // A collapsed studio is also non-blocking. Everything else is a real modal and
  // must catch canvas input behind it.
  const allowsWorkspaceInteraction = isPinned || isMiniMode;

  useEffect(() => {
    onInteractionModeChange?.(allowsWorkspaceInteraction);
  }, [allowsWorkspaceInteraction, onInteractionModeChange]);
  const toggleMiniMode = () => {
    setIsMiniMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('remix3d.colorStudioMini', String(next));
      } catch {}
      return next;
    });
  };
  const [copiedHex, setCopiedHex] = useState(false);
  const [secondaryColor, setSecondaryColor] = useState('#f43f5e');
  const [hsv, setHsv] = useState({ h: 200, s: 0.8, v: 0.9 });
  const [oklch, setOklch] = useState({ L: 0.7, C: 0.15, h: 220 });
  const [posterizeSteps, setPosterizeSteps] = useState(4);
  const [showPosterize, setShowPosterize] = useState(false);
  const [showPalettes, setShowPalettes] = useState(false);
  const [paletteName, setPaletteName] = useState<keyof typeof CURATED_PALETTES>('Drafting Neon');
  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>('analogous');
  const [showUniforms, setShowUniforms] = useState(false);
  const [shaderTarget, setShaderTarget] = useState<'brush' | 'model'>('brush');
  const wheelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const draggingWheel = useRef(false);
  const draggingSquare = useRef(false);
  const hsvRef = useRef(hsv);

  const allShaders = useMemo(() => {
    const quickIds = new Set<string>();
    const ordered: any[] = [];

    QUICK_SHADER_NAMES.forEach((name) => {
      const found = (ALL_MATERIAL_PRESETS as any[]).find((preset) => preset.name === name);
      if (found && !quickIds.has(found.id)) {
        quickIds.add(found.id);
        ordered.push(found);
      }
    });

    (ALL_MATERIAL_PRESETS as any[]).forEach((preset) => {
      if (!quickIds.has(preset.id)) {
        quickIds.add(preset.id);
        ordered.push(preset);
      }
    });

    return ordered;
  }, []);

  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    if (effectiveActiveLookName && effectiveActiveLookName !== 'Flat Paint' && effectiveMaterialType !== 'shadeless') {
      const match = allShaders.find((s) => s.name === effectiveActiveLookName || s.id === effectiveActiveLookName);
      if (match) return match.id;
    }
    return '';
  });
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const noticeTimeoutRef = useRef<number | null>(null);
  const isApplyingPresetRef = useRef(false);

  useEffect(() => {
    if (effectiveActiveLookName && effectiveActiveLookName !== 'Flat Paint' && effectiveMaterialType !== 'shadeless') {
      const match = allShaders.find((s) => s.name === effectiveActiveLookName || s.id === effectiveActiveLookName);
      if (match) setSelectedPresetId(match.id);
    } else if (effectiveMaterialType === 'shadeless' || !effectiveActiveLookName || effectiveActiveLookName === 'Flat Paint') {
      setSelectedPresetId('');
    }
  }, [effectiveActiveLookName, effectiveMaterialType, allShaders]);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
    };
  }, []);
  const [shaderRoughness, setShaderRoughness] = useState<number>(0.5);
  const [shaderMetalness, setShaderMetalness] = useState<number>(0.1);
  const [shaderRimPower, setShaderRimPower] = useState<number>(0.8);
  const lastSolidColorRef = useRef(normalizeHexColor(currentColor, '#38bdf8'));

  const [recentItems, setRecentItems] = useState<RecentStudioItem[]>(() => {
    const activeHex = normalizeHexColor(currentColor, '#38bdf8').toLowerCase();
    const fallback: RecentStudioItem[] = [{ type: 'color', hex: activeHex }];
    try {
      const stored = JSON.parse(localStorage.getItem(LAST_USED_COLORS_STORAGE_KEY) || '[]');
      if (Array.isArray(stored)) {
        const parsed: RecentStudioItem[] = [];
        for (const item of stored) {
          if (typeof item === 'string' && /^#[0-9a-fA-F]{6}$/.test(item)) {
            parsed.push({ type: 'color', hex: item.toLowerCase() });
          } else if (item && typeof item === 'object') {
            if (item.type === 'shader' && (item.presetId || item.name)) {
              parsed.push({
                type: 'shader',
                presetId: item.presetId,
                name: item.name,
                url: item.url,
                hex: item.hex,
              });
            } else if (item.type === 'color' && typeof item.hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(item.hex)) {
              parsed.push({ type: 'color', hex: item.hex.toLowerCase() });
            }
          }
        }
        if (parsed.length > 0) {
          return parsed.slice(0, 6);
        }
      }
    } catch {}
    return fallback;
  });

  const rememberShader = useCallback((preset: any) => {
    if (!preset) return;
    const representativeColor =
      preset.color ||
      PRESET_REPRESENTATIVE_COLORS[preset.name] ||
      (preset.category === 'Bright Colors' ? '#00f7ff' : undefined) ||
      '#00f7ff';
    const previewUrl = preset.url || (typeof preset.generate === 'function' ? createMatCap(preset.generate) : undefined);
    const label = QUICK_SHADER_LABEL_MAP[preset.name] ?? preset.name;

    const newItem: RecentStudioItem = {
      type: 'shader',
      presetId: preset.id,
      name: label,
      url: previewUrl,
      hex: representativeColor,
    };

    setRecentItems((previous) => {
      const filtered = previous.filter(
        (it) => !(it.type === 'shader' && (it.presetId === preset.id || it.name === label))
      );
      const next = [newItem, ...filtered].slice(0, 6);
      try {
        localStorage.setItem(LAST_USED_COLORS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const rememberColor = useCallback((hex: string) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    const normalized = hex.toLowerCase();
    const newItem: RecentStudioItem = {
      type: 'color',
      hex: normalized,
    };

    setRecentItems((previous) => {
      const filtered = previous.filter(
        (it) => !(it.type === 'color' && it.hex?.toLowerCase() === normalized)
      );
      const next = [newItem, ...filtered].slice(0, 6);
      try {
        localStorage.setItem(LAST_USED_COLORS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleUniformChange = (type: 'roughness' | 'metalness' | 'rim', value: number) => {
    if (type === 'roughness') {
      setShaderRoughness(value);
      onApplyBrushSettings?.({ roughness: value });
    } else if (type === 'metalness') {
      setShaderMetalness(value);
      onApplyBrushSettings?.({ metalness: value });
    } else if (type === 'rim') {
      setShaderRimPower(value);
      onApplyBrushSettings?.({ emissiveIntensity: value });
    }
  };

  const togglePinned = () => {
    setIsPinned((previous) => {
      const next = !previous;
      try {
        localStorage.setItem('remix3d.colorStudioPinned', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    // The gesture's unrounded HSV is authoritative until the pointer lifts.
    // Feeding our RGB preview back into it can shift the handle or lose hue
    // while crossing grayscale/black.
    if (draggingWheel.current || draggingSquare.current) return;
    const validHex = normalizeHexColor(currentColor, '#38bdf8');
    const rgb = hexToRgb(validHex);
    const nextHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    if (nextHsv.s === 0) nextHsv.h = hsvRef.current.h;
    setHsv(nextHsv);
    const rawOklch = hexToOklch(validHex);
    setOklch({ L: rawOklch.L, C: rawOklch.C, h: Math.round((rawOklch.h * 180) / Math.PI) });
    hsvRef.current = nextHsv;
  }, [currentColor]);

  const prevIsOpenRef = useRef(isOpen);
  useEffect(() => {
    if (!prevIsOpenRef.current && isOpen) {
      setActiveTab('wheel');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const showColorPicker = () => setActiveTab('wheel');
    window.addEventListener('remix3d:color-studio-wheel', showColorPicker);
    return () => window.removeEventListener('remix3d:color-studio-wheel', showColorPicker);
  }, []);

  useEffect(() => {
    const closeColorStudio = () => onClose();
    window.addEventListener('remix3d:close-color-studio', closeColorStudio);
    return () => window.removeEventListener('remix3d:close-color-studio', closeColorStudio);
  }, [onClose]);

  const applyColor = useCallback((hex: string, commitToHistory = true) => {
    setSelectedPresetId('');
    lastSolidColorRef.current = hex;
    onChangeColor(hex);
    onApplyBrushSettings?.({
      color: hex,
      solidColor: hex,
      materialType: 'shadeless',
      shaderEffect: undefined,
      customShader: undefined,
      matcapUrl: undefined,
      matcapTexture: undefined,
      previewUrl: undefined,
      activeLookName: 'Flat Paint',
    });
    if (commitToHistory) rememberColor(hex);
  }, [onApplyBrushSettings, onChangeColor, rememberColor]);

  const applyHsv = (next: { h: number; s: number; v: number }, commitToHistory = false) => {
    hsvRef.current = next;
    // Paint the handle before notifying the heavier workspace/brush state.
    renderWheel();
    setHsv(next);
    const rgb = hsvToRgb(next.h, next.s, next.v);
    applyColor(rgbToHex(rgb.r, rgb.g, rgb.b), commitToHistory);
  };

  const radius = WHEEL_SIZE / 2;
  const innerRadius = radius - RING_WIDTH;
  const squareSize = innerRadius * Math.SQRT2 - 12;
  const renderWheel = useCallback(() => {
    const canvas = wheelCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const hsv = hsvRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WHEEL_SIZE * dpr;
    canvas.height = WHEEL_SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);
    const center = WHEEL_SIZE / 2;
    if (typeof ctx.createConicGradient === 'function') {
      // One continuous ring avoids antialiased seams between 360 wedges.
      const ringGradient = ctx.createConicGradient(0, center, center);
      for (let i = 0; i <= 360; i += 60) {
        const rgb = hsvToRgb(i % 360, 1, 1);
        ringGradient.addColorStop(i / 360, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
      }
      ctx.beginPath();
      ctx.arc(center, center, (radius + innerRadius) / 2, 0, Math.PI * 2);
      ctx.lineWidth = radius - innerRadius - 4;
      ctx.strokeStyle = ringGradient;
      ctx.stroke();
    } else for (let i = 0; i < 360; i += 1) {
      const angle1 = ((i - 0.7) * Math.PI) / 180;
      const angle2 = ((i + 0.7) * Math.PI) / 180;
      ctx.beginPath();
      ctx.arc(center, center, radius - 2, angle1, angle2);
      ctx.arc(center, center, innerRadius + 2, angle2, angle1, true);
      ctx.closePath();
      const rgb = hsvToRgb(i, 1, 1);
      ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      ctx.fill();
    }
    const hueAngle = (hsv.h * Math.PI) / 180;
    const handleRadius = (radius + innerRadius) / 2;
    ctx.beginPath();
    ctx.arc(center + Math.cos(hueAngle) * handleRadius, center + Math.sin(hueAngle) * handleRadius, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#08090b';
    ctx.stroke();
    const sqX = center - squareSize / 2;
    const sqY = center - squareSize / 2;
    const pureHue = hsvToRgb(hsv.h, 1, 1);
    ctx.fillStyle = `rgb(${pureHue.r}, ${pureHue.g}, ${pureHue.b})`;
    ctx.fillRect(sqX, sqY, squareSize, squareSize);
    const white = ctx.createLinearGradient(sqX, sqY, sqX + squareSize, sqY);
    white.addColorStop(0, '#fff');
    white.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = white;
    ctx.fillRect(sqX, sqY, squareSize, squareSize);
    const black = ctx.createLinearGradient(sqX, sqY, sqX, sqY + squareSize);
    black.addColorStop(0, 'rgba(0,0,0,0)');
    black.addColorStop(1, '#000');
    ctx.fillStyle = black;
    ctx.fillRect(sqX, sqY, squareSize, squareSize);
    ctx.strokeStyle = isLight ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.22)';
    ctx.strokeRect(sqX, sqY, squareSize, squareSize);
    ctx.beginPath();
    ctx.arc(sqX + hsv.s * squareSize, sqY + (1 - hsv.v) * squareSize, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#08090b';
    ctx.stroke();
  }, [innerRadius, isLight, radius, squareSize]);

  useEffect(() => {
    if (isOpen && !isMiniMode && activeTab === 'wheel') renderWheel();
  }, [activeTab, isOpen, isMiniMode, hsv, renderWheel]);

  const pointerPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * WHEEL_SIZE) / rect.width - WHEEL_SIZE / 2,
      y: ((event.clientY - rect.top) * WHEEL_SIZE) / rect.height - WHEEL_SIZE / 2,
    };
  };
  const updateHue = (x: number, y: number) => {
    let angle = (Math.atan2(y, x) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    applyHsv({ ...hsvRef.current, h: angle });
  };
  const updateSatVal = (x: number, y: number) => applyHsv({
    ...hsvRef.current,
    s: Math.max(0, Math.min(1, (x + squareSize / 2) / squareSize)),
    v: Math.max(0, Math.min(1, 1 - (y + squareSize / 2) / squareSize)),
  });
  const handleWheelPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = pointerPosition(event);
    const distance = Math.hypot(x, y);
    if (distance >= innerRadius - 4 && distance <= radius + 4) {
      draggingWheel.current = true;
      updateHue(x, y);
    } else if (Math.abs(x) <= squareSize / 2 + 4 && Math.abs(y) <= squareSize / 2 + 4) {
      draggingSquare.current = true;
      updateSatVal(x, y);
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handleWheelPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingWheel.current && !draggingSquare.current) return;
    const { x, y } = pointerPosition(event);
    if (draggingWheel.current) updateHue(x, y);
    if (draggingSquare.current) updateSatVal(x, y);
  };
  const handleWheelPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingWheel.current || draggingSquare.current) {
      const { h, s, v } = hsvRef.current;
      const rgb = hsvToRgb(h, s, v);
      rememberColor(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    draggingWheel.current = false;
    draggingSquare.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleOklchChange = (channel: 'L' | 'C' | 'h', value: number) => {
    const next = { ...oklch, [channel]: value };
    setOklch(next);
    applyColor(oklchToHex({ L: next.L, C: next.C, h: (next.h * Math.PI) / 180 }), false);
  };

  const harmonies = useMemo(() => generateHarmonies(normalizeHexColor(currentColor, '#38bdf8')), [currentColor]);
  const harmonyColors = harmonies[harmonyMode];
  const gradient = useMemo(() => generateOKLCHGradient(
    normalizeHexColor(currentColor, '#38bdf8'),
    normalizeHexColor(secondaryColor, '#f43f5e'),
    9,
  ), [currentColor, secondaryColor]);
  const posterizedColor = useMemo(() => posterizeOKLCH(currentColor, posterizeSteps), [currentColor, posterizeSteps]);
  const applyPreset = (preset: any) => {
    if (!preset) return;
    try {
      haptics.trigger('medium');
    } catch {}
    isApplyingPresetRef.current = true;
    setSelectedPresetId(preset.id);
    rememberShader(preset);
    window.setTimeout(() => {
      isApplyingPresetRef.current = false;
    }, 500);
    const label = QUICK_SHADER_LABEL_MAP[preset.name] ?? preset.name;
    const targetName = shaderTarget === 'brush' ? 'Brush' : 'Model';
    setAppliedNotice(`Applied ${label} to ${targetName}`);
    if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
    noticeTimeoutRef.current = window.setTimeout(() => setAppliedNotice(null), 2500);

    const representativeColor =
      preset.color ||
      PRESET_REPRESENTATIVE_COLORS[preset.name] ||
      (preset.category === 'Bright Colors' ? '#00f7ff' : undefined) ||
      '#00f7ff';

    lastSolidColorRef.current = representativeColor;

    const previewUrl = preset.url || (typeof preset.generate === 'function' ? createMatCap(preset.generate) : undefined);

    if (preset.type === 'effect') {
      if (shaderTarget === 'brush') {
        const activeColor = preset.color || representativeColor;
        onChangeColor(activeColor);
        onApplyBrushSettings?.({
          materialType: 'animated_fx',
          shaderEffect: preset.effect,
          customShader: undefined,
          matcapUrl: previewUrl,
          previewUrl: previewUrl,
          matcapTexture: undefined,
          color: activeColor,
          solidColor: activeColor,
          roughness: 0.35,
          metalness: 0,
          emissiveIntensity: 1.5,
          opacity: 1,
          patternType: 'none',
          activeLookName: preset.name,
        });
      }
      return;
    }
    if (preset.type === 'shader') {
      if (shaderTarget === 'brush') {
        const activeColor = representativeColor;
        onChangeColor(activeColor);
        onApplyBrushSettings?.({
          materialType: 'animated_fx',
          shaderEffect: 'anime_cel',
          customShader: { id: preset.id, name: preset.name, vertexShader: preset.vertexShader, fragmentShader: preset.fragmentShader },
          // White is neutral for shaders that expose a color uniform; shaders
          // with authored colors keep their own palette unchanged.
          color: activeColor,
          solidColor: activeColor,
          roughness: 0.35,
          metalness: 0,
          emissiveIntensity: 1,
          opacity: 1,
          patternType: 'none',
          matcapUrl: previewUrl,
          previewUrl: previewUrl,
          matcapTexture: undefined,
          activeLookName: preset.name,
        });
      } else if (onApplyToModel) {
        onApplyToModel(new THREE.ShaderMaterial({
          vertexShader: preset.vertexShader || DEFAULT_VERTEX_SHADER,
          fragmentShader: preset.fragmentShader,
          uniforms: {
            u_time: { value: 0 }, time: { value: 0 }, iTime: { value: 0 }, uTime: { value: 0 },
            u_resolution: { value: new THREE.Vector2(512, 512) },
            resolution: { value: new THREE.Vector2(512, 512) },
            iResolution: { value: new THREE.Vector3(512, 512, 1) },
            u_mouse: { value: new THREE.Vector2(0, 0) }, iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
            uSunDir: { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() },
          },
          transparent: true,
          side: THREE.DoubleSide,
        }));
      }
      return;
    }

    const applyMatcapTextureAndSettings = (texture: THREE.Texture, url?: string, sampleCtx?: CanvasRenderingContext2D | null) => {
      texture.needsUpdate = true;
      let authoredColor = representativeColor;
      if (sampleCtx) {
        try {
          const pixel = sampleCtx.getImageData(256, 256, 1, 1).data;
          if (pixel[3] > 0 && (pixel[0] > 0 || pixel[1] > 0 || pixel[2] > 0)) {
            authoredColor = rgbToHex(pixel[0], pixel[1], pixel[2]);
          }
        } catch (_) {}
      }
      lastSolidColorRef.current = authoredColor;
      if (shaderTarget === 'brush') {
        onChangeColor(authoredColor);
        onApplyBrushSettings?.({
          materialType: 'matcap',
          matcapUrl: url,
          previewUrl: url,
          matcapTexture: texture,
          customShader: undefined,
          shaderEffect: undefined,
          color: authoredColor,
          solidColor: authoredColor,
          roughness: 0.5,
          metalness: 0,
          emissiveIntensity: preset.name?.toLowerCase().includes('glow') || preset.category === 'Bright Colors' ? 1.0 : 0,
          opacity: 1,
          patternType: 'none',
          activeLookName: preset.name,
        });
      } else {
        onApplyToModel?.(new THREE.MeshMatcapMaterial({ matcap: texture, color: 0xffffff }));
      }
    };

    if (typeof preset.generate === 'function') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d');
      if (context) {
        preset.generate(context, 512, 512);
        const dataUrl = canvas.toDataURL('image/png');
        const texture = new THREE.CanvasTexture(canvas);
        applyMatcapTextureAndSettings(texture, dataUrl, context);
        return;
      }
    }

    if (preset.url) {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        if (!context) return;
        context.drawImage(image, 0, 0, 512, 512);
        const texture = new THREE.CanvasTexture(canvas);
        applyMatcapTextureAndSettings(texture, preset.url, context);
      };
      image.src = preset.url;
      return;
    }
  };

  const handleSelectRecent = useCallback(
    (item: RecentStudioItem) => {
      if (item.type === 'shader') {
        const preset = allShaders.find((p) => p.id === item.presetId || p.name === item.name);
        if (preset) {
          applyPreset(preset);
        } else if (item.hex) {
          applyColor(item.hex);
        }
      } else if (item.hex) {
        applyColor(item.hex);
      }
    },
    [allShaders, applyColor, applyPreset]
  );

  const activeShaderPreset = useMemo(() => {
    if (!selectedPresetId) return null;
    return allShaders.find((preset) => preset.id === selectedPresetId) ?? null;
  }, [allShaders, selectedPresetId]);

  if (!isOpen) return null;

  const tabs: Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'wheel', label: 'Color', icon: Palette },
    { id: 'oklch', label: 'OKLCh', icon: Sliders },
    { id: 'harmonies', label: 'Harmony', icon: SunMedium },
    { id: 'shaders', label: 'Shader', icon: Atom },
  ];
  const activeTitle = tabs.find((tab) => tab.id === activeTab)?.label ?? 'Color';
  const shell = isLight
    ? 'bg-[#FAF9F5] border-black/15 text-neutral-900 shadow-[0_20px_55px_rgba(35,28,20,.18)]'
    : 'bg-[#14161a]/95 border-white/15 text-neutral-100 shadow-[0_24px_70px_rgba(0,0,0,.55)]';
  const quietText = isLight ? 'text-neutral-600' : 'text-neutral-400';
  const divider = isLight ? 'border-black/10' : 'border-white/10';
  const ghostButton = isLight ? 'text-neutral-700 hover:text-neutral-950 hover:bg-black/5' : 'text-neutral-400 hover:text-white hover:bg-white/5';
  const field = isLight ? 'border-black/15 bg-white text-neutral-900 shadow-xs' : 'border-white/15 bg-black/15 text-neutral-100';
  const slider = (label: string, valueLabel: string, input: React.ReactNode) => (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-[11px] font-semibold">
        <span className={isLight ? 'text-neutral-700' : 'text-neutral-300'}>{label}</span>
        <span className={`font-mono font-bold ${isLight ? 'text-neutral-900' : 'text-neutral-100'}`}>{valueLabel}</span>
      </span>
      {input}
    </label>
  );
  const baseColorControl = (description: string) => (
    <div className={`rounded-xl border p-2.5 ${isLight ? 'border-black/10 bg-black/[0.025]' : 'border-white/10 bg-white/[0.035]'}`}>
      <button
        type="button"
        onClick={() => setActiveTab('wheel')}
        className={`flex min-h-12 w-full items-center gap-2.5 rounded-lg px-1.5 text-left ${ghostButton}`}
        aria-label="Edit base color"
      >
        <span
          className={`h-10 w-10 shrink-0 rounded-full border overflow-hidden shadow-xs flex items-center justify-center ${isLight ? 'border-black/15' : 'border-white/20'}`}
          style={{ backgroundColor: currentColor }}
        >
          {activeShaderPreset?.url || effectivePreviewUrl ? (
            <img
              src={activeShaderPreset?.url || effectivePreviewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold">Base color</span>
          <span className="block font-mono text-[10px] font-bold opacity-65">{currentColor.toUpperCase()}</span>
        </span>
        <span className="text-[11px] font-semibold">Edit color</span>
      </button>
      <p className={`mt-1 px-1.5 text-[10px] leading-4 ${quietText}`}>{description}</p>
    </div>
  );

  return createPortal(
    <div
      data-pinned={isPinned ? 'true' : 'false'}
      className={`paperrocket-modal-overlay paperrocket-color-studio-overlay--side fixed inset-0 z-50 flex items-center justify-start p-2.5 sm:p-4 animate-in fade-in duration-150 ${
        allowsWorkspaceInteraction ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
    >
      <section
        id="mody-color-studio-modal"
        data-theme={theme}
        data-menu-width="wide"
        role={allowsWorkspaceInteraction ? 'region' : 'dialog'}
        aria-modal={allowsWorkspaceInteraction ? undefined : true}
        aria-label="Color studio"
        onClick={(event) => event.stopPropagation()}
        className={`paperrocket-color-studio pointer-events-auto relative flex w-full sm:w-[min(var(--studio-menu-wide),calc(100vw-20px))] sm:max-w-[var(--studio-menu-wide)] flex-col overflow-hidden rounded-t-3xl sm:rounded-[18px] border select-none ${shell}`}
        style={{ maxHeight: isMiniMode ? 'auto' : 'min(76dvh, 560px)' }}
      >
        <header className={`shrink-0 flex min-h-12 sm:min-h-14 items-center justify-between border-b px-3 ${divider}`}>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span
              className={`h-9 w-9 shrink-0 rounded-full border overflow-hidden shadow-xs flex items-center justify-center ${
                isLight ? 'border-black/20' : 'border-white/20'
              }`}
              style={{ backgroundColor: currentColor }}
            >
              {activeShaderPreset?.url || effectivePreviewUrl ? (
                <img
                  src={activeShaderPreset?.url || effectivePreviewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
            </span>
            {!isMiniMode && (
              <div className="min-w-0 flex-1 pr-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="truncate text-xs sm:text-sm font-semibold leading-tight">
                    {activeShaderPreset
                      ? (QUICK_SHADER_LABEL_MAP[activeShaderPreset.name] ?? activeShaderPreset.name)
                      : activeTitle}
                  </h2>
                  {effectiveActiveLookName && effectiveActiveLookName !== 'Flat Paint' && !activeShaderPreset && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 truncate max-w-[100px]">
                      {effectiveActiveLookName}
                    </span>
                  )}
                </div>
                <input
                  aria-label="Hex color"
                  value={currentColor.toUpperCase()}
                  onChange={(event) => {
                    const next = event.target.value;
                    if (/^#[0-9a-fA-F]{6}$/.test(next)) applyColor(next);
                    else onChangeColor(next);
                  }}
                  className={`mt-0.5 block w-20 border-0 bg-transparent p-0 font-mono text-[10px] sm:text-[11px] font-bold leading-tight outline-none ${isLight ? 'text-neutral-800' : 'text-neutral-200'}`}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={toggleMiniMode}
              className={`grid h-8.5 w-8.5 place-items-center rounded-lg transition-colors ${
                isMiniMode
                  ? isLight ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-950'
                  : ghostButton
              }`}
              aria-label={isMiniMode ? 'Expand full color wheel' : 'Collapse to mini strip'}
              aria-pressed={isMiniMode}
              title={isMiniMode ? 'Expand full color wheel' : 'Collapse to mini strip'}
            >
              {isMiniMode ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={togglePinned}
              className={`grid h-8.5 w-8.5 place-items-center rounded-lg transition-colors ${
                isPinned
                  ? isLight ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-950'
                  : ghostButton
              }`}
              aria-label={isPinned ? 'Unpin color studio' : 'Keep color studio open'}
              aria-pressed={isPinned}
              title={isPinned ? 'Return to modal view' : 'Keep open while drawing'}
            >
              <Pin className="h-4 w-4" />
            </button>
            {onSampleFromScreen && (
              <button
                type="button"
                onClick={onSampleFromScreen}
                className={`grid h-8.5 w-8.5 place-items-center rounded-lg transition-colors ${ghostButton}`}
                aria-label="Sample color"
                title="Sample color"
              >
                <Pipette className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(currentColor);
                setCopiedHex(true);
                window.setTimeout(() => setCopiedHex(false), 1200);
              }}
              className={`grid h-8.5 w-8.5 place-items-center rounded-lg transition-colors ${ghostButton}`}
              aria-label="Copy hex"
              title="Copy hex code"
            >
              {copiedHex ? <Check className="h-4 w-4 text-neutral-900 dark:text-white" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`grid h-8.5 w-8.5 place-items-center rounded-lg transition-colors ${ghostButton}`}
              aria-label="Close color studio"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {isMiniMode ? (
          <div className="flex items-center gap-1.5 px-3 py-2 border-t border-black/10 dark:border-white/10 overflow-x-auto no-scrollbar">
            <span className={`text-[9px] font-bold uppercase tracking-wider shrink-0 mr-1 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
              Recent
            </span>
            <div className="flex items-center gap-1.5">
              {recentItems.map((item, index) => {
                const isShader = item.type === 'shader';
                const isSelected = isShader
                  ? selectedPresetId === item.presetId
                  : !selectedPresetId && item.hex?.toLowerCase() === currentColor.toLowerCase();
                return (
                  <button
                    key={isShader ? `mini-shader-${item.presetId}-${index}` : `mini-color-${item.hex}-${index}`}
                    type="button"
                    onClick={() => handleSelectRecent(item)}
                    aria-label={isShader ? `Use shader ${item.name}` : `Use color ${item.hex}`}
                    title={isShader ? `Shader: ${item.name}` : item.hex}
                    className={`h-7 w-7 shrink-0 rounded-full border overflow-hidden shadow-xs transition-transform active:scale-95 flex items-center justify-center relative ${
                      isSelected
                        ? 'ring-2 ring-sky-500 scale-105 border-transparent'
                        : isLight ? 'border-black/20' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: isShader ? item.hex || '#38bdf8' : item.hex }}
                  >
                    {isShader && item.url ? (
                      <img
                        src={item.url}
                        alt={item.name || 'Shader'}
                        className="h-full w-full object-cover pointer-events-none"
                        loading="lazy"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto studio-scroll px-3 py-3">
          {activeTab === 'wheel' && <div className="grid gap-3">
            <div className="flex justify-center"><canvas ref={wheelCanvasRef} style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }} onPointerDown={handleWheelPointerDown} onPointerMove={handleWheelPointerMove} onPointerUp={handleWheelPointerUp} onPointerCancel={handleWheelPointerUp} className="touch-none cursor-crosshair" /></div>
            <div className="space-y-3 min-w-0">
              {slider('Saturation', `${Math.round(hsv.s * 100)}%`, <input type="range" min="0" max="100" value={Math.round(hsv.s * 100)} onChange={(event) => applyHsv({ ...hsv, s: Number(event.target.value) / 100 })} className={`h-2 w-full rounded-full cursor-pointer accent-neutral-900 dark:accent-white ${isLight ? 'bg-black/10' : 'bg-white/15'}`} />)}
              {slider('Lightness', `${Math.round(hsv.v * 100)}%`, <input type="range" min="0" max="100" value={Math.round(hsv.v * 100)} onChange={(event) => applyHsv({ ...hsv, v: Number(event.target.value) / 100 })} className={`h-2 w-full rounded-full cursor-pointer accent-neutral-900 dark:accent-white ${isLight ? 'bg-black/10' : 'bg-white/15'}`} />)}
              <div>
                <div className={`mb-1.5 text-[10px] font-bold uppercase tracking-[.14em] ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>Last used</div>
                <div className="grid grid-cols-6 gap-2">
                  {recentItems.map((item, index) => {
                    const isShader = item.type === 'shader';
                    const isSelected = isShader
                      ? selectedPresetId === item.presetId
                      : !selectedPresetId && item.hex?.toLowerCase() === currentColor.toLowerCase();

                    return (
                      <button
                        key={isShader ? `recent-shader-${item.presetId}-${index}` : `recent-color-${item.hex}-${index}`}
                        type="button"
                        onClick={() => handleSelectRecent(item)}
                        aria-label={isShader ? `Use shader ${item.name}` : `Use color ${item.hex}`}
                        title={isShader ? `Shader: ${item.name}` : item.hex}
                        className={`relative aspect-square min-h-0 w-full rounded-full border overflow-hidden shadow-xs transition-transform active:scale-95 flex items-center justify-center ${
                          isSelected
                            ? isLight
                              ? 'border-neutral-900 ring-2 ring-neutral-900/35 scale-105'
                              : 'border-white ring-2 ring-white/35 scale-105'
                            : isLight
                            ? 'border-black/15 hover:scale-105'
                            : 'border-white/15 hover:scale-105'
                        }`}
                        style={{ backgroundColor: isShader ? item.hex || '#38bdf8' : item.hex }}
                      >
                        {isShader && item.url ? (
                          <img
                            src={item.url}
                            alt={item.name || 'Shader'}
                            className="h-full w-full object-cover pointer-events-none"
                            loading="lazy"
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button type="button" onClick={() => setShowPalettes((shown) => !shown)} className={`flex h-10 w-full items-center justify-between border-t text-xs font-semibold ${divider} ${ghostButton}`}><span className="flex items-center gap-2"><Layers className="h-4 w-4" /> Palettes</span><ChevronDown className={`h-4 w-4 ${showPalettes ? 'rotate-180' : ''}`} /></button>
            </div>
            {showPalettes && <div className="space-y-2 pb-1">
              <select value={paletteName} onChange={(event) => setPaletteName(event.target.value as keyof typeof CURATED_PALETTES)} className={`h-11 w-full rounded-xl border px-3 text-xs outline-none ${field}`}>{Object.keys(CURATED_PALETTES).map((name) => <option key={name}>{name}</option>)}</select>
              <div className="grid grid-cols-7 gap-1.5">
                {CURATED_PALETTES[paletteName].map((color) => {
                  const isSelected = !selectedPresetId && color.toLowerCase() === currentColor.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => applyColor(color)}
                      className={`aspect-square w-full rounded-full border shadow-xs transition-transform active:scale-95 ${
                        isSelected
                          ? isLight
                            ? 'border-neutral-900 ring-2 ring-neutral-900/35 scale-105'
                            : 'border-white ring-2 ring-white/35 scale-105'
                          : isLight
                          ? 'border-black/15 hover:scale-105'
                          : 'border-white/15 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Use ${color}`}
                      title={color}
                    />
                  );
                })}
              </div>
            </div>}
          </div>}

          {activeTab === 'oklch' && <div className="space-y-5 py-1">
            {baseColorControl('Adjust perceptual lightness, color intensity, and hue below.')}
            {slider('Lightness', `${(oklch.L * 100).toFixed(1)}%`, <input type="range" min="0" max="100" step="0.5" value={oklch.L * 100} onChange={(event) => handleOklchChange('L', Number(event.target.value) / 100)} className={`h-2 w-full rounded-full cursor-pointer accent-neutral-900 dark:accent-white ${isLight ? 'bg-black/10' : 'bg-white/15'}`} />)}
            {slider('Chroma', oklch.C.toFixed(3), <input type="range" min="0" max="0.38" step="0.005" value={oklch.C} onChange={(event) => handleOklchChange('C', Number(event.target.value))} className={`h-2 w-full rounded-full cursor-pointer accent-neutral-900 dark:accent-white ${isLight ? 'bg-black/10' : 'bg-white/15'}`} />)}
            {slider('Hue', `${Math.round(oklch.h)}°`, <input type="range" min="0" max="359" value={oklch.h} onChange={(event) => handleOklchChange('h', Number(event.target.value))} className={`h-2 w-full rounded-full cursor-pointer accent-neutral-900 dark:accent-white ${isLight ? 'bg-black/10' : 'bg-white/15'}`} />)}
            <button type="button" onClick={() => setShowPosterize((shown) => !shown)} className={`flex h-11 w-full items-center justify-between border-t text-xs font-semibold ${divider} ${ghostButton}`}><span>Posterize</span><ChevronDown className={`h-4 w-4 ${showPosterize ? 'rotate-180' : ''}`} /></button>
            {showPosterize && <div className="space-y-3">
              {slider('Steps', String(posterizeSteps), <input type="range" min="2" max="12" value={posterizeSteps} onChange={(event) => setPosterizeSteps(Number(event.target.value))} className={`h-2 w-full rounded-full cursor-pointer accent-neutral-900 dark:accent-white ${isLight ? 'bg-black/10' : 'bg-white/15'}`} />)}
              <button type="button" onClick={() => applyColor(posterizedColor)} className={`flex h-11 w-full items-center justify-between rounded-xl border px-3 ${field}`}><span className="text-xs font-semibold">Use posterized color</span><span className="flex items-center gap-2 font-mono text-[10px] font-bold">{posterizedColor.toUpperCase()}<span className={`h-7 w-7 rounded-full border shadow-xs ${isLight ? 'border-black/15' : 'border-white/15'}`} style={{ backgroundColor: posterizedColor }} /></span></button>
            </div>}
          </div>}

          {activeTab === 'harmonies' && <div className="space-y-4 py-1">
            {baseColorControl('Harmony suggestions are generated from this color.')}
            <div className={`grid grid-cols-2 border-b ${divider}`}>{([['complementary', 'Complementary'], ['analogous', 'Analogous']] as Array<[HarmonyMode, string]>).map(([mode, label]) => <button key={mode} type="button" onClick={() => setHarmonyMode(mode)} className={`h-11 border-b-2 text-[11px] font-semibold ${harmonyMode === mode ? (isLight ? 'border-neutral-900 text-neutral-950 font-bold' : 'border-white text-white font-bold') : `border-transparent ${ghostButton}`}`}>{label}</button>)}</div>
            <div className={`text-[10px] font-semibold ${quietText}`}>Choose a swatch to use it as the paint color.</div>
            <div className="flex items-center justify-center gap-2.5 py-3">
              {harmonyColors.slice(0, 7).map((color, index) => {
                const isSelected = !selectedPresetId && color.toLowerCase() === currentColor.toLowerCase();
                return (
                  <button
                    key={`${color}-${index}`}
                    type="button"
                    onClick={() => applyColor(color)}
                    className={`h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-full border shadow-xs transition-transform active:scale-95 ${
                      isSelected
                        ? isLight
                          ? 'border-neutral-900 ring-2 ring-neutral-900/35 scale-105'
                          : 'border-white ring-2 ring-white/35 scale-105'
                        : isLight
                        ? 'border-black/15 hover:scale-105'
                        : 'border-white/15 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Use ${color}`}
                    title={color}
                  />
                );
              })}
            </div>
            <select value={harmonyMode} onChange={(event) => setHarmonyMode(event.target.value as HarmonyMode)} className={`h-11 w-full rounded-xl border px-3 text-xs outline-none ${field}`} aria-label="Harmony mode"><option value="complementary">Complementary (Graphic Contrast)</option><option value="analogous">Analogous (Harmonious Palette)</option></select>
          </div>}

          {activeTab === 'shaders' && (
            <div className="space-y-3 py-1">
              {/* Target Selector: Brush vs Model */}
              <MenuSegmentedToggle
                theme={isLight ? 'light' : 'dark'}
                value={shaderTarget}
                onChange={(t) => setShaderTarget(t as 'brush' | 'model')}
                options={[
                  { id: 'brush', label: 'Brush', icon: Paintbrush, title: 'Apply to active brush' },
                  { id: 'model', label: 'Model', icon: Box, disabled: !onApplyToModel, title: 'Apply to 3D model' },
                ]}
              />

              {/* Visual Confirmation Banner */}
              {appliedNotice && (
                <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-in fade-in duration-150 shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{appliedNotice}</span>
                </div>
              )}

              {/* All Shaders Unified Grid */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {allShaders.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  const label = QUICK_SHADER_LABEL_MAP[preset.name] ?? preset.name;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl p-1.5 border transition-all active:scale-95 ${
                        isSelected
                          ? isLight
                            ? 'border-sky-500 bg-sky-500/10 text-sky-950 font-bold shadow-xs ring-1 ring-sky-500/30'
                            : 'border-sky-400 bg-sky-500/15 text-sky-100 font-bold shadow-xs ring-1 ring-sky-400/30'
                          : `border-transparent ${ghostButton}`
                      }`}
                      title={preset.name}
                    >
                      <span
                        className={`relative block h-10 w-10 sm:h-11 sm:w-11 overflow-hidden rounded-full border shadow-sm transition-transform ${
                          isSelected
                            ? 'border-sky-500 ring-2 ring-sky-400/50 scale-105'
                            : isLight ? 'border-black/15' : 'border-white/15'
                        }`}
                      >
                        <img src={preset.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Check className="w-4 h-4 text-white stroke-[3]" />
                          </span>
                        )}
                      </span>
                      <span className={`text-[10px] truncate max-w-full text-center ${isSelected ? 'font-bold text-sky-600 dark:text-sky-400' : 'font-medium'}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Shader Uniform Controls - Collapsible & Minimized by Default */}
              <div className={`rounded-xl border overflow-hidden transition-all ${isLight ? 'bg-black/[0.03] border-black/10' : 'bg-white/[0.02] border-white/10'}`}>
                <button
                  type="button"
                  onClick={() => setShowUniforms((prev) => !prev)}
                  className={`w-full flex items-center justify-between p-3 cursor-pointer select-none transition-colors ${ghostButton}`}
                  aria-expanded={showUniforms}
                >
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-neutral-700' : 'text-neutral-400'}`}>
                    Shader Uniforms
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showUniforms ? 'rotate-180' : ''} ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`} />
                </button>
                {showUniforms && (
                  <div className={`px-3 pb-3 space-y-2.5 border-t pt-2.5 ${divider}`}>
                    {slider('Roughness', `${Math.round(shaderRoughness * 100)}%`, (
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(shaderRoughness * 100)}
                        onChange={(e) => handleUniformChange('roughness', Number(e.target.value) / 100)}
                        className={`h-2 w-full rounded-full cursor-pointer accent-neutral-900 dark:accent-white ${isLight ? 'bg-black/10' : 'bg-white/15'}`}
                      />
                    ))}
                    {slider('Metalness', `${Math.round(shaderMetalness * 100)}%`, (
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(shaderMetalness * 100)}
                        onChange={(e) => handleUniformChange('metalness', Number(e.target.value) / 100)}
                        className={`h-2 w-full rounded-full cursor-pointer accent-neutral-900 dark:accent-white ${isLight ? 'bg-black/10' : 'bg-white/15'}`}
                      />
                    ))}
                    {slider('Glow / Rim Power', `${shaderRimPower.toFixed(2)}`, (
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={Math.round(shaderRimPower * 100)}
                        onChange={(e) => handleUniformChange('rim', Number(e.target.value) / 100)}
                        className={`h-2 w-full rounded-full cursor-pointer accent-neutral-900 dark:accent-white ${isLight ? 'bg-black/10' : 'bg-white/15'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

          </>
        )}
        {!isMiniMode && (
          <nav className={`grid grid-cols-4 border-t px-1 py-1 ${divider}`} aria-label="Color modes">{tabs.map((tab) => { const Icon = tab.icon; const selected = activeTab === tab.id; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[9px] font-medium transition-all ${selected ? (isLight ? 'bg-black/10 text-neutral-950 font-bold' : 'bg-white/15 text-white font-bold') : ghostButton}`} aria-current={selected ? 'page' : undefined}><Icon className="h-4 w-4" /><span>{tab.label}</span></button>; })}</nav>
        )}
      </section>
    </div>,
    document.body,
  );
};

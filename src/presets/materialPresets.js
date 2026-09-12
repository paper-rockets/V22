import { DESKTOP_SHADERS_MATERIAL } from './desktopShaders';
import { GODOT_MATERIAL_PRESETS } from './godotShaders';
import { BLOBMIXER_MATERIAL_PRESETS } from './blobmixerShaders';
import { WAYFINDER_MATERIAL_PRESETS } from './wayfinderShaders';
import { GRASSWORKS_MATERIAL_PRESETS } from './grassworksShaders';
import { REZE_MATERIAL_PRESETS } from './rezeShaders';

// High-Quality Procedural MatCap Canvas Generator
export function createMatCap(drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, 512, 512);
  return canvas.toDataURL('image/png');
}

// Visual Presets with Real-Time Shaders
import {
  SUMMER_SHADERS,
  TOON_PRESETS,
  FLAT_COLOR_PRESETS,
  GLASS_PRESETS,
  BRIGHT_COLOR_PRESETS,
  METAL_PRESETS,
  CLAY_PRESETS,
  GEMS_PRESETS,
} from './materials/summerShaders';
import { FUN_MAGIC_SHADERS } from './materials/funMagicShaders';
import { WONDERLUST_PRESETS } from './materials/wonderlustPresets';

export {
  SUMMER_SHADERS,
  TOON_PRESETS,
  FLAT_COLOR_PRESETS,
  GLASS_PRESETS,
  BRIGHT_COLOR_PRESETS,
  METAL_PRESETS,
  CLAY_PRESETS,
  GEMS_PRESETS,
  FUN_MAGIC_SHADERS,
  WONDERLUST_PRESETS,
};

export const ALL_MATERIAL_PRESETS = [
  ...BLOBMIXER_MATERIAL_PRESETS.map(p => ({ ...p, url: createMatCap(p.generate) })),
  ...SUMMER_SHADERS.map(p => ({ ...p, url: createMatCap(p.generate) })),
  ...GODOT_MATERIAL_PRESETS.map(p => ({ ...p, url: createMatCap(p.generate) })),
  ...WONDERLUST_PRESETS.map(p => ({ ...p, url: createMatCap(p.generate) })),
  ...WAYFINDER_MATERIAL_PRESETS.map(p => ({ ...p, url: createMatCap(p.generate) })),
  ...GRASSWORKS_MATERIAL_PRESETS.map(p => ({ ...p, url: createMatCap(p.generate) })),
  ...REZE_MATERIAL_PRESETS.map(p => ({ ...p, url: createMatCap(p.generate) })),
  ...DESKTOP_SHADERS_MATERIAL.map(p => ({ ...p, url: createMatCap(p.generate) })),
  ...FUN_MAGIC_SHADERS.map(p => ({ ...p, url: createMatCap(p.generate) })),
  ...TOON_PRESETS.map(p => p.generate ? { ...p, url: createMatCap(p.generate) } : p),
  ...FLAT_COLOR_PRESETS.map(p => p.generate ? { ...p, url: createMatCap(p.generate) } : p),
  ...GLASS_PRESETS.map(p => p.generate ? { ...p, url: createMatCap(p.generate) } : p),
  ...BRIGHT_COLOR_PRESETS.map(p => p.generate ? { ...p, url: createMatCap(p.generate) } : p),
  ...METAL_PRESETS.map(p => p.generate ? { ...p, url: createMatCap(p.generate) } : p),
  ...CLAY_PRESETS.map(p => p.generate ? { ...p, url: createMatCap(p.generate) } : p),
  ...GEMS_PRESETS.map(p => p.generate ? { ...p, url: createMatCap(p.generate) } : p)
];

export const PRESET_CATEGORIES = [
  'All',
  '🎨 Blobmixer MatCaps',
  '☀️ Summer Afternoon',
  '🌿 Godot Water & Grass',
  '🌍 Wonderlust',
  '🍃 Wayfinder & Grassworks',
  '⚡ WebGPU & Cyber',
  '🌊 Live Desktop Shaders',
  '✨ Fun & Magic',
  'Toon Shaders',
  'Flat Colors',
  'Glass & Crystal',
  'Bright Colors',
  'Metals',
  'Clay & Matte',
  'Gems & Organics'
];

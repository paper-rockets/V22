// ============================================================================
// Master Material Presets Library - 100% Procedural & Code-Generated
// All materials are mathematically generated with zero third-party image assets.
// Safe for commercial distribution.
// ============================================================================

import { DOPAMINE_PRESETS } from './dopaminePresets.js';
import { PROCEDURAL_MATCAP_PRESETS } from './proceduralMatcaps.js';
import { GLASS_PRESETS } from './glassPresets.js';
import { ANIMATED_PRESETS } from './animatedPresets.js';
import { PLAYDOH_PRESETS } from './playdohPresets.js';
import {
  TOON_PRESETS,
  FLAT_COLOR_PRESETS,
  BRIGHT_COLOR_PRESETS,
  METAL_PRESETS,
  CLAY_PRESETS,
  GEMS_PRESETS,
} from './materials/summerShaders.js';
import { FUN_MAGIC_SHADERS } from './materials/funMagicShaders.js';
import { WONDERLUST_PRESETS } from './materials/wonderlustPresets.js';
import { MARBLE_PRESETS } from './materials/marbleShaders.js';

// Shared canvas for memory-efficient MatCap generation
let sharedCanvas = null;

export function createMatCap(drawFn, width = 256, height = 256) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return '';
  if (!drawFn || typeof drawFn !== 'function') return '';
  
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
  }
  sharedCanvas.width = width;
  sharedCanvas.height = height;
  const ctx = sharedCanvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.clearRect(0, 0, width, height);
  drawFn(ctx, width, height);
  return sharedCanvas.toDataURL('image/png');
}

// Wrap a preset so its data URL is lazily computed on first access (0ms boot overhead)
function makeLazyPreset(p) {
  let cachedUrl = p.url || null;
  return {
    ...p,
    get url() {
      if (cachedUrl) return cachedUrl;
      if (typeof p.generate === 'function') {
        cachedUrl = createMatCap(p.generate, 256, 256);
      }
      return cachedUrl;
    }
  };
}

const RAW_PRESETS = [
  // 1. Real Play-Doh Shaders (Directly from V23 Kids)
  ...PLAYDOH_PRESETS,

  // 2. Live Animated Shaders (High-Dopamine, Zero Water)
  ...ANIMATED_PRESETS,

  // 2. Glass & Crystal Shaders
  ...GLASS_PRESETS,

  // 3. Marble & Natural Stone Shaders (10-Piece Master Collection)
  ...MARBLE_PRESETS,

  // 4. Dopamine, Iridescent, Dichroic, Stars, Space, Candy & Kids Presets
  ...DOPAMINE_PRESETS,

  // 5. High-Performance Procedural Color Library (641 Materials)
  ...PROCEDURAL_MATCAP_PRESETS,

  // 6. Creative & Stylized Procedural Collections (Non-Water)
  ...WONDERLUST_PRESETS,
  ...FUN_MAGIC_SHADERS,
  ...TOON_PRESETS,
  ...FLAT_COLOR_PRESETS,
  ...BRIGHT_COLOR_PRESETS,
  ...METAL_PRESETS,
  ...CLAY_PRESETS,
  ...GEMS_PRESETS,
];

export const ALL_MATERIAL_PRESETS = RAW_PRESETS.map(makeLazyPreset);

export const PRESET_CATEGORIES = [
  'All',
  '🏛️ Marble & Natural Stone',
  '⚡ Animated Shaders',
  '🔮 Glass & Crystal',
  '✨ Iridescent & Dichroic',
  '🍬 Candy & Gummy',
  '⭐ Stars & Space',
  '🌈 Holographic & Rainbow',
  '🧸 Kids Toy & Clay',
  '💎 MatCaps: Metals & Chrome',
  '👑 MatCaps: Gold & Amber',
  '🌊 MatCaps: Blue & Cyan',
  '🌿 MatCaps: Green & Emerald',
  '🔥 MatCaps: Red & Crimson',
  '🔥 MatCaps: Orange & Coral',
  '🔮 MatCaps: Purple & Velvet',
  '🏺 MatCaps: Clay, Skin & Earth',
  '🌑 MatCaps: Obsidian & Dark',
  '⚪ MatCaps: Pearl & Ceramic',
  'Toon Shaders',
  'Flat Colors',
  'Bright Colors',
  'Metals',
  'Clay & Matte',
  'Gems & Organics'
];

export {
  PLAYDOH_PRESETS,
  ANIMATED_PRESETS,
  GLASS_PRESETS,
  MARBLE_PRESETS,
  DOPAMINE_PRESETS,
  PROCEDURAL_MATCAP_PRESETS,
  TOON_PRESETS,
  FLAT_COLOR_PRESETS,
  BRIGHT_COLOR_PRESETS,
  METAL_PRESETS,
  CLAY_PRESETS,
  GEMS_PRESETS,
  FUN_MAGIC_SHADERS,
  WONDERLUST_PRESETS,
};

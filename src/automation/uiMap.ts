import { DeviceTarget } from './types';

export interface TargetPosition {
  x: number;
  y: number;
  foundElement?: boolean;
}

/**
 * Common semantic UI targets mapped to DOM selectors and fallback responsive coordinates.
 */
interface TargetMapping {
  selectors: string[];
  fallback: {
    desktop: { x: number; y: number }; // normalized 0..1
    tablet: { x: number; y: number };
    phone: { x: number; y: number };
  };
}

export const SEMANTIC_UI_MAP: Record<string, TargetMapping> = {
  // Main Dock Tools
  draw: {
    selectors: ['button[data-mode="draw"]', 'button[aria-label="Draw"]', '.dock-btn-draw'],
    fallback: {
      desktop: { x: 0.44, y: 0.94 },
      tablet: { x: 0.42, y: 0.94 },
      phone: { x: 0.35, y: 0.95 },
    },
  },
  erase: {
    selectors: ['button[data-mode="erase"]', 'button[aria-label="Erase"]'],
    fallback: {
      desktop: { x: 0.48, y: 0.94 },
      tablet: { x: 0.47, y: 0.94 },
      phone: { x: 0.45, y: 0.95 },
    },
  },
  select: {
    selectors: ['button[data-mode="select"]', 'button[aria-label="Select"]'],
    fallback: {
      desktop: { x: 0.52, y: 0.94 },
      tablet: { x: 0.52, y: 0.94 },
      phone: { x: 0.55, y: 0.95 },
    },
  },
  layers: {
    selectors: ['button[data-mode="layers"]', 'button[aria-label="Layers"]'],
    fallback: {
      desktop: { x: 0.56, y: 0.94 },
      tablet: { x: 0.57, y: 0.94 },
      phone: { x: 0.65, y: 0.95 },
    },
  },

  // Brush / Surface options
  surface: {
    selectors: [
      'button[data-brush="conformal_bead"]',
      'button[aria-label*="Surface"]',
      'button:has(span:contains("Surface"))',
    ],
    fallback: {
      desktop: { x: 0.43, y: 0.88 },
      tablet: { x: 0.43, y: 0.88 },
      phone: { x: 0.38, y: 0.89 },
    },
  },
  'open-air': {
    selectors: [
      'button[data-brush="spatial_pipe"]',
      'button[aria-label*="Round"]',
      'button[aria-label*="Tube"]',
    ],
    fallback: {
      desktop: { x: 0.48, y: 0.88 },
      tablet: { x: 0.48, y: 0.88 },
      phone: { x: 0.5, y: 0.89 },
    },
  },
  'flat-brush': {
    selectors: ['button[data-brush="streamline_ink"]', 'button[aria-label*="Flat"]'],
    fallback: {
      desktop: { x: 0.38, y: 0.88 },
      tablet: { x: 0.38, y: 0.88 },
      phone: { x: 0.25, y: 0.89 },
    },
  },
  'marker-brush': {
    selectors: ['button[data-brush="chisel_marker"]', 'button[aria-label*="Marker"]'],
    fallback: {
      desktop: { x: 0.53, y: 0.88 },
      tablet: { x: 0.53, y: 0.88 },
      phone: { x: 0.62, y: 0.89 },
    },
  },
  'fine-pen': {
    selectors: ['button[data-brush="drafting_wire"]', 'button[aria-label*="Fine Pen"]'],
    fallback: {
      desktop: { x: 0.58, y: 0.88 },
      tablet: { x: 0.58, y: 0.88 },
      phone: { x: 0.74, y: 0.89 },
    },
  },
  'neon-glow': {
    selectors: ['button[data-brush="neon_cable"]', 'button[aria-label*="Neon"]'],
    fallback: {
      desktop: { x: 0.63, y: 0.88 },
      tablet: { x: 0.63, y: 0.88 },
      phone: { x: 0.82, y: 0.89 },
    },
  },

  // Color & Materials
  'color-studio': {
    selectors: ['button[aria-label="Color studio"]', 'button[aria-label*="base color"]', '.btn-color-studio'],
    fallback: {
      desktop: { x: 0.36, y: 0.94 },
      tablet: { x: 0.34, y: 0.94 },
      phone: { x: 0.2, y: 0.95 },
    },
  },

  // Lighting
  illumination: {
    selectors: ['button[aria-label="Lighting Setup"]', 'button[title*="Illumination"]', 'button[aria-label*="Illumination"]'],
    fallback: {
      desktop: { x: 0.64, y: 0.94 },
      tablet: { x: 0.66, y: 0.94 },
      phone: { x: 0.8, y: 0.95 },
    },
  },

  // Stroke Assist / Shapes / Ruler
  shapes: {
    selectors: ['button[aria-label*="Stroke assist"]', 'button[title*="Shapes"]'],
    fallback: {
      desktop: { x: 0.6, y: 0.94 },
      tablet: { x: 0.62, y: 0.94 },
      phone: { x: 0.72, y: 0.95 },
    },
  },
  ruler: {
    selectors: ['button[aria-label*="Ruler"]', 'button[title*="Ruler"]'],
    fallback: {
      desktop: { x: 0.68, y: 0.94 },
      tablet: { x: 0.7, y: 0.94 },
      phone: { x: 0.88, y: 0.95 },
    },
  },

  // Top Strip / Controls
  camera: {
    selectors: ['button[aria-label*="Camera"]', '.camera-recovery-pill', '.navigator-container'],
    fallback: {
      desktop: { x: 0.08, y: 0.06 },
      tablet: { x: 0.08, y: 0.06 },
      phone: { x: 0.12, y: 0.06 },
    },
  },
  more: {
    selectors: ['button[aria-label="More options"]', 'button[aria-label="Menu"]'],
    fallback: {
      desktop: { x: 0.96, y: 0.035 },
      tablet: { x: 0.95, y: 0.035 },
      phone: { x: 0.93, y: 0.035 },
    },
  },
  export: {
    selectors: ['button[aria-label="Export"]', 'button:contains("Export")'],
    fallback: {
      desktop: { x: 0.92, y: 0.035 },
      tablet: { x: 0.9, y: 0.035 },
      phone: { x: 0.86, y: 0.035 },
    },
  },
};

/**
 * Detect current device target category based on viewport width.
 */
export function getCurrentDeviceTarget(): DeviceTarget {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w <= 640) return 'phone';
  if (w <= 1024) return 'tablet';
  return 'desktop';
}

/**
 * Resolves a semantic target name to real screen pixel coordinates.
 */
export function resolveTargetPosition(
  targetName: string,
  deviceTarget: DeviceTarget = getCurrentDeviceTarget()
): TargetPosition {
  const mapping = SEMANTIC_UI_MAP[targetName.toLowerCase()];

  // Try finding real DOM element first
  if (typeof document !== 'undefined' && mapping?.selectors) {
    for (const selector of mapping.selectors) {
      try {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el && el.offsetParent !== null) {
          const rect = el.getBoundingClientRect();
          return {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2),
            foundElement: true,
          };
        }
      } catch (_) {}
    }
  }

  // Fallback to responsive calculated coordinates
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800;

  if (mapping) {
    const coords = mapping.fallback[deviceTarget];
    return {
      x: Math.round(coords.x * winW),
      y: Math.round(coords.y * winH),
      foundElement: false,
    };
  }

  // Default fallback center
  return {
    x: Math.round(winW * 0.5),
    y: Math.round(winH * 0.5),
    foundElement: false,
  };
}

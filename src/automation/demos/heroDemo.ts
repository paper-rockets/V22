import { DemoScene } from '../types';

export const HERO_DEMO: DemoScene = {
  id: '00_hero_continuous_flow',
  number: 0,
  title: 'Making Something (Hero Workflow)',
  featureTaught: 'Continuous creation workflow',
  category: 'Build',
  goal: 'From blank project to mannequin sketch, surface armor, spatial wings, glowing neon accents, dramatic lighting, and 360° beauty orbit',
  deviceTargets: ['desktop', 'tablet', 'phone'],
  steps: [
    // 1. Initial Blank Canvas Setup
    { type: 'CLEAR_SCENE' },
    {
      type: 'CALLOUT',
      title: 'Creating in 3D',
      subtitle: 'Watch a complete concept take shape from start to finish.',
      durationMs: 2000,
    },
    { type: 'WAIT', durationMs: 800 },

    // 2. Insert 3D Anatomical Mannequin
    { type: 'INSERT_OBJECT', objectType: 'mannequin' },
    {
      type: 'CALLOUT',
      title: '3D Scaffolding',
      subtitle: 'Drop an anatomical mannequin into the scene for proportions.',
      durationMs: 2000,
    },
    { type: 'WAIT', durationMs: 900 },

    // Camera initial orbit to establish 3D reference
    { type: 'ORBIT_CAMERA', deltaTheta: 0.35, deltaPhi: 0.1, durationMs: 1600 },
    { type: 'WAIT', durationMs: 500 },

    // 3. Surface Sketch: Drawing Armor & Contours on the Model
    { type: 'TAP', target: 'draw', pauseAfterMs: 350 },
    { type: 'TAP', target: 'surface', pauseAfterMs: 400 },
    {
      type: 'CALLOUT',
      title: 'Draw Directly on Surface',
      subtitle: 'Strokes hug the curvature of the 3D model.',
      durationMs: 2000,
    },
    // Left collar contour
    {
      type: 'DRAW_STROKE',
      stroke: {
        intent: 'Left collar contour',
        durationMs: 1400,
        pressure: { start: 0.3, middle: 0.8, end: 0.25 },
        points: [
          { x: 0.44, y: 0.44 },
          { x: 0.48, y: 0.47 },
          { x: 0.52, y: 0.48 },
        ],
        pauseAfterMs: 350,
      },
    },
    // Right collar contour
    {
      type: 'DRAW_STROKE',
      stroke: {
        intent: 'Right collar contour',
        durationMs: 1400,
        pressure: { start: 0.3, middle: 0.8, end: 0.25 },
        points: [
          { x: 0.52, y: 0.48 },
          { x: 0.56, y: 0.47 },
          { x: 0.6, y: 0.44 },
        ],
        pauseAfterMs: 400,
      },
    },
    // Head visor band
    {
      type: 'DRAW_STROKE',
      stroke: {
        intent: 'Head visor contour',
        durationMs: 1300,
        pressure: { start: 0.35, middle: 0.85, end: 0.3 },
        points: [
          { x: 0.47, y: 0.38 },
          { x: 0.52, y: 0.37 },
          { x: 0.57, y: 0.38 },
        ],
        pauseAfterMs: 500,
      },
    },
    // Chestplate emblem
    {
      type: 'DRAW_STROKE',
      stroke: {
        intent: 'Chestplate center crest',
        durationMs: 1200,
        pressure: { start: 0.4, middle: 0.9, end: 0.3 },
        points: [
          { x: 0.52, y: 0.47 },
          { x: 0.52, y: 0.55 },
        ],
        pauseAfterMs: 600,
      },
    },

    // Orbit to show surface conformity
    { type: 'ORBIT_CAMERA', deltaTheta: 0.65, deltaPhi: 0.15, durationMs: 2000 },
    { type: 'WAIT', durationMs: 700 },

    // 4. Drawing into Open Air: Spatial Wings & Curves
    { type: 'TAP', target: 'open-air', pauseAfterMs: 400 },
    {
      type: 'CALLOUT',
      title: 'Draw Freely in 3D Space',
      subtitle: 'Pull strokes out into the air to sculpt spatial volume.',
      durationMs: 2200,
    },
    // Left sweeping wing
    {
      type: 'DRAW_STROKE',
      stroke: {
        intent: 'Left spatial wing arc',
        durationMs: 1800,
        pressure: { start: 0.3, middle: 0.85, end: 0.2 },
        points: [
          { x: 0.46, y: 0.48 },
          { x: 0.38, y: 0.36 },
          { x: 0.32, y: 0.28 },
          { x: 0.25, y: 0.32 },
        ],
        pauseAfterMs: 400,
      },
    },
    // Left inner feather
    {
      type: 'DRAW_STROKE',
      stroke: {
        intent: 'Left lower wing accent',
        durationMs: 1400,
        pressure: { start: 0.25, middle: 0.75, end: 0.2 },
        points: [
          { x: 0.42, y: 0.46 },
          { x: 0.34, y: 0.42 },
          { x: 0.28, y: 0.46 },
        ],
        pauseAfterMs: 450,
      },
    },
    // Right sweeping wing
    {
      type: 'DRAW_STROKE',
      stroke: {
        intent: 'Right spatial wing arc',
        durationMs: 1800,
        pressure: { start: 0.3, middle: 0.85, end: 0.2 },
        points: [
          { x: 0.58, y: 0.48 },
          { x: 0.66, y: 0.36 },
          { x: 0.72, y: 0.28 },
          { x: 0.79, y: 0.32 },
        ],
        pauseAfterMs: 400,
      },
    },
    // Right inner feather
    {
      type: 'DRAW_STROKE',
      stroke: {
        intent: 'Right lower wing accent',
        durationMs: 1400,
        pressure: { start: 0.25, middle: 0.75, end: 0.2 },
        points: [
          { x: 0.62, y: 0.46 },
          { x: 0.7, y: 0.42 },
          { x: 0.76, y: 0.46 },
        ],
        pauseAfterMs: 600,
      },
    },

    // Camera orbit behind to reveal wing depth
    { type: 'ORBIT_CAMERA', deltaTheta: 1.1, deltaPhi: -0.1, durationMs: 2400 },
    { type: 'WAIT', durationMs: 700 },

    // 5. Neon Glow & Radiant Bloom Accents
    { type: 'TAP', target: 'neon-glow', pauseAfterMs: 400 },
    {
      type: 'CALLOUT',
      title: 'Neon Glow & Materials',
      subtitle: 'Add emissive light curves that cast bloom in real time.',
      durationMs: 2200,
    },
    // Glowing halo ring above head
    {
      type: 'DRAW_STROKE',
      stroke: {
        intent: 'Floating halo ring',
        durationMs: 1700,
        pressure: { start: 0.35, middle: 0.9, end: 0.35 },
        points: [
          { x: 0.44, y: 0.26 },
          { x: 0.52, y: 0.23 },
          { x: 0.6, y: 0.26 },
          { x: 0.52, y: 0.29 },
          { x: 0.44, y: 0.26 },
        ],
        pauseAfterMs: 500,
      },
    },
    // Left wing glowing crest
    {
      type: 'DRAW_STROKE',
      stroke: {
        intent: 'Left glowing energy crest',
        durationMs: 1600,
        pressure: { start: 0.2, middle: 0.85, end: 0.2 },
        points: [
          { x: 0.47, y: 0.42 },
          { x: 0.35, y: 0.3 },
          { x: 0.26, y: 0.25 },
        ],
        pauseAfterMs: 400,
      },
    },
    // Right wing glowing crest
    {
      type: 'DRAW_STROKE',
      stroke: {
        intent: 'Right glowing energy crest',
        durationMs: 1600,
        pressure: { start: 0.2, middle: 0.85, end: 0.2 },
        points: [
          { x: 0.57, y: 0.42 },
          { x: 0.69, y: 0.3 },
          { x: 0.78, y: 0.25 },
        ],
        pauseAfterMs: 700,
      },
    },

    // 6. Dramatic Lighting & Illumination
    { type: 'TAP', target: 'illumination', pauseAfterMs: 500 },
    {
      type: 'CALLOUT',
      title: 'Cinematic Studio Lighting',
      subtitle: 'Adjust illumination angles to reveal reflections and depth.',
      durationMs: 2200,
    },
    { type: 'ORBIT_CAMERA', deltaTheta: -0.7, deltaPhi: 0.25, durationMs: 2000 },
    { type: 'WAIT', durationMs: 600 },

    // 7. Grand 360° Beauty Turnaround
    {
      type: 'CALLOUT',
      title: 'Complete 3D Artwork',
      subtitle: 'A full concept sculpture built organically in 3D space.',
      durationMs: 2500,
    },
    { type: 'ORBIT_CAMERA', deltaTheta: 1.8, deltaPhi: -0.15, durationMs: 3800 },
    { type: 'WAIT', durationMs: 600 },
    { type: 'ORBIT_CAMERA', deltaTheta: 1.4, deltaPhi: 0.1, durationMs: 3200 },
    { type: 'WAIT', durationMs: 1200 },
  ],
};

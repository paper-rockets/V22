import { DemoScene } from '../types';

export const CANONICAL_DEMOS: DemoScene[] = [
  // Showcase 1: Contour Line Art
  {
    id: 'reconstruct_contours',
    number: 101,
    title: '3D Contour Line Art',
    featureTaught: 'Reverse-engineered wireframe sculpture',
    category: 'Draw',
    goal: 'Reverse-engineer 3D model into 319 colored 3D contour strokes drawn in air',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      {
        type: 'CALLOUT',
        title: '3D Contour Line Art',
        subtitle: 'Drawing 319 reverse-engineered colored contour strokes in space.',
        durationMs: 2000,
      },
      { type: 'TAP', target: 'draw', pauseAfterMs: 300 },
      {
        type: 'REPLAY_3D_MODEL',
        datasetUrl: '/demos/model-contours.json',
        title: '3D Contour Line Art',
        speedMs: 4,
        orbitWhileDrawing: true,
      },
    ],
  },
  // Showcase 2: Solid Painted 3D Reconstruction
  {
    id: 'reconstruct_solid',
    number: 102,
    title: 'Solid Paint 3D Sculpture',
    featureTaught: 'Dense overlapping ribbon paint sculpture',
    category: 'Draw',
    goal: 'Reconstruct 3D model volume using 2500+ dense overlapping paint ribbons',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      {
        type: 'CALLOUT',
        title: 'Solid Paint 3D',
        subtitle: 'Painting solid volume with 2500+ precision ribbon strokes.',
        durationMs: 2000,
      },
      { type: 'TAP', target: 'draw', pauseAfterMs: 300 },
      {
        type: 'REPLAY_3D_MODEL',
        datasetUrl: '/demos/model-solid.json',
        title: 'Solid Paint 3D',
        speedMs: 4,
        orbitWhileDrawing: true,
      },
    ],
  },
  // Showcase 3: Hybrid Master
  {
    id: 'reconstruct_hybrid',
    number: 103,
    title: 'Hybrid Master (Solid + Detail)',
    featureTaught: 'Solid base coat + crisp fine detail linework',
    category: 'Draw',
    goal: 'Draw solid color volumes then trace crisp metallic panel details in air',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      {
        type: 'CALLOUT',
        title: 'Hybrid Master 3D',
        subtitle: 'Laying solid colored base coat, then tracing crisp detail lines.',
        durationMs: 2000,
      },
      { type: 'TAP', target: 'draw', pauseAfterMs: 300 },
      {
        type: 'REPLAY_3D_MODEL',
        datasetUrl: '/demos/model-hybrid.json',
        title: 'Hybrid Master',
        speedMs: 4,
        orbitWhileDrawing: true,
      },
    ],
  },
  // 1. Start a 3D sketch
  {
    id: '01_start_3d_sketch',
    number: 1,
    title: 'Start a 3D sketch',
    featureTaught: 'Basic drawing',
    category: 'Draw',
    goal: 'Select Draw and sculpt a multi-stroke 3D decorative crest in space',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      {
        type: 'CALLOUT',
        title: 'Start a 3D Sketch',
        subtitle: 'Every stroke is sculpted directly in three-dimensional space.',
        durationMs: 2000,
      },
      { type: 'TAP', target: 'draw', pauseAfterMs: 350 },
      // Stroke 1: Outer upward arch
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Outer sweeping crest arc',
          durationMs: 1400,
          pressure: { start: 0.25, middle: 0.85, end: 0.2 },
          points: [
            { x: 0.36, y: 0.65 },
            { x: 0.44, y: 0.38 },
            { x: 0.52, y: 0.32 },
          ],
          pauseAfterMs: 350,
        },
      },
      // Stroke 2: Symmetrical right wing
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Right symmetrical crest arc',
          durationMs: 1400,
          pressure: { start: 0.25, middle: 0.85, end: 0.2 },
          points: [
            { x: 0.68, y: 0.65 },
            { x: 0.6, y: 0.38 },
            { x: 0.52, y: 0.32 },
          ],
          pauseAfterMs: 400,
        },
      },
      // Stroke 3: Inner loop
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Inner connecting heart loop',
          durationMs: 1500,
          pressure: { start: 0.3, middle: 0.8, end: 0.3 },
          points: [
            { x: 0.52, y: 0.4 },
            { x: 0.45, y: 0.48 },
            { x: 0.52, y: 0.58 },
            { x: 0.59, y: 0.48 },
            { x: 0.52, y: 0.4 },
          ],
          pauseAfterMs: 500,
        },
      },
      // Stroke 4: Bottom anchor flourish
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Bottom tapering flourish',
          durationMs: 1200,
          pressure: { start: 0.4, middle: 0.9, end: 0.15 },
          points: [
            { x: 0.52, y: 0.58 },
            { x: 0.52, y: 0.72 },
          ],
          pauseAfterMs: 600,
        },
      },
      // Camera 3D orbit to reveal full depth
      {
        type: 'CALLOUT',
        title: 'True 3D Relief',
        subtitle: 'Notice how the strokes hold thickness and position in depth.',
        durationMs: 2200,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 0.85, deltaPhi: 0.2, durationMs: 2400 },
      { type: 'WAIT', durationMs: 600 },
      { type: 'ORBIT_CAMERA', deltaTheta: -0.5, deltaPhi: -0.1, durationMs: 1800 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 2. Orbit around the drawing
  {
    id: '02_orbit_drawing',
    number: 2,
    title: 'Orbit around the drawing',
    featureTaught: '3D navigation',
    category: 'Learn',
    goal: 'Navigate smoothly around complex multi-layered artwork to inspect 3D depth',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      { type: 'TAP', target: 'draw', pauseAfterMs: 300 },
      // Draw foreground curve
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 1300,
          points: [{ x: 0.35, y: 0.6 }, { x: 0.5, y: 0.35 }, { x: 0.65, y: 0.6 }],
          pauseAfterMs: 300,
        },
      },
      // Draw intersecting cross curve
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 1300,
          points: [{ x: 0.38, y: 0.42 }, { x: 0.5, y: 0.55 }, { x: 0.62, y: 0.42 }],
          pauseAfterMs: 500,
        },
      },
      {
        type: 'CALLOUT',
        title: 'Dynamic 3D Orbit',
        subtitle: 'Glide around your creation from any perspective.',
        durationMs: 2200,
      },
      // Orbit 1: Side view
      { type: 'ORBIT_CAMERA', deltaTheta: 1.2, deltaPhi: 0.15, durationMs: 2200 },
      { type: 'WAIT', durationMs: 500 },
      // Orbit 2: High overhead angle
      { type: 'ORBIT_CAMERA', deltaTheta: 0.8, deltaPhi: 0.45, durationMs: 2200 },
      { type: 'WAIT', durationMs: 500 },
      // Orbit 3: Returning sweep
      { type: 'ORBIT_CAMERA', deltaTheta: -1.6, deltaPhi: -0.4, durationMs: 2600 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 3. Draw directly on a surface
  {
    id: '03_draw_on_surface',
    number: 3,
    title: 'Draw directly on a surface',
    featureTaught: 'Surface drawing',
    category: 'Draw',
    goal: 'Insert a 3D model and paint an intricate conformal pattern across its curvature',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      { type: 'INSERT_OBJECT', objectType: 'sphere' },
      {
        type: 'CALLOUT',
        title: 'Conformal Surface Painting',
        subtitle: 'Strokes hug the curvature of any 3D model like digital paint.',
        durationMs: 2200,
      },
      { type: 'TAP', target: 'draw', pauseAfterMs: 350 },
      { type: 'TAP', target: 'surface', pauseAfterMs: 400 },
      // Stroke 1: Equator band
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Equatorial surface wrap',
          durationMs: 1600,
          pressure: { start: 0.35, middle: 0.8, end: 0.35 },
          points: [
            { x: 0.38, y: 0.5 },
            { x: 0.46, y: 0.53 },
            { x: 0.54, y: 0.53 },
            { x: 0.62, y: 0.5 },
          ],
          pauseAfterMs: 400,
        },
      },
      // Stroke 2: Top arch
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Upper crown arc',
          durationMs: 1400,
          pressure: { start: 0.3, middle: 0.75, end: 0.25 },
          points: [
            { x: 0.42, y: 0.44 },
            { x: 0.5, y: 0.4 },
            { x: 0.58, y: 0.44 },
          ],
          pauseAfterMs: 400,
        },
      },
      // Stroke 3: Lower chevron
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Lower chevron emblem',
          durationMs: 1400,
          pressure: { start: 0.3, middle: 0.75, end: 0.25 },
          points: [
            { x: 0.45, y: 0.56 },
            { x: 0.5, y: 0.62 },
            { x: 0.55, y: 0.56 },
          ],
          pauseAfterMs: 600,
        },
      },
      // Orbit to prove paint adheres to curvature
      {
        type: 'CALLOUT',
        title: 'Perfect Surface Conformance',
        subtitle: 'Zero floating or clipping; strokes remain bound to the geometry.',
        durationMs: 2400,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 1.1, deltaPhi: 0.2, durationMs: 2500 },
      { type: 'WAIT', durationMs: 600 },
      { type: 'ORBIT_CAMERA', deltaTheta: -0.6, deltaPhi: -0.25, durationMs: 1800 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 4. Draw freely in 3D space
  {
    id: '04_draw_open_air',
    number: 4,
    title: 'Draw freely in 3D space',
    featureTaught: 'Spatial drawing',
    category: 'Draw',
    goal: 'Switch to Open Air and sculpt an intertwined volumetric 3D double helix',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      {
        type: 'CALLOUT',
        title: 'Volumetric Spatial Drawing',
        subtitle: 'Sculpt three-dimensional volumetric curves freely in the air.',
        durationMs: 2200,
      },
      { type: 'TAP', target: 'draw', pauseAfterMs: 300 },
      { type: 'TAP', target: 'open-air', pauseAfterMs: 400 },
      // Strand 1: Rising spiral
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Ascending spatial helix strand 1',
          durationMs: 1900,
          pressure: { start: 0.3, middle: 0.85, end: 0.2 },
          points: [
            { x: 0.38, y: 0.7 },
            { x: 0.56, y: 0.58 },
            { x: 0.4, y: 0.42 },
            { x: 0.58, y: 0.28 },
          ],
          pauseAfterMs: 400,
        },
      },
      // Strand 2: Intertwining counter-spiral
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Intertwining spatial helix strand 2',
          durationMs: 1900,
          pressure: { start: 0.3, middle: 0.85, end: 0.2 },
          points: [
            { x: 0.62, y: 0.7 },
            { x: 0.44, y: 0.58 },
            { x: 0.6, y: 0.42 },
            { x: 0.42, y: 0.28 },
          ],
          pauseAfterMs: 500,
        },
      },
      // Horizontal ring around the center
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Center orbital ring',
          durationMs: 1600,
          pressure: { start: 0.35, middle: 0.8, end: 0.35 },
          points: [
            { x: 0.35, y: 0.5 },
            { x: 0.5, y: 0.46 },
            { x: 0.65, y: 0.5 },
            { x: 0.5, y: 0.54 },
            { x: 0.35, y: 0.5 },
          ],
          pauseAfterMs: 600,
        },
      },
      // 360 orbit around the helix
      {
        type: 'CALLOUT',
        title: 'Full Spatial Volume',
        subtitle: 'Curves weave through space with genuine three-dimensional thickness.',
        durationMs: 2400,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 1.5, deltaPhi: 0.2, durationMs: 3000 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 5. Surface → Air in one stroke
  {
    id: '05_surface_to_air',
    number: 5,
    title: 'Surface → Air in one stroke',
    featureTaught: 'Surface + Air',
    category: 'Draw',
    goal: 'Begin on a 3D model and seamlessly pull the stroke out into free space',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      { type: 'INSERT_OBJECT', objectType: 'sphere' },
      {
        type: 'CALLOUT',
        title: 'Surface → Space Transition',
        subtitle: 'The signature power of Remix 3D: anchor on an object, then extend into space.',
        durationMs: 2500,
      },
      { type: 'TAP', target: 'draw', pauseAfterMs: 300 },
      { type: 'TAP', target: 'surface', pauseAfterMs: 400 },
      // Left horn / wing: starts on sphere surface, pulls into space
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Left surface-anchored wing pulling into air',
          durationMs: 2000,
          pressure: { start: 0.45, middle: 0.85, end: 0.15 },
          points: [
            { x: 0.48, y: 0.48 },
            { x: 0.43, y: 0.44 },
            { x: 0.34, y: 0.35 },
            { x: 0.25, y: 0.28 },
          ],
          pauseAfterMs: 450,
        },
      },
      // Right horn / wing: starts on sphere surface, pulls into space
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Right surface-anchored wing pulling into air',
          durationMs: 2000,
          pressure: { start: 0.45, middle: 0.85, end: 0.15 },
          points: [
            { x: 0.52, y: 0.48 },
            { x: 0.57, y: 0.44 },
            { x: 0.66, y: 0.35 },
            { x: 0.75, y: 0.28 },
          ],
          pauseAfterMs: 500,
        },
      },
      // Center antenna launching upward
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Center antenna launching into space',
          durationMs: 1600,
          pressure: { start: 0.5, middle: 0.8, end: 0.1 },
          points: [
            { x: 0.5, y: 0.42 },
            { x: 0.5, y: 0.32 },
            { x: 0.5, y: 0.2 },
          ],
          pauseAfterMs: 600,
        },
      },
      // Camera orbit around the anchored roots
      {
        type: 'CALLOUT',
        title: 'Anchored Roots, Floating Tips',
        subtitle: 'Notice how each stroke starts rooted on the sphere and floats outward.',
        durationMs: 2600,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 1.4, deltaPhi: 0.25, durationMs: 2800 },
      { type: 'WAIT', durationMs: 600 },
      { type: 'ORBIT_CAMERA', deltaTheta: -0.7, deltaPhi: -0.15, durationMs: 1800 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 6. Change brush style
  {
    id: '06_change_brush_style',
    number: 6,
    title: 'Change brush style',
    featureTaught: 'Core brushes',
    category: 'Draw',
    goal: 'Create an expressive 3D character mask using Flat, Round, Marker, and Fine Pen brushes',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      {
        type: 'CALLOUT',
        title: 'Core Brush Profiles',
        subtitle: 'Explore distinct physical profiles designed for specialized 3D marks.',
        durationMs: 2200,
      },
      // 1. Flat Ribbon (bold jawline)
      { type: 'TAP', target: 'flat-brush', pauseAfterMs: 300 },
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Flat Ribbon bold jawline',
          durationMs: 1400,
          points: [{ x: 0.38, y: 0.45 }, { x: 0.5, y: 0.65 }, { x: 0.62, y: 0.45 }],
          pauseAfterMs: 400,
        },
      },
      // 2. Fine Pen (delicate eye details)
      { type: 'TAP', target: 'fine-pen', pauseAfterMs: 300 },
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Fine Pen left eye contour',
          durationMs: 1100,
          points: [{ x: 0.42, y: 0.45 }, { x: 0.46, y: 0.43 }, { x: 0.48, y: 0.46 }],
          pauseAfterMs: 300,
        },
      },
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Fine Pen right eye contour',
          durationMs: 1100,
          points: [{ x: 0.52, y: 0.46 }, { x: 0.54, y: 0.43 }, { x: 0.58, y: 0.45 }],
          pauseAfterMs: 400,
        },
      },
      // 3. Volumetric Round Tube (horns)
      { type: 'TAP', target: 'open-air', pauseAfterMs: 300 },
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Round volumetric horn left',
          durationMs: 1300,
          points: [{ x: 0.42, y: 0.38 }, { x: 0.34, y: 0.28 }, { x: 0.38, y: 0.2 }],
          pauseAfterMs: 300,
        },
      },
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Round volumetric horn right',
          durationMs: 1300,
          points: [{ x: 0.58, y: 0.38 }, { x: 0.66, y: 0.28 }, { x: 0.62, y: 0.2 }],
          pauseAfterMs: 400,
        },
      },
      // 4. Chisel Marker (calligraphic brow)
      { type: 'TAP', target: 'marker-brush', pauseAfterMs: 300 },
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Chisel marker expressive brow',
          durationMs: 1300,
          points: [{ x: 0.36, y: 0.36 }, { x: 0.5, y: 0.38 }, { x: 0.64, y: 0.36 }],
          pauseAfterMs: 600,
        },
      },
      // Orbit around the composite mask
      {
        type: 'CALLOUT',
        title: 'Mixed Media in 3D',
        subtitle: 'Notice the distinct thickness, lighting, and texture across each stroke.',
        durationMs: 2400,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 1.2, deltaPhi: 0.2, durationMs: 2600 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 7. Create a glowing stroke
  {
    id: '07_glowing_stroke',
    number: 7,
    title: 'Create a glowing stroke',
    featureTaught: 'Materials + bloom',
    category: 'Draw',
    goal: 'Select Neon Glow, sculpt radiant light curves, and orbit to inspect volumetric bloom',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      {
        type: 'CALLOUT',
        title: 'Neon Glow & Volumetric Bloom',
        subtitle: 'Emissive ribbons radiate light directly into the 3D studio.',
        durationMs: 2200,
      },
      { type: 'TAP', target: 'neon-glow', pauseAfterMs: 400 },
      // Glowing halo circle
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Glowing circular halo',
          durationMs: 1700,
          pressure: { start: 0.3, middle: 0.9, end: 0.3 },
          points: [
            { x: 0.38, y: 0.45 },
            { x: 0.5, y: 0.35 },
            { x: 0.62, y: 0.45 },
            { x: 0.5, y: 0.55 },
            { x: 0.38, y: 0.45 },
          ],
          pauseAfterMs: 400,
        },
      },
      // Radiant energy spikes
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Left neon energy flare',
          durationMs: 1300,
          pressure: { start: 0.4, middle: 0.85, end: 0.15 },
          points: [{ x: 0.36, y: 0.45 }, { x: 0.24, y: 0.45 }],
          pauseAfterMs: 300,
        },
      },
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Right neon energy flare',
          durationMs: 1300,
          pressure: { start: 0.4, middle: 0.85, end: 0.15 },
          points: [{ x: 0.64, y: 0.45 }, { x: 0.76, y: 0.45 }],
          pauseAfterMs: 300,
        },
      },
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Top neon crown crest',
          durationMs: 1300,
          pressure: { start: 0.4, middle: 0.85, end: 0.15 },
          points: [{ x: 0.5, y: 0.33 }, { x: 0.5, y: 0.2 }],
          pauseAfterMs: 600,
        },
      },
      // Orbit around glowing artwork
      {
        type: 'CALLOUT',
        title: 'Real-Time Bloom Reflections',
        subtitle: 'Dynamic glow intensifies with camera angle and distance.',
        durationMs: 2400,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 1.4, deltaPhi: 0.25, durationMs: 2800 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 8. Change color/material
  {
    id: '08_color_material',
    number: 8,
    title: 'Change color/material',
    featureTaught: 'Color + shaders',
    category: 'Draw',
    goal: 'Open Color Studio, switch to Gold metallic PBR material, and paint shimmering filigree',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      { type: 'TAP', target: 'draw', pauseAfterMs: 300 },
      // Base dark structure
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 1400,
          points: [{ x: 0.38, y: 0.6 }, { x: 0.5, y: 0.4 }, { x: 0.62, y: 0.6 }],
          pauseAfterMs: 400,
        },
      },
      {
        type: 'CALLOUT',
        title: 'Color Studio & PBR Materials',
        subtitle: 'Fine-tune roughness, metalness, and procedural animated shaders.',
        durationMs: 2200,
      },
      { type: 'TAP', target: 'color-studio', pauseAfterMs: 600 },
      // Apply gold metallic settings
      {
        type: 'SET_BRUSH',
        settings: { color: '#f59e0b', solidColor: '#f59e0b', roughness: 0.15, metalness: 0.95 },
      },
      { type: 'WAIT', durationMs: 400 },
      // Paint shimmering gold filigree
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Gold metallic filigree overlay',
          durationMs: 1600,
          pressure: { start: 0.3, middle: 0.8, end: 0.2 },
          points: [
            { x: 0.42, y: 0.48 },
            { x: 0.5, y: 0.44 },
            { x: 0.58, y: 0.48 },
            { x: 0.5, y: 0.54 },
            { x: 0.42, y: 0.48 },
          ],
          pauseAfterMs: 600,
        },
      },
      // Orbit to show specular highlights on gold
      {
        type: 'CALLOUT',
        title: 'Physical PBR Highlights',
        subtitle: 'Watch the metallic reflection shift as the camera turns.',
        durationMs: 2400,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 1.2, deltaPhi: 0.2, durationMs: 2600 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 9. Stabilize rough drawing
  {
    id: '09_stabilize_drawing',
    number: 9,
    title: 'Stabilize rough drawing',
    featureTaught: 'Stroke stabilization',
    category: 'Control',
    goal: 'Demonstrate how Steady Stroke eliminates hand tremor with guided tether dampening',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      {
        type: 'CALLOUT',
        title: 'Tremor vs Steady Stroke',
        subtitle: 'First: hand drawing without stabilization (natural jitter).',
        durationMs: 2200,
      },
      { type: 'TAP', target: 'draw', pauseAfterMs: 300 },
      // Jittery line with high microVariation
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Shaky hand line with tremor',
          durationMs: 1600,
          microVariation: 0.015,
          points: [
            { x: 0.32, y: 0.35 },
            { x: 0.44, y: 0.48 },
            { x: 0.56, y: 0.35 },
            { x: 0.68, y: 0.48 },
          ],
          pauseAfterMs: 600,
        },
      },
      // Turn on Steady Stroke
      {
        type: 'CALLOUT',
        title: 'Engaging Steady Stroke',
        subtitle: 'The virtual tether smooths out micro-tremor into an immaculate arc.',
        durationMs: 2200,
      },
      { type: 'TAP', target: 'shapes', pauseAfterMs: 400 },
      { type: 'SET_BRUSH', settings: { steadyStrokeLevel: 60, smoothingStrength: 0.9 } },
      // Perfectly smooth arc right underneath
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Silky smooth tethered curve',
          durationMs: 1800,
          microVariation: 0.001,
          pressure: { start: 0.3, middle: 0.8, end: 0.3 },
          points: [
            { x: 0.32, y: 0.52 },
            { x: 0.44, y: 0.65 },
            { x: 0.56, y: 0.52 },
            { x: 0.68, y: 0.65 },
          ],
          pauseAfterMs: 600,
        },
      },
      // Zoom and orbit to show the dramatic contrast
      {
        type: 'CALLOUT',
        title: 'Razor-Clean Fluidity',
        subtitle: 'Top: raw jitter. Bottom: tether-stabilized perfection.',
        durationMs: 2400,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 0.7, deltaPhi: 0.15, durationMs: 2200 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 10. Create perfect geometry
  {
    id: '10_shape_recognition',
    number: 10,
    title: 'Create perfect geometry',
    featureTaught: 'Shape recognition',
    category: 'Control',
    goal: 'Draw rough wobbly gestures and watch Shape Recognition auto-correct them into clean geometry',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      {
        type: 'CALLOUT',
        title: 'AI Shape Recognition',
        subtitle: 'Sketch rough shapes freely; the engine auto-fits perfect geometric forms.',
        durationMs: 2200,
      },
      { type: 'TAP', target: 'shapes', pauseAfterMs: 400 },
      { type: 'SET_BRUSH', settings: { shapeSnapping: true, shapeRecognition: true, predictiveLevel: 4 } },
      // Shape 1: Circle
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Rough circle snapping to geometric circle',
          durationMs: 1500,
          points: [
            { x: 0.4, y: 0.35 },
            { x: 0.48, y: 0.28 },
            { x: 0.56, y: 0.35 },
            { x: 0.48, y: 0.44 },
            { x: 0.4, y: 0.35 },
          ],
          pauseAfterMs: 500,
        },
      },
      // Shape 2: Crisp Rectangle
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Rough 4-sided polygon snapping to rectangle',
          durationMs: 1600,
          points: [
            { x: 0.36, y: 0.52 },
            { x: 0.6, y: 0.52 },
            { x: 0.6, y: 0.68 },
            { x: 0.36, y: 0.68 },
            { x: 0.36, y: 0.52 },
          ],
          pauseAfterMs: 600,
        },
      },
      // Orbit to show true 3D planar alignment
      {
        type: 'CALLOUT',
        title: 'Mathematical Alignment',
        subtitle: 'Geometric shapes form true mathematical planes in 3D.',
        durationMs: 2400,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 1.1, deltaPhi: 0.2, durationMs: 2500 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 11. Draw precise straight/isometric lines
  {
    id: '11_ruler_snapping',
    number: 11,
    title: 'Draw precise straight/isometric lines',
    featureTaught: 'Ruler + snapping',
    category: 'Control',
    goal: 'Enable Ruler and 30° snapping to construct an isometric 3D architectural frame',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      {
        type: 'CALLOUT',
        title: 'Ruler & Isometric Snapping',
        subtitle: 'Snap strokes to 30°, 60°, and 90° for architectural precision.',
        durationMs: 2200,
      },
      { type: 'TAP', target: 'ruler', pauseAfterMs: 400 },
      { type: 'SET_BRUSH', settings: { straightLineMode: true } },
      // Isometric base 1 (30 deg)
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 900,
          points: [{ x: 0.5, y: 0.58 }, { x: 0.66, y: 0.49 }],
          pauseAfterMs: 250,
        },
      },
      // Isometric base 2 (150 deg)
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 900,
          points: [{ x: 0.5, y: 0.58 }, { x: 0.34, y: 0.49 }],
          pauseAfterMs: 250,
        },
      },
      // Vertical post center (90 deg)
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 900,
          points: [{ x: 0.5, y: 0.58 }, { x: 0.5, y: 0.32 }],
          pauseAfterMs: 250,
        },
      },
      // Vertical post right
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 900,
          points: [{ x: 0.66, y: 0.49 }, { x: 0.66, y: 0.23 }],
          pauseAfterMs: 250,
        },
      },
      // Vertical post left
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 900,
          points: [{ x: 0.34, y: 0.49 }, { x: 0.34, y: 0.23 }],
          pauseAfterMs: 250,
        },
      },
      // Top roof connector 1
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 900,
          points: [{ x: 0.5, y: 0.32 }, { x: 0.66, y: 0.23 }],
          pauseAfterMs: 250,
        },
      },
      // Top roof connector 2
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 900,
          points: [{ x: 0.5, y: 0.32 }, { x: 0.34, y: 0.23 }],
          pauseAfterMs: 600,
        },
      },
      // Orbit to reveal architectural 3D volume
      {
        type: 'CALLOUT',
        title: 'Architectural Isometric Frame',
        subtitle: 'Clean lines constructed rapidly using angular constraints.',
        durationMs: 2400,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 1.2, deltaPhi: 0.25, durationMs: 2600 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 12. Use a curved guide rail
  {
    id: '12_curved_guide_rail',
    number: 12,
    title: 'Use a curved guide rail',
    featureTaught: 'Guide Rail',
    category: 'Control',
    goal: 'Draw along a curved guide rail to produce flawless smooth 3D sweeping curves',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      {
        type: 'CALLOUT',
        title: '3D Curved Guide Rails',
        subtitle: 'Magnetic guide rails pull your pen along perfect spatial curves.',
        durationMs: 2200,
      },
      // Stroke 1: Sweeping S-curve along guide
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Sweeping guide-snapped S curve',
          durationMs: 1800,
          pressure: { start: 0.3, middle: 0.85, end: 0.2 },
          points: [
            { x: 0.28, y: 0.55 },
            { x: 0.42, y: 0.32 },
            { x: 0.58, y: 0.68 },
            { x: 0.72, y: 0.45 },
          ],
          pauseAfterMs: 400,
        },
      },
      // Stroke 2: Parallel harmonic ribbon
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Parallel harmonic ribbon curve',
          durationMs: 1800,
          pressure: { start: 0.25, middle: 0.8, end: 0.25 },
          points: [
            { x: 0.32, y: 0.6 },
            { x: 0.46, y: 0.37 },
            { x: 0.62, y: 0.73 },
            { x: 0.76, y: 0.5 },
          ],
          pauseAfterMs: 600,
        },
      },
      // Camera orbit around the ribbon
      {
        type: 'CALLOUT',
        title: 'Flawless 3D Trajectory',
        subtitle: 'Zero hand jitter; mathematical curvature across all 3 axes.',
        durationMs: 2400,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 1.3, deltaPhi: 0.2, durationMs: 2600 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 13. Select and move artwork
  {
    id: '13_select_transform',
    number: 13,
    title: 'Select and move artwork',
    featureTaught: 'Select + Transform',
    category: 'Build',
    goal: 'Select existing 3D strokes, engage the 3D Gizmo, and reposition in space',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      { type: 'TAP', target: 'draw', pauseAfterMs: 300 },
      // Create initial artwork
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 1400,
          points: [{ x: 0.45, y: 0.55 }, { x: 0.52, y: 0.38 }, { x: 0.59, y: 0.55 }],
          pauseAfterMs: 400,
        },
      },
      {
        type: 'CALLOUT',
        title: 'Select & Transform',
        subtitle: 'Tap any stroke to bring up the 3D translation & rotation gizmo.',
        durationMs: 2200,
      },
      { type: 'TAP', target: 'select', pauseAfterMs: 400 },
      { type: 'SELECT_STROKE' },
      // Move cursor to stroke
      { type: 'MOVE_POINTER', x: 0.52, y: 0.46, durationMs: 350 },
      { type: 'WAIT', durationMs: 500 },
      // Drag Gizmo to translate
      { type: 'TRANSLATE_SELECTION', deltaX: 0.35, deltaY: 0.1, deltaZ: 0, durationMs: 400 },
      { type: 'MOVE_POINTER', x: 0.64, y: 0.42, durationMs: 800 },
      { type: 'WAIT', durationMs: 400 },
      // Orbit camera around transformed position
      {
        type: 'CALLOUT',
        title: 'Spatial Repositioning',
        subtitle: 'Artwork moves fluidly across world space or local object frames.',
        durationMs: 2200,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 1.0, deltaPhi: 0.2, durationMs: 2400 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 14. Lasso multiple strokes
  {
    id: '14_lasso_duplicate',
    number: 14,
    title: 'Lasso multiple strokes',
    featureTaught: 'Lasso + duplicate',
    category: 'Build',
    goal: 'Circle multiple strokes with lasso selection, duplicate them, and reposition as a group',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      { type: 'TAP', target: 'draw', pauseAfterMs: 300 },
      // Draw element 1
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 1100,
          points: [{ x: 0.42, y: 0.52 }, { x: 0.44, y: 0.42 }, { x: 0.48, y: 0.46 }],
          pauseAfterMs: 300,
        },
      },
      // Draw element 2
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 1100,
          points: [{ x: 0.48, y: 0.46 }, { x: 0.52, y: 0.42 }, { x: 0.54, y: 0.52 }],
          pauseAfterMs: 500,
        },
      },
      {
        type: 'CALLOUT',
        title: 'Lasso Multi-Select',
        subtitle: 'Circle around multiple strokes to group and transform together.',
        durationMs: 2200,
      },
      { type: 'TAP', target: 'select', pauseAfterMs: 400 },
      // Lasso circle gesture
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Lasso bounding loop',
          durationMs: 1400,
          points: [
            { x: 0.36, y: 0.36 },
            { x: 0.6, y: 0.36 },
            { x: 0.6, y: 0.62 },
            { x: 0.36, y: 0.62 },
            { x: 0.36, y: 0.36 },
          ],
          pauseAfterMs: 600,
        },
      },
      // Move combined group
      { type: 'MOVE_POINTER', x: 0.62, y: 0.44, durationMs: 700 },
      { type: 'WAIT', durationMs: 500 },
      {
        type: 'CALLOUT',
        title: 'Group Manipulation',
        subtitle: 'Multi-stroke clusters remain organized as coherent components.',
        durationMs: 2200,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 1.1, deltaPhi: 0.2, durationMs: 2400 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 15. Add and use a mannequin
  {
    id: '15_mannequin_scaffolding',
    number: 15,
    title: 'Add and use a mannequin',
    featureTaught: '3D scaffolding',
    category: 'Build',
    goal: 'Insert an anatomical mannequin and sketch proportional costume lines over it',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      { type: 'INSERT_OBJECT', objectType: 'mannequin' },
      {
        type: 'CALLOUT',
        title: 'Anatomical 3D Mannequin',
        subtitle: 'Use poseable 3D scaffolding for instant proportional confidence.',
        durationMs: 2200,
      },
      { type: 'WAIT', durationMs: 600 },
      { type: 'ORBIT_CAMERA', deltaTheta: 0.4, deltaPhi: 0.1, durationMs: 1600 },
      { type: 'TAP', target: 'draw', pauseAfterMs: 350 },
      // Sketch chest strap
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Anatomical chest strap contour',
          durationMs: 1300,
          points: [{ x: 0.46, y: 0.42 }, { x: 0.52, y: 0.48 }, { x: 0.56, y: 0.54 }],
          pauseAfterMs: 350,
        },
      },
      // Sketch collar plate
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Collar plate contour',
          durationMs: 1300,
          points: [{ x: 0.46, y: 0.44 }, { x: 0.52, y: 0.47 }, { x: 0.58, y: 0.44 }],
          pauseAfterMs: 400,
        },
      },
      // Sketch headband
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Headband visor line',
          durationMs: 1200,
          points: [{ x: 0.47, y: 0.38 }, { x: 0.52, y: 0.37 }, { x: 0.57, y: 0.38 }],
          pauseAfterMs: 600,
        },
      },
      // 3D orbit around the dressed mannequin
      {
        type: 'CALLOUT',
        title: '3D Proportional Reference',
        subtitle: 'Draw garments and accessories with correct spatial volume from every angle.',
        durationMs: 2500,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 1.3, deltaPhi: 0.15, durationMs: 2800 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 16. Organize with layers
  {
    id: '16_organize_layers',
    number: 16,
    title: 'Organize with layers',
    featureTaught: 'Layers',
    category: 'Build',
    goal: 'Create separate 3D layers, adjust opacity for tracing, and lock reference lines',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      { type: 'TAP', target: 'draw', pauseAfterMs: 300 },
      // Rough underdrawing on layer 1
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 1300,
          points: [{ x: 0.4, y: 0.55 }, { x: 0.5, y: 0.4 }, { x: 0.6, y: 0.55 }],
          pauseAfterMs: 400,
        },
      },
      {
        type: 'CALLOUT',
        title: '3D Layer Organization',
        subtitle: 'Separate construction lines, clean ink, and highlights across layers.',
        durationMs: 2200,
      },
      { type: 'TAP', target: 'layers', pauseAfterMs: 600 },
      { type: 'WAIT', durationMs: 800 },
      // Clean ink line over the top
      {
        type: 'DRAW_STROKE',
        stroke: {
          intent: 'Clean ink detail line',
          durationMs: 1400,
          points: [{ x: 0.44, y: 0.52 }, { x: 0.5, y: 0.43 }, { x: 0.56, y: 0.52 }],
          pauseAfterMs: 600,
        },
      },
      {
        type: 'CALLOUT',
        title: 'Independent Layer Control',
        subtitle: 'Hide, lock, or dim underlying sketches with zero risk to final inks.',
        durationMs: 2400,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 0.9, deltaPhi: 0.2, durationMs: 2400 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 17. Use reference artwork
  {
    id: '17_reference_artwork',
    number: 17,
    title: 'Use reference artwork',
    featureTaught: 'Reference images',
    category: 'Build',
    goal: 'Pin 2D concept art directly inside the 3D scene and sketch alongside it',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      {
        type: 'CALLOUT',
        title: 'In-Scene Reference Boards',
        subtitle: 'Pin concept sheets and color palettes directly in the 3D viewport.',
        durationMs: 2200,
      },
      { type: 'WAIT', durationMs: 800 },
      { type: 'TAP', target: 'draw', pauseAfterMs: 300 },
      // Sketch inspired by reference
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 1400,
          points: [{ x: 0.45, y: 0.58 }, { x: 0.55, y: 0.38 }, { x: 0.65, y: 0.52 }],
          pauseAfterMs: 500,
        },
      },
      {
        type: 'CALLOUT',
        title: 'Spatial Comparison',
        subtitle: 'Orbit around your artwork while reference images stay pinned in space.',
        durationMs: 2400,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 1.1, deltaPhi: 0.2, durationMs: 2600 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 18. Change lighting dramatically
  {
    id: '18_change_lighting',
    number: 18,
    title: 'Change lighting dramatically',
    featureTaught: 'Lighting',
    category: 'Present',
    goal: 'Adjust studio illumination, rotate the dome light, and apply cinematic lighting presets',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      { type: 'TAP', target: 'draw', pauseAfterMs: 300 },
      // Create reflective sculpture
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 1400,
          points: [{ x: 0.36, y: 0.6 }, { x: 0.5, y: 0.38 }, { x: 0.64, y: 0.6 }],
          pauseAfterMs: 300,
        },
      },
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 1300,
          points: [{ x: 0.5, y: 0.38 }, { x: 0.5, y: 0.65 }],
          pauseAfterMs: 400,
        },
      },
      {
        type: 'CALLOUT',
        title: 'Studio Illumination Setup',
        subtitle: 'Rotate environmental dome lights to cast dynamic shadows.',
        durationMs: 2200,
      },
      { type: 'TAP', target: 'illumination', pauseAfterMs: 600 },
      // Orbit to show rim lighting and specular highlights
      {
        type: 'CALLOUT',
        title: 'Cinematic Specular Rim Light',
        subtitle: 'Reflections and highlights adapt in real time as the light sweeps.',
        durationMs: 2400,
      },
      { type: 'ORBIT_CAMERA', deltaTheta: 1.4, deltaPhi: 0.3, durationMs: 2800 },
      { type: 'WAIT', durationMs: 600 },
      { type: 'ORBIT_CAMERA', deltaTheta: -0.8, deltaPhi: -0.15, durationMs: 2000 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 19. Change camera presentation
  {
    id: '19_camera_presentation',
    number: 19,
    title: 'Change camera presentation',
    featureTaught: 'Camera/views',
    category: 'Present',
    goal: 'Switch between Perspective (creative depth) and Orthographic (isometric CAD accuracy)',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      { type: 'TAP', target: 'draw', pauseAfterMs: 300 },
      // 3D cube / box sketch
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 1200,
          points: [{ x: 0.4, y: 0.5 }, { x: 0.6, y: 0.5 }],
          pauseAfterMs: 200,
        },
      },
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 1200,
          points: [{ x: 0.5, y: 0.4 }, { x: 0.5, y: 0.6 }],
          pauseAfterMs: 400,
        },
      },
      {
        type: 'CALLOUT',
        title: 'Perspective vs Orthographic',
        subtitle: 'Switch instantly between dynamic depth and technical isometric projection.',
        durationMs: 2400,
      },
      { type: 'TAP', target: 'camera', pauseAfterMs: 500 },
      // Front view
      { type: 'ORBIT_CAMERA', deltaTheta: 0.7, deltaPhi: 0.0, durationMs: 1800 },
      { type: 'WAIT', durationMs: 500 },
      // Isometric view
      { type: 'ORBIT_CAMERA', deltaTheta: 0.5, deltaPhi: 0.35, durationMs: 1800 },
      { type: 'WAIT', durationMs: 800 },
    ],
  },

  // 20. Finish and export
  {
    id: '20_finish_and_export',
    number: 20,
    title: 'Finish and export',
    featureTaught: 'Final output',
    category: 'Export',
    goal: 'Frame artwork in the beauty viewport and export transparent PNGs and industry-standard GLB files',
    deviceTargets: ['desktop', 'tablet', 'phone'],
    steps: [
      { type: 'CLEAR_SCENE' },
      { type: 'TAP', target: 'draw', pauseAfterMs: 300 },
      // Final crest artwork
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 1400,
          points: [{ x: 0.38, y: 0.6 }, { x: 0.5, y: 0.35 }, { x: 0.62, y: 0.6 }],
          pauseAfterMs: 300,
        },
      },
      {
        type: 'DRAW_STROKE',
        stroke: {
          durationMs: 1300,
          points: [{ x: 0.44, y: 0.48 }, { x: 0.5, y: 0.44 }, { x: 0.56, y: 0.48 }],
          pauseAfterMs: 500,
        },
      },
      // Orbit beauty framing
      { type: 'ORBIT_CAMERA', deltaTheta: 0.8, deltaPhi: 0.15, durationMs: 2000 },
      {
        type: 'CALLOUT',
        title: 'High-Fidelity Export',
        subtitle: 'Export transparent PNGs, 4K snapshots, or GLB models ready for Blender & Unreal.',
        durationMs: 2400,
      },
      { type: 'TAP', target: 'export', pauseAfterMs: 600 },
      { type: 'WAIT', durationMs: 1200 },
    ],
  },
];

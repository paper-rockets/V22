import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = 'E:/X/AiStudio Workflow/V20/screenshots/s6lite-audit/landscape';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const targetUrl = process.env.APP_URL || 'http://localhost:3002/?device=none';
const simulatorUrl = process.env.SIMULATOR_URL || 'http://localhost:3002/?device=s6lite&orientation=landscape';

async function captureAllScreenshots() {
  console.log('===============================================================');
  console.log('  GALAXY TAB S6 LITE LANDSCAPE AUDIT: SCREENSHOT RUNNER');
  console.log('===============================================================');
  console.log(`Target Studio URL: ${targetUrl}`);
  console.log(`Simulator URL:     ${simulatorUrl}`);
  console.log(`Output Directory:  ${SCREENSHOT_DIR}`);
  console.log('Resolution: 2000 × 1200 Landscape (Viewport 1000 × 600 @ 2.0 DPR)');
  console.log('Device Profile: Samsung Galaxy Tab S6 Lite (SM-P610)');
  console.log('Coverage: Full Dark Mode Suite + Complete Light Mode Suite');
  console.log('---------------------------------------------------------------\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl'],
  });

  const context = await browser.newContext({
    viewport: { width: 1000, height: 600 },
    deviceScaleFactor: 2.0, // 1000 * 2 = 2000, 600 * 2 = 1200 (Exact Tab S6 Lite native resolution)
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-P610) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('  [Browser Error]:', msg.text());
    }
  });

  const manifest = [];

  async function snap(filename, description, category = 'General', theme = 'Dark') {
    const filePath = path.join(SCREENSHOT_DIR, filename);
    await page.waitForTimeout(400);
    await page.screenshot({ path: filePath });
    const stat = fs.statSync(filePath);
    const item = {
      filename,
      description,
      category,
      theme,
      path: filePath,
      sizeBytes: stat.size,
      resolution: '2000 × 1200 px',
      aspectRatio: '5 : 3 (Landscape)',
      timestamp: new Date().toISOString(),
    };
    manifest.push(item);
    console.log(`[SAVED] ${filename} (${Math.round(stat.size / 1024)} KB) - [${theme}] ${description}`);
  }

  try {
    console.log('1. Navigating to Studio application (Wide Landscape Canvas)...');
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Ensure dark theme initially
    await page.evaluate(() => {
      window.__testApp?.setTheme?.('dark');
      window.__testApp?.closeAllModals?.();
    });
    await page.waitForTimeout(500);

    // =========================================================================
    // PART 1: COMPLETE DARK MODE SUITE (LANDSCAPE 1000 × 600 @ 2.0 DPR)
    // =========================================================================

    // -------------------------------------------------------------------------
    // CATEGORY 1: BASE WORKSPACE & WIDE TABLET CANVAS
    // -------------------------------------------------------------------------
    console.log('\n--- Category 1: Dark Mode - Base Workspace & Landscape Canvas ---');
    await snap('01-dark-base-canvas-landscape.png', 'Base 3D Canvas in Landscape Wide Tablet Layout', 'Base Workspace', 'Dark');

    // -------------------------------------------------------------------------
    // CATEGORY 2: BOTTOM DOCK QUICK TOOLS
    // -------------------------------------------------------------------------
    console.log('\n--- Category 2: Dark Mode - Bottom Dock Quick Tools ---');

    const drawBtn = page.locator('button[data-pro-rail-button="true"][aria-label="Draw"]');
    if (await drawBtn.isVisible()) {
      await drawBtn.click();
      await snap('02-dark-dock-tool-draw-active.png', 'Bottom Dock: Draw Tool Active', 'Bottom Dock', 'Dark');
    }

    const eraseBtn = page.locator('button[data-pro-rail-button="true"][aria-label="Erase"]');
    if (await eraseBtn.isVisible()) {
      await eraseBtn.click();
      await snap('03-dark-dock-tool-erase-active.png', 'Bottom Dock: Erase Tool Active', 'Bottom Dock', 'Dark');
    }

    if (await drawBtn.isVisible()) {
      await drawBtn.click();
      await page.waitForTimeout(200);
    }

    // Color Swatch Shelf
    const colorBtn = page.locator('button[data-pro-rail-button="true"][aria-label="Color"]');
    if (await colorBtn.isVisible()) {
      await colorBtn.click();
      await page.waitForTimeout(400);
      await snap('04-dark-dock-color-shelf-open.png', 'Bottom Dock: Quick Color Shelf Open', 'Bottom Dock', 'Dark');

      const blueSwatch = page.locator('button[aria-label="Pick color #2563eb"], button[title*="#2563eb"]').first();
      if (await blueSwatch.isVisible()) {
        await blueSwatch.click();
        await snap('05-dark-dock-color-shelf-swatch-selected.png', 'Bottom Dock: Royal Blue Swatch Selected', 'Bottom Dock', 'Dark');
      }

      await colorBtn.click();
      await page.waitForTimeout(300);
    }

    // Brush Size Shelf
    const sizeBtn = page.locator('button[data-pro-rail-button="true"][aria-label="Stroke size"]');
    if (await sizeBtn.isVisible()) {
      await sizeBtn.click();
      await page.waitForTimeout(400);
      await snap('06-dark-dock-size-shelf-open.png', 'Bottom Dock: Brush Size Slider Shelf Open', 'Bottom Dock', 'Dark');

      const slider = page.locator('.paperrocket-studio-shelf input[type="range"]').first();
      if (await slider.isVisible()) {
        await slider.fill('0.08');
        await snap('07-dark-dock-size-slider-adjusted.png', 'Bottom Dock: Brush Size Slider Adjusted to 0.08', 'Bottom Dock', 'Dark');
      }

      await sizeBtn.click();
      await page.waitForTimeout(300);
    }

    // Quick Brush Presets Shelf
    const brushBtn = page.locator('button[data-pro-rail-button="true"][aria-label="Brushes"]');
    if (await brushBtn.isVisible()) {
      await brushBtn.click();
      await page.waitForTimeout(400);
      await snap('08-dark-dock-brush-shelf-open.png', 'Bottom Dock: Quick Brush Preset Shelf Open', 'Bottom Dock', 'Dark');

      const conformalBtn = page.locator('button:has-text("Hugs models"), button:has-text("Conformal")').first();
      if (await conformalBtn.isVisible()) {
        await conformalBtn.click();
        await snap('09-dark-dock-brush-conformal-selected.png', 'Bottom Dock: Conformal Bead Hugs Model Brush Selected', 'Bottom Dock', 'Dark');
      }

      await brushBtn.click();
      await page.waitForTimeout(300);
    }

    // Symmetry Mode
    const symmBtn = page.locator('button[data-pro-rail-button="true"][aria-label="Symmetry"]');
    if (await symmBtn.isVisible()) {
      await symmBtn.click();
      await page.waitForTimeout(400);
      await snap('10-dark-dock-symmetry-active.png', 'Bottom Dock: Symmetry Tool Activated in Scene', 'Bottom Dock', 'Dark');
      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    // -------------------------------------------------------------------------
    // CATEGORY 3: RIGHT RAIL MODAL PANELS (SELECT, CREATE, DEFORM, LAYERS)
    // -------------------------------------------------------------------------
    console.log('\n--- Category 3: Dark Mode - Right Rail Mode Panels ---');

    // Select Mode
    const selectRailBtn = page.locator('button.paperrocket-studio-mode[aria-label="Select"]');
    if (await selectRailBtn.isVisible()) {
      await selectRailBtn.click();
      await page.waitForTimeout(500);
      await snap('11-dark-rail-select-panel-open.png', 'Right Rail: Select Panel Open', 'Right Rail', 'Dark');

      const lassoBtn = page.locator('button:has-text("Lasso"), button[title*="Lasso"]').first();
      if (await lassoBtn.isVisible()) {
        await lassoBtn.click();
        await snap('12-dark-rail-select-lasso-mode.png', 'Right Rail: Lasso Select Mode Active', 'Right Rail', 'Dark');
      }

      const transformToggle = page.locator('button:has-text("Transform Details"), button:has-text("Exact Position")').first();
      if (await transformToggle.isVisible()) {
        await transformToggle.click();
        await snap('13-dark-rail-select-transform-details.png', 'Right Rail: Transform Coordinates & Values Expanded', 'Right Rail', 'Dark');
      }

      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    // Create Mode (3D Primitives)
    const createRailBtn = page.locator('button.paperrocket-studio-mode[aria-label="Create"]');
    if (await createRailBtn.isVisible()) {
      await createRailBtn.click();
      await page.waitForTimeout(500);
      await snap('14-dark-rail-create-panel-primitives.png', 'Right Rail: Create Panel & 3D Shapes Overview', 'Right Rail', 'Dark');

      const cubeBtn = page.locator('button[title*="Cube"]').first();
      if (await cubeBtn.isVisible()) {
        await cubeBtn.click();
        await page.waitForTimeout(400);
        await snap('15-dark-rail-create-action-spawn-cube.png', 'Action: 3D Cube Primitive Spawned in Scene', 'Actions & 3D Shapes', 'Dark');
      }

      const sphereBtn = page.locator('button[title*="Sphere"]').first();
      if (await sphereBtn.isVisible()) {
        await sphereBtn.click();
        await page.waitForTimeout(400);
        await snap('16-dark-rail-create-action-spawn-sphere.png', 'Action: 3D Sphere Primitive Spawned in Scene', 'Actions & 3D Shapes', 'Dark');
      }

      const clayBtn = page.locator('button:has-text("White Clay")').first();
      if (await clayBtn.isVisible()) {
        await clayBtn.click();
        await page.waitForTimeout(400);
        await snap('17-dark-rail-create-show-as-clay.png', 'Action: Display Mode Switched to White Clay', 'Actions & 3D Shapes', 'Dark');
      }

      const textureBtn = page.locator('button:has-text("Full Texture")').first();
      if (await textureBtn.isVisible()) {
        await textureBtn.click();
        await page.waitForTimeout(400);
        await snap('18-dark-rail-create-show-as-texture.png', 'Action: Display Mode Switched to Full Texture', 'Actions & 3D Shapes', 'Dark');
      }

      const fineGeomBtn = page.locator('button:has-text("Fine Geometry & Display"), button:has-text("Opacity / Wireframe")').first();
      if (await fineGeomBtn.isVisible()) {
        await fineGeomBtn.click();
        await page.waitForTimeout(400);
        await snap('19-dark-rail-create-fine-geometry-sliders.png', 'Right Rail: Fine Geometry & Display Sliders Open', 'Right Rail', 'Dark');
      }

      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    // Deform Mode
    const deformRailBtn = page.locator('button.paperrocket-studio-mode[aria-label="Deform"]');
    if (await deformRailBtn.isVisible()) {
      await deformRailBtn.click();
      await page.waitForTimeout(500);
      await snap('20-dark-rail-deform-panel-overview.png', 'Right Rail: Deform & Sculpt Panel Overview', 'Right Rail', 'Dark');

      // Click X Axis symmetry toggle button
      const xAxisBtn = page.locator('button:has-text("X"), button:has-text("X-Axis")').first();
      if (await xAxisBtn.isVisible()) {
        await xAxisBtn.click();
        await page.waitForTimeout(400);
        await snap('21-dark-rail-deform-mirror-plane-active.png', 'Right Rail: Mirror Plane Active along X-Axis', 'Right Rail', 'Dark');
      }

      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    // Layers Mode
    const layersRailBtn = page.locator('button.paperrocket-studio-mode[aria-label="Layers"]');
    if (await layersRailBtn.isVisible()) {
      await layersRailBtn.click();
      await page.waitForTimeout(500);
      await snap('22-dark-rail-layers-panel-overview.png', 'Right Rail: Layers Panel Overview', 'Right Rail', 'Dark');

      const addLayerBtn = page.locator('button[title*="Add Layer"], button:has-text("New Layer"), button:has-text("Add")').first();
      if (await addLayerBtn.isVisible()) {
        await addLayerBtn.click();
        await page.waitForTimeout(400);
        await snap('23-dark-rail-layers-new-layer-added.png', 'Action: New Artwork Layer Created', 'Scene Layers', 'Dark');
      }

      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    // -------------------------------------------------------------------------
    // CATEGORY 4: DRAW PANEL & FULL BRUSH SUITE
    // -------------------------------------------------------------------------
    console.log('\n--- Category 4: Dark Mode - Draw Panel & Brushes ---');

    await page.evaluate(() => window.__testApp?.openSheet?.('draw'));
    await page.waitForTimeout(500);
    await snap('24-dark-draw-panel-paint-tab.png', 'Draw Panel: Paint Tab (Profiles & Surface Alignments)', 'Draw & Brushes', 'Dark');

    const brushTabBtn = page.locator('button:has-text("Brush")').first();
    if (await brushTabBtn.isVisible()) {
      await brushTabBtn.click();
      await page.waitForTimeout(400);
      await snap('25-dark-draw-panel-brush-tab-curated.png', 'Draw Panel: Brush Tab (Curated Essential Presets)', 'Draw & Brushes', 'Dark');

      const moreBrushesBtn = page.locator('button:has-text("More brushes"), button:has-text("Show All")').first();
      if (await moreBrushesBtn.isVisible()) {
        await moreBrushesBtn.click();
        await page.waitForTimeout(400);
        await snap('26-dark-draw-panel-brush-tab-more-expanded.png', 'Draw Panel: All Specialist Brushes Suite Expanded', 'Draw & Brushes', 'Dark');
      }
    }

    const fineTuneTabBtn = page.locator('button:has-text("Fine tune"), button:has-text("Advanced")').first();
    if (await fineTuneTabBtn.isVisible()) {
      await fineTuneTabBtn.click();
      await page.waitForTimeout(400);
      await snap('27-dark-draw-panel-advanced-tab.png', 'Draw Panel: Fine Tune Tab (Smoothing, Real Size & Intensity)', 'Draw & Brushes', 'Dark');
    }

    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // Shapes Sheet
    await page.evaluate(() => window.__testApp?.openSheet?.('shapes'));
    await page.waitForTimeout(500);
    await snap('28-dark-shapes-sheet-snapping-settings.png', 'Shapes Sheet: Algorithmic Geometric Snapping Controls', 'Draw & Brushes', 'Dark');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // CATEGORY 5: IN-CANVAS 3D BRUSH ACTIONS (CLAY, RIBBON, TUBE)
    // -------------------------------------------------------------------------
    console.log('\n--- Category 5: Dark Mode - In-Canvas 3D Brush Drawing ---');

    // 1. Tube Stroke (Golden Amber)
    console.log('Drawing 3D Tube stroke...');
    await page.evaluate(() => {
      window.__testApp?.setBrushSettings?.((prev) => ({
        ...prev,
        color: '#f59e0b',
        size: 0.05,
        profile: 'tube',
        drawingMode: 'spatial_3d',
      }));
    });
    await page.mouse.move(340, 260);
    await page.mouse.down();
    for (let i = 0; i < 24; i++) {
      await page.mouse.move(340 + i * 12, 260 + Math.sin(i / 3) * 35);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    await page.waitForTimeout(500);
    await snap('29-dark-canvas-tube-stroke-drawn.png', 'Canvas: Golden Amber 3D Tube Stroke Drawn Freehand', 'Canvas Drawing', 'Dark');

    // 2. Ribbon Stroke (Hot Magenta)
    console.log('Drawing 3D Ribbon stroke...');
    await page.evaluate(() => {
      window.__testApp?.setBrushSettings?.((prev) => ({
        ...prev,
        color: '#ec4899',
        size: 0.06,
        profile: 'ribbon',
        drawingMode: 'spatial_3d',
      }));
    });
    await page.mouse.move(360, 350);
    await page.mouse.down();
    for (let i = 0; i < 22; i++) {
      await page.mouse.move(360 + i * 12, 350 - i * 5);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    await page.waitForTimeout(500);
    await snap('30-dark-canvas-ribbon-stroke-drawn.png', 'Canvas: Hot Magenta 3D Ribbon Stroke Drawn Freehand', 'Canvas Drawing', 'Dark');

    // 3. White Clay Stroke
    console.log('Drawing 3D White Clay stroke...');
    await page.evaluate(() => {
      window.__testApp?.setBrushSettings?.((prev) => ({
        ...prev,
        color: '#f8fafc',
        size: 0.07,
        profile: 'conformal',
        materialType: 'clay',
        drawingMode: 'spatial_3d',
      }));
    });
    await page.mouse.move(400, 200);
    await page.mouse.down();
    for (let i = 0; i < 20; i++) {
      await page.mouse.move(400 + i * 10, 200 + i * 8);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    await page.waitForTimeout(500);
    await snap('31-dark-canvas-clay-stroke-drawn.png', 'Canvas: White Clay Sculptural Stroke Drawn Freehand', 'Canvas Drawing', 'Dark');

    // 4. Erase a section of strokes
    if (await eraseBtn.isVisible()) {
      await eraseBtn.click();
      await page.waitForTimeout(300);
      await page.mouse.move(480, 250);
      await page.mouse.down();
      for (let i = 0; i < 15; i++) {
        await page.mouse.move(480 + i * 5, 250 + i * 3);
        await page.waitForTimeout(16);
      }
      await page.mouse.up();
      await page.waitForTimeout(500);
      await snap('32-dark-canvas-stroke-erased.png', 'Action: Precision Eraser Carving Through 3D Strokes', 'Canvas Drawing', 'Dark');
      await drawBtn.click();
    }

    // -------------------------------------------------------------------------
    // CATEGORY 6: COLOR STUDIO SUITE
    // -------------------------------------------------------------------------
    console.log('\n--- Category 6: Dark Mode - Color Studio Suite ---');

    await page.evaluate(() => window.__testApp?.openModal?.('colorStudio'));
    await page.waitForTimeout(600);

    // Tab 1: HSV Color Wheel
    const hsvTabBtn = page.locator('button:has-text("HSV Wheel")').first();
    if (await hsvTabBtn.isVisible()) {
      await hsvTabBtn.click();
      await page.waitForTimeout(400);
      await snap('33-dark-color-studio-tab-wheel.png', 'Color Studio: HSV Color Wheel & Brightness Slider', 'Color Studio', 'Dark');
    }

    // Tab 2: OKLCh Polar
    const oklchTab = page.locator('button:has-text("OKLCh Polar"), button:has-text("OKLCh")').first();
    if (await oklchTab.isVisible()) {
      await oklchTab.click();
      await page.waitForTimeout(400);
      await snap('34-dark-color-studio-tab-oklch-polar.png', 'Color Studio: OKLCh Polar Color Space (Lightness, Chroma, Hue)', 'Color Studio', 'Dark');

      const posterizeToggle = page.locator('button:has-text("Posterize"), input[type="checkbox"]').first();
      if (await posterizeToggle.isVisible()) {
        await posterizeToggle.click();
        await snap('35-dark-color-studio-oklch-posterize-steps.png', 'Color Studio: OKLCh Posterization Stepped Quantization', 'Color Studio', 'Dark');
      }
    }

    // Tab 3: Harmonies
    const harmoniesTab = page.locator('button:has-text("Harmonies")').first();
    if (await harmoniesTab.isVisible()) {
      await harmoniesTab.click();
      await page.waitForTimeout(400);
      await snap('36-dark-color-studio-tab-harmonies.png', 'Color Studio: Complementary & Analogous Color Harmonies', 'Color Studio', 'Dark');

      const curatedBtn = page.locator('button:has-text("Curated Palettes"), button:has-text("Drafting Neon")').first();
      if (await curatedBtn.isVisible()) {
        await curatedBtn.click();
        await page.waitForTimeout(400);
        await snap('37-dark-color-studio-harmonies-curated-palettes.png', 'Color Studio: Curated Designer Color Palettes List', 'Color Studio', 'Dark');
      }
    }

    // Tab 4: 1-Click Shaders
    const shadersTab = page.locator('button:has-text("1-Click Shaders"), button:has-text("Shaders")').first();
    if (await shadersTab.isVisible()) {
      await shadersTab.click();
      await page.waitForTimeout(400);
      await snap('38-dark-color-studio-tab-material-shaders.png', 'Color Studio: 1-Click 3D Material Shaders Suite', 'Color Studio', 'Dark');

      // Click a shader preset card in the grid
      const presetCard = page.locator('.grid div[title]').first();
      if (await presetCard.isVisible()) {
        await presetCard.click();
        await snap('39-dark-color-studio-shader-metal-applied.png', 'Action: 1-Click PBR Shader Preset Applied to Brush', 'Color Studio', 'Dark');
      }
    }

    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // CATEGORY 7: TOP STRIP & TOP MORE MENU
    // -------------------------------------------------------------------------
    console.log('\n--- Category 7: Dark Mode - Top More Menu ---');

    // Trigger more actions modal directly
    await page.evaluate(() => {
      const moreBtn = document.querySelector('button[aria-label="More actions"]');
      if (moreBtn) moreBtn.click();
    });
    await page.waitForTimeout(500);
    await snap('40-dark-top-more-menu-open.png', 'Top More Menu: Quick Actions & Navigation Dropdown Dialog Open', 'Top More Menu', 'Dark');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // CATEGORY 8: STUDIO SETTINGS SHEET (S-PEN & PERFORMANCE TIER)
    // -------------------------------------------------------------------------
    console.log('\n--- Category 8: Dark Mode - Studio Settings Sheet ---');

    await page.evaluate(() => window.__testApp?.openModal?.('settings'));
    await page.waitForTimeout(500);
    await snap('41-dark-settings-sheet-appearance-theme.png', 'Settings Sheet: Appearance, Theme & S-Pen Stylus Controls', 'Settings', 'Dark');

    const settingsContainer = page.locator('.paperrocket-studio-sheet-content, [role="dialog"]').first();
    if (await settingsContainer.isVisible()) {
      // Reveal more settings
      const moreSettingsBtn = page.locator('button.paperrocket-settings-more, button:has-text("More settings")').first();
      if (await moreSettingsBtn.isVisible()) {
        await moreSettingsBtn.click();
        await page.waitForTimeout(300);
      }

      await settingsContainer.evaluate((el) => el.scrollTo({ top: 320, behavior: 'smooth' }));
      await page.waitForTimeout(400);
      await snap('42-dark-settings-sheet-scene-and-camera.png', 'Settings Sheet: Camera Projection & Ground Grid Toggles', 'Settings', 'Dark');

      // Toggle Performance Diagnostics (Tab S6 Lite hardware telemetry)
      const statsToggle = page.locator('button[role="switch"][aria-label="Performance Diagnostics"]').first();
      if (await statsToggle.isVisible()) {
        await statsToggle.click();
        await page.waitForTimeout(300);
      }

      await settingsContainer.evaluate((el) => el.scrollTo({ top: 680, behavior: 'smooth' }));
      await page.waitForTimeout(400);
      await snap('43-dark-settings-sheet-performance-tier.png', 'Settings Sheet: Tab S6 Lite Hardware Performance Diagnostics Active', 'Settings', 'Dark');

      await settingsContainer.evaluate((el) => el.scrollTo({ top: 1000, behavior: 'smooth' }));
      await page.waitForTimeout(400);
      await snap('44-dark-settings-sheet-storage-and-backup.png', 'Settings Sheet: Storage Persistence & Local Autosaves', 'Settings', 'Dark');
    }

    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // CATEGORY 9: 3D MODELS LIBRARY & SURFACE PAINTING (PIKACHU)
    // -------------------------------------------------------------------------
    console.log('\n--- Category 9: Dark Mode - 3D Models & Pikachu Surface Painting ---');

    await page.evaluate(() => window.__testApp?.openModal?.('models'));
    await page.waitForTimeout(600);
    await snap('45-dark-model-library-presets-tab.png', 'Model Library: 3D Preset Models Archive Tab', '3D Models', 'Dark');

    const savedTab = page.locator('button:has-text("Saved"), button:has-text("My Models")').first();
    if (await savedTab.isVisible()) {
      await savedTab.click();
      await page.waitForTimeout(400);
      await snap('46-dark-model-library-saved-tab.png', 'Model Library: Local Saved Models Archive Tab', '3D Models', 'Dark');
    }

    const presetsTab = page.locator('button:has-text("Presets")').first();
    if (await presetsTab.isVisible()) {
      await presetsTab.click();
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('Pikachu');
        await page.waitForTimeout(300);
        await snap('47-dark-model-library-search-filtered.png', 'Model Library: Search Query Filtered for Pikachu', '3D Models', 'Dark');
      }
    }

    // Load Pikachu Model onto stage
    console.log('Loading 3D Pikachu model onto stage...');
    await page.evaluate(async () => {
      window.__testApp?.closeAllModals();
      const engine = window.__testApp?.getEngine();
      if (engine) {
        await engine.loadPresetModel('pikachu', 'texture', 'clear');
      }
    });
    await page.waitForTimeout(1600);
    await snap('48-dark-canvas-model-pikachu-textured.png', '3D Model: Pikachu Loaded on Stage in Full Texture Mode', '3D Models', 'Dark');

    // Switch Pikachu to Clay Mode
    await page.evaluate(() => {
      const engine = window.__testApp?.getEngine();
      engine?.setModelDisplayMode('clay');
    });
    await page.waitForTimeout(800);
    await snap('49-dark-canvas-model-pikachu-clay.png', '3D Model: Pikachu Displayed in White Clay Mode', '3D Models', 'Dark');

    // Surface Painting Mode directly on Pikachu
    console.log('Painting surface conformal stroke onto Pikachu model...');
    await page.evaluate(() => {
      const engine = window.__testApp?.getEngine();
      engine?.setModelDisplayMode('texture');
      window.__testApp?.setBrushSettings?.((prev) => ({
        ...prev,
        color: '#ef4444',
        size: 0.05,
        profile: 'conformal',
        drawingMode: 'surface',
      }));
    });
    await page.mouse.move(500, 280);
    await page.mouse.down();
    for (let i = 0; i < 20; i++) {
      await page.mouse.move(500 + (i - 10) * 5, 280 + i * 3);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    await page.waitForTimeout(600);
    await snap('50-dark-canvas-model-conformal-paint-stroke.png', 'Surface Painting: Conformal Stroke Painted Hugging Pikachu Model', 'Surface Painting', 'Dark');

    // -------------------------------------------------------------------------
    // CATEGORY 10: ILLUMINATION & LIGHTING STUDIO
    // -------------------------------------------------------------------------
    console.log('\n--- Category 10: Dark Mode - Illumination Studio ---');

    await page.evaluate(() => window.__testApp?.openModal?.('illumination'));
    await page.waitForTimeout(600);
    await snap('51-dark-illumination-studio-modal-overview.png', 'Studio Illumination: 3D Lighting Dome & Presets', 'Lighting Studio', 'Dark');

    const warmToneBtn = page.locator('button:has-text("Warm Daylight"), button:has-text("Warm")').first();
    if (await warmToneBtn.isVisible()) {
      await warmToneBtn.click();
      await snap('52-dark-illumination-studio-tone-warm.png', 'Studio Illumination: Warm Golden Ambient Lighting Tone', 'Lighting Studio', 'Dark');
    }

    const silPresetBtn = page.locator('button:has-text("Silhouette"), button:has-text("Dramatic")').first();
    if (await silPresetBtn.isVisible()) {
      await silPresetBtn.click();
      await snap('53-dark-illumination-studio-preset-silhouette.png', 'Studio Illumination: Dramatic Silhouette Lighting Preset', 'Lighting Studio', 'Dark');
    }

    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // CATEGORY 11: 3D ARMATURES & SCAFFOLDING GUIDES
    // -------------------------------------------------------------------------
    console.log('\n--- Category 11: Dark Mode - Scaffolding & Armatures ---');

    await page.evaluate(() => window.__testApp?.openModal?.('scaffolding'));
    await page.waitForTimeout(600);
    await snap('54-dark-scaffolding-modal-proxies-tab.png', '3D Armatures: Proxies Tab (Mannequin, Loomis Head, Vehicle)', 'Armatures & Guides', 'Dark');

    const mannequinBtn = page.locator('button:has-text("Mannequin Torso"), button:has-text("Mannequin")').first();
    if (await mannequinBtn.isVisible()) {
      await mannequinBtn.click();
      await page.waitForTimeout(600);
      await snap('56-dark-scaffolding-mannequin-spawned.png', 'Action: Human Mannequin Scaffolding Spawned on Canvas', 'Actions & 3D Shapes', 'Dark');
    }

    const primitivesTab = page.locator('button:has-text("Primitives")').first();
    if (await primitivesTab.isVisible()) {
      await primitivesTab.click();
      await page.waitForTimeout(400);
      await snap('55-dark-scaffolding-modal-primitives-tab.png', '3D Armatures: Topology-Accurate Primitives Tab', 'Armatures & Guides', 'Dark');
    }

    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(400);
    await snap('57-dark-canvas-mannequin-guide-rendered.png', 'Canvas: 3D Mannequin Proportional Guide Rendered on Stage', 'Armatures & Guides', 'Dark');

    // -------------------------------------------------------------------------
    // CATEGORY 12: BEND ALONG PATH CURVED GUIDES
    // -------------------------------------------------------------------------
    console.log('\n--- Category 12: Dark Mode - Bend Along Path Guides ---');

    await page.evaluate(() => window.__testApp?.openModal?.('bentGuide'));
    await page.waitForTimeout(600);
    await snap('58-dark-bent-guide-modal-wave-preset.png', 'Bend Along Path: Wave Preset & Ribbon Geometry', 'Armatures & Guides', 'Dark');

    const spiralBtn = page.locator('#mody-bent-guide-modal button:has-text("spiral"), button:has-text("Spiral")').first();
    if (await spiralBtn.isVisible()) {
      await spiralBtn.click();
      await page.waitForTimeout(300);
      await snap('59-dark-bent-guide-modal-spiral-preset.png', 'Bend Along Path: Spiral 3D Preset Selected', 'Armatures & Guides', 'Dark');

      const createGuideBtn = page.locator('button:has-text("Create Curved Guide")').first();
      if (await createGuideBtn.isVisible()) {
        await createGuideBtn.click();
        await page.waitForTimeout(600);
      }
    }

    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(400);
    await snap('60-dark-canvas-spiral-curved-guide-active.png', 'Canvas: Spiral Curved 3D Guide Surface Active on Stage', 'Armatures & Guides', 'Dark');

    // -------------------------------------------------------------------------
    // CATEGORY 13: ARBITRARY 3D MIRROR PLANE
    // -------------------------------------------------------------------------
    console.log('\n--- Category 13: Dark Mode - Custom Mirror Plane ---');

    await page.evaluate(() => window.__testApp?.openModal?.('customMirror'));
    await page.waitForTimeout(600);
    await snap('61-dark-custom-mirror-modal-overview.png', 'Custom Mirror Plane: 3D Coordinate Controls & Angle Offsets', 'Armatures & Guides', 'Dark');

    const alignCamBtn = page.locator('button:has-text("Align to View"), button:has-text("Align to Camera")').first();
    if (await alignCamBtn.isVisible()) {
      await alignCamBtn.click();
      await page.waitForTimeout(400);
      await snap('62-dark-custom-mirror-aligned-to-camera.png', 'Action: 3D Mirror Plane Aligned Directly to Camera Direction', 'Actions & 3D Shapes', 'Dark');
    }

    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // CATEGORY 14: EXPORT & SESSIONS MODALS
    // -------------------------------------------------------------------------
    console.log('\n--- Category 14: Dark Mode - Export & Sessions ---');

    await page.evaluate(() => window.__testApp?.openModal?.('export'));
    await page.waitForTimeout(600);
    await snap('63-dark-export-modal-options.png', 'Export Modal: GLB, Wavefront OBJ, UV Texture & High-Res PNG Options', 'Export Studio', 'Dark');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    await page.evaluate(() => window.__testApp?.openModal?.('sessions'));
    await page.waitForTimeout(600);
    await snap('64-dark-project-sessions-modal.png', 'Project Sessions: Non-destructive History & Undo Preservation', 'Export Studio', 'Dark');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // CATEGORY 15: PICTURE QUALITY & POST-PROCESSING
    // -------------------------------------------------------------------------
    console.log('\n--- Category 15: Dark Mode - Picture Quality & Post-Processing ---');

    await page.evaluate(() => window.__testApp?.openModal?.('renderSettings'));
    await page.waitForTimeout(600);
    await snap('65-dark-render-settings-picture-quality-modal.png', 'Picture Quality: Render Mode (Draft vs Composited) & Shaders', 'Rendering & Shaders', 'Dark');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // CATEGORY 16: CURVE DECIMATION & RDP SIMPLIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- Category 16: Dark Mode - Curve Decimation ---');

    await page.evaluate(() => window.__testApp?.openModal?.('curveDecimate'));
    await page.waitForTimeout(600);
    await snap('66-dark-curve-decimate-modal.png', 'Simplify Lines: Ramer-Douglas-Peucker Curve Decimation Modal', 'Editing Tools', 'Dark');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // CATEGORY 17: FLOATING REFERENCE CLIPBOARD & MOODBOARD
    // -------------------------------------------------------------------------
    console.log('\n--- Category 17: Dark Mode - Floating Reference Clipboard ---');

    await page.evaluate(() => window.__testApp?.openModal?.('clipboard'));
    await page.waitForTimeout(600);
    await snap('67-dark-floating-reference-clipboard.png', 'Floating Blueprint: 2D Moodboard & Reference Images Overlay', 'Editing Tools', 'Dark');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // CATEGORY 18: WEBXR AR VIEWER MODAL
    // -------------------------------------------------------------------------
    console.log('\n--- Category 18: Dark Mode - AR Viewer ---');

    await page.evaluate(() => window.__testApp?.openModal?.('arViewer'));
    await page.waitForTimeout(600);
    await snap('68-dark-ar-viewer-modal.png', 'WebXR AR Viewer: Floor Scan & Real-World Placement Modal', 'AR & Camera', 'Dark');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // CATEGORY 19: HOLISTIC DNA INSPECTOR POPUP
    // -------------------------------------------------------------------------
    console.log('\n--- Category 19: Dark Mode - Holistic DNA Inspector ---');

    await page.evaluate(() => window.__testApp?.openModal?.('dna'));
    await page.waitForTimeout(600);
    await snap('69-dark-holistic-dna-inspector.png', 'Holistic DNA Inspector: Roughness, Metalness, Emissive & Shaders', 'Editing Tools', 'Dark');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // CATEGORY 20: S-PEN RADIAL MENU (LONG PRESS CANVAS IN LANDSCAPE)
    // -------------------------------------------------------------------------
    console.log('\n--- Category 20: Dark Mode - S-Pen Radial Menu ---');

    await page.mouse.click(500, 300, { button: 'right' });
    await page.waitForTimeout(500);
    await snap('70-dark-spen-radial-menu-active.png', 'S-Pen Radial Menu: Long-Press Quick Tools Wheel in Landscape', 'Gestures & S-Pen', 'Dark');
    await page.mouse.click(100, 100);
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // CATEGORY 21: HARDWARE SIMULATOR MODE - DARK MODE
    // -------------------------------------------------------------------------
    console.log('\n--- Category 21: Dark Mode - Galaxy Tab S6 Lite Hardware Simulator Frame ---');

    await page.goto(simulatorUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await snap('71-dark-s6lite-hardware-bezel-landscape.png', 'Simulator Mode: Galaxy Tab S6 Lite Bezel Frame in Landscape with S-Pen Silo', 'Hardware Simulator', 'Dark');


    // =========================================================================
    // PART 2: COMPLETE LIGHT THEME SUITE (LANDSCAPE 1000 × 600 @ 2.0 DPR)
    // =========================================================================
    console.log('\n===============================================================');
    console.log('  SWITCHING TO LIGHT MODE AUDIT SUITE');
    console.log('===============================================================');

    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      window.__testApp?.setTheme?.('light');
      window.__testApp?.closeAllModals?.();
    });
    await page.waitForTimeout(600);

    // 1. Light Base Canvas
    console.log('\n--- Category 22: Light Theme - Base Canvas ---');
    await snap('72-light-base-canvas-landscape.png', 'Light Theme: Base 3D Canvas in Warm Neutral White Mode', 'Light Theme', 'Light');

    // 2. Light Bottom Dock & Color Shelf
    console.log('\n--- Category 23: Light Theme - Bottom Dock & Color Shelf ---');
    if (await colorBtn.isVisible()) {
      await colorBtn.click();
      await page.waitForTimeout(400);
      await snap('73-light-dock-color-shelf-open.png', 'Light Theme: Quick Color Shelf with Swatches Open', 'Light Theme', 'Light');
      await colorBtn.click();
      await page.waitForTimeout(300);
    }

    // 3. Light Size Shelf
    if (await sizeBtn.isVisible()) {
      await sizeBtn.click();
      await page.waitForTimeout(400);
      await snap('74-light-dock-size-shelf-open.png', 'Light Theme: Brush Size Slider Shelf Open', 'Light Theme', 'Light');
      await sizeBtn.click();
      await page.waitForTimeout(300);
    }

    // 4. Light Brush Preset Shelf
    if (await brushBtn.isVisible()) {
      await brushBtn.click();
      await page.waitForTimeout(400);
      await snap('75-light-dock-brush-presets-shelf.png', 'Light Theme: Quick Brush Presets Shelf Open', 'Light Theme', 'Light');
      await brushBtn.click();
      await page.waitForTimeout(300);
    }

    // 5. Light Create Panel
    console.log('\n--- Category 24: Light Theme - Mode Panels ---');
    if (await createRailBtn.isVisible()) {
      await createRailBtn.click();
      await page.waitForTimeout(500);
      await snap('76-light-rail-create-panel-primitives.png', 'Light Theme: Create Panel & 3D Primitives', 'Light Theme', 'Light');
      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    // 6. Light Layers Panel
    if (await layersRailBtn.isVisible()) {
      await layersRailBtn.click();
      await page.waitForTimeout(500);
      await snap('77-light-rail-layers-panel.png', 'Light Theme: Scene Layers Manager Panel', 'Light Theme', 'Light');
      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    // 7. Light Color Studio Modal (HSV Wheel)
    console.log('\n--- Category 25: Light Theme - Color Studio ---');
    await page.evaluate(() => window.__testApp?.openModal?.('colorStudio'));
    await page.waitForTimeout(600);
    if (await hsvTabBtn.isVisible()) {
      await hsvTabBtn.click();
      await page.waitForTimeout(400);
    }
    await snap('78-light-color-studio-wheel.png', 'Light Theme: Color Studio HSV Wheel & Lightness Controls', 'Light Theme', 'Light');

    // 8. Light Color Studio Harmonies
    if (await harmoniesTab.isVisible()) {
      await harmoniesTab.click();
      await page.waitForTimeout(400);
      await snap('79-light-color-studio-harmonies.png', 'Light Theme: Color Studio Harmonies & Curated Palettes', 'Light Theme', 'Light');
    }
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // 9. Light Draw Panel
    console.log('\n--- Category 26: Light Theme - Draw Panel & Brushes ---');
    await page.evaluate(() => window.__testApp?.openSheet?.('draw'));
    await page.waitForTimeout(500);
    await snap('80-light-draw-panel-paint-tab.png', 'Light Theme: Draw Panel Paint & Profile Tabs', 'Light Theme', 'Light');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // 10. Light 3D Model Pikachu on Stage
    console.log('\n--- Category 27: Light Theme - 3D Models on Stage ---');
    await page.evaluate(async () => {
      const engine = window.__testApp?.getEngine();
      if (engine) {
        await engine.loadPresetModel('pikachu', 'texture', 'clear');
      }
    });
    await page.waitForTimeout(1500);
    await snap('81-light-canvas-pikachu-model-rendered.png', 'Light Theme: 3D Pikachu Model Rendered on Stage in Light Studio', 'Light Theme', 'Light');

    // 11. Light Illumination Studio
    console.log('\n--- Category 28: Light Theme - Illumination Studio ---');
    await page.evaluate(() => window.__testApp?.openModal?.('illumination'));
    await page.waitForTimeout(600);
    await snap('82-light-illumination-studio-modal.png', 'Light Theme: Illumination Studio Dome & Ambient Presets', 'Light Theme', 'Light');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // 12. Light Settings Sheet
    console.log('\n--- Category 29: Light Theme - Settings Sheet ---');
    await page.evaluate(() => window.__testApp?.openModal?.('settings'));
    await page.waitForTimeout(500);
    await snap('83-light-settings-sheet-overview.png', 'Light Theme: Studio Settings Sheet (S-Pen, Theme & Performance)', 'Light Theme', 'Light');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // 13. Light Top More Menu
    console.log('\n--- Category 30: Light Theme - Top More Menu ---');
    await page.evaluate(() => {
      const moreBtn = document.querySelector('button[aria-label="More actions"]');
      if (moreBtn) moreBtn.click();
    });
    await page.waitForTimeout(500);
    await snap('84-light-top-more-menu-open.png', 'Light Theme: Top Bar Actions & More Menu Dropdown Dialog', 'Light Theme', 'Light');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 14. Light Export Studio
    console.log('\n--- Category 31: Light Theme - Export Studio ---');
    await page.evaluate(() => window.__testApp?.openModal?.('export'));
    await page.waitForTimeout(600);
    await snap('85-light-export-modal-options.png', 'Light Theme: 3D Artwork Export Studio', 'Light Theme', 'Light');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // 15. Light Hardware Simulator Frame
    console.log('\n--- Category 32: Light Theme - Hardware Simulator Frame ---');
    await page.goto(simulatorUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      window.__testApp?.setTheme?.('light');
    });
    await page.waitForTimeout(600);
    await snap('86-light-s6lite-hardware-bezel-landscape.png', 'Light Theme Simulator: Galaxy Tab S6 Lite Bezel Frame in Landscape with S-Pen Silo', 'Hardware Simulator', 'Light');

    console.log('\n===============================================================');
    console.log(`🎉 ALL ${manifest.length} LANDSCAPE SCREENSHOTS CAPTURED SUCCESSFULLY!`);
    console.log('===============================================================');

  } catch (error) {
    console.error('Audit runner error:', error);
  } finally {
    await browser.close();
  }

  // Write manifest file
  const manifestPath = path.join(SCREENSHOT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Manifest written to: ${manifestPath}`);
  console.log(`Total screenshots in manifest: ${manifest.length}`);
}

captureAllScreenshots().catch(console.error);

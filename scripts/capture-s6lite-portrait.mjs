import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = 'E:/X/AiStudio Workflow/V20/screenshots/s6lite-audit/portrait';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const targetUrl = process.env.APP_URL || 'http://localhost:3002/?device=none';
const simUrl = 'http://localhost:3002/?device=s6lite';

async function captureS6LitePortraitAudit() {
  console.log('===============================================================');
  console.log('  GALAXY TAB S6 LITE PORTRAIT AUDIT: SCREENSHOT RUNNER');
  console.log('===============================================================');
  console.log(`Target URL: ${targetUrl}`);
  console.log(`Simulator URL: ${simUrl}`);
  console.log(`Output Directory: ${SCREENSHOT_DIR}`);
  console.log('Resolution: 1200 × 2000 Portrait (Viewport 600 × 1000 @ 2.0 DPR)');
  console.log('Device: Samsung Galaxy Tab S6 Lite (SM-P610)');
  console.log('Modes: Complete Dark Mode + Full Light Mode Suite');
  console.log('---------------------------------------------------------------\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl'],
  });

  const context = await browser.newContext({
    viewport: { width: 600, height: 1000 },
    deviceScaleFactor: 2.0, // 600 * 2 = 1200, 1000 * 2 = 2000 physical resolution
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

  async function snap(filename, description, category = 'General') {
    const filePath = path.join(SCREENSHOT_DIR, filename);
    await page.waitForTimeout(400);
    await page.screenshot({ path: filePath });
    const stat = fs.statSync(filePath);
    const item = {
      filename,
      description,
      category,
      path: filePath,
      sizeBytes: stat.size,
    };
    manifest.push(item);
    console.log(`[SAVED] ${filename} (${Math.round(stat.size / 1024)} KB) - ${description}`);
  }

  try {
    console.log('1. Navigating to Studio application in Tab S6 Lite Portrait (1200x2000)...');
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Ensure dark mode first
    await page.evaluate(() => window.__testApp?.setTheme?.('dark'));
    await page.waitForTimeout(400);

    // =============================================================
    // PART 1: COMPLETE DARK MODE SUITE
    // =============================================================

    // -------------------------------------------------------------
    // CATEGORY 1: BASE WORKSPACE & SYSTEM OVERLAYS (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: Base Workspace ---');
    await snap('dark-01-base-canvas-portrait.png', 'Base 3D Canvas in Tab S6 Lite Portrait (Dark Mode)', 'Base Workspace (Dark)');

    // -------------------------------------------------------------
    // CATEGORY 2: BOTTOM DOCK QUICK TOOLS (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: Bottom Dock Quick Tools ---');
    
    // Draw tool active
    const drawBtn = page.locator('button[data-pro-rail-button="true"][aria-label="Draw"]');
    if (await drawBtn.isVisible()) {
      await drawBtn.click();
      await snap('dark-02-dock-tool-draw-active.png', 'Bottom Dock: Draw Tool Active (Dark)', 'Bottom Dock (Dark)');
    }

    // Erase tool active
    const eraseBtn = page.locator('button[data-pro-rail-button="true"][aria-label="Erase"]');
    if (await eraseBtn.isVisible()) {
      await eraseBtn.click();
      await snap('dark-03-dock-tool-erase-active.png', 'Bottom Dock: Erase Tool Active (Dark)', 'Bottom Dock (Dark)');
    }

    // Switch back to draw
    if (await drawBtn.isVisible()) {
      await drawBtn.click();
    }

    // Color Swatch Shelf
    const colorBtn = page.locator('button[data-pro-rail-button="true"][aria-label="Color"]');
    if (await colorBtn.isVisible()) {
      await colorBtn.click();
      await page.waitForTimeout(400);
      await snap('dark-04-dock-color-shelf-open.png', 'Bottom Dock: Quick Color Shelf Open (Dark)', 'Bottom Dock (Dark)');

      // Pick staple blue color
      const blueSwatch = page.locator('button[aria-label="Pick color #2563eb"], button[title*="#2563eb"], button[aria-label*="#2563eb"]').first();
      if (await blueSwatch.isVisible()) {
        await blueSwatch.click();
        await snap('dark-05-dock-color-shelf-swatch-selected.png', 'Bottom Dock: Blue Swatch Selected (Dark)', 'Bottom Dock (Dark)');
      }

      await colorBtn.click();
      await page.waitForTimeout(300);
    }

    // Size Slider Shelf
    const sizeBtn = page.locator('button[data-pro-rail-button="true"][aria-label="Stroke size"]');
    if (await sizeBtn.isVisible()) {
      await sizeBtn.click();
      await page.waitForTimeout(400);
      await snap('dark-06-dock-size-shelf-open.png', 'Bottom Dock: Size Slider Shelf Open (Dark)', 'Bottom Dock (Dark)');

      // Adjust size slider
      const slider = page.locator('.paperrocket-studio-shelf input[type="range"]');
      if (await slider.isVisible()) {
        await slider.fill('0.08');
        await snap('dark-07-dock-size-slider-adjusted.png', 'Bottom Dock: Brush Size Slider Adjusted (Dark)', 'Bottom Dock (Dark)');
      }

      await sizeBtn.click();
      await page.waitForTimeout(300);
    }

    // Quick Brush Preset Shelf
    const brushBtn = page.locator('button[data-pro-rail-button="true"][aria-label="Brushes"]');
    if (await brushBtn.isVisible()) {
      await brushBtn.click();
      await page.waitForTimeout(400);
      await snap('dark-08-dock-brush-shelf-open.png', 'Bottom Dock: Quick Brush Preset Shelf Open (Dark)', 'Bottom Dock (Dark)');

      // Select Conformal Bead brush preset
      const conformalBtn = page.locator('button:has-text("Hugs models"), button:has-text("Conformal"), button:has-text("Surface Decal")').first();
      if (await conformalBtn.isVisible()) {
        await conformalBtn.click();
        await snap('dark-09-dock-brush-conformal-selected.png', 'Bottom Dock: Conformal Bead Hugs Model Brush Selected (Dark)', 'Bottom Dock (Dark)');
      }

      await brushBtn.click();
      await page.waitForTimeout(300);
    }

    // Symmetry toggle
    const symmBtn = page.locator('button[data-pro-rail-button="true"][aria-label="Symmetry"]');
    if (await symmBtn.isVisible()) {
      await symmBtn.click();
      await page.waitForTimeout(400);
      await snap('dark-10-dock-symmetry-active.png', 'Bottom Dock: Symmetry Tool Activated (Dark)', 'Bottom Dock (Dark)');
      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    // -------------------------------------------------------------
    // CATEGORY 3: RIGHT RAIL MODAL PANELS (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: Right Rail Mode Panels ---');

    // Select Mode
    const selectRailBtn = page.locator('button.paperrocket-studio-mode[aria-label="Select"]');
    if (await selectRailBtn.isVisible()) {
      await selectRailBtn.click();
      await page.waitForTimeout(500);
      await snap('dark-11-rail-select-panel-open.png', 'Right Rail: Select Panel Open (Dark)', 'Right Rail (Dark)');

      // Switch selection mode to Lasso
      const lassoBtn = page.locator('button:has-text("Lasso"), button[title*="Lasso"]').first();
      if (await lassoBtn.isVisible()) {
        await lassoBtn.click();
        await snap('dark-12-rail-select-lasso-mode.png', 'Right Rail: Lasso Select Mode Active (Dark)', 'Right Rail (Dark)');
      }

      // Expand transform details
      const transformToggle = page.locator('button:has-text("Transform Details"), button:has-text("Exact Position")').first();
      if (await transformToggle.isVisible()) {
        await transformToggle.click();
        await snap('dark-13-rail-select-transform-details.png', 'Right Rail: Transform Coordinates & Values Expanded (Dark)', 'Right Rail (Dark)');
      }

      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    // Create Mode
    const createRailBtn = page.locator('button.paperrocket-studio-mode[aria-label="Create"]');
    if (await createRailBtn.isVisible()) {
      await createRailBtn.click();
      await page.waitForTimeout(500);
      await snap('dark-14-rail-create-panel-primitives.png', 'Right Rail: Create Panel & 3D Shapes Overview (Dark)', 'Right Rail (Dark)');

      // Spawn 3D Cube
      const cubeBtn = page.locator('button[title*="Cube"]').first();
      if (await cubeBtn.isVisible()) {
        await cubeBtn.click();
        await page.waitForTimeout(400);
        await snap('dark-15-rail-create-spawn-cube.png', 'Action: 3D Cube Primitive Spawned in Scene (Dark)', 'Actions & Clicks (Dark)');
      }

      // Spawn 3D Sphere
      const sphereBtn = page.locator('button[title*="Sphere"]').first();
      if (await sphereBtn.isVisible()) {
        await sphereBtn.click();
        await page.waitForTimeout(400);
        await snap('dark-16-rail-create-spawn-sphere.png', 'Action: 3D Sphere Primitive Spawned in Scene (Dark)', 'Actions & Clicks (Dark)');
      }

      // Switch to Clay mode
      const clayBtn = page.locator('button:has-text("White Clay")').first();
      if (await clayBtn.isVisible()) {
        await clayBtn.click();
        await page.waitForTimeout(400);
        await snap('dark-17-rail-create-white-clay-display.png', 'Action: Display Mode Switched to White Clay (Dark)', 'Actions & Clicks (Dark)');
      }

      // Switch back to Full Texture
      const textureBtn = page.locator('button:has-text("Full Texture")').first();
      if (await textureBtn.isVisible()) {
        await textureBtn.click();
        await page.waitForTimeout(400);
        await snap('dark-18-rail-create-full-texture-display.png', 'Action: Display Mode Switched to Full Texture (Dark)', 'Actions & Clicks (Dark)');
      }

      // Expand Fine Geometry & Display
      const fineGeomBtn = page.locator('button:has-text("Fine Geometry & Display"), button:has-text("Opacity / Wireframe")').first();
      if (await fineGeomBtn.isVisible()) {
        await fineGeomBtn.click();
        await page.waitForTimeout(400);
        await snap('dark-19-rail-create-fine-geometry-sliders.png', 'Right Rail: Fine Geometry & Display Sliders Open (Dark)', 'Right Rail (Dark)');
      }

      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    // Deform Mode
    const deformRailBtn = page.locator('button.paperrocket-studio-mode[aria-label="Deform"]');
    if (await deformRailBtn.isVisible()) {
      await deformRailBtn.click();
      await page.waitForTimeout(500);
      await snap('dark-20-rail-deform-panel-overview.png', 'Right Rail: Deform & Sculpt Panel Overview (Dark)', 'Right Rail (Dark)');

      // Toggle mirror axis X
      const mirrorXBtn = page.locator('button:has-text("Mirror X"), button:has-text("X-Axis")').first();
      if (await mirrorXBtn.isVisible()) {
        await mirrorXBtn.click();
        await snap('dark-21-rail-deform-mirror-plane-active.png', 'Right Rail: Mirror Plane Active along Axis (Dark)', 'Right Rail (Dark)');
      }

      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    // Layers Mode
    const layersRailBtn = page.locator('button.paperrocket-studio-mode[aria-label="Layers"]');
    if (await layersRailBtn.isVisible()) {
      await layersRailBtn.click();
      await page.waitForTimeout(500);
      await snap('dark-22-rail-layers-panel-overview.png', 'Right Rail: Layers Panel Overview (Dark)', 'Right Rail (Dark)');

      // Add a layer
      const addLayerBtn = page.locator('button[title*="Add Layer"], button:has-text("New Layer"), button:has-text("Add")').first();
      if (await addLayerBtn.isVisible()) {
        await addLayerBtn.click();
        await page.waitForTimeout(400);
        await snap('dark-23-rail-layers-new-layer-added.png', 'Action: New Artwork Layer Created (Dark)', 'Actions & Clicks (Dark)');
      }

      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    // -------------------------------------------------------------
    // CATEGORY 4: DRAW PANEL & BRUSH SUITE (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: Draw Panel & Brushes ---');

    await page.evaluate(() => window.__testApp?.openSheet?.('draw'));
    await page.waitForTimeout(500);
    await snap('dark-24-draw-panel-paint-tab.png', 'Draw Panel: Paint Tab Profiles & Surfaces (Dark)', 'Draw & Brushes (Dark)');

    // Switch to Brush Tab
    const brushTabBtn = page.locator('button:has-text("Brush")').first();
    if (await brushTabBtn.isVisible()) {
      await brushTabBtn.click();
      await page.waitForTimeout(400);
      await snap('dark-25-draw-panel-brush-tab-curated.png', 'Draw Panel: Brush Tab Essential Curated Brushes (Dark)', 'Draw & Brushes (Dark)');

      // Click "More Brushes"
      const moreBrushesBtn = page.locator('button:has-text("More Brushes"), button:has-text("Show All")').first();
      if (await moreBrushesBtn.isVisible()) {
        await moreBrushesBtn.click();
        await page.waitForTimeout(400);
        await snap('dark-26-draw-panel-brush-tab-all-expanded.png', 'Draw Panel: All Specialist Brushes Expanded (Dark)', 'Draw & Brushes (Dark)');
      }
    }

    // Switch to Advanced Tab
    const advancedTabBtn = page.locator('button:has-text("Advanced"), button:has-text("Settings")').first();
    if (await advancedTabBtn.isVisible()) {
      await advancedTabBtn.click();
      await page.waitForTimeout(400);
      await snap('dark-27-draw-panel-advanced-tab.png', 'Draw Panel: Advanced Tab Smoothing Taper Jitter (Dark)', 'Draw & Brushes (Dark)');
    }

    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // Shapes Sheet
    await page.evaluate(() => window.__testApp?.openSheet?.('shapes'));
    await page.waitForTimeout(500);
    await snap('dark-28-shapes-sheet-snapping-settings.png', 'Shapes Sheet: Auto-detect Shapes & Sensitivity (Dark)', 'Draw & Brushes (Dark)');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------
    // CATEGORY 5: BRUSHES ON CANVAS (CLAY, RIBBON, TUBE, ERASE) (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: Brushes Drawn on Canvas ---');

    // 1. Clay Stroke
    await page.evaluate(() => {
      window.__testApp?.setBrushSettings?.((prev) => ({
        ...prev,
        color: '#e2e8f0',
        size: 0.05,
        profile: 'tube',
        materialType: 'clay',
      }));
    });
    await page.mouse.move(260, 420);
    await page.mouse.down();
    for (let i = 0; i < 22; i++) {
      await page.mouse.move(260 + i * 3, 420 + i * 5);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    await page.waitForTimeout(500);
    await snap('dark-29-canvas-clay-stroke-drawn.png', 'Action: 3D White Clay Stroke Drawn on Canvas (Dark)', 'Canvas Drawing (Dark)');

    // 2. Ribbon Stroke
    await page.evaluate(() => {
      window.__testApp?.setBrushSettings?.((prev) => ({
        ...prev,
        color: '#38bdf8',
        size: 0.045,
        profile: 'ribbon',
        materialType: 'shaded',
      }));
    });
    await page.mouse.move(200, 380);
    await page.mouse.down();
    for (let i = 0; i < 22; i++) {
      await page.mouse.move(200 + i * 8, 380 + (i % 4 === 0 ? 15 : -8));
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    await page.waitForTimeout(500);
    await snap('dark-30-canvas-ribbon-stroke-drawn.png', 'Action: 3D Sky Blue Ribbon Stroke Drawn on Canvas (Dark)', 'Canvas Drawing (Dark)');

    // 3. Golden Tube Stroke
    await page.evaluate(() => {
      window.__testApp?.setBrushSettings?.((prev) => ({
        ...prev,
        color: '#f59e0b',
        size: 0.055,
        profile: 'tube',
        materialType: 'shaded',
      }));
    });
    await page.mouse.move(220, 520);
    await page.mouse.down();
    for (let i = 0; i < 20; i++) {
      await page.mouse.move(220 + i * 7, 520 + (i % 3 === 0 ? 14 : -10));
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    await page.waitForTimeout(500);
    await snap('dark-31-canvas-tube-stroke-drawn.png', 'Action: 3D Golden Tube Stroke Drawn on Canvas (Dark)', 'Canvas Drawing (Dark)');

    // 4. Erase a section of stroke
    if (await eraseBtn.isVisible()) {
      await eraseBtn.click();
      await page.waitForTimeout(300);
      await page.mouse.move(250, 480);
      await page.mouse.down();
      for (let i = 0; i < 18; i++) {
        await page.mouse.move(250 + i * 5, 480 + (i % 2 === 0 ? 6 : -6));
        await page.waitForTimeout(16);
      }
      await page.mouse.up();
      await page.waitForTimeout(500);
      await snap('dark-32-canvas-stroke-erased.png', 'Action: Real Eraser Cutting Through 3D Strokes (Dark)', 'Canvas Drawing (Dark)');
      await drawBtn.click();
      await page.waitForTimeout(300);
    }

    // -------------------------------------------------------------
    // CATEGORY 6: TOP STRIP & TOP MORE MENU (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: Top Strip & More Menu ---');
    await snap('dark-33-top-bar-overview.png', 'Top Bar: Header Controls & System Status (Dark)', 'Top Bar (Dark)');

    const moreBtn = page.locator('button[aria-label="More options"], button[aria-label="More"]').first();
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await page.waitForTimeout(500);
      await snap('dark-34-top-more-menu-open.png', 'Top More Menu: Quick Actions List Open (Dark)', 'Top Bar (Dark)');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // -------------------------------------------------------------
    // CATEGORY 7: COLOR STUDIO COMPREHENSIVE SUITE (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: Color Studio Suite ---');

    await page.evaluate(() => window.__testApp?.openModal?.('colorStudio'));
    await page.waitForTimeout(600);

    // Tab 1: Wheel
    await snap('dark-35-color-studio-tab-wheel.png', 'Color Studio: HSV Color Wheel & Brightness Slider (Dark)', 'Color Studio (Dark)');

    // Tab 2: OKLCh
    const oklchTab = page.locator('button:has-text("OKLCh"), button:has-text("Perceptual")').first();
    if (await oklchTab.isVisible()) {
      await oklchTab.click();
      await page.waitForTimeout(400);
      await snap('dark-36-color-studio-tab-oklch-polar.png', 'Color Studio: OKLCh Polar Color Space Lightness Chroma Hue (Dark)', 'Color Studio (Dark)');

      // Posterize preview toggle
      const posterizeToggle = page.locator('button:has-text("Posterize"), input[type="checkbox"]').first();
      if (await posterizeToggle.isVisible()) {
        await posterizeToggle.click();
        await snap('dark-37-color-studio-oklch-posterize-steps.png', 'Color Studio: OKLCh Posterization Stepped Bands (Dark)', 'Color Studio (Dark)');
      }
    }

    // Tab 3: Harmonies
    const harmoniesTab = page.locator('button:has-text("Harmonies"), button:has-text("Palettes")').first();
    if (await harmoniesTab.isVisible()) {
      await harmoniesTab.click();
      await page.waitForTimeout(400);
      await snap('dark-38-color-studio-tab-harmonies.png', 'Color Studio: Complementary & Analogous Harmonies (Dark)', 'Color Studio (Dark)');

      // Expand curated palettes
      const curatedBtn = page.locator('button:has-text("Curated Palettes"), button:has-text("Drafting Neon")').first();
      if (await curatedBtn.isVisible()) {
        await curatedBtn.click();
        await page.waitForTimeout(400);
        await snap('dark-39-color-studio-curated-palettes.png', 'Color Studio: Curated Designer Color Palettes List (Dark)', 'Color Studio (Dark)');
      }
    }

    // Tab 4: 1-Click Material Shaders
    const shadersTab = page.locator('button:has-text("Shaders"), button:has-text("Materials")').first();
    if (await shadersTab.isVisible()) {
      await shadersTab.click();
      await page.waitForTimeout(400);
      await snap('dark-40-color-studio-tab-material-shaders.png', 'Color Studio: 1-Click 3D Material Shaders Suite (Dark)', 'Color Studio (Dark)');

      // Click Metal shader
      const goldShader = page.locator('button:has-text("Metal"), button:has-text("Gold")').first();
      if (await goldShader.isVisible()) {
        await goldShader.click();
        await snap('dark-41-color-studio-shader-metal-applied.png', 'Action: Polished Metal Gold Material Applied (Dark)', 'Color Studio (Dark)');
      }
    }

    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------
    // CATEGORY 8: 3D MODELS LIBRARY & PIKACHU ON STAGE (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: Model Library & Ingestion ---');

    await page.evaluate(() => window.__testApp?.openModal?.('models'));
    await page.waitForTimeout(600);
    await snap('dark-42-model-library-presets-tab.png', 'Model Library: 3D Preset Models Tab (Dark)', '3D Models (Dark)');

    // Saved models tab
    const savedTab = page.locator('button:has-text("Saved"), button:has-text("My Models")').first();
    if (await savedTab.isVisible()) {
      await savedTab.click();
      await page.waitForTimeout(400);
      await snap('dark-43-model-library-saved-tab.png', 'Model Library: Local Saved Models Archive Tab (Dark)', '3D Models (Dark)');
    }

    // Filter presets
    const presetsTab = page.locator('button:has-text("Presets")').first();
    if (await presetsTab.isVisible()) {
      await presetsTab.click();
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('Pikachu');
        await page.waitForTimeout(300);
        await snap('dark-44-model-library-search-filtered.png', 'Model Library: Search Query Pikachu Filtered (Dark)', '3D Models (Dark)');
      }
    }

    // Load Pikachu Model into Canvas
    console.log('Loading 3D model Pikachu...');
    await page.evaluate(async () => {
      window.__testApp?.closeAllModals();
      const engine = window.__testApp?.getEngine();
      if (engine) {
        await engine.loadPresetModel('pikachu', 'texture', 'clear');
      }
    });
    await page.waitForTimeout(1600);
    await snap('dark-45-canvas-model-pikachu-textured.png', '3D Model: Pikachu Loaded on Stage in Full Texture Mode (Dark)', '3D Models (Dark)');

    // Switch Pikachu to Clay Mode
    await page.evaluate(() => {
      const engine = window.__testApp?.getEngine();
      engine?.setModelDisplayMode('clay');
    });
    await page.waitForTimeout(800);
    await snap('dark-46-canvas-model-pikachu-clay.png', '3D Model: Pikachu Displayed in White Clay Mode (Dark)', '3D Models (Dark)');

    // Conformal Paint on Pikachu Model
    console.log('Painting conformal stroke directly on 3D model...');
    await page.evaluate(() => {
      window.__testApp?.setBrushSettings?.((prev) => ({
        ...prev,
        color: '#ef4444',
        size: 0.05,
        profile: 'conformal',
        drawingMode: 'surface',
      }));
    });
    await page.mouse.move(300, 480);
    await page.mouse.down();
    for (let i = 0; i < 20; i++) {
      await page.mouse.move(300 + (i - 10) * 4, 480 + i * 3);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    await page.waitForTimeout(600);
    await snap('dark-47-canvas-model-surface-painting.png', 'Action: Surface Painting Directly on Pikachu Model with Conformal Brush (Dark)', 'Actions & Clicks (Dark)');

    // -------------------------------------------------------------
    // CATEGORY 9: ILLUMINATION & LIGHTING STUDIO (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: Illumination Studio ---');

    await page.evaluate(() => window.__testApp?.openModal?.('illumination'));
    await page.waitForTimeout(600);
    await snap('dark-48-illumination-studio-overview.png', 'Studio Illumination: 3D Lighting Dome & Studio Presets (Dark)', 'Lighting (Dark)');

    // Pick Warm tone
    const warmToneBtn = page.locator('button:has-text("Warm")').first();
    if (await warmToneBtn.isVisible()) {
      await warmToneBtn.click();
      await snap('dark-49-illumination-studio-tone-warm.png', 'Studio Illumination: Warm Golden Ambient Lighting Tone (Dark)', 'Lighting (Dark)');
    }

    // Pick Silhouette preset
    const silPresetBtn = page.locator('button:has-text("Silhouette"), button:has-text("Dramatic")').first();
    if (await silPresetBtn.isVisible()) {
      await silPresetBtn.click();
      await snap('dark-50-illumination-studio-preset-silhouette.png', 'Studio Illumination: Dramatic Silhouette Lighting Preset (Dark)', 'Lighting (Dark)');
    }

    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------
    // CATEGORY 10: 3D ARMATURES & SCAFFOLDING GUIDES (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: Scaffolding & Armatures ---');

    await page.evaluate(() => window.__testApp?.openModal?.('scaffolding'));
    await page.waitForTimeout(600);
    await snap('dark-51-scaffolding-modal-proxies-tab.png', '3D Armatures: Proxies Tab Mannequin Loomis Head (Dark)', 'Armatures & Guides (Dark)');

    // Tab 2: Primitives
    const primitivesTab = page.locator('button:has-text("Primitives")').first();
    if (await primitivesTab.isVisible()) {
      await primitivesTab.click();
      await page.waitForTimeout(400);
      await snap('dark-52-scaffolding-modal-primitives-tab.png', '3D Armatures: Topology-Accurate Primitives Tab (Dark)', 'Armatures & Guides (Dark)');
    }

    // Spawn Human Mannequin
    const proxiesTab = page.locator('button:has-text("Proxies")').first();
    if (await proxiesTab.isVisible()) {
      await proxiesTab.click();
      const mannequinBtn = page.locator('button:has-text("Human Mannequin"), button:has-text("Mannequin Torso")').first();
      if (await mannequinBtn.isVisible()) {
        await mannequinBtn.click();
        await page.waitForTimeout(600);
        await snap('dark-53-scaffolding-mannequin-spawned.png', 'Action: Human Mannequin Scaffolding Spawned on Canvas (Dark)', 'Actions & Clicks (Dark)');
      }
    }

    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(400);
    await snap('dark-54-canvas-mannequin-guide-rendered.png', 'Canvas: 3D Mannequin Proportional Guide Rendered (Dark)', 'Armatures & Guides (Dark)');

    // -------------------------------------------------------------
    // CATEGORY 11: BEND ALONG PATH CURVED GUIDES (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: Bend Along Path Guides ---');

    await page.evaluate(() => window.__testApp?.openModal?.('bentGuide'));
    await page.waitForTimeout(600);
    await snap('dark-55-bent-guide-modal-wave-preset.png', 'Bend Along Path: Wave Preset & Ribbon Geometry (Dark)', 'Armatures & Guides (Dark)');

    // Select Spiral Preset
    const spiralBtn = page.locator('#mody-bent-guide-modal button:has-text("spiral"), button:has-text("Spiral")').first();
    if (await spiralBtn.isVisible()) {
      await spiralBtn.click();
      await page.waitForTimeout(300);
      await snap('dark-56-bent-guide-modal-spiral-preset.png', 'Bend Along Path: Spiral 3D Preset Selected (Dark)', 'Armatures & Guides (Dark)');

      const createGuideBtn = page.locator('button:has-text("Create Curved Guide")').first();
      if (await createGuideBtn.isVisible()) {
        await createGuideBtn.click();
        await page.waitForTimeout(600);
      }
    }

    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(400);
    await snap('dark-57-canvas-spiral-curved-guide-active.png', 'Canvas: Spiral Curved 3D Guide Surface Active (Dark)', 'Armatures & Guides (Dark)');

    // -------------------------------------------------------------
    // CATEGORY 12: ARBITRARY 3D MIRROR PLANE (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: Custom Mirror Plane ---');

    await page.evaluate(() => window.__testApp?.openModal?.('customMirror'));
    await page.waitForTimeout(600);
    await snap('dark-58-custom-mirror-modal-overview.png', 'Custom Mirror Plane: 3D Coordinate Controls (Dark)', 'Armatures & Guides (Dark)');

    const alignCamBtn = page.locator('button:has-text("Align to Camera View"), button:has-text("Align to Camera")').first();
    if (await alignCamBtn.isVisible()) {
      await alignCamBtn.click();
      await page.waitForTimeout(400);
      await snap('dark-59-custom-mirror-aligned-to-camera.png', 'Action: 3D Mirror Plane Aligned Directly to Camera Direction (Dark)', 'Actions & Clicks (Dark)');
    }

    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------
    // CATEGORY 13: CURVE DECIMATION & RDP SIMPLIFICATION (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: Curve Decimation ---');

    await page.evaluate(() => window.__testApp?.openModal?.('curveDecimate'));
    await page.waitForTimeout(600);
    await snap('dark-60-curve-decimate-modal.png', 'Simplify Lines: Ramer-Douglas-Peucker Curve Decimation (Dark)', 'Editing Tools (Dark)');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------
    // CATEGORY 14: PICTURE QUALITY & POST-PROCESSING (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: Picture Quality & Render Settings ---');

    await page.evaluate(() => window.__testApp?.openModal?.('renderSettings'));
    await page.waitForTimeout(600);
    await snap('dark-61-render-settings-picture-quality-modal.png', 'Picture Quality: Render Mode Draft vs Composited & Shaders (Dark)', 'Rendering & Shaders (Dark)');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------
    // CATEGORY 15: EXPORT & SESSIONS MODALS (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: Export & Sessions ---');

    await page.evaluate(() => window.__testApp?.openModal?.('export'));
    await page.waitForTimeout(600);
    await snap('dark-62-export-modal-options.png', 'Export Modal: GLB, Wavefront OBJ, UV Texture & Snapshot Options (Dark)', 'Export & Sessions (Dark)');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    await page.evaluate(() => window.__testApp?.openModal?.('sessions'));
    await page.waitForTimeout(600);
    await snap('dark-63-project-sessions-modal.png', 'Project Sessions: Non-destructive History & Undo Preservation (Dark)', 'Export & Sessions (Dark)');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------
    // CATEGORY 16: STUDIO SETTINGS SHEET & S6 LITE TIER (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: Studio Settings Sheet ---');

    await page.evaluate(() => window.__testApp?.openModal?.('settings'));
    await page.waitForTimeout(500);
    await snap('dark-64-settings-sheet-appearance-theme.png', 'Settings Sheet: Appearance, Theme & S6 Lite Hardware Tier (Dark)', 'Settings (Dark)');

    // Scroll down settings sheet
    const settingsContainer = page.locator('.paperrocket-studio-sheet-content, [role="dialog"]').first();
    if (await settingsContainer.isVisible()) {
      await settingsContainer.evaluate((el) => el.scrollTo({ top: 380, behavior: 'smooth' }));
      await page.waitForTimeout(400);
      await snap('dark-65-settings-sheet-scene-and-camera.png', 'Settings Sheet: Projection Mode & Grid Toggles (Dark)', 'Settings (Dark)');

      await settingsContainer.evaluate((el) => el.scrollTo({ top: 780, behavior: 'smooth' }));
      await page.waitForTimeout(400);
      await snap('dark-66-settings-sheet-spen-and-storage.png', 'Settings Sheet: S-Pen Stylus Input, Touch Draw & Storage Persistence (Dark)', 'Settings (Dark)');
    }

    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------
    // CATEGORY 17: WEBXR AR VIEWER & DNA INSPECTOR (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: AR Viewer & DNA Inspector ---');

    await page.evaluate(() => window.__testApp?.openModal?.('arViewer'));
    await page.waitForTimeout(600);
    await snap('dark-67-ar-viewer-modal.png', 'WebXR AR Viewer: Floor Scan & Real-World Placement Modal (Dark)', 'AR & Camera (Dark)');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    await page.evaluate(() => window.__testApp?.openModal?.('dna'));
    await page.waitForTimeout(600);
    await snap('dark-68-holistic-dna-inspector.png', 'Holistic DNA Inspector: Roughness, Metalness, Emissive & Shaders (Dark)', 'Editing Tools (Dark)');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // Floating reference clipboard
    await page.evaluate(() => window.__testApp?.openModal?.('clipboard'));
    await page.waitForTimeout(600);
    await snap('dark-69-floating-reference-clipboard.png', 'Floating Blueprint: 2D Moodboard & Reference Overlay (Dark)', 'Editing Tools (Dark)');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // -------------------------------------------------------------
    // CATEGORY 18: S-PEN RADIAL MENU (LONG PRESS CANVAS) (DARK)
    // -------------------------------------------------------------
    console.log('\n--- Dark Mode: S-Pen Radial Menu ---');

    await page.mouse.move(300, 480);
    await page.mouse.down();
    await page.waitForTimeout(750); // Long-press threshold
    await snap('dark-70-spen-radial-menu-active.png', 'S-Pen Radial Menu: Long-Press Quick Tools Wheel on Tab S6 Lite (Dark)', 'Gestures & Stylus (Dark)');
    await page.mouse.up();
    await page.waitForTimeout(400);

    // =============================================================
    // PART 2: COMPLETE LIGHT THEME AUDIT SUITE
    // =============================================================
    console.log('\n===============================================================');
    console.log('  SWITCHING TO FULL LIGHT THEME SUITE...');
    console.log('===============================================================');

    await page.evaluate(() => {
      window.__testApp?.closeAllModals();
      window.__testApp?.setTheme?.('light');
    });
    await page.waitForTimeout(600);

    // 19. Light Theme Base Canvas
    await snap('light-71-base-canvas-portrait.png', 'Light Theme: Base 3D Canvas in Warm White Mode Portrait', 'Light Theme');

    // 20. Light Theme Bottom Dock Tools
    if (await drawBtn.isVisible()) {
      await drawBtn.click();
      await snap('light-72-dock-tool-draw-active.png', 'Light Theme: Bottom Dock Draw Tool Active', 'Light Theme');
    }
    if (await eraseBtn.isVisible()) {
      await eraseBtn.click();
      await snap('light-73-dock-tool-erase-active.png', 'Light Theme: Bottom Dock Erase Tool Active', 'Light Theme');
      await drawBtn.click();
    }

    // Light Theme Color Shelf
    if (await colorBtn.isVisible()) {
      await colorBtn.click();
      await page.waitForTimeout(400);
      await snap('light-74-dock-color-shelf-open.png', 'Light Theme: Quick Color Shelf with Swatches Open', 'Light Theme');
      await colorBtn.click();
      await page.waitForTimeout(300);
    }

    // Light Theme Size Slider Shelf
    if (await sizeBtn.isVisible()) {
      await sizeBtn.click();
      await page.waitForTimeout(400);
      await snap('light-75-dock-size-shelf-open.png', 'Light Theme: Brush Size Slider Shelf Open', 'Light Theme');
      await sizeBtn.click();
      await page.waitForTimeout(300);
    }

    // Light Theme Brush Presets Shelf
    if (await brushBtn.isVisible()) {
      await brushBtn.click();
      await page.waitForTimeout(400);
      await snap('light-76-dock-brush-shelf-open.png', 'Light Theme: Quick Brush Preset Shelf Open', 'Light Theme');
      await brushBtn.click();
      await page.waitForTimeout(300);
    }

    // Light Theme Symmetry
    if (await symmBtn.isVisible()) {
      await symmBtn.click();
      await page.waitForTimeout(400);
      await snap('light-77-dock-symmetry-active.png', 'Light Theme: Symmetry Tool Active', 'Light Theme');
      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    // 21. Light Theme Mode Panels / Right Rail
    if (await selectRailBtn.isVisible()) {
      await selectRailBtn.click();
      await page.waitForTimeout(500);
      await snap('light-78-rail-select-panel-open.png', 'Light Theme: Right Rail Select Panel Open', 'Light Theme');
      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    if (await createRailBtn.isVisible()) {
      await createRailBtn.click();
      await page.waitForTimeout(500);
      await snap('light-79-rail-create-panel-primitives.png', 'Light Theme: Right Rail Create Panel & 3D Shapes', 'Light Theme');
      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    if (await deformRailBtn.isVisible()) {
      await deformRailBtn.click();
      await page.waitForTimeout(500);
      await snap('light-80-rail-deform-panel-overview.png', 'Light Theme: Right Rail Deform & Sculpt Panel', 'Light Theme');
      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    if (await layersRailBtn.isVisible()) {
      await layersRailBtn.click();
      await page.waitForTimeout(500);
      await snap('light-81-rail-layers-panel-overview.png', 'Light Theme: Right Rail Scene Layers Panel', 'Light Theme');
      await page.evaluate(() => window.__testApp?.closeAllModals());
      await page.waitForTimeout(300);
    }

    // 22. Light Theme Draw Panel Tabs
    await page.evaluate(() => window.__testApp?.openSheet?.('draw'));
    await page.waitForTimeout(500);
    await snap('light-82-draw-panel-paint-tab.png', 'Light Theme: Draw Panel Paint Tab (Profiles & Surfaces)', 'Light Theme');

    const brushTabLight = page.locator('button:has-text("Brush")').first();
    if (await brushTabLight.isVisible()) {
      await brushTabLight.click();
      await page.waitForTimeout(400);
      await snap('light-83-draw-panel-brush-tab.png', 'Light Theme: Draw Panel Curated Brushes Tab', 'Light Theme');
    }

    const advTabLight = page.locator('button:has-text("Advanced"), button:has-text("Settings")').first();
    if (await advTabLight.isVisible()) {
      await advTabLight.click();
      await page.waitForTimeout(400);
      await snap('light-84-draw-panel-advanced-tab.png', 'Light Theme: Draw Panel Advanced Tab (Smoothing & Taper)', 'Light Theme');
    }

    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // 23. Light Theme Top More Menu
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await page.waitForTimeout(400);
      await snap('light-85-top-more-menu-open.png', 'Light Theme: Top Bar More Menu Actions', 'Light Theme');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // 24. Light Theme Color Studio
    await page.evaluate(() => window.__testApp?.openModal?.('colorStudio'));
    await page.waitForTimeout(600);
    await snap('light-86-color-studio-tab-wheel.png', 'Light Theme: Color Studio HSV Wheel Modal', 'Light Theme');

    const oklchTabLight = page.locator('button:has-text("OKLCh"), button:has-text("Perceptual")').first();
    if (await oklchTabLight.isVisible()) {
      await oklchTabLight.click();
      await page.waitForTimeout(400);
      await snap('light-87-color-studio-tab-oklch.png', 'Light Theme: Color Studio OKLCh Polar Sliders', 'Light Theme');
    }

    const harmoniesTabLight = page.locator('button:has-text("Harmonies"), button:has-text("Palettes")').first();
    if (await harmoniesTabLight.isVisible()) {
      await harmoniesTabLight.click();
      await page.waitForTimeout(400);
      await snap('light-88-color-studio-tab-harmonies.png', 'Light Theme: Color Studio Harmonies & Curated Palettes', 'Light Theme');
    }

    const shadersTabLight = page.locator('button:has-text("Shaders"), button:has-text("Materials")').first();
    if (await shadersTabLight.isVisible()) {
      await shadersTabLight.click();
      await page.waitForTimeout(400);
      await snap('light-89-color-studio-material-shaders.png', 'Light Theme: Color Studio 1-Click Material Shaders', 'Light Theme');
    }

    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // 25. Light Theme 3D Model Library & Model on Stage
    await page.evaluate(() => window.__testApp?.openModal?.('models'));
    await page.waitForTimeout(600);
    await snap('light-90-model-library-presets.png', 'Light Theme: 3D Model Library Presets Tab', 'Light Theme');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(400);

    await snap('light-91-canvas-model-pikachu.png', 'Light Theme: 3D Pikachu Model on Light Canvas', 'Light Theme');

    // 26. Light Theme Illumination Studio
    await page.evaluate(() => window.__testApp?.openModal?.('illumination'));
    await page.waitForTimeout(600);
    await snap('light-92-illumination-studio-modal.png', 'Light Theme: Illumination Lighting Studio Dome Modal', 'Light Theme');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // 27. Light Theme Scaffolding & Guides
    await page.evaluate(() => window.__testApp?.openModal?.('scaffolding'));
    await page.waitForTimeout(600);
    await snap('light-93-scaffolding-armatures-modal.png', 'Light Theme: 3D Armatures & Scaffolding Modal', 'Light Theme');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    await page.evaluate(() => window.__testApp?.openModal?.('bentGuide'));
    await page.waitForTimeout(600);
    await snap('light-94-bent-guide-modal.png', 'Light Theme: Bend Along Path Curved Guides Modal', 'Light Theme');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    await page.evaluate(() => window.__testApp?.openModal?.('customMirror'));
    await page.waitForTimeout(600);
    await snap('light-95-custom-mirror-modal.png', 'Light Theme: Custom Mirror Coordinate Modal', 'Light Theme');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // 28. Light Theme Export & Settings
    await page.evaluate(() => window.__testApp?.openModal?.('export'));
    await page.waitForTimeout(600);
    await snap('light-96-export-modal.png', 'Light Theme: Export Studio Modal (GLB, OBJ, PNG)', 'Light Theme');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    await page.evaluate(() => window.__testApp?.openModal?.('settings'));
    await page.waitForTimeout(600);
    await snap('light-97-settings-sheet.png', 'Light Theme: Studio Settings Sheet with S-Pen & S6 Lite Tier', 'Light Theme');
    await page.evaluate(() => window.__testApp?.closeAllModals());
    await page.waitForTimeout(300);

    // 29. Light Theme S-Pen Radial Menu
    await page.mouse.move(300, 480);
    await page.mouse.down();
    await page.waitForTimeout(750);
    await snap('light-98-spen-radial-menu-active.png', 'Light Theme: S-Pen Radial Menu on Light Canvas', 'Light Theme');
    await page.mouse.up();
    await page.waitForTimeout(400);

    // =============================================================
    // PART 3: GALAXY TAB S6 LITE HARDWARE BEZEL SIMULATOR FRAME
    // =============================================================
    console.log('\n===============================================================');
    console.log('  CATEGORY 20: TAB S6 LITE HARDWARE BEZEL SIMULATOR MODE');
    console.log('===============================================================');

    // Switch back to dark theme
    await page.evaluate(() => window.__testApp?.setTheme?.('dark'));
    await page.waitForTimeout(300);

    console.log('Navigating to Hardware Bezel Simulator: ' + simUrl);
    await page.goto(simUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1600);

    // Simulator in Dark Mode Portrait
    await snap(
      'sim-99-s6lite-bezel-frame-portrait-dark.png',
      'Hardware Simulator: Galaxy Tab S6 Lite Bezel Frame in Portrait (Dark Mode)',
      'Hardware Simulator'
    );

    // Switch simulator content to Light Mode
    await page.evaluate(() => window.__testApp?.setTheme?.('light'));
    await page.waitForTimeout(600);
    await snap(
      'sim-100-s6lite-bezel-frame-portrait-light.png',
      'Hardware Simulator: Galaxy Tab S6 Lite Bezel Frame in Portrait (Light Mode)',
      'Hardware Simulator'
    );

    // Switch orientation to Landscape in Hardware Simulator
    const orientBtn = page.locator('header button:has-text("Portrait"), header button[title*="Orientation"]').first();
    if (await orientBtn.isVisible()) {
      await orientBtn.click();
      await page.waitForTimeout(800);
      await snap(
        'sim-101-s6lite-bezel-frame-landscape.png',
        'Hardware Simulator: Galaxy Tab S6 Lite Bezel Frame in Landscape Orientation',
        'Hardware Simulator'
      );
    }

    console.log('\n===============================================================');
    console.log(`🎉 ALL ${manifest.length} PORTRAIT AUDIT SCREENSHOTS CAPTURED!`);
    console.log('===============================================================');

  } catch (error) {
    console.error('Portrait audit runner error:', error);
  } finally {
    await browser.close();
  }

  // Save manifest file
  const manifestPath = path.join(SCREENSHOT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Manifest saved with ${manifest.length} entries to: ${manifestPath}`);
}

captureS6LitePortraitAudit().catch(console.error);

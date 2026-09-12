import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = 'E:/X/AiStudio Workflow/V20/screenshots/s6lite-audit/portrait';
const manifestPath = path.join(SCREENSHOT_DIR, 'manifest.json');

const targetUrl = process.env.APP_URL || 'http://localhost:3002/?device=none';
const simUrl = 'http://localhost:3002/?device=s6lite';

async function finishS6LitePortraitAudit() {
  console.log('===============================================================');
  console.log('  FINISHING REMAINING S6 LITE PORTRAIT SCREENSHOTS');
  console.log('===============================================================');

  let manifest = [];
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`Loaded existing manifest with ${manifest.length} items.`);
  }

  const existingFilenames = new Set(manifest.map((item) => item.filename));

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl'],
  });

  const context = await browser.newContext({
    viewport: { width: 600, height: 1000 },
    deviceScaleFactor: 2.0,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-P610) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  async function snap(filename, description, category = 'General') {
    const filePath = path.join(SCREENSHOT_DIR, filename);
    await page.waitForTimeout(500);
    await page.screenshot({ path: filePath });
    const stat = fs.statSync(filePath);
    const item = {
      filename,
      description,
      category,
      path: filePath,
      sizeBytes: stat.size,
    };
    if (!existingFilenames.has(filename)) {
      manifest.push(item);
      existingFilenames.add(filename);
    } else {
      const idx = manifest.findIndex((m) => m.filename === filename);
      if (idx >= 0) manifest[idx] = item;
    }
    console.log(`[SAVED] ${filename} (${Math.round(stat.size / 1024)} KB) - ${description}`);
  }

  try {
    console.log('Navigating to Studio application...');
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Set to light theme
    await page.evaluate(() => window.__testApp?.setTheme?.('light'));
    await page.waitForTimeout(500);

    // 1. Draw Panel Advanced Tab (Light)
    try {
      await page.evaluate(() => window.__testApp?.openSheet?.('draw'));
      await page.waitForTimeout(600);
      const advTab = page.locator('button:has-text("Advanced"), button:has-text("Settings")').first();
      if (await advTab.isVisible({ timeout: 2000 })) {
        await advTab.click({ force: true });
        await page.waitForTimeout(400);
        await snap('light-84-draw-panel-advanced-tab.png', 'Light Theme: Draw Panel Advanced Tab (Smoothing & Taper)', 'Light Theme');
      }
    } catch (e) {
      console.log('Notice: advanced tab click handled:', e.message);
    }
    await page.evaluate(() => window.__testApp?.closeAllModals?.());
    await page.waitForTimeout(300);

    // 2. Top More Menu (Light)
    try {
      const moreBtn = page.locator('button[title*="More"], button[aria-label*="More"]').first();
      if (await moreBtn.isVisible({ timeout: 2000 })) {
        await moreBtn.click({ force: true });
        await page.waitForTimeout(400);
        await snap('light-85-top-more-menu-open.png', 'Light Theme: Top Bar More Menu Actions', 'Light Theme');
        await page.keyboard.press('Escape');
      }
    } catch (e) {
      console.log('Notice: top more menu handled:', e.message);
    }
    await page.waitForTimeout(300);

    // 3. Color Studio (Light)
    try {
      await page.evaluate(() => window.__testApp?.openModal?.('colorStudio'));
      await page.waitForTimeout(700);
      await snap('light-86-color-studio-tab-wheel.png', 'Light Theme: Color Studio HSV Wheel Modal', 'Light Theme');

      const oklchTab = page.locator('button:has-text("OKLCh"), button:has-text("Perceptual")').first();
      if (await oklchTab.isVisible({ timeout: 2000 })) {
        await oklchTab.click({ force: true });
        await page.waitForTimeout(400);
        await snap('light-87-color-studio-tab-oklch.png', 'Light Theme: Color Studio OKLCh Polar Sliders', 'Light Theme');
      }

      const harmoniesTab = page.locator('button:has-text("Harmonies"), button:has-text("Palettes")').first();
      if (await harmoniesTab.isVisible({ timeout: 2000 })) {
        await harmoniesTab.click({ force: true });
        await page.waitForTimeout(400);
        await snap('light-88-color-studio-tab-harmonies.png', 'Light Theme: Color Studio Harmonies & Curated Palettes', 'Light Theme');
      }

      const shadersTab = page.locator('button:has-text("Shaders"), button:has-text("Materials")').first();
      if (await shadersTab.isVisible({ timeout: 2000 })) {
        await shadersTab.click({ force: true });
        await page.waitForTimeout(400);
        await snap('light-89-color-studio-material-shaders.png', 'Light Theme: Color Studio 1-Click Material Shaders', 'Light Theme');
      }
    } catch (e) {
      console.log('Notice: color studio modal handled:', e.message);
    }
    await page.evaluate(() => window.__testApp?.closeAllModals?.());
    await page.waitForTimeout(300);

    // 4. Model Library & Canvas Pikachu (Light)
    try {
      await page.evaluate(() => window.__testApp?.openModal?.('models'));
      await page.waitForTimeout(700);
      await snap('light-90-model-library-presets.png', 'Light Theme: 3D Model Library Presets Tab', 'Light Theme');
      await page.evaluate(() => window.__testApp?.closeAllModals?.());
      await page.waitForTimeout(400);

      await page.evaluate(() => window.__testApp?.loadModel?.('pikachu'));
      await page.waitForTimeout(800);
      await snap('light-91-canvas-model-pikachu.png', 'Light Theme: 3D Pikachu Model on Light Canvas', 'Light Theme');
    } catch (e) {
      console.log('Notice: model library handled:', e.message);
    }

    // 5. Illumination Studio (Light)
    try {
      await page.evaluate(() => window.__testApp?.openModal?.('illumination'));
      await page.waitForTimeout(700);
      await snap('light-92-illumination-studio-modal.png', 'Light Theme: Illumination Lighting Studio Dome Modal', 'Light Theme');
      await page.evaluate(() => window.__testApp?.closeAllModals?.());
      await page.waitForTimeout(300);
    } catch (e) {
      console.log('Notice: illumination studio handled:', e.message);
    }

    // 6. Scaffolding & Bent Guides & Mirror (Light)
    try {
      await page.evaluate(() => window.__testApp?.openModal?.('scaffolding'));
      await page.waitForTimeout(700);
      await snap('light-93-scaffolding-armatures-modal.png', 'Light Theme: 3D Armatures & Scaffolding Modal', 'Light Theme');
      await page.evaluate(() => window.__testApp?.closeAllModals?.());
      await page.waitForTimeout(300);

      await page.evaluate(() => window.__testApp?.openModal?.('bentGuide'));
      await page.waitForTimeout(700);
      await snap('light-94-bent-guide-modal.png', 'Light Theme: Bend Along Path Curved Guides Modal', 'Light Theme');
      await page.evaluate(() => window.__testApp?.closeAllModals?.());
      await page.waitForTimeout(300);

      await page.evaluate(() => window.__testApp?.openModal?.('customMirror'));
      await page.waitForTimeout(700);
      await snap('light-95-custom-mirror-modal.png', 'Light Theme: Custom Mirror Coordinate Modal', 'Light Theme');
      await page.evaluate(() => window.__testApp?.closeAllModals?.());
      await page.waitForTimeout(300);
    } catch (e) {
      console.log('Notice: scaffolding/guides handled:', e.message);
    }

    // 7. Export & Settings (Light)
    try {
      await page.evaluate(() => window.__testApp?.openModal?.('export'));
      await page.waitForTimeout(700);
      await snap('light-96-export-modal.png', 'Light Theme: Export Studio Modal (GLB, OBJ, PNG)', 'Light Theme');
      await page.evaluate(() => window.__testApp?.closeAllModals?.());
      await page.waitForTimeout(300);

      await page.evaluate(() => window.__testApp?.openModal?.('settings'));
      await page.waitForTimeout(700);
      await snap('light-97-settings-sheet.png', 'Light Theme: Studio Settings Sheet with S-Pen & S6 Lite Tier', 'Light Theme');
      await page.evaluate(() => window.__testApp?.closeAllModals?.());
      await page.waitForTimeout(300);
    } catch (e) {
      console.log('Notice: export/settings handled:', e.message);
    }

    // 8. S-Pen Radial Menu (Light)
    try {
      await page.mouse.move(300, 480);
      await page.mouse.down();
      await page.waitForTimeout(750);
      await snap('light-98-spen-radial-menu-active.png', 'Light Theme: S-Pen Radial Menu on Light Canvas', 'Light Theme');
      await page.mouse.up();
      await page.waitForTimeout(400);
    } catch (e) {
      console.log('Notice: radial menu handled:', e.message);
    }

    // 9. Hardware Simulator Frames
    console.log('Navigating to Hardware Bezel Simulator Portrait Dark...');
    await page.goto(`${simUrl}&orientation=portrait`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.__testApp?.setTheme?.('dark'));
    await page.waitForTimeout(400);
    await snap(
      'sim-99-s6lite-bezel-frame-portrait-dark.png',
      'Hardware Simulator: Galaxy Tab S6 Lite Bezel Frame in Portrait (Dark Mode)',
      'Hardware Simulator'
    );

    console.log('Navigating to Hardware Bezel Simulator Portrait Light...');
    await page.evaluate(() => window.__testApp?.setTheme?.('light'));
    await page.waitForTimeout(600);
    await snap(
      'sim-100-s6lite-bezel-frame-portrait-light.png',
      'Hardware Simulator: Galaxy Tab S6 Lite Bezel Frame in Portrait (Light Mode)',
      'Hardware Simulator'
    );

    console.log('Navigating to Hardware Bezel Simulator Landscape...');
    await page.goto(`${simUrl}&orientation=landscape`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await snap(
      'sim-101-s6lite-bezel-frame-landscape.png',
      'Hardware Simulator: Galaxy Tab S6 Lite Bezel Frame in Landscape Orientation',
      'Hardware Simulator'
    );

    console.log(`\nAll done! Updated manifest has ${manifest.length} entries.`);
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Saved manifest to ${manifestPath}`);
}

finishS6LitePortraitAudit().catch(console.error);

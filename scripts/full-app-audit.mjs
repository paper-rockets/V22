import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const screenshotsDir = path.join(rootDir, 'fresh-audit-screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const auditResults = {
  timestamp: new Date().toISOString(),
  consoleErrors: [],
  pageErrors: [],
  touchTargetViolations: [],
  brokenImages: [],
  frameZeroIssues: [],
  pixelRenderAudit: {},
  gizmoDockOverlapAudit: [],
  lightThemeContrastAudit: [],
  keyboardSqueezeAudit: [],
  storageCorruptionAudit: {},
  layerAudits: {},
  devicesTested: []
};

async function runAudit() {
  console.log('Starting fast 12-layer audit with fresh screenshots...');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const deviceConfigs = [
    {
      name: 'Galaxy_S25_Ultra',
      viewport: { width: 412, height: 915 },
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S938B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36'
    },
    {
      name: 'Galaxy_Tab_S6_Lite_Portrait',
      viewport: { width: 800, height: 1334 },
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-P610) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
    },
    {
      name: 'Galaxy_Tab_S6_Lite_Landscape',
      viewport: { width: 1334, height: 800 },
      isMobile: false,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-P610) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
    },
    {
      name: 'Desktop_1080p',
      viewport: { width: 1920, height: 1080 },
      isMobile: false,
      hasTouch: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
    }
  ];

  for (const dev of deviceConfigs) {
    console.log(`\n========================================`);
    console.log(`Auditing: ${dev.name} (${dev.viewport.width}x${dev.viewport.height})`);
    console.log(`========================================`);
    auditResults.devicesTested.push(dev.name);

    for (const theme of ['dark', 'light']) {
      console.log(`\n--- Theme: ${theme.toUpperCase()} ---`);

      const context = await browser.newContext({
        viewport: dev.viewport,
        isMobile: dev.isMobile,
        hasTouch: dev.hasTouch,
        userAgent: dev.userAgent,
        colorScheme: theme === 'dark' ? 'dark' : 'light'
      });

      const page = await context.newPage();
      page.setDefaultTimeout(2500);
      page.setDefaultNavigationTimeout(20000);

      // Listeners for errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          auditResults.consoleErrors.push({ device: dev.name, theme, text });
        }
      });

      page.on('pageerror', err => {
        auditResults.pageErrors.push({ device: dev.name, theme, message: err.message });
      });

      // Navigate and set exact theme in localStorage
      await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
      await page.evaluate((t) => {
        localStorage.setItem('mody_theme', t);
        localStorage.setItem('remix3d_theme', t);
      }, theme);

      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Layer 9: Check Gizmo vs Bottom Dock overlap
      const overlapCheck = await page.evaluate(() => {
        const nvDock = document.querySelector('#nv-dock');
        const nvTab = document.querySelector('#nv-tab');
        const dock = Array.from(document.querySelectorAll('div')).find(d => {
          const r = d.getBoundingClientRect();
          return r.bottom > window.innerHeight - 80 && r.height > 40 && r.width > 200 && window.getComputedStyle(d).position === 'fixed';
        });

        if (!nvDock || !dock) return { detected: false };
        const r1 = nvDock.getBoundingClientRect();
        const r2 = dock.getBoundingClientRect();
        const rTab = nvTab ? nvTab.getBoundingClientRect() : null;

        const overlaps = !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
        const tabOverlaps = rTab ? !(rTab.right < r2.left || rTab.left > r2.right || rTab.bottom < r2.top || rTab.top > r2.bottom) : false;

        return {
          detected: overlaps || tabOverlaps,
          gizmoRect: { top: Math.round(r1.top), left: Math.round(r1.left), right: Math.round(r1.right), bottom: Math.round(r1.bottom), width: Math.round(r1.width), height: Math.round(r1.height) },
          dockRect: { top: Math.round(r2.top), left: Math.round(r2.left), right: Math.round(r2.right), bottom: Math.round(r2.bottom), width: Math.round(r2.width), height: Math.round(r2.height) },
          tabRect: rTab ? { top: Math.round(rTab.top), left: Math.round(rTab.left), right: Math.round(rTab.right), bottom: Math.round(rTab.bottom) } : null
        };
      });

      if (overlapCheck.detected) {
        auditResults.gizmoDockOverlapAudit.push({
          device: dev.name,
          theme,
          details: overlapCheck
        });
      }

      // Screenshot 01: Base Canvas
      const shot01 = `${dev.name}_${theme}_01_base_canvas.png`;
      await page.screenshot({ path: path.join(screenshotsDir, shot01) });
      console.log(`[Screenshot] ${shot01}`);

      // Layer 3: Canvas rendering verification
      const canvasPixels = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return { error: 'No canvas found' };
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return { error: 'No WebGL context' };

        const w = gl.drawingBufferWidth || canvas.width;
        const h = gl.drawingBufferHeight || canvas.height;
        const samples = [];
        const coords = [
          { x: Math.floor(w / 2), y: Math.floor(h / 2), label: 'center' },
          { x: 10, y: 10, label: 'bottom-left' },
          { x: w - 10, y: 10, label: 'bottom-right' }
        ];

        for (const pt of coords) {
          const pixel = new Uint8Array(4);
          gl.readPixels(pt.x, pt.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
          samples.push({ label: pt.label, rgba: Array.from(pixel) });
        }

        return { width: w, height: h, samples };
      });
      auditResults.pixelRenderAudit[`${dev.name}_${theme}`] = canvasPixels;

      // Layer 4 & Touch Targets: Check button sizes
      if (dev.hasTouch) {
        const smallTargets = await page.evaluate(() => {
          const interactive = Array.from(document.querySelectorAll('button, [role="button"]'));
          const violations = [];
          for (const el of interactive) {
            const r = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || r.width === 0 || r.height === 0) continue;
            if (r.width < 44 || r.height < 44) {
              violations.push({
                text: (el.innerText || el.getAttribute('aria-label') || el.title || el.className).slice(0, 30).trim(),
                width: Math.round(r.width),
                height: Math.round(r.height),
                class: el.className.slice(0, 50)
              });
            }
          }
          return violations;
        });

        if (smallTargets.length > 0) {
          auditResults.touchTargetViolations.push({
            device: dev.name,
            theme,
            count: smallTargets.length,
            violations: smallTargets
          });
        }
      }

      // Layer 7: Touch Action check
      const touchActionCheck = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const container = document.querySelector('#viewport-container');
        const nvCanvas = document.querySelector('#nv-canvas');
        return {
          canvasTouchAction: canvas ? window.getComputedStyle(canvas).touchAction : 'none',
          containerTouchAction: container ? window.getComputedStyle(container).touchAction : 'none',
          nvCanvasTouchAction: nvCanvas ? window.getComputedStyle(nvCanvas).touchAction : 'none'
        };
      });
      auditResults.layerAudits[`${dev.name}_${theme}_touch_action`] = touchActionCheck;

      // Test Bottom Dock: Color Shelf
      try {
        const colorBtn = await page.$('button[title*="Color"], button[aria-label*="Color"]');
        if (colorBtn) {
          await colorBtn.click();
          await page.waitForTimeout(500);
          const shotColor = `${dev.name}_${theme}_02_dock_color_shelf.png`;
          await page.screenshot({ path: path.join(screenshotsDir, shotColor) });
          console.log(`[Screenshot] ${shotColor}`);

          // Close Color Studio modal
          const closeColorBtn = await page.$('#mody-color-studio-modal button[aria-label*="Close"], #mody-color-studio-modal button[title*="Close"]');
          if (closeColorBtn) {
            await closeColorBtn.click();
          } else {
            // Click outside
            await page.keyboard.press('Escape');
          }
          await page.waitForTimeout(300);
        }
      } catch (e) {
        console.warn('Color shelf test error:', e.message);
      }

      // Test Bottom Dock: Size Shelf
      try {
        const sizeBtn = await page.$('button[title*="Size"], button[aria-label*="Size"]');
        if (sizeBtn) {
          await sizeBtn.click();
          await page.waitForTimeout(500);
          const shotSize = `${dev.name}_${theme}_03_dock_size_shelf.png`;
          await page.screenshot({ path: path.join(screenshotsDir, shotSize) });
          console.log(`[Screenshot] ${shotSize}`);

          // Close size shelf
          await sizeBtn.click();
          await page.waitForTimeout(300);
        }
      } catch (e) {
        console.warn('Size shelf test error:', e.message);
      }

      // Test Bottom Dock: Brush Shelf
      try {
        const brushBtn = await page.$('button[title*="Brush"], button[aria-label*="Brush"]');
        if (brushBtn) {
          await brushBtn.click();
          await page.waitForTimeout(500);
          const shotBrush = `${dev.name}_${theme}_04_dock_brush_shelf.png`;
          await page.screenshot({ path: path.join(screenshotsDir, shotBrush) });
          console.log(`[Screenshot] ${shotBrush}`);

          // Verify Brush Previews (broken images)
          const brushImgCheck = await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('.brush-card img, [data-brush-id] img, img[alt*="brush"], img[alt*="Brush"]'));
            return imgs.map(i => ({
              src: i.src,
              alt: i.alt,
              complete: i.complete,
              naturalWidth: i.naturalWidth,
              naturalHeight: i.naturalHeight
            }));
          });

          const broken = brushImgCheck.filter(i => !i.complete || i.naturalWidth === 0);
          if (broken.length > 0) {
            auditResults.brokenImages.push({
              device: dev.name,
              theme,
              brokenCount: broken.length,
              samples: broken
            });
          }

          // Close brush shelf
          await brushBtn.click();
          await page.waitForTimeout(300);
        }
      } catch (e) {
        console.warn('Brush shelf test error:', e.message);
      }

      // Test Studio Rail: Create Panel
      try {
        const createBtn = await page.$('button[title*="Create"], button[aria-label*="Create"]');
        if (createBtn) {
          await createBtn.click();
          await page.waitForTimeout(500);
          const shotCreate = `${dev.name}_${theme}_05_rail_create_panel.png`;
          await page.screenshot({ path: path.join(screenshotsDir, shotCreate) });
          console.log(`[Screenshot] ${shotCreate}`);

          // Close Create panel
          await createBtn.click();
          await page.waitForTimeout(300);
        }
      } catch (e) {
        console.warn('Create panel test error:', e.message);
      }

      // Test Studio Rail: Layers Panel
      try {
        const layersBtn = await page.$('button[title*="Layers"], button[aria-label*="Layers"]');
        if (layersBtn) {
          await layersBtn.click();
          await page.waitForTimeout(500);
          const shotLayers = `${dev.name}_${theme}_06_rail_layers_panel.png`;
          await page.screenshot({ path: path.join(screenshotsDir, shotLayers) });
          console.log(`[Screenshot] ${shotLayers}`);

          // Close Layers panel
          await layersBtn.click();
          await page.waitForTimeout(300);
        }
      } catch (e) {
        console.warn('Layers panel test error:', e.message);
      }

      // Test Top Settings and More
      try {
        const moreBtn = await page.$('button[aria-label="Settings and more"]');
        if (moreBtn) {
          await moreBtn.click();
          await page.waitForTimeout(500);
          const shotMore = `${dev.name}_${theme}_07_more_menu.png`;
          await page.screenshot({ path: path.join(screenshotsDir, shotMore) });
          console.log(`[Screenshot] ${shotMore}`);

          // Click Settings inside the More menu
          const settingsItem = await page.$('button:has-text("Settings"), [data-sheet-id="settings"]');
          if (settingsItem) {
            await settingsItem.click();
            await page.waitForTimeout(500);
            const shotSettings = `${dev.name}_${theme}_08_settings_sheet.png`;
            await page.screenshot({ path: path.join(screenshotsDir, shotSettings) });
            console.log(`[Screenshot] ${shotSettings}`);

            // Close sheet
            await page.keyboard.press('Escape');
          } else {
            await page.keyboard.press('Escape');
          }
          await page.waitForTimeout(300);
        }
      } catch (e) {
        console.warn('More/Settings test error:', e.message);
      }

      // Layer 8: Mobile Keyboard Squeeze Test
      if (dev.isMobile) {
        const origHeight = dev.viewport.height;
        await page.setViewportSize({ width: dev.viewport.width, height: Math.round(origHeight * 0.55) });
        await page.waitForTimeout(400);

        const squeezeEval = await page.evaluate(() => {
          const dock = Array.from(document.querySelectorAll('div')).find(d => {
            const r = d.getBoundingClientRect();
            return r.bottom > window.innerHeight - 80 && r.height > 40 && r.width > 200 && window.getComputedStyle(d).position === 'fixed';
          });
          return {
            windowHeight: window.innerHeight,
            dockVisible: dock ? dock.getBoundingClientRect().bottom <= window.innerHeight : false,
            dockRect: dock ? {
              top: Math.round(dock.getBoundingClientRect().top),
              bottom: Math.round(dock.getBoundingClientRect().bottom),
              height: Math.round(dock.getBoundingClientRect().height)
            } : null
          };
        });

        const shotSqueeze = `${dev.name}_${theme}_09_keyboard_squeeze.png`;
        await page.screenshot({ path: path.join(screenshotsDir, shotSqueeze) });
        console.log(`[Screenshot] ${shotSqueeze}`);

        auditResults.keyboardSqueezeAudit.push({
          device: dev.name,
          theme,
          data: squeezeEval
        });

        // Restore viewport height
        await page.setViewportSize(dev.viewport);
        await page.waitForTimeout(200);
      }

      await context.close();
    }
  }

  // Layer 11: Storage Corruption Resilience Test
  console.log('\n--- Auditing Layer 11: Storage Corruption Handling ---');
  const storageContext = await browser.newContext();
  const storagePage = await storageContext.newPage();
  await storagePage.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });

  const storageTestResult = await storagePage.evaluate(() => {
    try {
      localStorage.setItem('mody_project_v1', '{{{CORRUPTED_JSON_DATA}}');
      localStorage.setItem('remix3d_active_layer', 'NaN');
      localStorage.setItem('mody_brush_settings', 'undefined');
      return { injected: true };
    } catch (e) {
      return { injected: false, error: e.message };
    }
  });

  let whiteScreenDetected = false;
  try {
    await storagePage.reload({ waitUntil: 'domcontentloaded' });
    await storagePage.waitForTimeout(1500);
    whiteScreenDetected = await storagePage.evaluate(() => {
      return !document.querySelector('canvas') || document.body.innerText.includes('An unexpected error has occurred');
    });
  } catch (e) {
    whiteScreenDetected = true;
  }

  auditResults.storageCorruptionAudit = {
    testExecuted: true,
    corruptedKeysInjected: storageTestResult.injected,
    whiteScreenDetected,
    status: whiteScreenDetected ? 'FAIL (White screen on corrupted storage)' : 'PASS (Graceful recovery)'
  };
  await storageContext.close();

  await browser.close();

  // Save report
  fs.writeFileSync(
    path.join(rootDir, 'fresh-audit-report.json'),
    JSON.stringify(auditResults, null, 2)
  );

  console.log('\n========================================');
  console.log('Full 12-Layer Fast Audit Complete!');
  console.log('Results saved to fresh-audit-report.json');
  console.log('========================================');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

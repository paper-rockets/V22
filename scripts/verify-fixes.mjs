import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function testFixes() {
  console.log('Testing live server at http://localhost:5174 ...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 412, height: 915 }, // Galaxy S25 Ultra
    isMobile: true,
    hasTouch: true,
  });

  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 1. Check Sun / Lighting button in top bar
  const sunBtn = page.locator('button[title*="Illumination"], button[aria-label*="Illumination"]').first();
  const isSunVisible = await sunBtn.isVisible();
  console.log('1. Sun / Lighting Button Visible in Header:', isSunVisible);

  // 2. Check Opacity button in ProRail
  const opacityBtn = page.locator('button.paperrocket-studio-quick--opacity');
  const isOpacityVisible = await opacityBtn.isVisible();
  console.log('2. Opacity Button Visible in Dock:', isOpacityVisible);

  // Click Opacity button to test shelf
  if (isOpacityVisible) {
    await opacityBtn.click();
    await page.waitForTimeout(400);
    const opacityShelf = page.locator('input[aria-label="Stroke opacity slider"]');
    const isShelfOpen = await opacityShelf.isVisible();
    console.log('2b. Opacity Shelf Opened with Slider:', isShelfOpen);
    // Click outside to test dismiss
    await page.mouse.click(100, 200);
    await page.waitForTimeout(300);
  }

  // 3. Check Gizmo Mode Badge and Tab Target
  const tabBtn = page.locator('.nv-tab');
  const tabBox = await tabBtn.boundingBox();
  console.log(`3. Gizmo 3-dot tab button dimensions: ${tabBox?.width}px x ${tabBox?.height}px (Passes >= 44px: ${tabBox?.width >= 44 && tabBox?.height >= 44})`);

  const modeBadge = page.locator('.nv-mode-badge');
  const isModeBadgeVisible = await modeBadge.isVisible();
  const modeTextInitial = await modeBadge.textContent();
  console.log('4. Mode Badge Visible:', isModeBadgeVisible, '| Mode:', modeTextInitial);

  // Click mode badge to cycle mode
  if (isModeBadgeVisible) {
    await modeBadge.click();
    await page.waitForTimeout(300);
    const modeTextAfter = await modeBadge.textContent();
    console.log('4b. Mode after 1 click:', modeTextAfter);
  }

  // 5. Check Gizmo and Dock Overlap on Galaxy S25 Ultra
  const gizmoDock = page.locator('#nv-dock');
  const studioRail = page.locator('.paperrocket-studio-rail-inner');
  const gizmoBox = await gizmoDock.boundingBox();
  const railBox = await studioRail.boundingBox();

  if (gizmoBox && railBox) {
    const hasCollision = !(
      gizmoBox.x + gizmoBox.width < railBox.x ||
      gizmoBox.x > railBox.x + railBox.width ||
      gizmoBox.y + gizmoBox.height < railBox.y ||
      gizmoBox.y > railBox.y + railBox.height
    );
    console.log(`5. Collision between Gizmo and Dock on Galaxy S25 Ultra: ${hasCollision ? 'COLLISION' : 'ZERO COLLISION (CLEAN CLEARANCE)'}`);
    console.log(`   Gizmo bottom: ${gizmoBox.y + gizmoBox.height}px | Dock top: ${railBox.y}px | Gap: ${railBox.y - (gizmoBox.y + gizmoBox.height)}px`);
  }

  // Take screenshot
  const outDir = 'E:/X/AiStudio Workflow/V22 Test/fresh-audit-screenshots';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const shotPath = path.join(outDir, 'live_verification_fixes_s25ultra.png');
  await page.screenshot({ path: shotPath });
  console.log('Screenshot saved to:', shotPath);

  console.log('Page Errors:', pageErrors.length === 0 ? '0 errors (CLEAN)' : pageErrors);

  await browser.close();
}

testFixes().catch(console.error);

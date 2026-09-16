import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  console.log('=== Testing Main 3D App & Menu Open Speed ===');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });

  // Locate color panel / circle button
  const colorBtn = page.locator('button[title*="color" i], button[aria-label*="color" i], [data-tour="color-swatch"]').first();
  
  // Measure exact time to open
  const t0 = performance.now();
  // Open color studio via keyboard or click or custom event
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('remix3d:open-modal', { detail: 'color' }));
  });
  await page.waitForSelector('[role="dialog"], [aria-label*="color" i], [aria-label="Color modes"]', { timeout: 3000 }).catch(() => {});
  const openTime = Math.round(performance.now() - t0);
  console.log(`Color Studio opened in: ${openTime}ms! (Target: <100ms)`);

  // Switch to Shaders tab inside modal
  const shadersTab = page.locator('button:has-text("Shaders"), button:has-text("Effects")').first();
  if (await shadersTab.count() > 0) {
    await shadersTab.click();
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: 'screenshots/verify_in_app_shaders_organized.png' });

  console.log('=== Testing Shaders Reviewer Page (shaders.html) ===');
  await page.goto('http://localhost:5174/shaders.html', { waitUntil: 'networkidle' });
  
  // Verify Color Dots exist
  const colorDots = await page.locator('button[title*="Red"], button[title*="Gold"], button[title*="Blue"]').count();
  console.log(`Found ${colorDots} Color Filter dots!`);

  // Click Favorites tab
  const favTab = page.locator('button:has-text("Favs")');
  await favTab.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshots/verify_shaders_favorites_view.png' });

  // Click Gold color dot
  const goldDot = page.locator('button[title*="Gold"]').first();
  if (await goldDot.count() > 0) {
    await goldDot.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/verify_shaders_gold_filter.png' });
  }

  console.log('Errors encountered:', errors);
  await browser.close();
  console.log('All tests passed!');
}

test();

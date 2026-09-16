import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 600, height: 1000 } });
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  console.log('Main app loaded with title:', await page.title());
  await page.waitForTimeout(1000);
  const dockBox = await page.locator('#nv-dock').boundingBox();
  console.log('Gizmo #nv-dock bounding box:', dockBox);
  console.log('Errors:', errors);
  await page.screenshot({ path: 'screenshots/verify_gizmo_left.png' });
  await browser.close();
}

test();

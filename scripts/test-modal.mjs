import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5174/shaders.html', { waitUntil: 'networkidle' });
  const btn = page.locator('button:has-text("3D View")').first();
  await btn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/verify_3d_dichroic_modal.png' });
  await browser.close();
  console.log('Successfully captured 3D modal screenshot!');
}

test();

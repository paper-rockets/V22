import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });

  // Click the Color button on the left toolbar
  const colorBtn = page.locator('button:has-text("Color")');
  console.log('Clicking Color button...');
  const t0 = performance.now();
  await colorBtn.click();
  await page.waitForTimeout(300);
  const openTime = Math.round(performance.now() - t0);
  console.log(`Menu opened in ${openTime}ms!`);

  // Switch to Shaders tab inside the modal
  const shadersTab = page.locator('button:has-text("Shaders"), button:has-text("Effects")');
  if (await shadersTab.count() > 0) {
    await shadersTab.first().click();
    await page.waitForTimeout(400);
  }

  await page.screenshot({ path: 'screenshots/verify_in_app_modal_open.png' });
  await browser.close();
  console.log('Done!');
}

test();

import { chromium } from 'playwright';
import fs from 'node:fs';

async function verify4k() {
  console.log('Testing 4K audit page and drawing functionality in Playwright...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 3840, height: 2160 },
    deviceScaleFactor: 1.0
  });

  const page = await context.newPage();
  await page.goto('http://localhost:3002/audit', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Check canvas 0
  const canvas0 = page.locator('#canvas-0');
  await canvas0.waitFor({ state: 'visible', timeout: 5000 });

  const box = await canvas0.boundingBox();
  console.log('Canvas 0 bounding box on 4K monitor:', box);

  if (box) {
    // Draw a stroke across the canvas
    const startX = box.x + box.width * 0.2;
    const startY = box.y + box.height * 0.2;
    const endX = box.x + box.width * 0.8;
    const endY = box.y + box.height * 0.8;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(startX + (endX - startX) * (i / 10), startY + (endY - startY) * (i / 10));
      await page.waitForTimeout(20);
    }
    await page.mouse.up();
    await page.waitForTimeout(400);

    // Verify drawing data exists
    const hasData = await page.evaluate(() => {
      const c = document.getElementById('canvas-0');
      const ctx = c.getContext('2d');
      const imgData = ctx.getImageData(0, 0, c.width, c.height).data;
      // Check if any pixel has non-zero alpha
      let nonZero = 0;
      for (let i = 3; i < imgData.length; i += 4) {
        if (imgData[i] > 0) nonZero++;
      }
      return { nonZeroPixels: nonZero, width: c.width, height: c.height };
    });

    console.log('Drawing verification result on canvas 0:', hasData);
  }

  // Save verification snapshot
  await page.screenshot({ path: 'screenshots/verify-4k-audit-view.png' });
  console.log('Saved 4K verification screenshot to screenshots/verify-4k-audit-view.png');

  await browser.close();
}

verify4k().catch(console.error);

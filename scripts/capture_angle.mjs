import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(2000);

  await page.locator('button[title="Demonstrations"]').click();
  await page.waitForTimeout(800);

  await page.locator('text=3D Contour Line Art').first().click();
  await page.waitForSelector('text=Step 4 of 4', { timeout: 10000 });

  // Wait 25 seconds for drawing
  await page.waitForTimeout(25000);

  // Orbit camera with mouse drag on canvas
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (box) {
    const startX = box.x + box.width * 0.5;
    const startY = box.y + box.height * 0.5;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 200, startY - 50, { steps: 15 });
    await page.mouse.up();
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'e:/X/AiStudio Workflow/V25/screenshots/feature_drawing_angle.png' });
  console.log('Captured feature_drawing_angle.png');

  await browser.close();
}

run().catch(console.error);

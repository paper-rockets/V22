import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5174/ ...');
  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(2000);

  console.log('Opening Demo Center...');
  await page.locator('button[title="Demonstrations"]').click();
  await page.waitForTimeout(800);

  console.log('Launching 3D Contour Line Art demo...');
  await page.locator('text=3D Contour Line Art').first().click();

  console.log('Waiting for Step 4...');
  await page.waitForSelector('text=Step 4 of 4', { timeout: 10000 });

  console.log('Waiting 15 seconds of live drawing...');
  await page.waitForTimeout(15000);

  await page.screenshot({ path: 'e:/X/AiStudio Workflow/V25/screenshots/feature_drawing_live.png' });
  console.log('Captured feature_drawing_live.png');

  await browser.close();
}

run().catch(console.error);

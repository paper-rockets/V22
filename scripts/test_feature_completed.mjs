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

  console.log('Monitoring drawing to completion...');
  for (let i = 0; i < 45; i++) {
    await page.waitForTimeout(1000);
    const bodyText = await page.locator('body').innerText();
    const match = bodyText.match(/Drawing stroke (\d+) of (\d+)/);
    if (match) {
      console.log(`Progress: stroke ${match[1]} / ${match[2]}`);
    } else if (bodyText.includes('Drawing Complete')) {
      console.log('Drawing Complete reached!');
      break;
    }
  }

  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'e:/X/AiStudio Workflow/V25/screenshots/feature_drawing_completed.png' });
  console.log('Captured feature_drawing_completed.png');

  await browser.close();
}

run().catch(console.error);

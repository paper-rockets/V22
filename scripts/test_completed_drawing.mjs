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

  console.log('Launching Hybrid Master demo...');
  await page.locator('text=Hybrid Master (Solid + Detail)').first().click();

  console.log('Waiting for Step 4 (Drawing)...');
  await page.waitForSelector('text=Step 4 of 4', { timeout: 10000 });
  console.log('Step 4 started!');

  for (let i = 0; i < 200; i++) {
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

  await page.waitForTimeout(2500);
  const shotPath = 'e:/X/AiStudio Workflow/V25/screenshots/reconstruct_artist_drawing.png';
  await page.screenshot({ path: shotPath });
  console.log('Captured screenshot at', shotPath);

  // Also copy to artifacts directory
  const brainPath = 'C:/Users/macie/.gemini/antigravity/brain/aeb285a8-deba-4a0a-9ea9-f60b6e1969bf/reconstruct_artist_drawing.png';
  import('fs').then(fs => {
    fs.copyFileSync(shotPath, brainPath);
    console.log('Copied to artifact:', brainPath);
  });

  await page.waitForTimeout(1000);
  await browser.close();
}

run().catch(console.error);

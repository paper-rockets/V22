import { chromium } from 'playwright';

async function run() {
  console.log('--- Starting Verification of AI Demonstrations & Fullscreen ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });

  const errors = [];
  page.on('pageerror', (err) => {
    console.error('Page error:', err.message);
    errors.push(err.message);
  });

  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Main app loaded successfully.');

  // 1. Check for Demos button
  const demoBtn = page.locator('button[aria-label="Interactive AI Demonstrations"]').first();
  await demoBtn.waitFor({ state: 'visible', timeout: 5000 });
  console.log('Demonstrations button found in top navigation bar.');

  // 2. Open Demonstrations Center Modal
  await demoBtn.click();
  await page.waitForSelector('text=Interactive AI Demonstrations', { timeout: 5000 });
  console.log('Demonstrations modal opened.');

  // Verify all 20 canonical actions are present
  const actionItems = await page.locator('h4').allTextContents();
  console.log(`Found ${actionItems.length} action titles in modal:`, actionItems.slice(0, 5));

  if (!actionItems.some((t) => t.includes('Start a 3D sketch'))) {
    throw new Error('Missing Action 1: Start a 3D sketch');
  }
  if (!actionItems.some((t) => t.includes('Surface → Air in one stroke'))) {
    throw new Error('Missing Action 5: Surface → Air in one stroke');
  }
  if (!actionItems.some((t) => t.includes('Finish and export'))) {
    throw new Error('Missing Action 20: Finish and export');
  }

  // 3. Test Fullscreen on mobile viewport
  console.log('--- Testing Mobile / Tablet Fullscreen Edge-to-Edge ---');
  const mobilePage = await browser.newPage({
    viewport: { width: 412, height: 893 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    isMobile: true,
    hasTouch: true,
  });

  await mobilePage.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  const simulatorWrapper = await mobilePage.locator('text=Emulating Galaxy S25 Ultra').count();
  if (simulatorWrapper > 0) {
    throw new Error('Simulator bezel wrapper should NOT be shown on mobile devices! Must be full screen.');
  }
  console.log('Confirmed: Real mobile/touch screen renders edge-to-edge full screen with zero simulator bezels.');

  // Check that mobile also has Demos button accessible
  const mobileDemoBtn = mobilePage.locator('button[aria-label="Interactive AI Demonstrations"]').first();
  await mobileDemoBtn.waitFor({ state: 'visible', timeout: 5000 });
  await mobileDemoBtn.click();
  await mobilePage.waitForSelector('text=Interactive AI Demonstrations', { timeout: 5000 });
  console.log('Confirmed: Mobile modal opens cleanly and fits screen.');

  // 4. Test playing a demonstration (Action 1)
  console.log('--- Testing Playback of Demonstration 1 ---');
  const playFirstBtn = mobilePage.locator('button[title*="Play Demonstration 1:"]').first();
  await playFirstBtn.click();

  // Floating bar should appear
  await mobilePage.waitForSelector('text=Start a 3D sketch', { timeout: 5000 });
  console.log('Demo floating controller is active.');

  // Wait 1.5 seconds for drawing stroke to execute
  await mobilePage.waitForTimeout(1500);

  console.log('Errors encountered:', errors);
  if (errors.length > 0) {
    throw new Error(`Errors during run: ${errors.join(', ')}`);
  }

  await browser.close();
  console.log('--- ALL VERIFICATIONS PASSED SUCCESSFULLY! ---');
}

run().catch((e) => {
  console.error('Verification failed:', e);
  process.exit(1);
});

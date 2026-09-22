import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const recordingsDir = path.join(rootDir, 'recordings');

const TARGET_CONFIGS = [
  {
    name: 'pc',
    deviceTarget: 'desktop',
    viewport: { width: 1280, height: 720 },
    hasTouch: false,
    isMobile: false,
    outputDir: path.join(recordingsDir, 'pc'),
  },
  {
    name: 'tablet',
    deviceTarget: 'tablet',
    viewport: { width: 1200, height: 800 },
    hasTouch: true,
    isMobile: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    outputDir: path.join(recordingsDir, 'tablet'),
  },
];

async function recordSingleAction(browser, targetConfig, demoInfo) {
  const tempDir = path.join(targetConfig.outputDir, '_temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const context = await browser.newContext({
    viewport: targetConfig.viewport,
    recordVideo: {
      dir: tempDir,
      size: targetConfig.viewport,
    },
    hasTouch: targetConfig.hasTouch,
    isMobile: targetConfig.isMobile,
    userAgent: targetConfig.userAgent,
  });

  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait until Remix 3D Studio engine & demo runner are initialized
    await page.waitForFunction(() => typeof window.__REMIX_PLAY_DEMO__ === 'function', {
      timeout: 15000,
    });

    // Small pause to settle initial frame
    await page.waitForTimeout(400);

    // Play the requested demo scene
    await page.evaluate(
      async ({ id, target }) => {
        await window.__REMIX_PLAY_DEMO__(id, target);
      },
      { id: demoInfo.id, target: targetConfig.deviceTarget }
    );

    // Settle end frame
    await page.waitForTimeout(700);

    // Retrieve video instance before closing
    const video = page.video();
    await page.close();
    await context.close();

    if (video) {
      const tempPath = await video.path();
      const numStr = String(demoInfo.number).padStart(2, '0');
      const cleanName = `action_${numStr}_${demoInfo.id.replace(/^[0-9]+_/, '')}.webm`;
      const finalPath = path.join(targetConfig.outputDir, cleanName);

      if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
      fs.renameSync(tempPath, finalPath);

      const stats = fs.statSync(finalPath);
      const kb = Math.round(stats.size / 1024);
      console.log(`  [${targetConfig.name.toUpperCase()}] Saved: ${cleanName} (${kb} KB)`);
      return { success: true, path: finalPath, sizeKb: kb };
    }
  } catch (err) {
    console.error(`  [${targetConfig.name.toUpperCase()}] Error recording ${demoInfo.id}:`, err.message);
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('====================================================');
  console.log('BATCH RECORDING: 20 Canonical Actions for PC & Tablet');
  console.log('====================================================\n');

  // Ensure output directories exist
  for (const t of TARGET_CONFIGS) {
    if (!fs.existsSync(t.outputDir)) fs.mkdirSync(t.outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  // Get demo list from app
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForFunction(() => Array.isArray(window.__REMIX_ALL_DEMOS__), { timeout: 15000 });

  const allDemos = await page.evaluate(() => {
    return window.__REMIX_ALL_DEMOS__.map((d) => ({
      id: d.id,
      number: d.number,
      title: d.title,
    }));
  });
  await page.close();

  console.log(`Loaded ${allDemos.length} demonstrations to record:`);
  allDemos.forEach((d) => console.log(`  #${d.number}: ${d.title} (${d.id})`));
  console.log('\n----------------------------------------------------\n');

  const results = { pc: [], tablet: [] };

  for (const target of TARGET_CONFIGS) {
    console.log(`>>> RECORDING SET: ${target.name.toUpperCase()} (${target.viewport.width}x${target.viewport.height}) <<<`);
    for (let i = 0; i < allDemos.length; i++) {
      const demo = allDemos[i];
      console.log(`[${i + 1}/${allDemos.length}] Recording #${demo.number}: ${demo.title}...`);
      const res = await recordSingleAction(browser, target, demo);
      results[target.name].push({ demo, ...res });
    }
    console.log(`Finished recording set for ${target.name.toUpperCase()}.\n`);
  }

  await browser.close();

  // Clean up any remaining _temp dirs
  for (const t of TARGET_CONFIGS) {
    const tempDir = path.join(t.outputDir, '_temp');
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (_) {}
    }
  }

  console.log('====================================================');
  console.log('RECORDING SUMMARY');
  console.log('====================================================');
  for (const target of TARGET_CONFIGS) {
    const recorded = results[target.name].filter((r) => r.success);
    console.log(`- ${target.name.toUpperCase()}: ${recorded.length} / ${allDemos.length} videos recorded successfully in:`);
    console.log(`  ${target.outputDir}`);
  }
  console.log('\nAll done!');
}

main().catch((err) => {
  console.error('Fatal batch recording error:', err);
  process.exit(1);
});

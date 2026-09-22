import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'recordings', 'tablet');

const MISSING_ACTIONS = [
  { id: '16_organize_layers', number: 16, title: 'Organize with layers' },
  { id: '19_camera_presentation', number: 19, title: 'Change camera presentation' },
  { id: '20_finish_and_export', number: 20, title: 'Finish and export' },
];

async function main() {
  console.log('Recording missing Tablet demonstrations: 16, 19, 20...');
  const tempDir = path.join(outputDir, '_temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  for (const demo of MISSING_ACTIONS) {
    console.log(`Recording Tablet #${demo.number}: ${demo.title}...`);
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      recordVideo: {
        dir: tempDir,
        size: { width: 1200, height: 800 },
      },
      hasTouch: true,
      isMobile: true,
      userAgent:
        'Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();
    try {
      await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => typeof window.__REMIX_PLAY_DEMO__ === 'function', {
        timeout: 15000,
      });

      await page.waitForTimeout(400);

      await page.evaluate(
        async ({ id }) => {
          await window.__REMIX_PLAY_DEMO__(id, 'tablet');
        },
        { id: demo.id }
      );

      await page.waitForTimeout(700);

      const video = page.video();
      await page.close();
      await context.close();

      if (video) {
        const tempPath = await video.path();
        const numStr = String(demo.number).padStart(2, '0');
        const cleanName = `action_${numStr}_${demo.id.replace(/^[0-9]+_/, '')}.webm`;
        const finalPath = path.join(outputDir, cleanName);

        if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
        fs.renameSync(tempPath, finalPath);

        const stats = fs.statSync(finalPath);
        console.log(`  Saved: ${cleanName} (${Math.round(stats.size / 1024)} KB)`);
      }
    } catch (err) {
      console.error(`  Error on #${demo.number}:`, err.message);
      await page.close().catch(() => {});
      await context.close().catch(() => {});
    }
  }

  await browser.close();

  if (fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }

  console.log('Finished missing Tablet recordings!');
}

main().catch(console.error);

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const iconsDir = path.join(rootDir, 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const svgPath = path.join(iconsDir, 'icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

async function generate() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. Standard full icon HTML template
  const standardHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: transparent; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          svg { width: 100%; height: 100%; display: block; }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;

  // 2. Maskable icon HTML template (padded safe zone, full bleed background)
  const maskableHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #0c0e14; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          .icon-wrap { width: 80%; height: 80%; display: flex; align-items: center; justify-content: center; }
          svg { width: 100%; height: 100%; display: block; }
        </style>
      </head>
      <body>
        <div class="icon-wrap">
          ${svgContent}
        </div>
      </body>
    </html>
  `;

  // Render 512x512 standard
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(standardHtml);
  await page.screenshot({ path: path.join(iconsDir, 'icon-512.png'), omitBackground: false });
  console.log('Generated icon-512.png');

  // Render 192x192 standard
  await page.setViewportSize({ width: 192, height: 192 });
  await page.setContent(standardHtml);
  await page.screenshot({ path: path.join(iconsDir, 'icon-192.png'), omitBackground: false });
  console.log('Generated icon-192.png');

  // Render 512x512 maskable
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(maskableHtml);
  await page.screenshot({ path: path.join(iconsDir, 'icon-maskable-512.png'), omitBackground: false });
  console.log('Generated icon-maskable-512.png');

  // Render 192x192 maskable
  await page.setViewportSize({ width: 192, height: 192 });
  await page.setContent(maskableHtml);
  await page.screenshot({ path: path.join(iconsDir, 'icon-maskable-192.png'), omitBackground: false });
  console.log('Generated icon-maskable-192.png');

  // Render favicon 32x32
  await page.setViewportSize({ width: 32, height: 32 });
  await page.setContent(standardHtml);
  await page.screenshot({ path: path.join(rootDir, 'public', 'favicon.png'), omitBackground: true });
  console.log('Generated favicon.png');

  await browser.close();
  console.log('All PWA icon assets generated successfully!');
}

generate().catch((err) => {
  console.error('Failed to generate PWA icons:', err);
  process.exit(1);
});

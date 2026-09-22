#!/usr/bin/env node
/**
 * Renders the comparison page to PNGs at full resolution.
 *
 * The in-app browser screenshots come back around 800px wide for a two-pane
 * comparison, which is about 400px per model - far too coarse to judge stroke
 * quality. This drives the same page with Playwright at whatever size is asked
 * for and writes the frames to disk, optionally from several angles.
 *
 * Usage:
 *   node scripts/deconstruct3d/shoot.mjs --data /demos/draw-house.json \
 *        --model /models/dutch_house.glb --out shots --size 1400 --angles 4
 */

import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

function parseArgs(argv) {
  const args = {
    data: '/demos/drawing.json', model: null, out: 'scripts/deconstruct3d/.shots',
    size: 1400, angles: 1, port: 5025, pane: 'both', pass: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '');
    if (key === 'help') { console.log('see header'); process.exit(0); }
    args[key] = argv[++i];
  }
  args.size = Number(args.size);
  args.angles = Number(args.angles);
  return args;
}

const args = parseArgs(process.argv);
const url = `http://localhost:${args.port}/demos/preview.html?data=${args.data}${args.model ? `&model=${args.model}` : ''}`;
fs.mkdirSync(args.out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: args.pane === 'both' ? args.size * 2 : args.size, height: args.size },
  deviceScaleFactor: 1,
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('requestfailed', (r) => errors.push(`failed: ${r.url()}`));
await page.goto(url, { waitUntil: 'load' });
try {
  await page.waitForFunction(() => window.__dbg && window.__dbg.strokes && window.__dbg.strokes.length > 0, { timeout: 45000 });
} catch {
  const state = await page.evaluate(() => ({
    hasDbg: !!window.__dbg,
    strokes: window.__dbg ? (window.__dbg.strokes || []).length : -1,
    err: document.getElementById('err')?.textContent || '',
  }));
  console.error('page never finished loading strokes:', JSON.stringify(state), errors.slice(0, 5));
  await browser.close();
  process.exit(1);
}

await page.evaluate(({ pane, pass }) => {
  document.getElementById('bar').style.display = 'none';
  if (pane === 'drawing') {
    document.getElementById('stage').style.gridTemplateColumns = '1fr';
    document.getElementById('left').style.display = 'none';
  } else if (pane === 'model') {
    document.getElementById('stage').style.gridTemplateColumns = '1fr';
    document.getElementById('right').style.display = 'none';
  }
  if (pass) {
    for (const b of document.querySelectorAll('#passes button')) {
      const wanted = pass.split(',').some((n) => b.textContent.startsWith(n));
      if (b.classList.contains('off') === wanted) b.click();
    }
  }
  window.dispatchEvent(new Event('resize'));
}, { pane: args.pane, pass: args.pass });

await page.waitForTimeout(600);

const written = [];
for (let i = 0; i < args.angles; i++) {
  await page.evaluate((radians) => window.__dbg.orbit(radians), i === 0 ? 0 : (Math.PI * 2) / args.angles);
  await page.waitForTimeout(250);
  const file = path.join(args.out, `shot_${String(i).padStart(2, '0')}.png`);
  await page.screenshot({ path: file });
  written.push(file);
}

const score = await page.evaluate(() => (window.__dbg.score ? window.__dbg.score() : null));
await browser.close();

console.log(JSON.stringify({ written, score, errors }, null, 2));

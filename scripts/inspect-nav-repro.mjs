import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';

await mkdir('artifacts/nav-repro', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1605, height: 1003 } });
  page.setDefaultTimeout(90000);
  await page.addInitScript(() => {
    localStorage.setItem('remix3d.hasOnboarded', 'true');
    localStorage.setItem('mody_theme', 'light');
  });
  await page.goto('http://127.0.0.1:4175/', { waitUntil: 'commit' });
  await page.getByRole('button', { name: 'Draw', exact: true }).click();
  const swatch = page.locator('.paperrocket-color-swatch').first();
  console.log('Swatch cascade:', JSON.stringify(await swatch.evaluate((button) => {
    const rules = [];
    const walk = (list) => {
      for (const rule of list) {
        if (rule.cssRules) walk(rule.cssRules);
        if (rule.selectorText && rule.style?.borderRadius && button.matches(rule.selectorText)) rules.push({ selector: rule.selectorText, radius: rule.style.borderRadius, priority: rule.style.getPropertyPriority('border-radius') });
      }
    };
    for (const sheet of document.styleSheets) { try { walk(sheet.cssRules); } catch {} }
    return { computed: getComputedStyle(button).borderRadius, parents: Array.from((function* () { let p = button; while(p) { yield p.className; p = p.parentElement; } })()), rules };
  }), null, 2));
  await page.getByRole('button', { name: 'Draw', exact: true }).click();
  await page.getByRole('button', { name: 'Color', exact: true }).click();
  await page.getByRole('button', { name: 'Keep color studio open', exact: true }).click();
  await page.getByRole('button', { name: 'Collapse to mini strip', exact: true }).click();
  await page.getByRole('button', { name: 'Expand full color wheel', exact: true }).click();
  await page.screenshot({ path: 'artifacts/nav-repro/current-expanded.png' });
  console.log('Expanded color state:', JSON.stringify(await page.evaluate(() => ({
    canvases: Array.from(document.querySelectorAll('[aria-label="Color studio"] canvas')).map((canvas) => ({ width: canvas.width, height: canvas.height, rect: canvas.getBoundingClientRect().toJSON() })),
    navCount: document.querySelectorAll('#nv, .jn-wrap').length,
    tools: document.querySelectorAll('.paperrocket-studio-mode').length,
  }))));
  await page.close();
  for (const [index, file] of ['C:/Users/macie/Videos/Screen Recordings/Screen Recording 2026-09-15 012537.mp4', 'C:/Users/macie/Videos/Screen Recordings/Screen Recording 2026-09-15 005615.mp4'].entries()) {
    const videoPage = await browser.newPage({ viewport: { width: 1605, height: 1003 } });
    const data = (await readFile(file)).toString('base64');
    await videoPage.setContent(`<video id="recording" muted preload="auto" style="width:100%;height:100vh;object-fit:contain" src="data:video/mp4;base64,${data}"></video>`);
    await videoPage.waitForFunction(() => document.querySelector('video').readyState >= 2);
    const duration = await videoPage.evaluate(() => document.querySelector('video').duration);
    console.log('Recording', index, 'duration', duration);
    for (let i = 0; i < 6; i++) {
      await videoPage.evaluate(async (seconds) => {
        const video = document.querySelector('video');
        await new Promise((resolve) => { video.addEventListener('seeked', resolve, { once: true }); video.currentTime = seconds; });
      }, Math.max(0.05, duration * i / 6));
      await videoPage.screenshot({ path: `artifacts/nav-repro/recording-${index}-${i}.png` });
    }
    await videoPage.close();
  }
} finally { await browser.close(); }

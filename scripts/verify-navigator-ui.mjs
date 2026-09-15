import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = 'artifacts/navigator-ui';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
try {
  for (const viewport of [{ width: 1605, height: 1003 }, { width: 768, height: 1024 }]) {
    const page = await browser.newPage({ viewport });
    page.setDefaultTimeout(90000);
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('remix3d.hasOnboarded', 'true');
      localStorage.setItem('mody_theme', 'light');
      localStorage.setItem('paperrocket_nav_style', 'sphere');
      localStorage.setItem('paperrocket_show_navigator', 'true');
      localStorage.setItem('mody_active_controller', 'navigator');
    });
    await page.goto(process.env.STUDIO_URL || 'http://127.0.0.1:4175/', { waitUntil: 'commit' });
    await page.getByRole('button', { name: 'View controls menu', exact: true }).waitFor();
    for (const style of (process.env.STUDIO_TEST_FOCUS === 'color' ? ['Sphere'] : ['Sphere', 'Disc', 'Petal', 'Collar'])) {
      await page.getByRole('button', { name: 'Settings and more', exact: true }).click();
      await page.getByRole('button', { name: style, exact: true }).click();
      assert.equal(await page.locator('#nv:visible, .jn-wrap:visible').count(), 0, 'Top menu must hide navigator');
      await page.getByRole('button', { name: 'Close more actions', exact: true }).click();
      const settingsTrigger = page.getByRole('button', { name: 'View controls menu', exact: true });
      await settingsTrigger.waitFor();
      assert.ok((await settingsTrigger.boundingBox()).height <= 30, 'Navigator chrome must stay compact');
      await settingsTrigger.click();
      const menu = page.locator('.navigator-settings-surface:visible');
      await menu.getByLabel('Layer to move and rotate').waitFor();
      const box = await menu.boundingBox();
      assert.ok(box.y >= 10 && box.y + box.height <= viewport.height - 10, `Menu clipped: ${JSON.stringify(box)}`);
      const art = style === 'Sphere' ? page.locator('.nv-canvas') : page.locator('.jsk').first();
      assert.equal(await art.isVisible(), false, 'Navigator settings must hide artwork');
      if (style === 'Sphere') {
        await menu.getByRole('button', { name: /Advanced settings/ }).click();
        await page.waitForFunction(() => {
          const box = document.querySelector('#nv-menu')?.getBoundingClientRect();
          return box && box.top >= 10 && box.bottom <= window.innerHeight - 10;
        });
        const advancedBox = await menu.boundingBox();
        assert.ok(advancedBox.y >= 10 && advancedBox.y + advancedBox.height <= viewport.height - 10, 'Advanced menu clipped');
      }
      await page.screenshot({ path: `${output}/${viewport.width}-${style.toLowerCase()}-settings.png` });
      await menu.getByRole('button', { name: 'Close view controls menu', exact: true }).click();
      await page.getByRole('button', { name: 'Draw', exact: true }).click();
      assert.equal(await page.locator('#nv:visible, .jn-wrap:visible').count(), 0, 'Draw panel must hide navigator');
      const radius = await page.locator('.paperrocket-color-swatch').first().evaluate((button) => getComputedStyle(button).borderRadius);
      assert.equal(radius, '9999px', 'Draw swatches must remain round despite panel overrides');
      await page.screenshot({ path: `${output}/${viewport.width}-${style.toLowerCase()}-draw.png` });
      await page.getByRole('button', { name: 'Draw', exact: true }).click();
      await settingsTrigger.waitFor();
    }
    await page.getByRole('button', { name: 'Color', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Draw', exact: true }).isVisible(), true, 'Full unpinned picker must retain the tool rail');
    assert.equal(await page.locator('.paperrocket-studio-quick-group').isVisible(), true, 'Full unpinned picker must retain the bottom dock');
    assert.equal(await page.locator('#nv:visible, .jn-wrap:visible').count(), 0, 'Full unpinned picker must hide navigator');
    await page.screenshot({ path: `${output}/${viewport.width}-full-unpinned-color.png` });
    await page.getByRole('button', { name: 'Keep color studio open', exact: true }).click();
    assert.equal(await page.locator('#nv:visible, .jn-wrap:visible').count(), 0, 'Pinned color picker must hide navigator');
    await page.getByRole('button', { name: 'Collapse to mini strip', exact: true }).click();
    assert.equal(await page.locator('#nv:visible, .jn-wrap:visible').count(), 0, 'Mini color picker must hide navigator');
    await page.getByRole('button', { name: 'Expand full color wheel', exact: true }).click();
    const wheel = page.locator('[aria-label="Color studio"] canvas');
    await wheel.waitFor();
    const wheelPaint = await wheel.evaluate((canvas) => ({ width: canvas.width, height: canvas.height, alpha: canvas.getContext('2d').getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data[3] }));
    assert.equal(wheelPaint.width, wheelPaint.height, 'Expanded wheel must be initialized');
    assert.equal(wheelPaint.alpha, 255, 'Expanded wheel must be painted');
    const historyBefore = await page.evaluate(() => localStorage.getItem('remix3d.colorStudioLastUsed'));
    const wheelBox = await wheel.boundingBox();
    await page.mouse.move(wheelBox.x + wheelBox.width / 2, wheelBox.y + wheelBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(wheelBox.x + wheelBox.width * 0.65, wheelBox.y + wheelBox.height * 0.35, { steps: 12 });
    const handlePixel = await wheel.evaluate((canvas) => Array.from(canvas.getContext('2d').getImageData(Math.round(canvas.width * 0.65), Math.round(canvas.height * 0.35), 1, 1).data));
    assert.ok(handlePixel.slice(0, 3).every((channel) => channel > 245), 'The white handle must track the pointer');
    assert.equal(await page.evaluate(() => localStorage.getItem('remix3d.colorStudioLastUsed')), historyBefore, 'Dragging must not commit intermediate colors');
    await page.mouse.up();
    assert.notEqual(await page.evaluate(() => localStorage.getItem('remix3d.colorStudioLastUsed')), historyBefore, 'Release must commit the final color');
    assert.equal(await page.getByRole('button', { name: 'Draw', exact: true }).isVisible(), true, 'Pinned picker must retain tools');
    await page.screenshot({ path: `${output}/${viewport.width}-expanded-color.png` });
    await page.getByRole('button', { name: 'Close color studio', exact: true }).click();
    await page.getByRole('button', { name: 'View controls menu', exact: true }).waitFor();
    await page.close();
  }
  assert.deepEqual(errors, [], 'Runtime errors');
  console.log('Navigator variants, clipping, compact controls and menu occlusion passed on desktop and portrait.');
} finally {
  await browser.close();
}

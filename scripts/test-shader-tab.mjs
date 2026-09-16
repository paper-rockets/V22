import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  // Set viewport to tablet size (Samsung S6 Lite landscape ~1200x800)
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });

  // Click Color button
  await page.locator('button:has-text("Color")').click();
  await page.waitForTimeout(300);

  // Click Shader tab
  const shaderTab = page.locator('button:has-text("Shader")').last();
  console.log('Clicking Shader tab...');
  const t0 = performance.now();
  await shaderTab.click();
  await page.waitForTimeout(300);
  console.log(`Shader tab rendered in: ${Math.round(performance.now() - t0)}ms!`);

  // Screenshot default (Favs)
  await page.screenshot({ path: 'screenshots/verify_tabs_favs.png' });

  // Click Kids & Play-Doh
  await page.locator('button:has-text("Kids & Play-Doh")').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'screenshots/verify_kids_playdoh.png' });

  // Click Animated
  await page.locator('button:has-text("Animated")').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'screenshots/verify_animated.png' });

  // Click Glass
  await page.locator('button:has-text("Glass")').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'screenshots/verify_glass.png' });

  // Click Stars & Galaxy
  await page.locator('button:has-text("Stars & Galaxy")').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'screenshots/verify_stars_galaxy.png' });

  // Click Candy
  await page.locator('button:has-text("Candy")').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'screenshots/verify_candy.png' });

  // Select a preset and verify header star button
  const firstPreset = page.locator('button[title="Bubblegum Gloss"], button[title*="Candy"], button[title*="Gummy"]').first();
  if (await firstPreset.isVisible()) {
    await firstPreset.click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'screenshots/verify_selected_header_star.png' });
  }

  await browser.close();
  console.log('All tests completed successfully!');
}

test().catch(console.error);

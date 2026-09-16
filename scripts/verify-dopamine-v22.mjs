import { chromium } from 'playwright';
import * as path from 'path';

const ARTIFACT_DIR = 'C:/Users/macie/.gemini/antigravity/brain/47d89e20-ae67-49aa-bfd4-cf4fdd5ff277';

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  // 1. Tablet Landscape test (Samsung S6 Lite: 1200x800)
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button:has-text("Color")');

  // Open Color Studio
  await page.locator('button:has-text("Color")').click();
  await page.waitForTimeout(300);

  // Switch to Shader tab
  await page.locator('button:has-text("Shader")').last().click();
  await page.waitForTimeout(400);

  // 1. Check Header Star button count (MUST BE 0)
  const headerStarCount = await page.locator('button:has-text("Starred"), button:has-text("Star")').count();
  console.log('Header Star button count (must be 0):', headerStarCount);

  // 2. Check Color dots count (MUST BE 0)
  const colorDotsCount = await page.locator('button[title="Iridescent / Rainbow"]').count();
  console.log('Color dots count (must be 0):', colorDotsCount);

  // 3. Screenshot default Dopamine tab
  const dopaminePath = path.join(ARTIFACT_DIR, 'verify_minimal_dopamine.png');
  await page.screenshot({ path: dopaminePath });
  console.log('Saved dopamine tab screenshot to', dopaminePath);

  // 4. Click Bubblegum Gloss to verify full name in header
  const bubblegumBtn = page.locator('button[title*="Bubblegum Gloss"]').first();
  if (await bubblegumBtn.isVisible()) {
    await bubblegumBtn.click();
    await page.waitForTimeout(300);
  }
  const headerTitle = await page.locator('h2').innerText();
  console.log('Active Header Title:', headerTitle);

  // 5. Take screenshot of Kids & Play-Doh - VERIFY ACTUAL PLAY-DOH & ZERO SKIN TONES
  await page.locator('button:has-text("Kids & Play-Doh")').click();
  await page.waitForTimeout(400);
  const skinCount = await page.locator('button:has-text("Skin")').count();
  console.log('Skin count in Kids tab (must be 0):', skinCount);

  const playdohCardCount = await page.locator('button[title*="Play-Doh"]').count();
  console.log('Total Play-Doh shaders found in Kids tab:', playdohCardCount);

  // Take screenshot of overall Play-Doh collection in Kids tab
  const kidsCollectionPath = path.join(ARTIFACT_DIR, 'verify_playdoh_collection.png');
  await page.screenshot({ path: kidsCollectionPath });
  console.log('Saved Play-Doh collection screenshot to', kidsCollectionPath);

  // Click Glossy Rainbow Play-Doh
  const glossyBtn = page.locator('button[title*="Glossy Rainbow Play-Doh"]').first();
  if (await glossyBtn.isVisible()) {
    await glossyBtn.click();
    await page.waitForTimeout(300);
    const glossyPath = path.join(ARTIFACT_DIR, 'verify_playdoh_glossy_active.png');
    await page.screenshot({ path: glossyPath });
    console.log('Saved glossy Play-Doh screenshot to', glossyPath);
  }

  // Click Metallic Gold Play-Doh
  const metallicBtn = page.locator('button[title*="Metallic Gold Play-Doh"]').first();
  if (await metallicBtn.isVisible()) {
    await metallicBtn.click();
    await page.waitForTimeout(300);
    const metalPath = path.join(ARTIFACT_DIR, 'verify_playdoh_metallic_active.png');
    await page.screenshot({ path: metalPath });
    console.log('Saved metallic Play-Doh screenshot to', metalPath);

    // Close modal and draw a 3D curve on canvas
    const closeBtn = page.locator('header button[aria-label="Close modal"], header button:has(svg.lucide-x)').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    } else {
      await page.mouse.click(100, 100);
      await page.waitForTimeout(300);
    }

    // Drag to draw 3D stroke
    await page.mouse.move(550, 300);
    await page.mouse.down();
    await page.mouse.move(650, 350, { steps: 10 });
    await page.mouse.move(750, 420, { steps: 10 });
    await page.mouse.move(850, 380, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(400);

    const strokeCanvasPath = path.join(ARTIFACT_DIR, 'verify_3d_stroke_playdoh.png');
    await page.screenshot({ path: strokeCanvasPath });
    console.log('Saved 3D canvas stroke screenshot to', strokeCanvasPath);
  }

  // 6. Test search bar
  await page.locator('button:has-text("All (")').click();
  await page.waitForTimeout(300);
  const searchInput = page.locator('input[placeholder*="Search shaders"]');
  await searchInput.fill('candy');
  await page.waitForTimeout(300);
  const searchPath = path.join(ARTIFACT_DIR, 'verify_minimal_search.png');
  await page.screenshot({ path: searchPath });
  console.log('Saved search screenshot to', searchPath);
  await searchInput.fill('');
  await page.waitForTimeout(200);

  // 2. Tablet Portrait test (Samsung S6 Lite portrait: 800x1200)
  const portraitPage = await browser.newPage({ viewport: { width: 800, height: 1200 } });
  await portraitPage.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await portraitPage.waitForSelector('button:has-text("Color")');
  await portraitPage.locator('button:has-text("Color")').click();
  await portraitPage.waitForTimeout(300);
  await portraitPage.locator('button:has-text("Shader")').last().click();
  await portraitPage.waitForTimeout(300);

  // Click Kids & Play-Doh in portrait
  await portraitPage.locator('button:has-text("Kids & Play-Doh")').click();
  await portraitPage.waitForTimeout(300);

  const portraitPath = path.join(ARTIFACT_DIR, 'verify_tablet_portrait_v2.png');
  await portraitPage.screenshot({ path: portraitPath });
  console.log('Saved tablet portrait v2 screenshot to', portraitPath);

  await browser.close();
  console.log('All browser verifications finished successfully!');
}

main().catch((err) => {
  console.error('Error running test:', err);
  process.exit(1);
});

import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const ROOT_DIR = 'E:/X/AiStudio Workflow/V20';
const ALL_DIR = path.join(ROOT_DIR, 'ALL_SCREENSHOTS');
const FLAT_DIR = path.join(ALL_DIR, 'ALL_SCREENSHOTS_FLAT');
const S25_DEST = path.join(ALL_DIR, '1_Galaxy_S25_Ultra');
const PORT_DEST = path.join(ALL_DIR, '2_Galaxy_Tab_S6_Lite_Portrait');
const LAND_DEST = path.join(ALL_DIR, '3_Galaxy_Tab_S6_Lite_Landscape');

const S25_SRC = path.join(ROOT_DIR, 'screenshots/s25ultra-audit');
const PORT_SRC = path.join(ROOT_DIR, 'screenshots/s6lite-audit/portrait');
const LAND_SRC = path.join(ROOT_DIR, 'screenshots/s6lite-audit/landscape');

fs.mkdirSync(ALL_DIR, { recursive: true });
fs.mkdirSync(FLAT_DIR, { recursive: true });
fs.mkdirSync(S25_DEST, { recursive: true });
fs.mkdirSync(PORT_DEST, { recursive: true });
fs.mkdirSync(LAND_DEST, { recursive: true });

// 1. Ensure Landscape Manifest includes the 4 extra Color Studio screenshots
const landManifestPath = path.join(LAND_SRC, 'manifest.json');
let landManifest = [];
if (fs.existsSync(landManifestPath)) {
  landManifest = JSON.parse(fs.readFileSync(landManifestPath, 'utf8'));
}
const landMap = new Map(landManifest.map((item) => [item.filename, item]));

const extraLandscape = [
  {
    filename: '33-dark-color-studio-tab-wheel.png',
    description: 'Color Studio HSV Wheel & Lightness Sliders in Landscape',
    category: 'Color Studio',
    theme: 'Dark',
  },
  {
    filename: '34-dark-color-studio-tab-oklch-polar.png',
    description: 'Color Studio OKLCh Polar Perception Sliders in Landscape',
    category: 'Color Studio',
    theme: 'Dark',
  },
  {
    filename: '35-dark-color-studio-oklch-posterize-steps.png',
    description: 'Color Studio OKLCh Posterize Steps & Quantization in Landscape',
    category: 'Color Studio',
    theme: 'Dark',
  },
  {
    filename: '79-light-color-studio-harmonies.png',
    description: 'Color Studio Curated Harmonies & Palettes in Light Theme (Landscape)',
    category: 'Color Studio',
    theme: 'Light',
  },
];

for (const extra of extraLandscape) {
  if (!landMap.has(extra.filename)) {
    const fullPath = path.join(LAND_SRC, extra.filename);
    if (fs.existsSync(fullPath)) {
      const st = fs.statSync(fullPath);
      landManifest.push({
        filename: extra.filename,
        description: extra.description,
        category: extra.category,
        theme: extra.theme,
        path: fullPath,
        sizeBytes: st.size,
        resolution: '2000 × 1200 px',
        aspectRatio: '5 : 3 (Landscape)',
      });
    }
  }
}
landManifest.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));
fs.writeFileSync(landManifestPath, JSON.stringify(landManifest, null, 2));

// Load all 3 manifests
const s25Manifest = JSON.parse(fs.readFileSync(path.join(S25_SRC, 'manifest.json'), 'utf8'));
const portManifest = JSON.parse(fs.readFileSync(path.join(PORT_SRC, 'manifest.json'), 'utf8'));

console.log(`Loaded ${s25Manifest.length} S25 Ultra screenshots`);
console.log(`Loaded ${portManifest.length} Tab S6 Lite Portrait screenshots`);
console.log(`Loaded ${landManifest.length} Tab S6 Lite Landscape screenshots`);

const allEntries = [];
let overallIndex = 1;

// Process S25 Ultra
for (const item of s25Manifest) {
  const srcFile = path.join(S25_SRC, item.filename);
  if (!fs.existsSync(srcFile)) continue;

  const destSubfolder = path.join(S25_DEST, item.filename);
  fs.copyFileSync(srcFile, destSubfolder);

  const cleanName = `${String(overallIndex).padStart(3, '0')}_S25-Ultra_${item.filename}`;
  const destFlat = path.join(FLAT_DIR, cleanName);
  fs.copyFileSync(srcFile, destFlat);

  allEntries.push({
    num: overallIndex,
    device: 'Galaxy S25 Ultra',
    deviceSlug: 's25ultra',
    orientation: 'Portrait',
    resolution: '1440 × 3120',
    theme: 'Dark',
    category: item.category || 'General',
    description: item.description,
    originalFilename: item.filename,
    flatFilename: cleanName,
    relPathSub: `1_Galaxy_S25_Ultra/${item.filename}`,
    relPathFlat: `ALL_SCREENSHOTS_FLAT/${cleanName}`,
    sizeBytes: fs.statSync(srcFile).size,
  });
  overallIndex++;
}

// Process Tab S6 Lite Portrait
for (const item of portManifest) {
  const srcFile = path.join(PORT_SRC, item.filename);
  if (!fs.existsSync(srcFile)) continue;

  const destSubfolder = path.join(PORT_DEST, item.filename);
  fs.copyFileSync(srcFile, destSubfolder);

  const isDark = item.filename.startsWith('dark') || item.filename.includes('dark');
  const theme = isDark ? 'Dark' : 'Light';
  const cleanName = `${String(overallIndex).padStart(3, '0')}_TabS6Lite-Portrait_${theme}_${item.filename}`;
  const destFlat = path.join(FLAT_DIR, cleanName);
  fs.copyFileSync(srcFile, destFlat);

  allEntries.push({
    num: overallIndex,
    device: 'Galaxy Tab S6 Lite',
    deviceSlug: 's6lite-portrait',
    orientation: 'Portrait',
    resolution: '1200 × 2000',
    theme,
    category: item.category || 'General',
    description: item.description,
    originalFilename: item.filename,
    flatFilename: cleanName,
    relPathSub: `2_Galaxy_Tab_S6_Lite_Portrait/${item.filename}`,
    relPathFlat: `ALL_SCREENSHOTS_FLAT/${cleanName}`,
    sizeBytes: fs.statSync(srcFile).size,
  });
  overallIndex++;
}

// Process Tab S6 Lite Landscape
for (const item of landManifest) {
  const srcFile = path.join(LAND_SRC, item.filename);
  if (!fs.existsSync(srcFile)) continue;

  const destSubfolder = path.join(LAND_DEST, item.filename);
  fs.copyFileSync(srcFile, destSubfolder);

  const isDark = !item.filename.includes('light');
  const theme = isDark ? 'Dark' : 'Light';
  const cleanName = `${String(overallIndex).padStart(3, '0')}_TabS6Lite-Landscape_${theme}_${item.filename}`;
  const destFlat = path.join(FLAT_DIR, cleanName);
  fs.copyFileSync(srcFile, destFlat);

  allEntries.push({
    num: overallIndex,
    device: 'Galaxy Tab S6 Lite',
    deviceSlug: 's6lite-landscape',
    orientation: 'Landscape',
    resolution: '2000 × 1200',
    theme,
    category: item.category || 'General',
    description: item.description,
    originalFilename: item.filename,
    flatFilename: cleanName,
    relPathSub: `3_Galaxy_Tab_S6_Lite_Landscape/${item.filename}`,
    relPathFlat: `ALL_SCREENSHOTS_FLAT/${cleanName}`,
    sizeBytes: fs.statSync(srcFile).size,
  });
  overallIndex++;
}

console.log(`Total consolidated screenshots: ${allEntries.length}`);

// Write JSON manifest in ALL_SCREENSHOTS
fs.writeFileSync(path.join(ALL_DIR, 'ALL_SCREENSHOTS_CATALOG.json'), JSON.stringify(allEntries, null, 2));

// Generate README_SCREENSHOTS.md
let readme = `# All Screenshots Catalog (${allEntries.length} Screenshots)

**Full Folder Location:**  
\`E:\\X\\AiStudio Workflow\\V20\\ALL_SCREENSHOTS\`

---

## Folder Organization

You have everything organized in two easy ways inside this folder:

1. **\`ALL_SCREENSHOTS_FLAT\\\` (Recommended for Quick Browsing)**  
   Every single one of the ${allEntries.length} screenshots in ONE place, numbered \`001\` through \`${String(allEntries.length).padStart(3, '0')}\` with device and description in the name.  
   Open this folder in Windows File Explorer and set view to **Large Icons** to view all screens side-by-side!

2. **Categorized by Device:**  
   - \`1_Galaxy_S25_Ultra\\\` (${s25Manifest.length} images · 1440 × 3120 px)
   - \`2_Galaxy_Tab_S6_Lite_Portrait\\\` (${portManifest.length} images · 1200 × 2000 px · Dark & Light)
   - \`3_Galaxy_Tab_S6_Lite_Landscape\\\` (${landManifest.length} images · 2000 × 1200 px · Dark & Light)

3. **Offline HTML Viewer:**  
   Double click \`BROWSE_SCREENSHOTS.html\` in this folder to browse, search, and view all screenshots in high resolution in any web browser without needing any server or command line.

4. **1-Click Complete ZIP Archive:**  
   \`ALL_233_SCREENSHOTS.zip\` is located directly in this folder for instant copying or sharing.

---

## Device Breakdown

| Device | Orientation | Resolution | Mode / Theme | Count | Subfolder |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Galaxy S25 Ultra** | Portrait | 1440 × 3120 | Dark Mode | 64 screens | \`1_Galaxy_S25_Ultra\` |
| **Galaxy Tab S6 Lite** | Portrait | 1200 × 2000 | Dark + Light | 88 screens | \`2_Galaxy_Tab_S6_Lite_Portrait\` |
| **Galaxy Tab S6 Lite** | Landscape | 2000 × 1200 | Dark + Light | 81 screens | \`3_Galaxy_Tab_S6_Lite_Landscape\` |
| **TOTAL** | — | — | **Dark + Light** | **${allEntries.length} screens** | \`ALL_SCREENSHOTS_FLAT\` |

---

## Complete File Listing

| # | Device | Orientation | Theme | Category | Description | File |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;

for (const entry of allEntries) {
  readme += `| ${String(entry.num).padStart(3, '0')} | ${entry.device} | ${entry.orientation} | ${entry.theme} | ${entry.category} | ${entry.description} | \`${entry.flatFilename}\` |\n`;
}

fs.writeFileSync(path.join(ALL_DIR, 'README_SCREENSHOTS.md'), readme, 'utf8');

// Generate BROWSE_SCREENSHOTS.html (Offline Viewer)
const htmlViewer = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Remix 3D Studio - Offline Screenshots Browser (${allEntries.length} Screens)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #090a10;
      color: #f1f5f9;
      padding-bottom: 60px;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(14, 16, 24, 0.96);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 14px 20px;
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 18px;
      font-weight: 700;
    }
    .sub {
      font-size: 12px;
      color: #94a3b8;
    }
    .filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }
    .btn {
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      transition: all 0.15s;
    }
    .btn.active {
      background: #38bdf8;
      color: #04121d;
      border-color: #38bdf8;
    }
    .search-input {
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: #11131c;
      color: #fff;
      font-size: 12px;
      outline: none;
      min-width: 220px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      padding: 20px;
      max-width: 1600px;
      margin: 0 auto;
    }
    .card {
      background: #12141f;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, border-color 0.2s;
    }
    .card:hover {
      transform: translateY(-2px);
      border-color: rgba(56, 189, 248, 0.4);
    }
    .card-head {
      padding: 10px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .card-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
    }
    .badge-dev {
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.08);
      color: #38bdf8;
      font-weight: 700;
    }
    .badge-theme {
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    .badge-theme.dark { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
    .badge-theme.light { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
    .card-title {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-img-wrap {
      background: #000;
      height: 380px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .card-img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
      cursor: zoom-in;
    }
    .card-foot {
      padding: 8px 12px;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-foot a {
      color: #38bdf8;
      text-decoration: none;
      font-weight: 600;
    }
    .card-foot a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <header>
    <div class="top-bar">
      <div>
        <h1>Remix 3D Studio - All Screenshots Directory</h1>
        <div class="sub">${allEntries.length} High-Resolution Screens · Galaxy S25 Ultra + Tab S6 Lite (Portrait & Landscape)</div>
      </div>
      <input type="text" class="search-input" id="search" placeholder="Search screens, menus, brushes..." oninput="filterScreens()">
    </div>
    <div class="filters">
      <button class="btn active" data-filter="all" onclick="setDevice('all')">All Devices (${allEntries.length})</button>
      <button class="btn" data-filter="s25ultra" onclick="setDevice('s25ultra')">Galaxy S25 Ultra (${s25Manifest.length})</button>
      <button class="btn" data-filter="s6lite-portrait" onclick="setDevice('s6lite-portrait')">Tab S6 Lite Portrait (${portManifest.length})</button>
      <button class="btn" data-filter="s6lite-landscape" onclick="setDevice('s6lite-landscape')">Tab S6 Lite Landscape (${landManifest.length})</button>
      <span style="color:rgba(255,255,255,0.2); margin:0 4px;">|</span>
      <button class="btn" data-theme="all" onclick="setTheme('all')">All Themes</button>
      <button class="btn" data-theme="Dark" onclick="setTheme('Dark')">Dark Mode</button>
      <button class="btn" data-theme="Light" onclick="setTheme('Light')">Light Mode</button>
    </div>
  </header>

  <div class="grid" id="grid">
    ${allEntries
      .map(
        (e) => `
      <div class="card" data-device="${e.deviceSlug}" data-theme="${e.theme}" data-text="${e.description.toLowerCase()} ${e.category.toLowerCase()} ${e.flatFilename.toLowerCase()}">
        <div class="card-head">
          <div class="card-meta">
            <span style="font-family:monospace; color:#94a3b8;">#${String(e.num).padStart(3, '0')}</span>
            <span class="badge-dev">${e.device} · ${e.orientation}</span>
            <span class="badge-theme ${e.theme.toLowerCase()}">${e.theme}</span>
          </div>
          <div class="card-title" title="${e.description}">${e.description}</div>
        </div>
        <div class="card-img-wrap">
          <img src="${e.relPathFlat}" alt="${e.description}" class="card-img" loading="lazy" onclick="window.open('${e.relPathFlat}', '_blank')">
        </div>
        <div class="card-foot">
          <span>${e.category} · ${e.resolution}</span>
          <a href="${e.relPathFlat}" download>Download</a>
        </div>
      </div>
    `
      )
      .join('')}
  </div>

  <script>
    let activeDev = 'all';
    let activeTheme = 'all';

    function setDevice(dev) {
      activeDev = dev;
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === dev));
      filterScreens();
    }

    function setTheme(th) {
      activeTheme = th;
      document.querySelectorAll('[data-theme]').forEach(b => b.classList.toggle('active', b.getAttribute('data-theme') === th));
      filterScreens();
    }

    function filterScreens() {
      const q = document.getElementById('search').value.toLowerCase().trim();
      const cards = document.querySelectorAll('.card');
      cards.forEach(card => {
        const d = card.getAttribute('data-device');
        const t = card.getAttribute('data-theme');
        const txt = card.getAttribute('data-text');

        const matchDev = activeDev === 'all' || d === activeDev;
        const matchTheme = activeTheme === 'all' || t === activeTheme;
        const matchSearch = !q || txt.includes(q);

        card.style.display = (matchDev && matchTheme && matchSearch) ? 'flex' : 'none';
      });
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(ALL_DIR, 'BROWSE_SCREENSHOTS.html'), htmlViewer, 'utf8');

// Generate Complete ZIP bundle
console.log('Generating ALL_233_SCREENSHOTS.zip archive...');
const zip = new JSZip();
for (const entry of allEntries) {
  const fileData = fs.readFileSync(path.join(FLAT_DIR, entry.flatFilename));
  zip.file(entry.flatFilename, fileData);
}
zip.file('README_SCREENSHOTS.md', fs.readFileSync(path.join(ALL_DIR, 'README_SCREENSHOTS.md')));
zip.file('ALL_SCREENSHOTS_CATALOG.json', fs.readFileSync(path.join(ALL_DIR, 'ALL_SCREENSHOTS_CATALOG.json')));

const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
const zipPath = path.join(ALL_DIR, 'ALL_233_SCREENSHOTS.zip');
fs.writeFileSync(zipPath, zipBuffer);
console.log(`Saved complete bundle ZIP (${Math.round(zipBuffer.length / (1024 * 1024))} MB) to: ${zipPath}`);

console.log('\nAll screenshots consolidated successfully into:');
console.log(ALL_DIR);

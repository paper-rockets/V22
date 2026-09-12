import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
import JSZip from 'jszip';
import qrcodeTerminal from 'qrcode-terminal';
import { renderAuditPageHtml } from './audit-page.js';

const requestedPort = 3002;
const SCREENSHOT_BASE = path.resolve('screenshots');
const S25_DIR = path.join(SCREENSHOT_BASE, 's25ultra-audit');
const S6LITE_PORT_DIR = path.join(SCREENSHOT_BASE, 's6lite-audit', 'portrait');
const S6LITE_LAND_DIR = path.join(SCREENSHOT_BASE, 's6lite-audit', 'landscape');
const SCREENSHOT_DIR = S25_DIR;
const FEEDBACK_DIR = path.resolve('audit-feedback');
const ANNOTATIONS_DIR = path.join(FEEDBACK_DIR, 'annotations');

fs.mkdirSync(FEEDBACK_DIR, { recursive: true });
fs.mkdirSync(ANNOTATIONS_DIR, { recursive: true });

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name,
          address: iface.address,
          isWifi:
            name.toLowerCase().includes('wi-fi') ||
            name.toLowerCase().includes('wlan') ||
            name.toLowerCase().includes('wireless'),
        });
      }
    }
  }

  addresses.sort((a, b) => (b.isWifi ? 1 : 0) - (a.isWifi ? 1 : 0));
  return addresses;
}

function findCloudflaredPath() {
  const standardPaths = [
    'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
    'C:\\Program Files\\cloudflared\\cloudflared.exe',
  ];
  for (const p of standardPaths) {
    if (fs.existsSync(p)) return p;
  }
  return 'cloudflared';
}

function getAllScreenshotsList() {
  const all = [];

  // 1. Samsung Galaxy Tab S6 Lite - Portrait (1200 x 2000)
  const portManifest = path.join(S6LITE_PORT_DIR, 'manifest.json');
  if (fs.existsSync(portManifest)) {
    try {
      const items = JSON.parse(fs.readFileSync(portManifest, 'utf8'));
      items.forEach((item, idx) => {
        const isDark = item.filename.startsWith('dark') || item.filename.includes('dark');
        all.push({
          id: `s6-port-${idx + 1}`,
          filename: item.filename,
          description: item.description,
          category: item.category || 'General',
          device: 's6lite-portrait',
          deviceName: 'Galaxy Tab S6 Lite (Portrait)',
          orientation: 'portrait',
          theme: isDark ? 'dark' : 'light',
          url: `/screenshots/s6lite-audit/portrait/${item.filename}`,
          path: item.path,
          sizeBytes: item.sizeBytes,
        });
      });
    } catch (e) {
      console.error('Error reading Tab S6 Lite portrait manifest:', e);
    }
  }

  // 2. Samsung Galaxy Tab S6 Lite - Landscape (2000 x 1200)
  const landManifest = path.join(S6LITE_LAND_DIR, 'manifest.json');
  if (fs.existsSync(landManifest)) {
    try {
      const items = JSON.parse(fs.readFileSync(landManifest, 'utf8'));
      items.forEach((item, idx) => {
        const isDark = !item.filename.includes('light');
        all.push({
          id: `s6-land-${idx + 1}`,
          filename: item.filename,
          description: item.description,
          category: item.category || 'General',
          device: 's6lite-landscape',
          deviceName: 'Galaxy Tab S6 Lite (Landscape)',
          orientation: 'landscape',
          theme: isDark ? 'dark' : 'light',
          url: `/screenshots/s6lite-audit/landscape/${item.filename}`,
          path: item.path,
          sizeBytes: item.sizeBytes,
        });
      });
    } catch (e) {
      console.error('Error reading Tab S6 Lite landscape manifest:', e);
    }
  }

  // 3. Samsung Galaxy S25 Ultra (1440 x 3120)
  const s25Manifest = path.join(S25_DIR, 'manifest.json');
  if (fs.existsSync(s25Manifest)) {
    try {
      const items = JSON.parse(fs.readFileSync(s25Manifest, 'utf8'));
      items.forEach((item, idx) => {
        all.push({
          id: `s25-${idx + 1}`,
          filename: item.filename,
          description: item.description,
          category: item.category || 'General',
          device: 's25ultra',
          deviceName: 'Galaxy S25 Ultra',
          orientation: 'portrait',
          theme: 'dark',
          url: `/screenshots/s25ultra-audit/${item.filename}`,
          path: item.path,
          sizeBytes: item.sizeBytes,
        });
      });
    } catch (e) {
      console.error('Error reading S25 Ultra manifest:', e);
    }
  }

  return all;
}

function getScreenshotsList() {
  return getAllScreenshotsList();
}

function renderGalleryHtml() {
  const items = getScreenshotsList();
  const categories = Array.from(new Set(items.map((i) => i.category || 'General')));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Galaxy S25 Ultra Screenshots Gallery (64 Pics)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #090a0f;
      color: #f1f5f9;
      padding-bottom: 60px;
      -webkit-tap-highlight-color: transparent;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(15, 17, 23, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding: 14px 16px;
    }
    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    h1 {
      font-size: 17px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.2;
    }
    .subhead {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .btn-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-audit {
      background: #10b981;
      color: #032117;
    }
    .btn-audit:hover { background: #34d399; }
    .btn-zip {
      background: #38bdf8;
      color: #04121d;
    }
    .btn-zip:active { transform: scale(0.96); background: #7dd3fc; }
    .btn-app {
      background: rgba(255,255,255,0.1);
      color: #e2e8f0;
      border: 1px solid rgba(255,255,255,0.15);
    }
    .filters {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: none;
    }
    .filters::-webkit-scrollbar { display: none; }
    .pill {
      white-space: nowrap;
      padding: 4px 11px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 500;
      background: rgba(255,255,255,0.06);
      color: #94a3b8;
      border: 1px solid rgba(255,255,255,0.08);
      cursor: pointer;
    }
    .pill.active {
      background: #ffffff;
      color: #090a0f;
      font-weight: 600;
    }
    .stats-bar {
      padding: 10px 16px;
      font-size: 12px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
      padding: 0 16px;
    }
    @media (min-width: 600px) {
      .grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; padding: 0 24px; }
    }
    .card {
      background: #13151d;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.15s ease, border-color 0.15s ease;
      display: flex;
      flex-direction: column;
    }
    .card:active { transform: scale(0.98); }
    .card-img-wrap {
      width: 100%;
      aspect-ratio: 9 / 19.5;
      background: #000;
      position: relative;
      overflow: hidden;
    }
    .card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: opacity 0.2s ease;
    }
    .card-info {
      padding: 10px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card-title {
      font-size: 11.5px;
      font-weight: 600;
      color: #f1f5f9;
      line-height: 1.3;
      margin-bottom: 4px;
    }
    .card-category {
      font-size: 10px;
      color: #38bdf8;
      font-weight: 500;
    }
    /* Lightbox Modal */
    .lightbox {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0,0,0,0.96);
      backdrop-filter: blur(10px);
      flex-direction: column;
    }
    .lightbox.open { display: flex; }
    .lb-header {
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0,0,0,0.6);
    }
    .lb-title {
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      max-width: 65%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .lb-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .lb-btn {
      background: rgba(255,255,255,0.15);
      border: none;
      color: #fff;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      text-decoration: none;
    }
    .lb-close {
      font-size: 20px;
      padding: 4px 10px;
      line-height: 1;
    }
    .lb-body {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 8px;
      position: relative;
    }
    .lb-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
    }
    .lb-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0,0,0,0.5);
      color: white;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 50%;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 20px;
      user-select: none;
    }
    .lb-prev { left: 12px; }
    .lb-next { right: 12px; }
  </style>
</head>
<body>

  <header>
    <div class="header-top">
      <div>
        <h1>Galaxy S25 Ultra Screenshots</h1>
        <div class="subhead">${items.length} Native 1440×3120 Screenshots</div>
      </div>
      <div class="btn-group">
        <a href="/audit" class="btn btn-audit">✎ Open Audit & Notes Page</a>
        <a href="/download-all-zip" class="btn btn-zip">Download All ZIP</a>
        <a href="/?device=s25ultra" class="btn btn-app">Open 3D App</a>
      </div>
    </div>
    <div class="filters" id="filters">
      <button class="pill active" onclick="filterCategory('all')">All (${items.length})</button>
      ${categories
        .map(
          (c) =>
            `<button class="pill" onclick="filterCategory('${c}')">${c} (${items.filter((i) => i.category === c).length})</button>`
        )
        .join('')}
    </div>
  </header>

  <div class="stats-bar">
    <span>Tap any image for full-screen zoom & download</span>
    <span>S25 Ultra • 1440 × 3120</span>
  </div>

  <main class="grid" id="galleryGrid">
    ${items
      .map(
        (item, index) => `
      <div class="card" data-category="${item.category || 'General'}" onclick="openLightbox(${index})">
        <div class="card-img-wrap">
          <img class="card-img" loading="lazy" src="/screenshots/s25ultra-audit/${item.filename}" alt="${item.description}">
        </div>
        <div class="card-info">
          <div class="card-title">${item.description}</div>
          <div class="card-category">${item.category || 'General'}</div>
        </div>
      </div>
    `
      )
      .join('')}
  </main>

  <!-- Lightbox -->
  <div class="lightbox" id="lightbox">
    <div class="lb-header">
      <div class="lb-title" id="lbTitle">Screenshot</div>
      <div class="lb-actions">
        <a href="#" class="lb-btn" id="lbDownload" download>Save to Phone</a>
        <button class="lb-btn lb-close" onclick="closeLightbox()">✕</button>
      </div>
    </div>
    <div class="lb-body">
      <div class="lb-nav lb-prev" onclick="prevImage(event)">‹</div>
      <img src="" alt="" class="lb-img" id="lbImg">
      <div class="lb-nav lb-next" onclick="nextImage(event)">›</div>
    </div>
  </div>

  <script>
    const items = ${JSON.stringify(items)};
    let currentIndex = 0;

    function filterCategory(cat) {
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      event.target.classList.add('active');
      const cards = document.querySelectorAll('.card');
      cards.forEach(card => {
        if (cat === 'all' || card.getAttribute('data-category') === cat) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function openLightbox(index) {
      currentIndex = index;
      updateLightbox();
      document.getElementById('lightbox').classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      document.getElementById('lightbox').classList.remove('open');
      document.body.style.overflow = 'auto';
    }

    function updateLightbox() {
      const item = items[currentIndex];
      const imgPath = '/screenshots/s25ultra-audit/' + item.filename;
      document.getElementById('lbImg').src = imgPath;
      document.getElementById('lbTitle').innerText = (currentIndex + 1) + '/' + items.length + ': ' + item.description;
      document.getElementById('lbDownload').href = imgPath;
      document.getElementById('lbDownload').setAttribute('download', item.filename);
    }

    function prevImage(e) {
      e.stopPropagation();
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      updateLightbox();
    }

    function nextImage(e) {
      e.stopPropagation();
      currentIndex = (currentIndex + 1) % items.length;
      updateLightbox();
    }

    // Touch swipe support for lightbox on phone
    let touchStartX = 0;
    const lb = document.getElementById('lightbox');
    lb.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, {passive: true});
    lb.addEventListener('touchend', e => {
      const diff = e.changedTouches[0].screenX - touchStartX;
      if (diff > 50) prevImage(e);
      if (diff < -50) nextImage(e);
    }, {passive: true});

    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'ArrowLeft') prevImage(e);
      if (e.key === 'ArrowRight') nextImage(e);
      if (e.key === 'Escape') closeLightbox();
    });
  </script>
</body>
</html>`;
}

async function startServer() {
  console.clear();
  console.log('\x1b[36m%s\x1b[0m', '=============================================================');
  console.log('\x1b[1m\x1b[35m%s\x1b[0m', '   REMIX 3D STUDIO - MOBILE & WEB AUDIT REVIEW SERVER');
  console.log('\x1b[36m%s\x1b[0m', '=============================================================');

  const localIps = getLocalIpAddresses();
  const primaryIp = localIps.length > 0 ? localIps[0].address : 'localhost';
  const localWifiUrl = `http://${primaryIp}:${requestedPort}`;
  const computerUrl = `http://localhost:${requestedPort}`;

  let cachedZipBuffer = null;
  let cachedS6PortZip = null;
  let cachedS6LandZip = null;
  let cachedS6AllZip = null;

  // Initialize Vite dev server with custom review & audit plugin
  const server = await createServer({
    configFile: './vite.config.ts',
    plugins: [
      {
        name: 'audit-routes-handler',
        configureServer(viteServer) {
          viteServer.middlewares.use(async (req, res, next) => {
            const parsedUrl = new URL(req.url || '/', 'http://localhost');
            const pathname = parsedUrl.pathname;

            // Route 1: Audit Review Page (Draw / Highlight / Notes for every screen)
            if (pathname === '/audit' || pathname === '/review' || pathname === '/audit/') {
              const items = getScreenshotsList();
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(renderAuditPageHtml(items));
              return;
            }

            // Route 2: Classic Gallery UI
            if (pathname === '/gallery' || pathname === '/pics' || pathname === '/screenshots' || pathname === '/gallery/') {
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(renderGalleryHtml());
              return;
            }

            // Route 2b: All Screenshots Browser UI
            if (pathname === '/browse' || pathname === '/all-screenshots' || pathname === '/all') {
              const browseHtmlPath = path.resolve('ALL_SCREENSHOTS/BROWSE_SCREENSHOTS.html');
              if (fs.existsSync(browseHtmlPath)) {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.end(fs.readFileSync(browseHtmlPath, 'utf8'));
                return;
              }
            }

            // Route 3: Save Audit Feedback API (POST)
            if (pathname === '/api/save-audit' && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => { body += chunk.toString(); });
              req.on('end', () => {
                try {
                  const payload = JSON.parse(body);
                  const { auditData, manifest, timestamp } = payload;

                  // Save raw JSON
                  fs.writeFileSync(
                    path.join(FEEDBACK_DIR, 'audit-notes.json'),
                    JSON.stringify(auditData, null, 2),
                    'utf8'
                  );

                  // Save any drawn overlay PNGs
                  for (const [idxStr, data] of Object.entries(auditData)) {
                    const idx = parseInt(idxStr, 10);
                    const item = manifest[idx];
                    if (item && data.drawingDataUrl) {
                      const base64Data = data.drawingDataUrl.replace(/^data:image\/png;base64,/, '');
                      const outImgPath = path.join(ANNOTATIONS_DIR, `annotated_${item.filename}`);
                      fs.writeFileSync(outImgPath, Buffer.from(base64Data, 'base64'));
                    }
                  }

                  // Generate Markdown report AUDIT_FEEDBACK.md in workspace root
                  let md = `# Remix 3D Studio - UI/UX Audit Feedback Report\n\n`;
                  md += `**Submitted:** ${timestamp || new Date().toISOString()}\n`;
                  md += `**Total Screens Cataloged:** ${manifest.length}\n\n`;

                  let reviewedCount = 0;
                  let fixCount = 0;

                  for (let i = 0; i < manifest.length; i++) {
                    const item = manifest[i];
                    const d = auditData[i];
                    if (!d || (!d.notes && !d.status && !d.drawingDataUrl && (!d.tags || d.tags.length === 0))) continue;

                    reviewedCount++;
                    if (d.status === 'needs-fix') fixCount++;

                    md += `### ${item.filename} — ${item.description}\n`;
                    md += `- **Device:** ${item.deviceName || item.device || 'Galaxy S25 Ultra'}\n`;
                    md += `- **Category:** ${item.category}\n`;
                    md += `- **Review Status:** ${d.status ? d.status.toUpperCase() : 'NOT SPECIFIED'}\n`;
                    if (d.priority) md += `- **Priority:** ${d.priority}\n`;
                    if (d.tags && d.tags.length > 0) md += `- **Tags:** \`${d.tags.join('`, `')}\`\n`;
                    if (d.notes) md += `- **Notes / Action Items:**\n  > ${d.notes.trim().replace(/\n/g, '\n  > ')}\n`;
                    if (d.drawingDataUrl) {
                      md += `- **Markings / Highlights:** Saved to \`audit-feedback/annotations/annotated_${item.filename}\`\n`;
                    }
                    md += `\n---\n\n`;
                  }

                  md = `# Summary: ${reviewedCount} Screens Reviewed (${fixCount} Require Changes)\n\n` + md;
                  fs.writeFileSync(path.resolve('AUDIT_FEEDBACK.md'), md, 'utf8');

                  console.log(`\x1b[32m✔ Audit feedback saved: ${reviewedCount} screens documented in AUDIT_FEEDBACK.md\x1b[0m`);

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, count: reviewedCount }));
                  return;
                } catch (err) {
                  console.error('Error saving audit feedback:', err);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                  return;
                }
              });
              return;
            }

            // Route 4: Load Audit Feedback API (GET)
            if (pathname === '/api/audit-data') {
              const notesFile = path.join(FEEDBACK_DIR, 'audit-notes.json');
              if (fs.existsSync(notesFile)) {
                res.setHeader('Content-Type', 'application/json');
                res.end(fs.readFileSync(notesFile, 'utf8'));
                return;
              }
              res.setHeader('Content-Type', 'application/json');
              res.end('{}');
              return;
            }

            // Route 5a: Download S25 Ultra screenshots ZIP
            if (pathname === '/download-all-zip') {
              try {
                if (!cachedZipBuffer) {
                  console.log('\x1b[90mPackaging 64 S25 Ultra screenshots into ZIP...\x1b[0m');
                  const zip = new JSZip();
                  const files = fs.readdirSync(S25_DIR).filter((f) => f.endsWith('.png'));
                  for (const file of files) {
                    const fileData = fs.readFileSync(path.join(S25_DIR, file));
                    zip.file(file, fileData);
                  }
                  cachedZipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
                }
                res.setHeader('Content-Type', 'application/zip');
                res.setHeader(
                  'Content-Disposition',
                  'attachment; filename="s25ultra-all-screenshots-1440x3120.zip"'
                );
                res.setHeader('Content-Length', cachedZipBuffer.length);
                res.end(cachedZipBuffer);
                return;
              } catch (err) {
                console.error('ZIP generation error:', err);
                res.statusCode = 500;
                res.end('Error generating ZIP');
                return;
              }
            }

            // Route 5b: Download Galaxy Tab S6 Lite Portrait ZIP
            if (pathname === '/download-s6lite-portrait-zip') {
              try {
                if (!cachedS6PortZip) {
                  console.log('\x1b[90mPackaging Tab S6 Lite Portrait screenshots into ZIP...\x1b[0m');
                  const zip = new JSZip();
                  const files = fs.readdirSync(S6LITE_PORT_DIR).filter((f) => f.endsWith('.png'));
                  for (const file of files) {
                    const fileData = fs.readFileSync(path.join(S6LITE_PORT_DIR, file));
                    zip.file(file, fileData);
                  }
                  cachedS6PortZip = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
                }
                res.setHeader('Content-Type', 'application/zip');
                res.setHeader(
                  'Content-Disposition',
                  'attachment; filename="tabs6lite-portrait-screenshots-1200x2000.zip"'
                );
                res.setHeader('Content-Length', cachedS6PortZip.length);
                res.end(cachedS6PortZip);
                return;
              } catch (err) {
                console.error('Tab S6 Lite Portrait ZIP error:', err);
                res.statusCode = 500;
                res.end('Error generating ZIP');
                return;
              }
            }

            // Route 5c: Download Galaxy Tab S6 Lite Landscape ZIP
            if (pathname === '/download-s6lite-landscape-zip') {
              try {
                if (!cachedS6LandZip) {
                  console.log('\x1b[90mPackaging Tab S6 Lite Landscape screenshots into ZIP...\x1b[0m');
                  const zip = new JSZip();
                  const files = fs.readdirSync(S6LITE_LAND_DIR).filter((f) => f.endsWith('.png'));
                  for (const file of files) {
                    const fileData = fs.readFileSync(path.join(S6LITE_LAND_DIR, file));
                    zip.file(file, fileData);
                  }
                  cachedS6LandZip = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
                }
                res.setHeader('Content-Type', 'application/zip');
                res.setHeader(
                  'Content-Disposition',
                  'attachment; filename="tabs6lite-landscape-screenshots-2000x1200.zip"'
                );
                res.setHeader('Content-Length', cachedS6LandZip.length);
                res.end(cachedS6LandZip);
                return;
              } catch (err) {
                console.error('Tab S6 Lite Landscape ZIP error:', err);
                res.statusCode = 500;
                res.end('Error generating ZIP');
                return;
              }
            }

            // Route 5d: Download Galaxy Tab S6 Lite All (Portrait + Landscape) ZIP
            if (pathname === '/download-s6lite-all-zip') {
              try {
                if (!cachedS6AllZip) {
                  console.log('\x1b[90mPackaging all Tab S6 Lite screenshots into ZIP...\x1b[0m');
                  const zip = new JSZip();
                  const portFiles = fs.readdirSync(S6LITE_PORT_DIR).filter((f) => f.endsWith('.png'));
                  for (const file of portFiles) {
                    zip.file(`portrait/${file}`, fs.readFileSync(path.join(S6LITE_PORT_DIR, file)));
                  }
                  const landFiles = fs.readdirSync(S6LITE_LAND_DIR).filter((f) => f.endsWith('.png'));
                  for (const file of landFiles) {
                    zip.file(`landscape/${file}`, fs.readFileSync(path.join(S6LITE_LAND_DIR, file)));
                  }
                  cachedS6AllZip = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
                }
                res.setHeader('Content-Type', 'application/zip');
                res.setHeader(
                  'Content-Disposition',
                  'attachment; filename="tabs6lite-all-screenshots-portrait-and-landscape.zip"'
                );
                res.setHeader('Content-Length', cachedS6AllZip.length);
                res.end(cachedS6AllZip);
                return;
              } catch (err) {
                console.error('Tab S6 Lite All ZIP error:', err);
                res.statusCode = 500;
                res.end('Error generating ZIP');
                return;
              }
            }

            // Route 5e: Download Complete 233 Screenshots Bundle ZIP
            if (pathname === '/download-complete-bundle-zip' || pathname === '/download-all-screens-zip') {
              const bundleZipPath = path.resolve('ALL_SCREENSHOTS/ALL_233_SCREENSHOTS.zip');
              if (fs.existsSync(bundleZipPath)) {
                const stat = fs.statSync(bundleZipPath);
                res.setHeader('Content-Type', 'application/zip');
                res.setHeader(
                  'Content-Disposition',
                  'attachment; filename="remix3d-all-233-screenshots-bundle.zip"'
                );
                res.setHeader('Content-Length', stat.size);
                fs.createReadStream(bundleZipPath).pipe(res);
                return;
              }
            }

            // Route 6: Serve static screenshot files (S6 Lite Portrait, Landscape, S25 Ultra)
            if (pathname.startsWith('/screenshots/')) {
              const relPath = pathname.replace(/^\/screenshots\//, '');
              const filePath = path.resolve(SCREENSHOT_BASE, relPath);
              if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                res.setHeader('Content-Type', 'image/png');
                res.setHeader('Cache-Control', 'public, max-age=86400');
                fs.createReadStream(filePath).pipe(res);
                return;
              }
            }

            // Route 6b: Serve files under ALL_SCREENSHOTS (for offline viewer or direct links)
            if (pathname.startsWith('/ALL_SCREENSHOTS/')) {
              const rel = pathname.replace(/^\/ALL_SCREENSHOTS\//, '');
              const target = path.resolve('ALL_SCREENSHOTS', rel);
              if (fs.existsSync(target) && fs.statSync(target).isFile()) {
                if (target.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
                else if (target.endsWith('.zip')) res.setHeader('Content-Type', 'application/zip');
                else if (target.endsWith('.html')) res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader('Cache-Control', 'public, max-age=86400');
                fs.createReadStream(target).pipe(res);
                return;
              }
            }

            next();
          });
        },
      },
    ],
    server: {
      host: '0.0.0.0',
      port: requestedPort,
      cors: true,
    },
  });

  await server.listen();

  console.log('\x1b[32m✔ Local server running on port ' + requestedPort + '\x1b[0m');
  console.log('\x1b[90mConnecting to Cloudflare secure tunnel for cellular / remote phone access...\x1b[0m\n');

  const cloudflaredExe = findCloudflaredPath();
  const tunnelProc = spawn(cloudflaredExe, ['tunnel', '--url', `http://localhost:${requestedPort}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let cellularUrl = null;
  const keepAliveTimer = setInterval(() => {}, 1000 * 60 * 60);

  tunnelProc.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !cellularUrl) {
      cellularUrl = match[0];
      const previewText = `=============================================================
REMIX 3D STUDIO - AUDIT, GALLERY & CELLULAR ACCESS LINKS
=============================================================

1. AUDIT & NOTES REVIEW PAGE (Draw, highlight & add notes on your phone):
   ${cellularUrl}/audit

2. GALLERY (View & download all 64 pictures on your phone):
   ${cellularUrl}/gallery

3. LIVE 3D APP on your phone:
   ${cellularUrl}/?device=s25ultra

4. AT HOME (On same Wi-Fi):
   Audit Page: ${localWifiUrl}/audit
   Gallery:    ${localWifiUrl}/gallery
   3D App:     ${localWifiUrl}/?device=s25ultra

5. On this computer:
   Audit Page: ${computerUrl}/audit
   Gallery:    ${computerUrl}/gallery
   3D App:     ${computerUrl}/?device=s25ultra

Port: ${requestedPort}
=============================================================
`;
      try {
        fs.writeFileSync(path.resolve('./CELLULAR_PREVIEW_URL.txt'), previewText, 'utf8');
      } catch (_) {}

      printLinks(computerUrl, localWifiUrl, cellularUrl, requestedPort);
    }
  });

  tunnelProc.on('error', (err) => {
    console.warn('Could not launch cloudflared:', err.message);
    printLinks(computerUrl, localWifiUrl, null, requestedPort);
  });

  tunnelProc.on('exit', (code) => {
    console.log(`Cloudflare tunnel exited with code ${code}`);
    clearInterval(keepAliveTimer);
    process.exit(code || 0);
  });

  setTimeout(() => {
    if (!cellularUrl) {
      printLinks(computerUrl, localWifiUrl, null, requestedPort);
    }
  }, 9000);

  const handleShutdown = async () => {
    console.log('\nShutting down server and tunnel...');
    clearInterval(keepAliveTimer);
    try {
      tunnelProc.kill();
    } catch (_) {}
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
}

function printLinks(computerUrl, localWifiUrl, cellularUrl, port) {
  console.log('\x1b[36m%s\x1b[0m', '-------------------------------------------------------------');
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', '🚀 TUNNEL & SERVER READY — ACCESS ON MOBILE & WEB:');
  console.log('\x1b[36m%s\x1b[0m', '-------------------------------------------------------------');
  console.log(`  \x1b[1mOn this computer:\x1b[0m`);
  console.log(`    \x1b[1m\x1b[32mAudit & Notes Page: \x1b[36m${computerUrl}/audit\x1b[0m`);
  console.log(`    Gallery:            \x1b[36m${computerUrl}/gallery\x1b[0m`);
  console.log(`    3D App:             \x1b[36m${computerUrl}/?device=s25ultra\x1b[0m\n`);

  console.log(`  \x1b[1mOn your phone (same Wi-Fi):\x1b[0m`);
  console.log(`    \x1b[1m\x1b[32mAudit & Notes Page: \x1b[33m${localWifiUrl}/audit\x1b[0m`);
  console.log(`    Gallery:            \x1b[33m${localWifiUrl}/gallery\x1b[0m`);
  console.log(`    3D App:             \x1b[33m${localWifiUrl}/?device=s25ultra\x1b[0m\n`);

  if (cellularUrl) {
    console.log(`  \x1b[1m\x1b[35mOn your phone (CELLULAR / TUNNEL — NO FIREWALL ISSUES):\x1b[0m`);
    console.log(`    \x1b[1m\x1b[32mAudit & Notes Page: \x1b[4m${cellularUrl}/audit\x1b[0m`);
    console.log(`    Gallery (All 64 Pics): \x1b[4m${cellularUrl}/gallery\x1b[0m`);
    console.log(`    Live 3D App:           \x1b[4m${cellularUrl}/?device=s25ultra\x1b[0m\n`);

    console.log('\x1b[1m\x1b[34m%s\x1b[0m', '📱 SCAN TO OPEN AUDIT PAGE ON YOUR PHONE:');
    console.log('\x1b[90m%s\x1b[0m', '-------------------------------------------------------------');
    qrcodeTerminal.generate(`${cellularUrl}/audit`, { small: true }, (qrcode) => {
      console.log(qrcode);
    });
    console.log('\x1b[90m%s\x1b[0m', '-------------------------------------------------------------');
  }

  console.log(`Port: ${port}`);
}

startServer();

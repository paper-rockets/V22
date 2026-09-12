/**
 * Mobile and Web Audit Page with Multi-Device Support (Tab S6 Lite Portrait & Landscape, S25 Ultra)
 * Optimized for 4K / Ultrawide & High-DPI Displays:
 * - Fluid wide layout with 1, 2, 3, and 4-column responsive grid
 * - Ultra-slim sticky header and compact card chrome
 * - Fully functional, pixel-perfect drawing and highlighting engine with PointerEvents
 * - Large image scaling options up to full 4K screen height
 * - Side-by-side or stacked card layout toggle
 */

export function renderAuditPageHtml(manifest) {
  const devices = [
    { id: 'all', label: 'All Devices', count: manifest.length },
    {
      id: 's6lite-portrait',
      label: 'Tab S6 Lite · Port',
      count: manifest.filter((i) => i.device === 's6lite-portrait').length,
    },
    {
      id: 's6lite-landscape',
      label: 'Tab S6 Lite · Land',
      count: manifest.filter((i) => i.device === 's6lite-landscape').length,
    },
    {
      id: 's25ultra',
      label: 'S25 Ultra',
      count: manifest.filter((i) => i.device === 's25ultra').length,
    },
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Remix 3D Studio - 4K Optimized Multi-Device Audit Review</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #07080d;
      --card-bg: #10121a;
      --card-border: rgba(255, 255, 255, 0.08);
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --accent-hover: #0284c7;
      --danger: #ef4444;
      --warning: #f59e0b;
      --success: #10b981;
      --img-max-height: 78vh;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.35;
      padding-bottom: 60px;
      -webkit-tap-highlight-color: transparent;
    }

    /* Ultra-Slim Sticky Header (Zero Wasted Space) */
    header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(10, 12, 18, 0.96);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--card-border);
      padding: 6px 14px;
    }
    .header-content {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .brand-title {
      font-size: 13px;
      font-weight: 700;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .brand-badge {
      font-size: 9.5px;
      padding: 1px 6px;
      border-radius: 9999px;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent);
      font-weight: 600;
    }

    /* Compact Pill Tabs */
    .filter-group {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }
    .pill {
      white-space: nowrap;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-muted);
      border: 1px solid var(--card-border);
      cursor: pointer;
      transition: all 0.12s;
    }
    .pill:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
    .pill.active {
      background: #ffffff;
      color: #08090d;
      font-weight: 700;
      border-color: #ffffff;
    }
    .pill-mode.active {
      background: var(--accent);
      color: #04121d;
      font-weight: 700;
      border-color: var(--accent);
    }
    .divider {
      width: 1px;
      height: 18px;
      background: rgba(255, 255, 255, 0.12);
      margin: 0 4px;
    }

    /* Header Right: Controls & Actions */
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 4px 9px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      text-decoration: none;
      transition: all 0.12s;
      white-space: nowrap;
    }
    .btn:active { transform: scale(0.97); }
    .btn-bundle {
      background: #f59e0b;
      color: #181002;
      font-weight: 700;
    }
    .btn-bundle:hover { background: #fbbf24; }
    .btn-primary { background: var(--accent); color: #04121d; }
    .btn-primary:hover { background: #7dd3fc; }
    .btn-success { background: #10b981; color: #032117; }
    .btn-success:hover { background: #34d399; }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      color: var(--text);
      border-color: var(--card-border);
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.12); }

    /* Progress & Counter */
    .progress-text {
      font-size: 11px;
      color: var(--text-muted);
      font-family: monospace;
      white-space: nowrap;
    }

    /* Fluid 4K Grid Container */
    .container {
      width: 100%;
      max-width: 100%;
      padding: 10px 16px;
      margin: 0 auto;
    }

    /* Dynamic Grid Columns (1, 2, 3, or 4 cols) */
    .cards-grid {
      display: grid;
      gap: 16px;
      width: 100%;
    }
    .cards-grid.cols-1 { grid-template-columns: 1fr; }
    .cards-grid.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cards-grid.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .cards-grid.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

    @media (max-width: 1200px) {
      .cards-grid.cols-3, .cards-grid.cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 768px) {
      .cards-grid.cols-2, .cards-grid.cols-3, .cards-grid.cols-4 { grid-template-columns: 1fr; }
      .header-content { flex-direction: column; align-items: flex-start; }
    }

    /* Audit Card - Ultra Clean & Space Efficient */
    .audit-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      transition: border-color 0.15s;
    }
    .audit-card.status-needs-fix { border-color: rgba(239, 68, 68, 0.6); }
    .audit-card.status-good { border-color: rgba(16, 185, 129, 0.5); }
    .audit-card.status-tweak { border-color: rgba(245, 158, 11, 0.5); }

    /* Split Side-by-Side Mode (Image Left, Notes Right on 1-Col or 2-Col) */
    .cards-grid.layout-split .audit-card {
      flex-direction: row;
    }
    .cards-grid.layout-split .audit-card .card-main-area {
      flex: 1 1 70%;
      min-width: 0;
      border-right: 1px solid var(--card-border);
    }
    .cards-grid.layout-split .audit-card .card-feedback {
      flex: 0 0 30%;
      min-width: 260px;
      border-top: none;
    }
    @media (max-width: 900px) {
      .cards-grid.layout-split .audit-card { flex-direction: column; }
      .cards-grid.layout-split .audit-card .card-main-area { border-right: none; }
      .cards-grid.layout-split .audit-card .card-feedback { border-top: 1px solid var(--card-border); flex: auto; }
    }

    .card-main-area {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-width: 0;
    }

    /* Slim Single-Line Card Header (30px high) */
    .card-header {
      padding: 5px 10px;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .card-header-left {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      overflow: hidden;
    }
    .card-num {
      font-size: 10.5px;
      font-family: monospace;
      color: var(--accent);
      font-weight: 700;
    }
    .device-tag {
      font-size: 9px;
      padding: 1px 5px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.07);
      color: #cbd5e1;
      font-weight: 600;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .theme-tag {
      font-size: 9px;
      padding: 1px 5px;
      border-radius: 3px;
      font-weight: 600;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .theme-tag.dark { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
    .theme-tag.light { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
    .card-title {
      font-size: 12px;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-cat {
      font-size: 10px;
      color: var(--text-muted);
      white-space: nowrap;
    }

    /* Drawing Toolbar - Compact & Integrated */
    .draw-toolbar {
      padding: 4px 8px;
      background: rgba(12, 14, 22, 0.95);
      border-bottom: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      font-size: 10.5px;
    }
    .draw-tools-left, .draw-tools-right {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .tool-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 10.5px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      transition: all 0.12s;
    }
    .tool-btn:hover { background: rgba(255, 255, 255, 0.1); }
    .tool-btn.active {
      background: #ffffff;
      color: #000;
      font-weight: 700;
      border-color: #ffffff;
    }
    .swatch-btn {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.12s;
    }
    .swatch-btn.active {
      transform: scale(1.25);
      border-color: #ffffff;
      box-shadow: 0 0 6px rgba(255,255,255,0.6);
    }
    .swatch-red { background: #ef4444; }
    .swatch-yellow { background: #facc15; }
    .swatch-cyan { background: #38bdf8; }
    .swatch-white { background: #ffffff; }

    /* Visual Canvas Area - Pixel-Perfect Overlay */
    .card-visual-stage {
      position: relative;
      width: 100%;
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #030406;
      padding: 6px 0;
      user-select: none;
    }
    .image-canvas-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      max-width: 100%;
    }
    .screenshot-img {
      display: block;
      max-width: 100%;
      height: auto;
      max-height: var(--img-max-height);
      object-fit: contain;
      user-select: none;
      pointer-events: none;
      border-radius: 2px;
    }
    .overlay-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      touch-action: none;
      cursor: crosshair;
      z-index: 10;
      border-radius: 2px;
    }

    /* Compact Feedback Area (Around 35px high when empty, expands on click) */
    .card-feedback {
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-top: 1px solid var(--card-border);
      background: rgba(255, 255, 255, 0.012);
    }
    .feedback-compact-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      flex-wrap: wrap;
    }
    .status-btn-group {
      display: flex;
      gap: 4px;
    }
    .status-btn {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10.5px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-muted);
      border: 1px solid var(--card-border);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      transition: all 0.12s;
    }
    .status-btn:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
    .status-btn.active.needs-fix {
      background: rgba(239, 68, 68, 0.25);
      color: #fca5a5;
      border-color: rgba(239, 68, 68, 0.6);
    }
    .status-btn.active.tweak {
      background: rgba(245, 158, 11, 0.25);
      color: #fde68a;
      border-color: rgba(245, 158, 11, 0.6);
    }
    .status-btn.active.good {
      background: rgba(16, 185, 129, 0.25);
      color: #6ee7b7;
      border-color: rgba(16, 185, 129, 0.6);
    }

    /* Tag Chips - Small & Clean */
    .tags-container {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .tag-chip {
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 9.5px;
      background: rgba(255, 255, 255, 0.03);
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.06);
      cursor: pointer;
      user-select: none;
      transition: all 0.1s;
    }
    .tag-chip.selected {
      background: rgba(56, 189, 248, 0.18);
      color: var(--accent);
      border-color: rgba(56, 189, 248, 0.4);
      font-weight: 600;
    }

    /* Slim Notes Input (One-line default, expands on focus) */
    .notes-input-wrap {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .notes-textarea {
      width: 100%;
      min-height: 28px;
      height: 28px;
      padding: 5px 8px;
      border-radius: 5px;
      background: #090a10;
      border: 1px solid var(--card-border);
      color: #ffffff;
      font-family: inherit;
      font-size: 11.5px;
      resize: vertical;
      outline: none;
      transition: height 0.15s, border-color 0.15s;
    }
    .notes-textarea:focus, .notes-textarea.has-content {
      height: 64px;
      border-color: var(--accent);
    }
    .notes-footer {
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      color: #64748b;
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 10000;
      background: #1e293b;
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      transform: translateY(60px);
      opacity: 0;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }
  </style>
</head>
<body>

  <!-- Ultra-Slim Header -->
  <header>
    <div class="header-content">
      <div class="header-left">
        <div class="brand-title">
          <span>Remix 3D Studio</span>
          <span class="brand-badge">${manifest.length} Screens</span>
        </div>

        <div class="divider"></div>

        <!-- Device Filter Pills -->
        <div class="filter-group" id="devicePills">
          ${devices
            .map(
              (dev) =>
                `<button class="pill ${dev.id === 'all' ? 'active' : ''}" data-device="${dev.id}" onclick="filterByDevice('${dev.id}')">${dev.label} (${dev.count})</button>`
            )
            .join('')}
        </div>

        <div class="divider"></div>

        <!-- Theme Filters -->
        <div class="filter-group" id="modePills">
          <button class="pill pill-mode active" data-mode="all" onclick="filterByMode('all')">All</button>
          <button class="pill pill-mode" data-mode="dark" onclick="filterByMode('dark')">Dark</button>
          <button class="pill pill-mode" data-mode="light" onclick="filterByMode('light')">Light</button>
          <button class="pill" data-status="needs-fix" onclick="filterByStatus('needs-fix')">Fix (<span id="countNeedsFix">0</span>)</button>
          <button class="pill" data-status="has-notes" onclick="filterByStatus('has-notes')">Notes (<span id="countHasNotes">0</span>)</button>
        </div>
      </div>

      <div class="header-right">
        <!-- 4K Grid Column Selector -->
        <span style="font-size:10px; color:#94a3b8;">Cols:</span>
        <div class="filter-group" id="colControls">
          <button class="pill" data-col="1" onclick="setGridColumns(1)">1</button>
          <button class="pill" data-col="2" onclick="setGridColumns(2)">2</button>
          <button class="pill active" data-col="3" onclick="setGridColumns(3)">3</button>
          <button class="pill" data-col="4" onclick="setGridColumns(4)">4</button>
        </div>

        <!-- Image Height Scale Selector -->
        <span style="font-size:10px; color:#94a3b8; margin-left:4px;">Size:</span>
        <div class="filter-group" id="scaleControls">
          <button class="pill" onclick="setImageHeight('550px')">Med</button>
          <button class="pill active" onclick="setImageHeight('78vh')">Large</button>
          <button class="pill" onclick="setImageHeight('92vh')">Full 4K</button>
        </div>

        <!-- Layout Split / Stacked -->
        <button class="pill" id="layoutToggleBtn" onclick="toggleLayoutSplit()">Split Layout</button>

        <div class="divider"></div>

        <span class="progress-text" id="progressText">0/${manifest.length}</span>
        <a href="/download-complete-bundle-zip" class="btn btn-bundle" title="Download all 233 full-res PNGs in one ZIP">ZIP Bundle (173MB)</a>
        <button type="button" class="btn btn-primary" onclick="exportZipPackage()">Export Reviews</button>
        <button type="button" class="btn btn-success" onclick="saveAuditFeedbackToServer()">Save Notes</button>
      </div>
    </div>
  </header>

  <!-- Main Fluid Container -->
  <main class="container">
    <div class="cards-grid cols-3" id="cardsGrid">
      ${manifest
        .map((item, index) => {
          const isDark = item.theme === 'dark' || item.filename.includes('dark');
          const themeLabel = isDark ? 'DARK' : 'LIGHT';
          const themeClass = isDark ? 'dark' : 'light';
          const deviceLabel =
            item.device === 's6lite-portrait'
              ? 'Tab S6 · Port'
              : item.device === 's6lite-landscape'
              ? 'Tab S6 · Land'
              : 'S25 Ultra';

          return `
        <article
          class="audit-card"
          id="card-${index}"
          data-index="${index}"
          data-device="${item.device || 's25ultra'}"
          data-theme="${themeClass}"
          data-category="${item.category || 'General'}"
          data-filename="${item.filename}"
        >
          <div class="card-main-area">
            <!-- Slim Card Header -->
            <div class="card-header">
              <div class="card-header-left">
                <span class="card-num">#${String(index + 1).padStart(3, '0')}</span>
                <span class="device-tag">${deviceLabel}</span>
                <span class="theme-tag ${themeClass}">${themeLabel}</span>
                <h2 class="card-title" title="${item.description}">${item.description}</h2>
              </div>
              <span class="card-cat">${item.category || 'General'}</span>
            </div>

            <!-- Integrated Slim Drawing Toolbar -->
            <div class="draw-toolbar">
              <div class="draw-tools-left">
                <button type="button" class="tool-btn active" id="drawBtn-${index}" onclick="setTool(${index}, 'pen')">Draw</button>
                <button type="button" class="tool-btn" id="highlighterBtn-${index}" onclick="setTool(${index}, 'highlighter')">Highlight</button>
                <button type="button" class="tool-btn" id="eraserBtn-${index}" onclick="setTool(${index}, 'eraser')">Eraser</button>
                <div class="divider" style="height:12px; margin:0 2px;"></div>
                <button type="button" class="swatch-btn swatch-red active" id="swatch-red-${index}" title="Red" onclick="setStrokeColor(${index}, '#ef4444')"></button>
                <button type="button" class="swatch-btn swatch-yellow" id="swatch-yellow-${index}" title="Yellow" onclick="setStrokeColor(${index}, '#facc15')"></button>
                <button type="button" class="swatch-btn swatch-cyan" id="swatch-cyan-${index}" title="Cyan" onclick="setStrokeColor(${index}, '#38bdf8')"></button>
                <button type="button" class="swatch-btn swatch-white" id="swatch-white-${index}" title="White" onclick="setStrokeColor(${index}, '#ffffff')"></button>
              </div>
              <div class="draw-tools-right">
                <button type="button" class="tool-btn" title="Undo stroke" onclick="undoCanvas(${index})">Undo</button>
                <button type="button" class="tool-btn" title="Clear markings" onclick="clearCanvas(${index})">Clear</button>
              </div>
            </div>

            <!-- Visual Stage & Canvas Overlay -->
            <div class="card-visual-stage">
              <div class="image-canvas-wrapper" id="wrap-${index}">
                <img
                  src="${item.url || `/screenshots/s25ultra-audit/${item.filename}`}"
                  alt="${item.description}"
                  class="screenshot-img"
                  id="img-${index}"
                  loading="lazy"
                  onload="setupImageCanvas(${index})"
                />
                <canvas class="overlay-canvas" id="canvas-${index}"></canvas>
              </div>
            </div>
          </div>

          <!-- Space-Efficient Card Feedback Section -->
          <div class="card-feedback">
            <div class="feedback-compact-row">
              <div class="status-btn-group">
                <button type="button" class="status-btn" id="status-fix-${index}" onclick="setStatus(${index}, 'needs-fix')">Fix</button>
                <button type="button" class="status-btn" id="status-tweak-${index}" onclick="setStatus(${index}, 'tweak')">Tweak</button>
                <button type="button" class="status-btn" id="status-good-${index}" onclick="setStatus(${index}, 'good')">Approved</button>
              </div>

              <select class="tool-btn" id="priority-${index}" onchange="saveFeedbackState(${index})">
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
                <option value="polish">Polish</option>
              </select>
            </div>

            <!-- Compact Tag Chips -->
            <div class="tags-container">
              <span class="tag-chip" onclick="toggleTag(${index}, 'Layout', this)">Layout</span>
              <span class="tag-chip" onclick="toggleTag(${index}, 'Hitbox', this)">Hitbox</span>
              <span class="tag-chip" onclick="toggleTag(${index}, 'Typography', this)">Typography</span>
              <span class="tag-chip" onclick="toggleTag(${index}, 'Color', this)">Color</span>
              <span class="tag-chip" onclick="toggleTag(${index}, 'S-Pen', this)">S-Pen</span>
              <span class="tag-chip" onclick="toggleTag(${index}, 'Bug', this)">Bug</span>
            </div>

            <!-- Expandable Notes Input -->
            <div class="notes-input-wrap">
              <textarea
                class="notes-textarea"
                id="notes-${index}"
                placeholder="Write review note..."
                oninput="onNotesInput(${index})"
                onfocus="this.classList.add('has-content')"
                onblur="if(!this.value.trim()) this.classList.remove('has-content')"
              ></textarea>
              <div class="notes-footer">
                <span id="charCount-${index}">0 chars</span>
              </div>
            </div>
          </div>
        </article>
      `;
        })
        .join('')}
    </div>
  </main>

  <!-- Toast Notification -->
  <div class="toast" id="toast">
    <span id="toastMsg">Feedback saved successfully</span>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
  <script>
    const manifest = ${JSON.stringify(manifest)};
    const auditData = {};
    const canvasStates = {};
    let activeDeviceFilter = 'all';
    let activeModeFilter = 'all';
    let activeStatusFilter = null;
    let isSplitLayout = false;

    // Load saved feedback from localStorage
    function loadSavedFeedback() {
      try {
        const saved = localStorage.getItem('remix3d_audit_feedback_v20');
        if (saved) Object.assign(auditData, JSON.parse(saved));
      } catch (e) {
        console.warn('Storage error:', e);
      }
    }
    loadSavedFeedback();

    // 100% Reliable Canvas Initialization & Sizing
    function setupImageCanvas(index) {
      const img = document.getElementById('img-' + index);
      const canvas = document.getElementById('canvas-' + index);
      if (!img || !canvas) return;

      const rect = img.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);

      if (w <= 0 || h <= 0) {
        setTimeout(() => setupImageCanvas(index), 120);
        return;
      }

      canvas.width = w;
      canvas.height = h;

      if (!canvasStates[index]) {
        canvasStates[index] = {
          ctx: canvas.getContext('2d'),
          color: '#ef4444',
          tool: 'pen', // 'pen', 'highlighter', 'eraser'
          lineWidth: 4,
          isDrawing: false,
          strokes: []
        };
      } else {
        canvasStates[index].ctx = canvas.getContext('2d');
      }

      // Re-hydrate stored drawings if available
      if (canvasStates[index].strokes.length > 0) {
        redrawAllStrokes(index);
      } else if (auditData[index] && auditData[index].drawingDataUrl) {
        const savedImg = new Image();
        savedImg.onload = () => {
          canvasStates[index].ctx.drawImage(savedImg, 0, 0, canvas.width, canvas.height);
        };
        savedImg.src = auditData[index].drawingDataUrl;
      }

      hydrateCardUi(index);
      bindPointerEvents(index, canvas);
    }

    // Unified PointerEvents for Mouse, Touch, Stylus, S-Pen
    function bindPointerEvents(index, canvas) {
      if (canvas.__hasBoundEvents) return;
      canvas.__hasBoundEvents = true;

      const state = canvasStates[index];

      function getPoint(e) {
        const r = canvas.getBoundingClientRect();
        const scaleX = canvas.width / r.width;
        const scaleY = canvas.height / r.height;
        return {
          x: (e.clientX - r.left) * scaleX,
          y: (e.clientY - r.top) * scaleY
        };
      }

      canvas.addEventListener('pointerdown', (e) => {
        canvas.setPointerCapture(e.pointerId);
        state.isDrawing = true;
        const pt = getPoint(e);

        state.currentStroke = {
          tool: state.tool,
          color: state.color,
          lineWidth: state.tool === 'highlighter' ? 22 : (state.tool === 'eraser' ? 24 : state.lineWidth),
          points: [pt]
        };

        const ctx = state.ctx;
        ctx.beginPath();
        applyStrokeStyle(ctx, state.currentStroke);
        ctx.moveTo(pt.x, pt.y);
      });

      canvas.addEventListener('pointermove', (e) => {
        if (!state.isDrawing || !state.currentStroke) return;
        const pt = getPoint(e);
        state.currentStroke.points.push(pt);

        const ctx = state.ctx;
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      });

      function stopDraw(e) {
        if (!state.isDrawing) return;
        state.isDrawing = false;
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        if (state.currentStroke) {
          state.strokes.push(state.currentStroke);
          state.currentStroke = null;
          saveCanvasToStorage(index);
        }
      }

      canvas.addEventListener('pointerup', stopDraw);
      canvas.addEventListener('pointercancel', stopDraw);
    }

    function applyStrokeStyle(ctx, stroke) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.lineWidth || 24;
      } else if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
        ctx.lineWidth = stroke.lineWidth || 22;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color || '#ef4444';
        ctx.lineWidth = stroke.lineWidth || 4;
      }
    }

    function setTool(index, tool) {
      const state = canvasStates[index];
      if (!state) return;
      state.tool = tool;

      const card = document.getElementById('card-' + index);
      card.querySelector('#drawBtn-' + index).classList.toggle('active', tool === 'pen');
      card.querySelector('#highlighterBtn-' + index).classList.toggle('active', tool === 'highlighter');
      card.querySelector('#eraserBtn-' + index).classList.toggle('active', tool === 'eraser');
    }

    function setStrokeColor(index, colorHex) {
      const state = canvasStates[index];
      if (!state) return;
      state.color = colorHex;
      state.tool = 'pen';

      const card = document.getElementById('card-' + index);
      card.querySelectorAll('.swatch-btn').forEach(b => b.classList.remove('active'));
      const activeSwatch = card.querySelector(\`[id^="swatch-"][id$="-\${index}"][style*="\${colorHex}"], .swatch-red\`);
      if (activeSwatch) activeSwatch.classList.add('active');

      card.querySelector('#drawBtn-' + index).classList.add('active');
      card.querySelector('#highlighterBtn-' + index).classList.remove('active');
      card.querySelector('#eraserBtn-' + index).classList.remove('active');
    }

    function undoCanvas(index) {
      const state = canvasStates[index];
      if (!state || state.strokes.length === 0) return;
      state.strokes.pop();
      redrawAllStrokes(index);
      saveCanvasToStorage(index);
    }

    function clearCanvas(index) {
      const state = canvasStates[index];
      const canvas = document.getElementById('canvas-' + index);
      if (!state || !canvas) return;
      state.strokes = [];
      state.ctx.clearRect(0, 0, canvas.width, canvas.height);
      saveCanvasToStorage(index);
    }

    function redrawAllStrokes(index) {
      const state = canvasStates[index];
      const canvas = document.getElementById('canvas-' + index);
      if (!state || !canvas) return;
      const ctx = state.ctx;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const stroke of state.strokes) {
        if (!stroke.points || stroke.points.length === 0) continue;
        ctx.beginPath();
        applyStrokeStyle(ctx, stroke);
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function saveCanvasToStorage(index) {
      const canvas = document.getElementById('canvas-' + index);
      if (!canvas) return;
      if (!auditData[index]) auditData[index] = {};
      auditData[index].drawingDataUrl = canvas.toDataURL('image/png');
      persistToLocalStorage();
    }

    // UI Feedback Helpers
    function setStatus(index, status) {
      if (!auditData[index]) auditData[index] = {};
      auditData[index].status = status;

      const card = document.getElementById('card-' + index);
      card.classList.remove('status-needs-fix', 'status-good', 'status-tweak');
      if (status === 'needs-fix') card.classList.add('status-needs-fix');
      if (status === 'tweak') card.classList.add('status-tweak');
      if (status === 'good') card.classList.add('status-good');

      card.querySelector('#status-fix-' + index).classList.toggle('active', status === 'needs-fix');
      card.querySelector('#status-tweak-' + index).classList.toggle('active', status === 'tweak');
      card.querySelector('#status-good-' + index).classList.toggle('active', status === 'good');

      persistToLocalStorage();
      updateProgressCounters();
    }

    function toggleTag(index, tag, el) {
      if (!auditData[index]) auditData[index] = {};
      if (!auditData[index].tags) auditData[index].tags = [];
      const tags = auditData[index].tags;
      const pos = tags.indexOf(tag);
      if (pos > -1) tags.splice(pos, 1);
      else tags.push(tag);

      el.classList.toggle('selected', pos === -1);
      persistToLocalStorage();
      updateProgressCounters();
    }

    function onNotesInput(index) {
      const textarea = document.getElementById('notes-' + index);
      const val = textarea.value;
      if (!auditData[index]) auditData[index] = {};
      auditData[index].notes = val;
      textarea.classList.toggle('has-content', val.trim().length > 0);
      document.getElementById('charCount-' + index).innerText = val.length + ' chars';
      persistToLocalStorage();
      updateProgressCounters();
    }

    function saveFeedbackState(index) {
      const p = document.getElementById('priority-' + index).value;
      if (!auditData[index]) auditData[index] = {};
      auditData[index].priority = p;
      persistToLocalStorage();
    }

    function hydrateCardUi(index) {
      const data = auditData[index];
      if (!data) return;

      if (data.notes) {
        const txt = document.getElementById('notes-' + index);
        txt.value = data.notes;
        txt.classList.add('has-content');
        document.getElementById('charCount-' + index).innerText = data.notes.length + ' chars';
      }
      if (data.status) setStatus(index, data.status);
      if (data.priority) document.getElementById('priority-' + index).value = data.priority;
      if (data.tags && Array.isArray(data.tags)) {
        const card = document.getElementById('card-' + index);
        card.querySelectorAll('.tag-chip').forEach(chip => {
          chip.classList.toggle('selected', data.tags.includes(chip.innerText));
        });
      }
    }

    function persistToLocalStorage() {
      try {
        localStorage.setItem('remix3d_audit_feedback_v20', JSON.stringify(auditData));
      } catch (e) {
        console.warn('Storage quota warning:', e);
      }
    }

    function updateProgressCounters() {
      let reviewedCount = 0;
      let fixCount = 0;
      let notesCount = 0;

      for (let i = 0; i < manifest.length; i++) {
        const d = auditData[i];
        if (d && (d.notes || d.status || (d.tags && d.tags.length > 0) || d.drawingDataUrl)) reviewedCount++;
        if (d && d.status === 'needs-fix') fixCount++;
        if (d && d.notes && d.notes.trim().length > 0) notesCount++;
      }

      document.getElementById('progressText').innerText = reviewedCount + '/' + manifest.length;
      document.getElementById('countNeedsFix').innerText = fixCount;
      document.getElementById('countHasNotes').innerText = notesCount;
    }

    // Grid Columns & Scaling Controls
    function setGridColumns(cols) {
      const grid = document.getElementById('cardsGrid');
      grid.classList.remove('cols-1', 'cols-2', 'cols-3', 'cols-4');
      grid.classList.add('cols-' + cols);
      document.querySelectorAll('#colControls .pill').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-col') == cols);
      });
      // Re-measure canvases after layout reflow
      setTimeout(() => {
        manifest.forEach((_, i) => setupImageCanvas(i));
      }, 150);
    }

    function setImageHeight(h) {
      document.documentElement.style.setProperty('--img-max-height', h);
      document.querySelectorAll('#scaleControls .pill').forEach(b => {
        b.classList.toggle('active', b.innerText === (h === '550px' ? 'Med' : (h === '78vh' ? 'Large' : 'Full 4K')));
      });
      setTimeout(() => {
        manifest.forEach((_, i) => setupImageCanvas(i));
      }, 150);
    }

    function toggleLayoutSplit() {
      isSplitLayout = !isSplitLayout;
      const grid = document.getElementById('cardsGrid');
      grid.classList.toggle('layout-split', isSplitLayout);
      const btn = document.getElementById('layoutToggleBtn');
      btn.classList.toggle('active', isSplitLayout);
      btn.innerText = isSplitLayout ? 'Stacked Layout' : 'Split Layout';
      setTimeout(() => {
        manifest.forEach((_, i) => setupImageCanvas(i));
      }, 150);
    }

    // Filters
    function filterByDevice(dev) {
      activeDeviceFilter = dev;
      document.querySelectorAll('#devicePills .pill').forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-device') === dev);
      });
      applyCombinedFilters();
    }

    function filterByMode(mode) {
      activeModeFilter = mode;
      document.querySelectorAll('#modePills .pill-mode').forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-mode') === mode);
      });
      applyCombinedFilters();
    }

    function filterByStatus(status) {
      activeStatusFilter = activeStatusFilter === status ? null : status;
      document.querySelectorAll('#modePills .pill[data-status]').forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-status') === activeStatusFilter);
      });
      applyCombinedFilters();
    }

    function applyCombinedFilters() {
      const cards = document.querySelectorAll('.audit-card');
      cards.forEach(card => {
        const idx = parseInt(card.getAttribute('data-index'));
        const d = auditData[idx];
        const cardDevice = card.getAttribute('data-device');
        const cardTheme = card.getAttribute('data-theme');

        const matchDev = (activeDeviceFilter === 'all') || (cardDevice === activeDeviceFilter);
        const matchMode = (activeModeFilter === 'all') || (cardTheme === activeModeFilter);
        let matchStatus = true;
        if (activeStatusFilter === 'needs-fix') matchStatus = !!(d && d.status === 'needs-fix');
        else if (activeStatusFilter === 'has-notes') matchStatus = !!(d && d.notes && d.notes.trim().length > 0);

        card.style.display = (matchDev && matchMode && matchStatus) ? 'flex' : 'none';
      });
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      document.getElementById('toastMsg').innerText = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Save Feedback to Project Files on Server
    async function saveAuditFeedbackToServer() {
      try {
        showToast('Saving feedback to project...');
        const payload = { auditData, manifest, timestamp: new Date().toISOString() };
        const res = await fetch('/api/save-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) showToast('Feedback saved! Notes & drawings updated in project.');
        else showToast('Saved locally in browser.');
      } catch (err) {
        showToast('Saved locally in browser.');
      }
    }

    // Export ZIP package with annotated images
    async function exportZipPackage() {
      try {
        showToast('Creating ZIP archive...');
        const zip = new JSZip();
        let report = '# Remix 3D Studio - Comprehensive Review\\n\\n';
        for (let i = 0; i < manifest.length; i++) {
          const item = manifest[i];
          const d = auditData[i];
          if (!d) continue;
          report += \`## \${item.filename}: \${item.description}\\n\`;
          report += \`- Status: \${d.status || 'None'}\\n\`;
          report += \`- Notes: \${d.notes || 'None'}\\n\\n\`;
          if (d.drawingDataUrl) {
            const base64Data = d.drawingDataUrl.replace(/^data:image\\/png;base64,/, '');
            zip.file('annotations/annotated_' + item.filename, base64Data, { base64: true });
          }
        }
        zip.file('AUDIT_REPORT.md', report);
        zip.file('audit-data.json', JSON.stringify(auditData, null, 2));

        const content = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = 'remix3d-audit-reviews.zip';
        a.click();
        showToast('Review ZIP downloaded!');
      } catch (err) {
        console.error('ZIP error:', err);
      }
    }

    window.addEventListener('load', () => {
      updateProgressCounters();
      // On 4K screens (width >= 2400px), default to 4 columns
      if (window.innerWidth >= 2400) {
        setGridColumns(4);
      } else if (window.innerWidth >= 1600) {
        setGridColumns(3);
      }
    });

    // Window resize observer to ensure canvases stay perfectly mapped
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        manifest.forEach((_, i) => setupImageCanvas(i));
      }, 180);
    });
  </script>
</body>
</html>`;
}

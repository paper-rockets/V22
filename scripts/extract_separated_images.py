import cv2
import numpy as np
import os
import shutil

SHEETS = [
    {
        'id': 'sheet1',
        'folder': 'sheet1_reaph1',
        'path': r"C:\Users\macie\Downloads\Gemini_Generated_Image_reaph1reaph1reap.jpg",
        'label': 'Sheet 1 (reaph1)',
        'expected_rows': 7,
        'expected_cols': 8
    },
    {
        'id': 'sheet2',
        'folder': 'sheet2_hnk7',
        'path': r"C:\Users\macie\Downloads\Gemini_Generated_Image_hnk7d2hnk7d2hnk7.jpg",
        'label': 'Sheet 2 (hnk7)',
        'expected_rows': 6,
        'expected_cols': 8
    },
    {
        'id': 'sheet3',
        'folder': 'sheet3_h4oldm',
        'path': r"C:\Users\macie\Downloads\Gemini_Generated_Image_h4oldmh4oldmh4ol.jpg",
        'label': 'Sheet 3 (h4oldm)',
        'expected_rows': 6,
        'expected_cols': 8
    }
]

BASE_OUTPUT = r"E:\X\AiStudio Workflow\V22\separated_images"
PUBLIC_OUTPUT = r"E:\X\AiStudio Workflow\V22\public\separated_images"

CANVAS_SIZE = 340

def get_bands(prof, min_len=40, thresh=80):
    bands = []
    in_b = False
    start = 0
    for i, v in enumerate(prof):
        if v > thresh and not in_b:
            in_b = True
            start = i
        elif v <= thresh and in_b:
            in_b = False
            if (i - start) >= min_len:
                bands.append((start, i))
    if in_b and (len(prof) - start) >= min_len:
        bands.append((start, len(prof)))
    return bands

def process_sheet(sheet, global_counter):
    p = sheet['path']
    if not os.path.exists(p):
        raise FileNotFoundError(f"Source file not found: {p}")

    img = cv2.imread(p)
    h, w, _ = img.shape

    bg = np.median(np.vstack([img[:30, :30], img[:30, -30:], img[-30:, :30], img[-30:, -30:]]), axis=(0,1))
    diff = np.linalg.norm(img.astype(np.float32) - bg, axis=2)
    mask = (diff > 25).astype(np.uint8)

    r_bands = get_bands(np.sum(mask, axis=1))
    c_bands = get_bands(np.sum(mask, axis=0))

    if len(r_bands) != sheet['expected_rows'] or len(c_bands) != sheet['expected_cols']:
        raise ValueError(f"Unexpected bands for {sheet['id']}: rows={len(r_bands)}, cols={len(c_bands)}")

    r_gutters = [r_bands[i+1][0] - r_bands[i][1] for i in range(len(r_bands)-1)]
    c_gutters = [c_bands[j+1][0] - c_bands[j][1] for j in range(len(c_bands)-1)]
    avg_rg = int(np.mean(r_gutters) // 2)
    avg_cg = int(np.mean(c_gutters) // 2)

    sheet_out_dir = os.path.join(BASE_OUTPUT, sheet['folder'])
    all_out_dir = os.path.join(BASE_OUTPUT, 'all')
    os.makedirs(sheet_out_dir, exist_ok=True)
    os.makedirs(all_out_dir, exist_ok=True)

    extracted = []

    model_idx = 1
    for r in range(len(r_bands)):
        top = max(0, r_bands[r][0] - (r_gutters[r-1]//2 if r > 0 else avg_rg))
        bot = min(h, r_bands[r][1] + (r_gutters[r]//2 if r < len(r_bands)-1 else avg_rg))
        for c in range(len(c_bands)):
            left = max(0, c_bands[c][0] - (c_gutters[c-1]//2 if c > 0 else avg_cg))
            right = min(w, c_bands[c][1] + (c_gutters[c]//2 if c < len(c_bands)-1 else avg_cg))

            cell_mask = mask[top:bot, left:right]
            coords = np.argwhere(cell_mask > 0)
            if len(coords) == 0:
                print(f"Warning: no pixels in cell r={r}, c={c}")
                continue

            cy_min, cx_min = coords.min(axis=0)
            cy_max, cx_max = coords.max(axis=0)

            box_y1 = top + cy_min
            box_y2 = top + cy_max
            box_x1 = left + cx_min
            box_x2 = left + cx_max

            char_crop = img[box_y1:box_y2+1, box_x1:box_x2+1]
            ch_h, ch_w, _ = char_crop.shape

            cell_border_pixels = np.vstack([
                img[top:top+5, left:right].reshape(-1, 3),
                img[bot-5:bot, left:right].reshape(-1, 3),
                img[top:bot, left:left+5].reshape(-1, 3),
                img[top:bot, right-5:right].reshape(-1, 3)
            ])
            local_bg = np.median(cell_border_pixels, axis=0).astype(np.uint8)

            canvas = np.full((CANVAS_SIZE, CANVAS_SIZE, 3), local_bg, dtype=np.uint8)

            off_y = (CANVAS_SIZE - ch_h) // 2
            off_x = (CANVAS_SIZE - ch_w) // 2
            canvas[off_y:off_y+ch_h, off_x:off_x+ch_w] = char_crop

            sheet_filename = f"{sheet['id']}_model_{model_idx:02d}_r{r+1}_c{c+1}.png"
            all_filename = f"model_{global_counter:03d}_{sheet['id']}_r{r+1}_c{c+1}.png"

            sheet_path = os.path.join(sheet_out_dir, sheet_filename)
            all_path = os.path.join(all_out_dir, all_filename)

            cv2.imwrite(sheet_path, canvas)
            cv2.imwrite(all_path, canvas)

            extracted.append({
                'global_id': global_counter,
                'sheet_id': sheet['id'],
                'sheet_label': sheet['label'],
                'row': r + 1,
                'col': c + 1,
                'sheet_filename': sheet_filename,
                'all_filename': all_filename,
                'sheet_rel_path': f"{sheet['folder']}/{sheet_filename}",
                'all_rel_path': f"all/{all_filename}",
                'width': ch_w,
                'height': ch_h
            })

            model_idx += 1
            global_counter += 1

    print(f"Finished {sheet['label']}: {len(extracted)} models extracted.")
    return extracted, global_counter

def main():
    os.makedirs(BASE_OUTPUT, exist_ok=True)
    all_models = []
    counter = 1

    for s in SHEETS:
        models, counter = process_sheet(s, counter)
        all_models.extend(models)

    if os.path.exists(PUBLIC_OUTPUT):
        shutil.rmtree(PUBLIC_OUTPUT)
    shutil.copytree(BASE_OUTPUT, PUBLIC_OUTPUT)
    print(f"Copied all {len(all_models)} separated images to {PUBLIC_OUTPUT}")

    cards_html = []
    for m in all_models:
        cards_html.append(f"""    <div class="card" data-sheet="{m['sheet_id']}">
      <a href="/separated_images/{m['sheet_rel_path']}" target="_blank">
        <img src="/separated_images/{m['sheet_rel_path']}" alt="{m['sheet_filename']}" loading="lazy" />
      </a>
      <div class="card-info">
        <div class="name">#{m['global_id']:03d} &bull; {m['sheet_id'].upper()}</div>
        <div>Row {m['row']}, Col {m['col']} ({m['width']}x{m['height']}px)</div>
        <a class="download-link" href="/separated_images/{m['sheet_rel_path']}" download="{m['sheet_filename']}">Download PNG</a>
      </div>
    </div>""")

    cards_joined = "\n".join(cards_html)

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Separated Models Gallery (152 Models)</title>
  <style>
    :root {{
      --bg: #121212;
      --card-bg: #1e1e1e;
      --border: #333;
      --text: #f0f0f0;
      --accent: #4f46e5;
    }}
    body {{
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
    }}
    header {{
      max-width: 1400px;
      margin: 0 auto 24px auto;
    }}
    h1 {{
      margin: 0 0 8px 0;
      font-size: 24px;
    }}
    p {{
      margin: 0 0 16px 0;
      color: #999;
      font-size: 14px;
    }}
    .filters {{
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }}
    .filter-btn {{
      background: var(--card-bg);
      color: var(--text);
      border: 1px solid var(--border);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }}
    .filter-btn.active {{
      background: var(--accent);
      border-color: var(--accent);
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
      max-width: 1400px;
      margin: 0 auto;
    }}
    .card {{
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }}
    .card:hover {{
      transform: translateY(-2px);
      border-color: #6366f1;
    }}
    .card img {{
      width: 100%;
      height: auto;
      aspect-ratio: 1 / 1;
      object-fit: contain;
      border-radius: 4px;
      background: #faeee0;
    }}
    .card-info {{
      margin-top: 8px;
      font-size: 12px;
      text-align: center;
      color: #bbb;
      width: 100%;
    }}
    .card-info .name {{
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
    }}
    .download-link {{
      display: inline-block;
      margin-top: 6px;
      font-size: 11px;
      color: #818cf8;
      text-decoration: none;
    }}
    .download-link:hover {{
      text-decoration: underline;
    }}
  </style>
</head>
<body>
  <header>
    <h1>Separated Character Models</h1>
    <p>Extracted 152 individual models from the 3 Gemini image sheets. Saved in <code>E:\\X\\AiStudio Workflow\\V22\\separated_images</code>.</p>
    <div class="filters">
      <button class="filter-btn active" onclick="filterGallery('all', this)">All Models ({len(all_models)})</button>
      <button class="filter-btn" onclick="filterGallery('sheet1', this)">Sheet 1 (56 models)</button>
      <button class="filter-btn" onclick="filterGallery('sheet2', this)">Sheet 2 (48 models)</button>
      <button class="filter-btn" onclick="filterGallery('sheet3', this)">Sheet 3 (48 models)</button>
    </div>
  </header>

  <div class="grid" id="galleryGrid">
{cards_joined}
  </div>

  <script>
    function filterGallery(sheetId, btn) {{
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cards = document.querySelectorAll('.card');
      cards.forEach(card => {{
        if (sheetId === 'all' || card.dataset.sheet === sheetId) {{
          card.style.display = 'flex';
        }} else {{
          card.style.display = 'none';
        }}
      }});
    }}
  </script>
</body>
</html>"""

    with open(r"E:\X\AiStudio Workflow\V22\separated_images.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    with open(r"E:\X\AiStudio Workflow\V22\public\separated_images.html", "w", encoding="utf-8") as f:
        f.write(html_content)

    print("Created separated_images.html gallery in root and public folders.")
    print(f"Total models extracted: {len(all_models)}")

if __name__ == '__main__':
    main()

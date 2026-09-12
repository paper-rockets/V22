import os
import json
import time
from PIL import Image, ImageDraw, ImageFont

CANVAS_W = 2048
CANVAS_H = 1539

BASE_DIR = r'e:\X\AiStudio Workflow\V20\ALL_SCREENSHOTS'
FLAT_DIR = os.path.join(BASE_DIR, 'ALL_SCREENSHOTS_FLAT')
CATALOG_PATH = os.path.join(BASE_DIR, 'ALL_SCREENSHOTS_CATALOG.json')
OUTPUT_DIR = os.path.join(BASE_DIR, 'CONTACT_SHEETS_2048x1539')

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
    ALL_ITEMS = json.load(f)

# Fonts
FONT_TITLE = ImageFont.truetype('segoeuib.ttf', 24)
FONT_SUBTITLE = ImageFont.truetype('segoeuib.ttf', 15)
FONT_META = ImageFont.truetype('segoeui.ttf', 12)
FONT_BADGE = ImageFont.truetype('segoeuib.ttf', 11)
FONT_CARD_TITLE = ImageFont.truetype('segoeuib.ttf', 11)
FONT_CARD_SUB = ImageFont.truetype('segoeui.ttf', 9)
FONT_FOOTER = ImageFont.truetype('segoeui.ttf', 11)

def truncate_text(draw, text, font, max_width):
    if draw.textlength(text, font=font) <= max_width:
        return text
    while len(text) > 3 and draw.textlength(text + '…', font=font) > max_width:
        text = text[:-1]
    return text + '…'

def render_sheet(sheet_idx, total_sheets, sheet_config):
    title = sheet_config['title']
    subtitle = sheet_config['subtitle']
    device = sheet_config['device']
    filename_prefix = sheet_config['filename_prefix']
    items = sheet_config['items']
    cols = sheet_config['cols']
    thumb_w = sheet_config['thumb_w']
    aspect_ratio = sheet_config['aspect_ratio'] # h / w
    
    thumb_h = int(thumb_w * aspect_ratio)
    card_pad = 5
    label_h = 42
    cell_w = thumb_w + card_pad * 2
    cell_h = thumb_h + card_pad * 2 + label_h
    
    gap_x = 12
    gap_y = 12
    
    # Calculate rows needed
    num_items = len(items)
    rows = (num_items + cols - 1) // cols
    
    # Calculate grid bounds
    grid_w = cols * cell_w + (cols - 1) * gap_x
    grid_h = rows * cell_h + (rows - 1) * gap_y
    
    # Center horizontally and vertically within 2048 x 1539
    margin_x = (CANVAS_W - grid_w) // 2
    header_h = 100
    footer_h = 36
    available_h = CANVAS_H - header_h - footer_h
    margin_y = header_h + (available_h - grid_h) // 2
    
    # Create exact 2048 x 1539 canvas
    sheet = Image.new('RGB', (CANVAS_W, CANVAS_H), (14, 16, 21))
    draw = ImageDraw.Draw(sheet)
    
    # Header background banner
    draw.rectangle([(0, 0), (CANVAS_W, 90)], fill=(20, 24, 33))
    draw.line([(0, 90), (CANVAS_W, 90)], fill=(38, 44, 58), width=2)
    
    # Header Text
    screen_range = f"Screens #{items[0]['num']:03d} – #{items[-1]['num']:03d}"
    draw.text((32, 14), "REMIX 3D STUDIO  •  V20 MOBILE-FIRST AUDIT", fill=(56, 189, 248), font=FONT_TITLE)
    sheet_heading = f"SHEET {sheet_idx:02d} OF {total_sheets:02d}  —  {title.upper()}  •  {screen_range}"
    draw.text((32, 44), sheet_heading, fill=(255, 255, 255), font=FONT_SUBTITLE)
    meta_line = f"Canvas: {CANVAS_W} × {CANVAS_H} px  |  Format: Fixed 2048×1539  |  {len(items)} Screens  |  Location: E:\\X\\AiStudio Workflow\\V20\\ALL_SCREENSHOTS"
    draw.text((32, 66), meta_line, fill=(148, 163, 184), font=FONT_META)
    
    # Render Item Cards
    for idx, item in enumerate(items):
        c = idx % cols
        r = idx // cols
        
        x = margin_x + c * (cell_w + gap_x)
        y = margin_y + r * (cell_h + gap_y)
        
        # Card background
        draw.rounded_rectangle(
            [(x, y), (x + cell_w, y + cell_h)],
            radius=6,
            fill=(22, 26, 35),
            outline=(38, 44, 58),
            width=1
        )
        
        # Thumbnail image
        img_path = os.path.join(FLAT_DIR, item['flatFilename'])
        if os.path.exists(img_path):
            with Image.open(img_path) as img:
                resized = img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
                sheet.paste(resized, (x + card_pad, y + card_pad))
                draw.rectangle(
                    [(x + card_pad, y + card_pad), (x + card_pad + thumb_w - 1, y + card_pad + thumb_h - 1)],
                    outline=(48, 54, 70),
                    width=1
                )
        
        # Number badge
        badge_str = f"#{item['num']:03d}"
        bx = x + card_pad + 4
        by = y + card_pad + 4
        draw.rounded_rectangle([(bx, by), (bx + 38, by + 16)], radius=3, fill=(10, 12, 16, 220), outline=(56, 189, 248), width=1)
        draw.text((bx + 4, by + 1), badge_str, fill=(255, 255, 255), font=FONT_BADGE)
        
        # Label text
        tx = x + card_pad
        ty = y + card_pad + thumb_h + 5
        avail_w = thumb_w
        
        cat_text = f"{item['category'].upper()}"
        cat_text = truncate_text(draw, cat_text, FONT_CARD_SUB, avail_w)
        draw.text((tx, ty), cat_text, fill=(56, 189, 248), font=FONT_CARD_SUB)
        
        desc_text = item['description']
        desc_text = truncate_text(draw, desc_text, FONT_CARD_TITLE, avail_w)
        draw.text((tx, ty + 13), desc_text, fill=(241, 245, 249), font=FONT_CARD_TITLE)
        
        fn_text = item['flatFilename']
        fn_text = truncate_text(draw, fn_text, FONT_CARD_SUB, avail_w)
        draw.text((tx, ty + 27), fn_text, fill=(100, 116, 139), font=FONT_CARD_SUB)

    # Footer
    footer_text = f"Remix 3D Studio (V20)  •  Canvas: 2048 × 1539 px  •  Target: E:\\X\\AiStudio Workflow\\V20\\ALL_SCREENSHOTS\\CONTACT_SHEETS_2048x1539  •  Sheet {sheet_idx} of {total_sheets}"
    draw.text((32, CANVAS_H - 24), footer_text, fill=(100, 116, 139), font=FONT_FOOTER)
    
    # Save PNG
    out_png = os.path.join(OUTPUT_DIR, f"{filename_prefix}.png")
    sheet.save(out_png, optimize=True)
    png_mb = os.path.getsize(out_png) / (1024 * 1024)
    
    # Save JPG
    out_jpg = os.path.join(OUTPUT_DIR, f"{filename_prefix}.jpg")
    sheet.save(out_jpg, quality=92, optimize=True)
    jpg_mb = os.path.getsize(out_jpg) / (1024 * 1024)
    
    # Verify exact canvas dimensions
    assert sheet.size == (CANVAS_W, CANVAS_H), f"Invalid canvas size: {sheet.size}"
    assert png_mb <= 19.0, f"Exceeded 19MB: {png_mb:.2f} MB"
    assert jpg_mb <= 19.0, f"Exceeded 19MB: {jpg_mb:.2f} MB"
    
    print(f"[{sheet_idx:02d}/{total_sheets:02d}] {filename_prefix} -> PNG: {png_mb:.2f} MB | JPG: {jpg_mb:.2f} MB (Dims: {sheet.size[0]}x{sheet.size[1]})")
    
    return {
        'sheetIndex': sheet_idx,
        'title': title,
        'filenamePrefix': filename_prefix,
        'pngPath': out_png,
        'jpgPath': out_jpg,
        'pngMb': png_mb,
        'jpgMb': jpg_mb,
        'itemCount': len(items),
        'screenRange': screen_range,
        'dimensions': f"{CANVAS_W} × {CANVAS_H}"
    }

def main():
    print(f"Generating contact sheets strictly at {CANVAS_W} × {CANVAS_H}...")
    sheets_info = []
    
    # 1. Galaxy S25 Ultra (64 screens -> 4 sheets of 16)
    s25_items = [it for it in ALL_ITEMS if it['device'] == 'Galaxy S25 Ultra']
    for i in range(4):
        batch = s25_items[i*16:(i+1)*16]
        sheet_num = i + 1
        info = render_sheet(sheet_num, 12, {
            'title': f"Galaxy S25 Ultra Portrait (Part {i+1} of 4)",
            'subtitle': "1440 × 3120  •  8 × 2 Grid",
            'device': "Galaxy S25 Ultra",
            'filename_prefix': f"SHEET_{sheet_num:02d}_Galaxy_S25_Ultra_Part_{i+1}",
            'items': batch,
            'cols': 8,
            'thumb_w': 224,
            'aspect_ratio': 3126.0 / 1442.0
        })
        sheets_info.append(info)
        
    # 2. Galaxy Tab S6 Lite Portrait (88 screens -> 4 sheets of 22)
    tab_p_items = [it for it in ALL_ITEMS if it['device'] == 'Galaxy Tab S6 Lite' and it['orientation'] == 'Portrait']
    for i in range(4):
        batch = tab_p_items[i*22:(i+1)*22]
        sheet_num = i + 5
        info = render_sheet(sheet_num, 12, {
            'title': f"Galaxy Tab S6 Lite Portrait (Part {i+1} of 4)",
            'subtitle': "1200 × 2000  •  8 × 3 Grid",
            'device': "Galaxy Tab S6 Lite (Portrait)",
            'filename_prefix': f"SHEET_{sheet_num:02d}_Galaxy_Tab_S6_Lite_Portrait_Part_{i+1}",
            'items': batch,
            'cols': 8,
            'thumb_w': 224,
            'aspect_ratio': 2000.0 / 1200.0
        })
        sheets_info.append(info)
        
    # 3. Galaxy Tab S6 Lite Landscape (81 screens -> 4 sheets: 21, 20, 20, 20)
    tab_l_items = [it for it in ALL_ITEMS if it['device'] == 'Galaxy Tab S6 Lite' and it['orientation'] == 'Landscape']
    batches_l = [
        tab_l_items[0:21],
        tab_l_items[21:41],
        tab_l_items[41:61],
        tab_l_items[61:81]
    ]
    for i, batch in enumerate(batches_l):
        sheet_num = i + 9
        info = render_sheet(sheet_num, 12, {
            'title': f"Galaxy Tab S6 Lite Landscape (Part {i+1} of 4)",
            'subtitle': "2000 × 1200  •  6 × 4 Grid",
            'device': "Galaxy Tab S6 Lite (Landscape)",
            'filename_prefix': f"SHEET_{sheet_num:02d}_Galaxy_Tab_S6_Lite_Landscape_Part_{i+1}",
            'items': batch,
            'cols': 6,
            'thumb_w': 304,
            'aspect_ratio': 1200.0 / 2000.0
        })
        sheets_info.append(info)
        
    # Write Index JSON
    with open(os.path.join(OUTPUT_DIR, 'INDEX_2048x1539.json'), 'w', encoding='utf-8') as f:
        json.dump({
            'canvasWidth': CANVAS_W,
            'canvasHeight': CANVAS_H,
            'totalSheets': len(sheets_info),
            'totalScreenshots': len(ALL_ITEMS),
            'generatedAt': time.strftime('%Y-%m-%d %H:%M:%S'),
            'sheets': sheets_info
        }, f, indent=2)

    print(f"\nCompleted! All 12 contact sheets generated at exact {CANVAS_W} × {CANVAS_H} resolution.")
    print(f"Output folder: {OUTPUT_DIR}")

if __name__ == '__main__':
    main()

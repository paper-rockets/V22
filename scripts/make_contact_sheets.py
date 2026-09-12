import os
import json
import time
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = r'e:\X\AiStudio Workflow\V20\ALL_SCREENSHOTS'
FLAT_DIR = os.path.join(BASE_DIR, 'ALL_SCREENSHOTS_FLAT')
CATALOG_PATH = os.path.join(BASE_DIR, 'ALL_SCREENSHOTS_CATALOG.json')
OUTPUT_DIR = os.path.join(BASE_DIR, 'CONTACT_SHEETS')

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
    ALL_ITEMS = json.load(f)

# Fonts
FONT_TITLE = ImageFont.truetype('segoeuib.ttf', 36)
FONT_SUBTITLE = ImageFont.truetype('segoeuib.ttf', 22)
FONT_META = ImageFont.truetype('segoeui.ttf', 16)
FONT_BADGE = ImageFont.truetype('segoeuib.ttf', 14)
FONT_CARD_TITLE = ImageFont.truetype('segoeuib.ttf', 14)
FONT_CARD_SUB = ImageFont.truetype('segoeui.ttf', 12)
FONT_FOOTER = ImageFont.truetype('segoeui.ttf', 15)

def truncate_text(draw, text, font, max_width):
    if draw.textlength(text, font=font) <= max_width:
        return text
    while len(text) > 3 and draw.textlength(text + '…', font=font) > max_width:
        text = text[:-1]
    return text + '…'

def create_panel(panel_config):
    title = panel_config['title']
    subtitle = panel_config['subtitle']
    device_name = panel_config['device']
    filename_prefix = panel_config['filename_prefix']
    items = panel_config['items']
    cols = panel_config['cols']
    rows = panel_config['rows']
    thumb_w = panel_config['thumb_w']
    aspect_ratio = panel_config['aspect_ratio'] # height / width
    
    thumb_h = int(thumb_w * aspect_ratio)
    card_pad = 8
    label_h = 62
    cell_w = thumb_w + card_pad * 2
    cell_h = thumb_h + card_pad * 2 + label_h
    
    gap_x = 16
    gap_y = 20
    margin_x = 48
    margin_top = 180
    margin_bottom = 80
    
    sheet_w = margin_x * 2 + cols * cell_w + (cols - 1) * gap_x
    sheet_h = margin_top + rows * cell_h + (rows - 1) * gap_y + margin_bottom
    
    print(f"\n==========================================")
    print(f"Generating: {title}")
    print(f"Items: {len(items)} | Grid: {cols}x{rows}")
    print(f"Dimensions: {sheet_w} x {sheet_h} px")
    print(f"Thumbnail size: {thumb_w} x {thumb_h} px")
    
    # Canvas background
    sheet = Image.new('RGB', (sheet_w, sheet_h), (14, 16, 21))
    draw = ImageDraw.Draw(sheet)
    
    # Header background banner
    draw.rectangle([(0, 0), (sheet_w, 140)], fill=(20, 24, 33))
    draw.line([(0, 140), (sheet_w, 140)], fill=(38, 44, 58), width=2)
    
    # Header Text
    draw.text((margin_x, 26), "REMIX 3D STUDIO  •  V20 MOBILE-FIRST AUDIT", fill=(56, 189, 248), font=FONT_TITLE)
    draw.text((margin_x, 72), f"{title.upper()}  —  {subtitle}", fill=(255, 255, 255), font=FONT_SUBTITLE)
    meta_info = f"Total Screens: {len(items)}  |  Grid: {cols} cols × {rows} rows  |  Resolution: {sheet_w} × {sheet_h} px  |  Location: E:\\X\\AiStudio Workflow\\V20\\ALL_SCREENSHOTS"
    draw.text((margin_x, 106), meta_info, fill=(148, 163, 184), font=FONT_META)
    
    # Render cards
    t0 = time.time()
    for idx, item in enumerate(items):
        col = idx % cols
        row = idx // cols
        
        x = margin_x + col * (cell_w + gap_x)
        y = margin_top + row * (cell_h + gap_y)
        
        # Card background
        draw.rounded_rectangle(
            [(x, y), (x + cell_w, y + cell_h)],
            radius=8,
            fill=(22, 26, 35),
            outline=(38, 44, 58),
            width=1
        )
        
        # Thumbnail image
        img_path = os.path.join(FLAT_DIR, item['flatFilename'])
        if os.path.exists(img_path):
            with Image.open(img_path) as img:
                # Resize keeping high detail
                resized = img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
                sheet.paste(resized, (x + card_pad, y + card_pad))
                
                # Thumbnail border
                draw.rectangle(
                    [(x + card_pad, y + card_pad), (x + card_pad + thumb_w - 1, y + card_pad + thumb_h - 1)],
                    outline=(50, 56, 72),
                    width=1
                )
        
        # Number Badge (pill at top-left of image)
        num_str = f"#{item['num']:03d}"
        badge_w = 48
        badge_h = 22
        bx = x + card_pad + 6
        by = y + card_pad + 6
        draw.rounded_rectangle([(bx, by), (bx + badge_w, by + badge_h)], radius=4, fill=(10, 12, 16, 220), outline=(56, 189, 248), width=1)
        draw.text((bx + 6, by + 2), num_str, fill=(255, 255, 255), font=FONT_BADGE)
        
        # Label area
        tx = x + card_pad
        ty = y + card_pad + thumb_h + 8
        avail_w = thumb_w
        
        # Category / theme
        cat_text = f"{item['category'].upper()}  •  {item.get('theme', 'DARK')}"
        cat_text = truncate_text(draw, cat_text, FONT_CARD_SUB, avail_w)
        draw.text((tx, ty), cat_text, fill=(56, 189, 248), font=FONT_CARD_SUB)
        
        # Description
        desc_text = item['description']
        desc_text = truncate_text(draw, desc_text, FONT_CARD_TITLE, avail_w)
        draw.text((tx, ty + 18), desc_text, fill=(241, 245, 249), font=FONT_CARD_TITLE)
        
        # File name
        fn_text = item['flatFilename']
        fn_text = truncate_text(draw, fn_text, FONT_CARD_SUB, avail_w)
        draw.text((tx, ty + 36), fn_text, fill=(100, 116, 139), font=FONT_CARD_SUB)

    # Footer
    footer_text = f"Remix 3D Studio (V20) Complete Audit  •  Target Folder: E:\\X\\AiStudio Workflow\\V20\\ALL_SCREENSHOTS  •  {panel_config['footer_note']}"
    draw.text((margin_x, sheet_h - 45), footer_text, fill=(100, 116, 139), font=FONT_FOOTER)
    
    elapsed = time.time() - t0
    print(f"Rendered in {elapsed:.1f}s. Saving outputs...")
    
    # Save PNG
    out_png = os.path.join(OUTPUT_DIR, f"{filename_prefix}.png")
    sheet.save(out_png, optimize=True)
    png_mb = os.path.getsize(out_png) / (1024 * 1024)
    
    # Save High-Quality JPG
    out_jpg = os.path.join(OUTPUT_DIR, f"{filename_prefix}.jpg")
    sheet.save(out_jpg, quality=92, optimize=True)
    jpg_mb = os.path.getsize(out_jpg) / (1024 * 1024)
    
    print(f"Saved PNG: {out_png} ({png_mb:.2f} MB)")
    print(f"Saved JPG: {out_jpg} ({jpg_mb:.2f} MB)")
    
    # Check 19 MB limit
    assert png_mb <= 19.0, f"PNG exceeded 19MB: {png_mb:.2f} MB"
    assert jpg_mb <= 19.0, f"JPG exceeded 19MB: {jpg_mb:.2f} MB"
    print(f"Verified: Both files are safely under the 19MB limit!")
    
    return {
        'title': title,
        'prefix': filename_prefix,
        'png_path': out_png,
        'jpg_path': out_jpg,
        'png_mb': png_mb,
        'jpg_mb': jpg_mb,
        'dimensions': f"{sheet_w} × {sheet_h}",
        'count': len(items)
    }

def main():
    # 1. Panel 1: Galaxy S25 Ultra (Screens 1 to 64)
    s25_items = [it for it in ALL_ITEMS if it['device'] == 'Galaxy S25 Ultra']
    p1 = create_panel({
        'title': 'Panel 1: Galaxy S25 Ultra (Portrait)',
        'subtitle': '1440 × 3120  •  64 Screenshots (Screens #001 – #064)',
        'device': 'Galaxy S25 Ultra',
        'filename_prefix': 'PANEL_1_Galaxy_S25_Ultra_Portrait',
        'items': s25_items,
        'cols': 8,
        'rows': 8,
        'thumb_w': 500,
        'aspect_ratio': 3126.0 / 1442.0,
        'footer_note': 'Panel 1 of 3: Samsung Galaxy S25 Ultra High-DPI Portrait Testing Suite'
    })
    
    # 2. Panel 2: Galaxy Tab S6 Lite Portrait (Screens 65 to 152)
    tab_port_items = [it for it in ALL_ITEMS if it['device'] == 'Galaxy Tab S6 Lite' and it['orientation'] == 'Portrait']
    p2 = create_panel({
        'title': 'Panel 2: Galaxy Tab S6 Lite (Portrait)',
        'subtitle': '1200 × 2000  •  88 Screenshots (Screens #065 – #152)  •  Dark & Light',
        'device': 'Galaxy Tab S6 Lite',
        'filename_prefix': 'PANEL_2_Galaxy_Tab_S6_Lite_Portrait',
        'items': tab_port_items,
        'cols': 8,
        'rows': 11,
        'thumb_w': 500,
        'aspect_ratio': 2000.0 / 1200.0,
        'footer_note': 'Panel 2 of 3: Samsung Galaxy Tab S6 Lite Tablet Portrait Suite (Dark & Light)'
    })
    
    # 3. Panel 3: Galaxy Tab S6 Lite Landscape (Screens 153 to 233)
    tab_land_items = [it for it in ALL_ITEMS if it['device'] == 'Galaxy Tab S6 Lite' and it['orientation'] == 'Landscape']
    p3 = create_panel({
        'title': 'Panel 3: Galaxy Tab S6 Lite (Landscape)',
        'subtitle': '2000 × 1200  •  81 Screenshots (Screens #153 – #233)  •  Dark & Light',
        'device': 'Galaxy Tab S6 Lite',
        'filename_prefix': 'PANEL_3_Galaxy_Tab_S6_Lite_Landscape',
        'items': tab_land_items,
        'cols': 9,
        'rows': 9,
        'thumb_w': 620,
        'aspect_ratio': 1200.0 / 2000.0,
        'footer_note': 'Panel 3 of 3: Samsung Galaxy Tab S6 Lite Tablet Landscape Suite (Dark & Light)'
    })
    
    # Write metadata index
    summary = {
        'totalScreenshots': len(ALL_ITEMS),
        'generatedAt': time.strftime('%Y-%m-%d %H:%M:%S'),
        'panels': [p1, p2, p3]
    }
    with open(os.path.join(OUTPUT_DIR, 'CONTACT_SHEETS_INDEX.json'), 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)
    
    print("\n==========================================")
    print("ALL 3 PANELS SUCCESSFULLY GENERATED!")
    print(f"Directory: {OUTPUT_DIR}")
    for p in [p1, p2, p3]:
        print(f"- {p['title']}: {p['dimensions']} px | PNG: {p['png_mb']:.2f} MB | JPG: {p['jpg_mb']:.2f} MB")

if __name__ == '__main__':
    main()

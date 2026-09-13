import bpy
import os
import sys
import glob
import time

DOWNLOADS_DIR = r"C:\Users\macie\Downloads"
OUTPUT_DIR = r"E:\X\AiStudio Workflow\V22\public\models"
TARGET_MAX_FACES = 50000
MAX_TEXTURE_DIM = 2048

# Blacklist excessively massive broken files
BLACKLIST = {
    "Meshy_AI_Tree_0803222224_texture.glb"  # 402 MB tree with 10M polygons
}

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Collect all .glb files in Downloads
all_glbs = glob.glob(os.path.join(DOWNLOADS_DIR, "*.glb"))

# Filter list
queue = []
for p in all_glbs:
    name = os.path.basename(p)
    if name in BLACKLIST:
        continue
    # Skip duplicates like "model (1).glb" if "model.glb" exists
    if " (1).glb" in name or " (2).glb" in name:
        base_name = name.replace(" (1).glb", ".glb").replace(" (2).glb", ".glb")
        if os.path.exists(os.path.join(DOWNLOADS_DIR, base_name)):
            continue
    
    dst_path = os.path.join(OUTPUT_DIR, name)
    # If already successfully compressed in output dir, skip
    if os.path.exists(dst_path) and os.path.getsize(dst_path) > 0:
        continue
        
    queue.append((p, dst_path, name))

# Sort queue by file size ascending so quick wins process fast
queue.sort(key=lambda x: os.path.getsize(x[0]))

print(f"========================================================")
print(f"Total GLBs found: {len(all_glbs)}")
print(f"Total in queue to compress: {len(queue)}")
print(f"Target Output Folder: {OUTPUT_DIR}")
print(f"========================================================\n")

success_count = 0
fail_count = 0
total_orig_bytes = 0
total_new_bytes = 0

for idx, (src_path, dst_path, filename) in enumerate(queue):
    orig_bytes = os.path.getsize(src_path)
    total_orig_bytes += orig_bytes
    print(f"[{idx+1}/{len(queue)}] Compressing: {filename} ({orig_bytes / (1024*1024):.2f} MB)...")
    start_t = time.time()

    # Reset Blender
    bpy.ops.wm.read_factory_settings(use_empty=True)

    try:
        bpy.ops.import_scene.gltf(filepath=src_path)
    except Exception as imp_err:
        print(f"  [ERROR] Import failed for {filename}: {imp_err}")
        fail_count += 1
        continue

    # Resize oversized textures
    for img in bpy.data.images:
        try:
            w, h = img.size[0], img.size[1]
            if w > 0 and h > 0:
                max_dim = max(w, h)
                if max_dim > MAX_TEXTURE_DIM:
                    scale = MAX_TEXTURE_DIM / float(max_dim)
                    new_w = max(1, int(round(w * scale)))
                    new_h = max(1, int(round(h * scale)))
                    img.scale(new_w, new_h)
        except Exception as img_err:
            pass

    # Proportionally decimate mesh faces if model exceeds target
    mesh_objs = [obj for obj in bpy.data.objects if obj.type == 'MESH' and obj.data]
    total_faces = sum(len(obj.data.polygons) for obj in mesh_objs)
    if total_faces > TARGET_MAX_FACES:
        ratio = max(0.05, float(TARGET_MAX_FACES) / float(total_faces))
        for obj in mesh_objs:
            if not obj.data.shape_keys and len(obj.data.polygons) > 300:
                mod = obj.modifiers.new(name="Decimate", type='DECIMATE')
                mod.ratio = ratio

    # Export with Draco compression
    try:
        bpy.ops.export_scene.gltf(
            filepath=dst_path,
            export_format='GLB',
            export_draco_mesh_compression_enable=True,
            export_draco_mesh_compression_level=7,
            export_image_format='AUTO',
            export_apply=True
        )
        new_bytes = os.path.getsize(dst_path)
        total_new_bytes += new_bytes
        elapsed = time.time() - start_t
        reduction = (1.0 - (new_bytes / float(orig_bytes))) * 100.0 if orig_bytes > 0 else 0.0
        print(f"  -> Done in {elapsed:.1f}s: {orig_bytes / (1024*1024):.2f} MB to {new_bytes / (1024*1024):.2f} MB ({reduction:.1f}% reduction)")
        success_count += 1
    except Exception as exp_err:
        print(f"  [ERROR] Export failed for {filename}: {exp_err}")
        fail_count += 1

print("\n====================== ALL DONE ======================")
print(f"Successfully compressed: {success_count}/{len(queue)}")
if fail_count > 0:
    print(f"Failed: {fail_count}")
print(f"Original Queue Size:   {total_orig_bytes / (1024*1024):.2f} MB")
print(f"Compressed Queue Size: {total_new_bytes / (1024*1024):.2f} MB")
if total_orig_bytes > 0:
    print(f"Total Space Saved:     {(1.0 - total_new_bytes / float(total_orig_bytes)) * 100.0:.1f}%")

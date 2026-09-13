import bpy
import os
import sys
import glob
import time

OUTPUT_DIR = r"E:\X\AiStudio Workflow\V22\public\models"
DOWNLOADS_DIR = r"C:\Users\macie\Downloads"
TARGET_MAX_BYTES = int(1.5 * 1024 * 1024) # Target ceiling: ~1.5 MB (ultra-smooth on S6 Lite)
BLACKLIST = {
    "Meshy_AI_Tree_0803222224_texture.glb"
}

# The 8 new Meshy cat models (Priority)
NEW_MESHY = [
    "Meshy_AI_Tiny_Cat_Magician_0913064508_texture.glb",
    "Meshy_AI_Nurse_Pusheen_and_Tin_0913064519_texture.glb",
    "Meshy_AI_Whisker_Artist_0913064530_texture.glb",
    "Meshy_AI_Nutella_Cat_0913065234_texture.glb",
    "Meshy_AI_Pusheen_Cake_Celebrat_0913065248_texture.glb",
    "Meshy_AI_Scooter_Cat_0913065304_texture.glb",
    "Meshy_AI_Pusheen_Baking_Magic_0913065316_texture.glb",
    "Meshy_AI_Purrouette_0913065347_texture.glb"
]

def compress_file(src_path, dst_path, tex_dim=1024, target_faces=16000):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    try:
        bpy.ops.import_scene.gltf(filepath=src_path)
    except Exception as e:
        return False, f"Import error: {e}"

    # Resize textures
    for img in bpy.data.images:
        try:
            w, h = img.size[0], img.size[1]
            if w > 0 and h > 0:
                max_d = max(w, h)
                if max_d > tex_dim:
                    scale = float(tex_dim) / float(max_d)
                    new_w = max(1, int(round(w * scale)))
                    new_h = max(1, int(round(h * scale)))
                    img.scale(new_w, new_h)
        except Exception:
            pass

    # Proportionally decimate mesh
    mesh_objs = [o for o in bpy.data.objects if o.type == 'MESH' and o.data is not None]
    total_faces = sum(len(o.data.polygons) for o in mesh_objs)
    if total_faces > target_faces:
        ratio = max(0.04, float(target_faces) / float(total_faces))
        for o in mesh_objs:
            if not o.data.shape_keys and len(o.data.polygons) > 200:
                mod = o.modifiers.new(name="Decimate", type='DECIMATE')
                mod.ratio = ratio

    temp_dst = dst_path + ".tmp.glb"
    try:
        bpy.ops.export_scene.gltf(
            filepath=temp_dst,
            export_format='GLB',
            export_draco_mesh_compression_enable=True,
            export_draco_mesh_compression_level=7,
            export_image_format='JPEG',
            export_image_quality=70,
            export_apply=True
        )
    except Exception as e:
        if os.path.exists(temp_dst):
            try: os.remove(temp_dst)
            except: pass
        return False, f"Export error: {e}"

    sz = os.path.getsize(temp_dst)
    # If still > 1.5MB, retry with 512px textures and 10,000 faces
    if sz > TARGET_MAX_BYTES and tex_dim > 512:
        if os.path.exists(temp_dst):
            try: os.remove(temp_dst)
            except: pass
        print(f"  -> {sz / (1024*1024):.2f} MB is > 1.5 MB, running Pass 2 (512px / 10k faces)...")
        return compress_file(src_path, dst_path, tex_dim=512, target_faces=10000)

    if os.path.exists(dst_path):
        try: os.remove(dst_path)
        except: pass
    os.rename(temp_dst, dst_path)
    return True, sz

# Build list of files to process
queue = []

# 1. First: the 8 new Meshy models
for name in NEW_MESHY:
    src = os.path.join(DOWNLOADS_DIR, name)
    dst = os.path.join(OUTPUT_DIR, name)
    if os.path.exists(src):
        queue.append((src, dst, name, "New Meshy Model"))

# 2. Existing files in public/models that are > 1.8 MB
for entry in os.scandir(OUTPUT_DIR):
    if entry.is_file() and entry.name.endswith(".glb") and entry.stat().st_size > 1.8 * 1024 * 1024:
        if entry.name in BLACKLIST or entry.name in NEW_MESHY:
            continue
        dl_src = os.path.join(DOWNLOADS_DIR, entry.name)
        src = dl_src if os.path.exists(dl_src) else entry.path
        queue.append((src, entry.path, entry.name, "Oversized (>1.8MB) Model"))

# 3. Any uncompressed files in Downloads not yet in public/models
for dl_file in glob.glob(os.path.join(DOWNLOADS_DIR, "*.glb")):
    fname = os.path.basename(dl_file)
    if fname in BLACKLIST or " (1).glb" in fname or " (2).glb" in fname:
        continue
    dst = os.path.join(OUTPUT_DIR, fname)
    if not os.path.exists(dst):
        queue.append((dl_file, dst, fname, "Uncompressed Download"))

# Remove duplicates while preserving order
seen = set()
deduped_queue = []
for item in queue:
    if item[2] not in seen:
        seen.add(item[2])
        deduped_queue.append(item)

print(f"========================================================")
print(f"S6 LITE ULTRA-LIGHT OPTIMIZER: TARGET ~500KB - 1.5MB")
print(f"Total models to optimize: {len(deduped_queue)}")
print(f"========================================================\n")

success_count = 0
fail_count = 0

for idx, (src_path, dst_path, filename, category) in enumerate(deduped_queue):
    orig_mb = os.path.getsize(src_path) / (1024 * 1024)
    print(f"[{idx+1}/{len(deduped_queue)}] [{category}] {filename} ({orig_mb:.2f} MB)...")
    start_t = time.time()
    
    ok, result = compress_file(src_path, dst_path, tex_dim=1024, target_faces=16000)
    elapsed = time.time() - start_t
    if ok:
        new_mb = result / (1024 * 1024)
        print(f"  -> Done in {elapsed:.1f}s: {orig_mb:.2f} MB to {new_mb:.2f} MB")
        success_count += 1
    else:
        print(f"  [ERROR]: {result}")
        fail_count += 1

print("\n====================== OPTIMIZATION COMPLETE ======================")
print(f"Total processed: {success_count}/{len(deduped_queue)}")

import bpy
import os
import sys
import time

FILES = [
    r"C:\Users\macie\Downloads\Meshy_AI_Tiny_Cat_Magician_0913064508_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Nurse_Pusheen_and_Tin_0913064519_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Whisker_Artist_0913064530_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Nutella_Cat_0913065234_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Pusheen_Cake_Celebrat_0913065248_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Scooter_Cat_0913065304_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Pusheen_Baking_Magic_0913065316_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Purrouette_0913065347_texture.glb"
]

OUTPUT_DIR = r"E:\X\AiStudio Workflow\V22\public\models"
TARGET_MAX_FACES = 50000
MAX_TEXTURE_DIM = 2048

os.makedirs(OUTPUT_DIR, exist_ok=True)

print(f"========================================================")
print(f"Starting compression for {len(FILES)} new Meshy models")
print(f"Target: {OUTPUT_DIR}")
print(f"========================================================\n")

for idx, src_path in enumerate(FILES):
    if not os.path.exists(src_path):
        print(f"[{idx+1}/{len(FILES)}] File not found: {src_path}")
        continue

    filename = os.path.basename(src_path)
    dst_path = os.path.join(OUTPUT_DIR, filename)
    orig_bytes = os.path.getsize(src_path)
    start_t = time.time()

    print(f"[{idx+1}/{len(FILES)}] Compressing: {filename} ({orig_bytes / (1024*1024):.2f} MB)...")

    # Reset Blender scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    try:
        bpy.ops.import_scene.gltf(filepath=src_path)
    except Exception as imp_err:
        print(f"  [ERROR] Import failed for {filename}: {imp_err}")
        continue

    # Resize oversized textures to max 2K
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
        except Exception:
            pass

    # Proportionally decimate mesh faces
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
        elapsed = time.time() - start_t
        reduction = (1.0 - (new_bytes / float(orig_bytes))) * 100.0 if orig_bytes > 0 else 0.0
        print(f"  -> Finished in {elapsed:.1f}s: {orig_bytes / (1024*1024):.2f} MB to {new_bytes / (1024*1024):.2f} MB ({reduction:.1f}% reduction)")
    except Exception as exp_err:
        print(f"  [ERROR] Export failed for {filename}: {exp_err}")

print("\nAll 8 new Meshy models processed successfully.")

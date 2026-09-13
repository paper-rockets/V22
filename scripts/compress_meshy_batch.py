import bpy
import os
import sys
import glob

SOURCE_FILES = [
    r"C:\Users\macie\Downloads\Meshy_AI_Boltcloud_0913050911_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Crimson_Mech_Crab_0913045453_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Bookish_Cat_0913045659_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Cozy_Cat_Reading_Time_0912214543_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_The_Great_Indoors_0913045820_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Love_Cat_0913050415_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Cozy_Cat_Family_0912215129_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Cool_Pusheen_0913045738_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Crimson_Mech_Crab_0913050102_generate.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Crimson_Sentinel_Ride_0913050116_generate.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_fuchikoma_0913051043_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Prismatic_Snail_0913050907_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Apple_Seed_Cover_0913045350_texture.glb",
    r"C:\Users\macie\Downloads\pusheen_cafe.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Tachikoma_Robot_0913051052_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Rainbow_Plush_Monster_0913045931_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Neon_Spiral_Tail_Cham_0913050914_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Strawberry_Samurai_Bu_0913051202_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Starry_Snuggle_0913051226_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Bubblegum_Dragon_0913050844_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Cute_Pink_Axolotl_0913051211_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI__0813042902_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI__0813042800_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI__0813042227_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Porco_Rosso_Savoia_S2_0811060710_image-to-3d-texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI__0811060646_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Character_output.glb",
    r"C:\Users\macie\Downloads\Meshy_AI__0811060301_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Low_Poly_Whale_Prince_0811060243_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Kiki_Broomstick_Low_P_0811060153_image-to-3d-texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Orange_Explorer_SUV_0811060059_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI__0811060031_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Meshy_Merged_Animations.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Animation_Walking_withSkin.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_bluey_orange_car_0803173556_image-to-3d-texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_Tree_0803222224_texture.glb",
    r"C:\Users\macie\Downloads\Meshy_AI_model_Animation_Walking_withSkin.glb",
]

OUTPUT_DIR = r"E:\X\AiStudio Workflow\V22\public\models"
TARGET_MAX_FACES = 50000
MAX_TEXTURE_DIM = 2048

os.makedirs(OUTPUT_DIR, exist_ok=True)

results = []

for idx, src_path in enumerate(SOURCE_FILES):
    if not os.path.exists(src_path):
        print(f"[{idx+1}/{len(SOURCE_FILES)}] Skipping missing file: {src_path}")
        continue

    filename = os.path.basename(src_path)
    dst_path = os.path.join(OUTPUT_DIR, filename)
    orig_bytes = os.path.getsize(src_path)

    print(f"\n========================================================")
    print(f"[{idx+1}/{len(SOURCE_FILES)}] Processing: {filename}")
    print(f"Original size: {orig_bytes / (1024*1024):.2f} MB")
    print(f"========================================================")

    # Reset Blender scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    try:
        bpy.ops.import_scene.gltf(filepath=src_path)
    except Exception as e:
        print(f"Error importing {src_path}: {e}")
        continue

    # Resize images
    for img in bpy.data.images:
        w, h = img.size[0], img.size[1]
        if w > 0 and h > 0:
            max_dim = max(w, h)
            if max_dim > MAX_TEXTURE_DIM:
                scale = MAX_TEXTURE_DIM / float(max_dim)
                new_w = max(1, int(round(w * scale)))
                new_h = max(1, int(round(h * scale)))
                print(f"  Scaling texture {img.name}: {w}x{h} -> {new_w}x{new_h}")
                try:
                    img.scale(new_w, new_h)
                except Exception as scale_err:
                    print(f"  Could not scale {img.name}: {scale_err}")

    # Decimate meshes
    for obj in bpy.data.objects:
        if obj.type == 'MESH' and obj.data:
            if obj.data.shape_keys:
                print(f"  Object {obj.name} has shape keys, skipping decimation.")
                continue
            poly_count = len(obj.data.polygons)
            if poly_count > TARGET_MAX_FACES:
                ratio = max(0.05, float(TARGET_MAX_FACES) / float(poly_count))
                print(f"  Mesh {obj.name}: {poly_count} faces -> Decimate ratio {ratio:.3f}")
                mod = obj.modifiers.new(name="Decimate", type='DECIMATE')
                mod.ratio = ratio

    # Export with Draco
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
        reduction = (1.0 - (new_bytes / orig_bytes)) * 100.0
        print(f"SUCCESS: {orig_bytes / (1024*1024):.2f} MB -> {new_bytes / (1024*1024):.2f} MB ({reduction:.1f}% reduction)")
        results.append({
            "name": filename,
            "orig_mb": orig_bytes / (1024*1024),
            "new_mb": new_bytes / (1024*1024),
            "reduction": reduction,
            "status": "OK"
        })
    except Exception as exp_err:
        print(f"Error exporting {filename}: {exp_err}")
        results.append({
            "name": filename,
            "orig_mb": orig_bytes / (1024*1024),
            "new_mb": 0,
            "reduction": 0,
            "status": f"FAILED: {exp_err}"
        })

print("\n\n====================== SUMMARY ======================")
total_orig = sum(r["orig_mb"] for r in results)
total_new = sum(r["new_mb"] for r in results)
print(f"Total processed: {len(results)}")
print(f"Total Original Size:   {total_orig:.2f} MB")
print(f"Total Compressed Size: {total_new:.2f} MB")
if total_orig > 0:
    print(f"Overall Space Saved:   {100.0 * (1.0 - total_new / total_orig):.1f}%")

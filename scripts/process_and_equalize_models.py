import bpy
import os
import glob
import json
import struct
import shutil
from mathutils import Vector

MODELS_DIR = r'E:\X\AiStudio Workflow\V22\public\models'
DOWNLOADS_DIR = r'C:\Users\macie\Downloads'
TARGET_SIZE = 2.0

BASISU_MODELS = {
    'calavera_sugar_skull.glb',
    'countryside_house.glb',
    'forest_house.glb',
    'lowpoly_house.glb',
    'mexican_flower_skull.glb',
    'pikachu.glb',
    'squirtle.glb'
}

def scale_basisu_glb(file_path, target_max=2.0):
    with open(file_path, 'rb') as f:
        magic, version, total_len = struct.unpack('<4sII', f.read(12))
        chunk_len, chunk_type = struct.unpack('<II', f.read(8))
        json_bytes = f.read(chunk_len)
        data = json.loads(json_bytes.decode('utf-8'))
        bin_chunk = f.read()

    positions = []
    for mesh in data.get('meshes', []):
        for prim in mesh.get('primitives', []):
            pos_acc_idx = prim.get('attributes', {}).get('POSITION')
            if pos_acc_idx is not None:
                acc = data['accessors'][pos_acc_idx]
                if 'min' in acc and 'max' in acc:
                    positions.append((acc['min'], acc['max']))
    if not positions:
        return False

    min_x = min(p[0][0] for p in positions)
    min_y = min(p[0][1] for p in positions)
    min_z = min(p[0][2] for p in positions)
    max_x = max(p[1][0] for p in positions)
    max_y = max(p[1][1] for p in positions)
    max_z = max(p[1][2] for p in positions)

    dx = max_x - min_x
    dy = max_y - min_y
    dz = max_z - min_z
    max_d = max(dx, dy, dz)
    if max_d <= 0:
        return False

    s = target_max / max_d
    cx = (min_x + max_x) / 2.0
    cz = (min_z + max_z) / 2.0
    gy = min_y

    scene = data.get('scene', 0)
    scene_nodes = data['scenes'][scene].get('nodes', [])
    new_root_idx = len(data['nodes'])
    new_root_node = {
        'name': 'NormalizedRoot',
        'children': scene_nodes,
        'scale': [round(s, 6), round(s, 6), round(s, 6)],
        'translation': [round(-cx * s, 6), round(-gy * s, 6), round(-cz * s, 6)]
    }
    data['nodes'].append(new_root_node)
    data['scenes'][scene]['nodes'] = [new_root_idx]

    new_json = json.dumps(data, separators=(',', ':')).encode('utf-8')
    pad_len = (4 - (len(new_json) % 4)) % 4
    new_json += b' ' * pad_len
    new_chunk_len = len(new_json)
    new_total_len = 12 + 8 + new_chunk_len + len(bin_chunk)

    tmp_path = file_path + '.tmp.glb'
    with open(tmp_path, 'wb') as f:
        f.write(struct.pack('<4sII', magic, version, new_total_len))
        f.write(struct.pack('<II', new_chunk_len, chunk_type))
        f.write(new_json)
        f.write(bin_chunk)

    shutil.move(tmp_path, file_path)
    print(f'[Basisu] Scaled {os.path.basename(file_path)}: orig max={max_d:.2f} -> scale={s:.6f}')
    return True

def fix_sailormoon(dst_path):
    print('=== Fixing sailormoon_casual_bun.glb ===')
    src_path = os.path.join(DOWNLOADS_DIR, 'sailormoon_casual_bun.glb')
    if not os.path.exists(src_path):
        src_path = dst_path

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=src_path)

    img0 = bpy.data.images.get('Image_0')
    img1 = bpy.data.images.get('Image_1')

    # aiStandardSurface6 (hair) -> connect img0
    mat6 = bpy.data.materials.get('aiStandardSurface6')
    if mat6 and img0:
        mat6.use_nodes = True
        bsdf = None
        for n in mat6.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                bsdf = n
                break
        if not bsdf:
            mat6.node_tree.nodes.clear()
            bsdf = mat6.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
            out = mat6.node_tree.nodes.new('ShaderNodeOutputMaterial')
            mat6.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

        tex_node = mat6.node_tree.nodes.new('ShaderNodeTexImage')
        tex_node.image = img0
        mat6.node_tree.links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
        bsdf.inputs['Base Color'].default_value = (1.0, 1.0, 1.0, 1.0)
        print('Linked Image_0 to aiStandardSurface6 Base Color')

    # aiStandardSurface1 (body) -> ensure img0 connected
    mat1 = bpy.data.materials.get('aiStandardSurface1')
    if mat1 and img0:
        mat1.use_nodes = True
        for n in mat1.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                if not n.inputs['Base Color'].links:
                    tex_node = mat1.node_tree.nodes.new('ShaderNodeTexImage')
                    tex_node.image = img0
                    mat1.node_tree.links.new(tex_node.outputs['Color'], n.inputs['Base Color'])
                n.inputs['Base Color'].default_value = (1.0, 1.0, 1.0, 1.0)

    # aiStandardSurface7 (sparkle planes) -> ensure img1 connected
    mat7 = bpy.data.materials.get('aiStandardSurface7')
    if mat7 and img1:
        mat7.use_nodes = True
        for n in mat7.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                if not n.inputs['Base Color'].links:
                    tex_node = mat7.node_tree.nodes.new('ShaderNodeTexImage')
                    tex_node.image = img1
                    mat7.node_tree.links.new(tex_node.outputs['Color'], n.inputs['Base Color'])
                n.inputs['Base Color'].default_value = (1.0, 1.0, 1.0, 1.0)

    normalize_and_export(dst_path)

def fix_halloween(dst_path):
    print('=== Fixing halloween.glb ===')
    src_path = os.path.join(DOWNLOADS_DIR, 'halloween.glb')
    if not os.path.exists(src_path):
        src_path = dst_path

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=src_path)

    img0 = bpy.data.images.get('Image_0')
    img1 = bpy.data.images.get('Image_1')
    img2 = bpy.data.images.get('Image_2')
    img3 = bpy.data.images.get('Image_3')

    mat_mapping = {
        'aiStandardSurface1': img2,
        'aiStandardSurface2': img0,
        'aiStandardSurface4': img1,
        'aiStandardSurface6': img0,
        'aiStandardSurface7': img0,
        'aiStandardSurface8': img3,
        'aiStandardSurface9': img3
    }

    for mat_name, img in mat_mapping.items():
        mat = bpy.data.materials.get(mat_name)
        if mat and img:
            mat.use_nodes = True
            bsdf = None
            for n in mat.node_tree.nodes:
                if n.type == 'BSDF_PRINCIPLED':
                    bsdf = n
                    break
            if not bsdf:
                mat.node_tree.nodes.clear()
                bsdf = mat.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
                out = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')
                mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

            has_tex = False
            for n in mat.node_tree.nodes:
                if n.type == 'TEX_IMAGE' and n.image:
                    has_tex = True
                    mat.node_tree.links.new(n.outputs['Color'], bsdf.inputs['Base Color'])
                    break
            if not has_tex:
                tex_node = mat.node_tree.nodes.new('ShaderNodeTexImage')
                tex_node.image = img
                mat.node_tree.links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])

            bsdf.inputs['Base Color'].default_value = (1.0, 1.0, 1.0, 1.0)
            if 'Specular IOR Level' in bsdf.inputs:
                bsdf.inputs['Specular IOR Level'].default_value = 0.2
            if 'Roughness' in bsdf.inputs:
                bsdf.inputs['Roughness'].default_value = 0.6
    print('Successfully mapped textures for all halloween materials!')

    normalize_and_export(dst_path)

def normalize_and_export(dst_path, target_size=TARGET_SIZE):
    for img in bpy.data.images:
        try:
            w, h = img.size[0], img.size[1]
            if w > 0 and h > 0:
                max_d = max(w, h)
                if max_d > 1024:
                    scale = 1024.0 / float(max_d)
                    img.scale(max(1, int(round(w * scale))), max(1, int(round(h * scale))))
        except Exception:
            pass

    mesh_objs = [o for o in bpy.data.objects if o.type == 'MESH']
    if not mesh_objs:
        print(f'No meshes in {os.path.basename(dst_path)}')
        return

    min_v = Vector((float('inf'), float('inf'), float('inf')))
    max_v = Vector((float('-inf'), float('-inf'), float('-inf')))

    for o in mesh_objs:
        for corner in o.bound_box:
            world_c = o.matrix_world @ Vector(corner)
            min_v.x = min(min_v.x, world_c.x)
            min_v.y = min(min_v.y, world_c.y)
            min_v.z = min(min_v.z, world_c.z)
            max_v.x = max(max_v.x, world_c.x)
            max_v.y = max(max_v.y, world_c.y)
            max_v.z = max(max_v.z, world_c.z)

    dims = max_v - min_v
    max_dim = max(dims.x, dims.y, dims.z)
    if max_dim <= 0:
        print(f'Zero max_dim in {os.path.basename(dst_path)}')
        return

    scale_factor = target_size / max_dim
    center_x = (min_v.x + max_v.x) / 2.0
    center_y = (min_v.y + max_v.y) / 2.0
    ground_z = min_v.z

    root_objs = [o for o in bpy.data.objects if o.parent is None]
    if not root_objs:
        root_objs = bpy.data.objects[:]

    empty = bpy.data.objects.new('NormalizeRoot', None)
    bpy.context.scene.collection.objects.link(empty)
    empty.location = (0, 0, 0)

    for o in root_objs:
        if o != empty:
            o.parent = empty

    empty.scale = (scale_factor, scale_factor, scale_factor)
    empty.location = (-center_x * scale_factor, -center_y * scale_factor, -ground_z * scale_factor)

    bpy.context.view_layer.update()

    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.data.objects:
        if o != empty:
            o.select_set(True)
    bpy.context.view_layer.objects.active = mesh_objs[0] if mesh_objs else None
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    bpy.data.objects.remove(empty, do_unlink=True)

    bpy.ops.object.select_all(action='DESELECT')
    for o in mesh_objs:
        o.select_set(True)
    if mesh_objs:
        bpy.context.view_layer.objects.active = mesh_objs[0]
        try:
            bpy.ops.object.transform_apply(location=True, rotation=False, scale=True)
        except Exception as e:
            print(f'transform_apply notice: {e}')

    temp_dst = dst_path + '.tmp.glb'
    try:
        bpy.ops.export_scene.gltf(
            filepath=temp_dst,
            export_format='GLB',
            use_selection=False,
            export_draco_mesh_compression_enable=True,
            export_draco_mesh_compression_level=7,
            export_draco_position_quantization=14,
            export_draco_normal_quantization=10,
            export_draco_texcoord_quantization=12,
            export_image_format='JPEG',
            export_image_quality=75,
            export_apply=True
        )
        if os.path.exists(temp_dst) and os.path.getsize(temp_dst) > 0:
            shutil.move(temp_dst, dst_path)
            print(f'Normalized {os.path.basename(dst_path)}: max_dim={max_dim:.2f} -> {target_size:.2f} ({os.path.getsize(dst_path)/1024:.1f} KB)')
        else:
            if os.path.exists(temp_dst):
                os.remove(temp_dst)
    except Exception as e:
        print(f'Export error for {os.path.basename(dst_path)}: {e}')
        if os.path.exists(temp_dst):
            os.remove(temp_dst)

def process_all():
    all_files = sorted(glob.glob(os.path.join(MODELS_DIR, '*.glb')))
    print(f'Processing {len(all_files)} models in {MODELS_DIR}...')

    sailor_path = os.path.join(MODELS_DIR, 'sailormoon_casual_bun.glb')
    if os.path.exists(sailor_path):
        fix_sailormoon(sailor_path)

    halloween_path = os.path.join(MODELS_DIR, 'halloween.glb')
    if os.path.exists(halloween_path):
        fix_halloween(halloween_path)

    for p in all_files:
        name = os.path.basename(p)
        if name in ('sailormoon_casual_bun.glb', 'halloween.glb'):
            continue

        if name in BASISU_MODELS:
            scale_basisu_glb(p, TARGET_SIZE)
            continue

        bpy.ops.wm.read_factory_settings(use_empty=True)
        try:
            bpy.ops.import_scene.gltf(filepath=p)
            normalize_and_export(p, TARGET_SIZE)
        except Exception as e:
            print(f'Skipping {name} due to import error: {e}')

if __name__ == '__main__':
    process_all()

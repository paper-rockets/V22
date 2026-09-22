"""Bakes Blender's Line Art over a GLB and writes the strokes out as JSON.

Blender's Line Art is production animation tooling: it walks the mesh, finds
creases, material boundaries, intersections and silhouettes, removes what is
hidden behind other geometry, and chains what is left into long clean
polylines. That is exactly the wireframe sketch stage of a drawing, done far
better than anything worth hand-rolling.

Run headless:
  blender --background --factory-startup --python lineart.py -- \
      --model in.glb --out lines.json [--crease 45] [--contour] [--camera x,y,z]

Coordinates come out in glTF space (Y up), so the caller can reuse the same
normalisation it applies to the mesh itself.
"""

import bpy
import json
import math
import sys


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = {
        "model": None, "out": None, "crease": 45.0, "contour": False,
        "camera": None, "smooth": 0.2, "split_angle": 0.0,
    }
    i = 0
    while i < len(argv):
        key = argv[i].lstrip("-")
        if key == "contour":
            args["contour"] = True
            i += 1
            continue
        args[key] = argv[i + 1]
        i += 2
    args["crease"] = float(args["crease"])
    args["smooth"] = float(args["smooth"])
    args["split_angle"] = float(args["split_angle"])
    return args


def build_scene(model, contour, camera):  # noqa: D401
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=model)

    scene = bpy.context.scene
    # One frame only. Baking defaults to the whole frame range, which on a
    # 250-frame scene multiplies the stroke count by 250.
    scene.frame_start = scene.frame_end = scene.frame_current = 1

    # Line Art always needs a camera, even when we are not asking for the
    # camera's silhouette: it is what the occlusion pass is measured against.
    # Without one the bake silently produces nothing at all.
    cam_data = bpy.data.cameras.new("cam")
    cam = bpy.data.objects.new("cam", cam_data)
    bpy.context.collection.objects.link(cam)
    if camera:
        cam.location = tuple(float(v) for v in camera.split(","))
    else:
        cam.location = (0.0, -8.0, 2.0)
    cam.rotation_euler = (math.radians(80), 0.0, 0.0)
    cam_data.lens = 35
    scene.camera = cam


def make_grease_pencil():
    data_api = getattr(bpy.data, "grease_pencils_v3", None) or bpy.data.grease_pencils
    gp_data = data_api.new("LineArt")
    gp = bpy.data.objects.new("LineArt", gp_data)
    bpy.context.collection.objects.link(gp)
    bpy.context.view_layer.objects.active = gp
    gp.select_set(True)
    if not gp_data.layers:
        gp_data.layers.new("lines")
    if len(gp_data.materials) == 0:
        mat = bpy.data.materials.new("LineArtMat")
        bpy.data.materials.create_gpencil_data(mat)
        gp_data.materials.append(mat)
    return gp, gp_data


def configure(mod, gp_data, args):
    mod.source_type = 'SCENE'
    mod.target_layer = gp_data.layers[0].name
    mod.target_material = gp_data.materials[0]

    settings = {
        # View-independent edge types: these describe the object itself, so the
        # drawing still reads from every angle. Contour is the camera's
        # silhouette and is optional.
        "use_crease": True,
        "use_material": True,
        "use_intersection": True,
        "use_edge_mark": True,
        "use_contour": args["contour"],
        "use_loose": False,
        "crease_threshold": math.radians(args["crease"]),
        # Chaining: join fragments into long strokes, and do not let a slight
        # bend start a new one.
        "use_fuzzy_intersections": True,
        "use_fuzzy_all": False,
        # Chain in world space, not screen space. Screen-space chaining is for
        # a fixed camera; we want lines that hold together when the drawing is
        # orbited, and without this the bake returns two-point fragments.
        "use_geometry_space_chain": True,
        "chaining_image_threshold": 0.02,
        "use_loose_edge_chain": True,
        "split_angle": math.radians(args["split_angle"]),
        "smooth_tolerance": args["smooth"],
        "use_overlap_edge_type_support": True,
        # Keep lines that are hidden behind other geometry. The result is a
        # drawing that still reads when you orbit round the back, rather than
        # one that only works from the camera it was baked with.
        "use_multiple_levels": True,
        "level_start": 0,
        "level_end": 8,
        "use_occlusion_mask": False,
    }
    for key, value in settings.items():
        if hasattr(mod, key):
            setattr(mod, key, value)


def collect_strokes(gp_data):
    """Reads baked strokes, converting Blender's Z-up back to glTF's Y-up."""
    out = []
    for layer in gp_data.layers:
        for frame in getattr(layer, "frames", []):
            drawing = getattr(frame, "drawing", frame)
            for stroke in getattr(drawing, "strokes", []):
                points = []
                for p in stroke.points:
                    x, y, z = p.position
                    points.append([round(x, 5), round(z, 5), round(-y, 5)])
                if len(points) >= 2:
                    out.append(points)
    return out


def main():
    args = parse_args()
    if not args["model"] or not args["out"]:
        raise SystemExit("--model and --out are required")

    build_scene(args["model"], args["contour"], args["camera"])
    gp, gp_data = make_grease_pencil()
    mod = gp.modifiers.new(name="LineArt", type='LINEART')
    configure(mod, gp_data, args)

    bpy.ops.object.lineart_bake_strokes()
    lines = collect_strokes(gp_data)

    with open(args["out"], "w", encoding="utf8") as fh:
        json.dump({"lines": lines}, fh)
    print(f"LINEART_OK strokes={len(lines)} points={sum(len(l) for l in lines)}")


main()

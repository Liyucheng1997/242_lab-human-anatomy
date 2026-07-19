import bpy, sys, os

# 用法: blender -b Startup.blend --python export_glb.py -- "<collection名>" "<输出glb路径>"
argv = sys.argv[sys.argv.index("--") + 1:]
coll_name = argv[0]
out_path = argv[1]

scene = bpy.context.scene

# 找到目标顶层集合
target = None
for c in scene.collection.children:
    if c.name == coll_name:
        target = c
        break
if target is None:
    print("!! collection not found:", coll_name)
    sys.exit(1)

# 取该集合内所有 mesh 对象
objs = [o for o in target.all_objects if o.type == 'MESH']
print(f"collection '{coll_name}': {len(objs)} mesh objects")

# 全部取消选择，再选中目标对象
bpy.ops.object.select_all(action='DESELECT')
for o in objs:
    o.hide_set(False)
    o.hide_viewport = False
    try:
        o.select_set(True)
    except Exception:
        pass
if objs:
    bpy.context.view_layer.objects.active = objs[0]

os.makedirs(os.path.dirname(out_path), exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format='GLB',
    use_selection=True,
    export_apply=True,              # 应用修改器（Solidify 等）
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_yup=True,
    export_materials='EXPORT',
    export_normals=True,
)
print("EXPORTED ->", out_path, os.path.getsize(out_path) if os.path.exists(out_path) else "MISSING")

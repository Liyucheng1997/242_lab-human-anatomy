import bpy
scene = bpy.context.scene
target = None
for c in scene.collection.children:
    if c.name == "5: Cardiovascular system":
        target = c; break
curves = [o for o in target.all_objects if o.type == 'CURVE']
o = None
for cand in curves:
    if 'artery' in cand.name.lower():
        o = cand; break
o = o or curves[0]
print("curve:", o.name)
cu = o.data
print("  bevel_mode:", getattr(cu, 'bevel_mode', '?'))
print("  bevel_depth:", cu.bevel_depth)
print("  bevel_object:", cu.bevel_object)
print("  extrude:", cu.extrude)
print("  modifiers:", [m.type for m in o.modifiers])
print("  splines:", len(cu.splines))

# 用 evaluated depsgraph 拿真实几何顶点数
deps = bpy.context.evaluated_depsgraph_get()
ev = o.evaluated_get(deps)
try:
    me = ev.to_mesh()
    print("  evaluated verts:", len(me.vertices), "polys:", len(me.polygons))
    ev.to_mesh_clear()
except Exception as e:
    print("  to_mesh err:", e)

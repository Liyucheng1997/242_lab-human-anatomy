import bpy, sys, os

# 用法: blender -b Startup.blend --python export_glb2.py -- "<collection名>" "<layerId>" "<输出glb>"
argv = sys.argv[sys.argv.index("--") + 1:]
coll_name, layer_id, out_path = argv[0], argv[1], argv[2]

# —— 颜色规则（与 src/colors.js 对齐）——
import re
SYSTEM_BASE = {
    'skeleton': (0.929, 0.902, 0.827, 1),
    'muscular': (0.694, 0.290, 0.259, 1),
    'cardiovascular': (0.753, 0.224, 0.169, 1),
    'nervous': (0.914, 0.839, 0.478, 1),
    'visceral': (0.851, 0.545, 0.478, 1),
    'lymphoid': (0.788, 0.663, 0.416, 1),
    'joints': (0.80, 0.82, 0.86, 1),
}
def hx(h):
    h = h.lstrip('#'); return (int(h[0:2],16)/255, int(h[2:4],16)/255, int(h[4:6],16)/255, 1)
KEYWORD = [
    (re.compile(r'vein|venous|vena|sinus', re.I), hx('2E6FB0')),
    (re.compile(r'artery|arteria|aorta|arterial|pulmonary trunk|truncus', re.I), hx('C0392B')),
    (re.compile(r'atrium|ventricle|heart|papillary|valve|leaflet', re.I), hx('B5322A')),
    (re.compile(r'nerve|nervus|ganglion|plexus', re.I), hx('E9C94A')),
    (re.compile(r'nucleus|gyrus|cortex|cerebell|thalam|hippocamp|amygdal|hypophysis|commissure|tract', re.I), hx('E7D9B0')),
    (re.compile(r'liver|hepat', re.I), hx('8C4A3A')),
    (re.compile(r'lung|pulmo', re.I), hx('D98A93')),
    (re.compile(r'kidney|renal|\bren\b', re.I), hx('9B5A4A')),
    (re.compile(r'colon|intestine|bowel|caecum|cecum|appendix|rectum|duoden|jejun|ileum', re.I), hx('D9A15C')),
    (re.compile(r'stomach|gaster', re.I), hx('D98B6A')),
    (re.compile(r'spleen', re.I), hx('7A3A4A')),
    (re.compile(r'omentum|mesocolon|\bmeso|peritone|serosa', re.I), hx('E8C9A0')),
    (re.compile(r'lymph|thymus|tonsil', re.I), hx('C9A96A')),
]
def color_for(name):
    if name:
        for rx, col in KEYWORD:
            if rx.search(name):
                return col
    return SYSTEM_BASE.get(layer_id, (0.85, 0.85, 0.85, 1))

_mat_cache = {}
def mat_for(name):
    col = color_for(name)
    key = tuple(round(c, 4) for c in col)
    if key in _mat_cache:
        return _mat_cache[key]
    m = bpy.data.materials.new(name="anat_%d_%d_%d" % (col[0]*255, col[1]*255, col[2]*255))
    m.use_nodes = False
    m.diffuse_color = col
    _mat_cache[key] = m
    return m

scene = bpy.context.scene
target = None
for c in scene.collection.children:
    if c.name == coll_name:
        target = c; break
if target is None:
    print("!! collection not found:", coll_name); sys.exit(1)

# 收集要导出的对象：网格 + 曲线（跳过文字/空对象）
objs = [o for o in target.all_objects if o.type in ('MESH', 'CURVE')]
print("objs MESH+CURVE:", len(objs))

bpy.ops.object.select_all(action='DESELECT')
# 先把曲线转成网格（血管/神经是带 bevel 的曲线）
curves = [o for o in objs if o.type == 'CURVE']
for o in curves:
    o.hide_set(False); o.hide_viewport = False
    o.select_set(True)
if curves:
    bpy.context.view_layer.objects.active = curves[0]
    bpy.ops.object.convert(target='MESH')

# 重新收集（转换后对象类型都变 MESH）
objs = [o for o in target.all_objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
exported = 0
for o in objs:
    # 跳过空几何（无 bevel 的零宽曲线转出来会是空网格）
    if o.data is None or len(o.data.vertices) == 0:
        continue
    o.hide_set(False); o.hide_viewport = False
    o.select_set(True)
    # 赋颜色材质
    o.data.materials.clear()
    o.data.materials.append(mat_for(o.name))
    exported += 1
    bpy.context.view_layer.objects.active = o
print("exported meshes:", exported)

os.makedirs(os.path.dirname(out_path), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=out_path, export_format='GLB', use_selection=True,
    export_apply=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_yup=True, export_materials='EXPORT', export_normals=True,
)
print("EXPORTED ->", out_path, os.path.getsize(out_path) if os.path.exists(out_path) else "MISSING")

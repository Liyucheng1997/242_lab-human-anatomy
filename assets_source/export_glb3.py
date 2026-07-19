import bpy, sys, os, re

argv = sys.argv[sys.argv.index("--") + 1:]
coll_name, layer_id, out_path = argv[0], argv[1], argv[2]

def hx(h):
    h = h.lstrip('#'); return (int(h[0:2],16)/255, int(h[2:4],16)/255, int(h[4:6],16)/255, 1)
SYSTEM_BASE = {
    'skeleton': hx('EDE6D3'), 'muscular': hx('B14A42'), 'cardiovascular': hx('C0392B'),
    'nervous': hx('E9D67A'), 'visceral': hx('D98B7A'), 'lymphoid': hx('C9A96A'),
    'joints': hx('CDD3DC'),
}
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
            if rx.search(name): return col
    return SYSTEM_BASE.get(layer_id, (0.85,0.85,0.85,1))
_mat = {}
def mat_for(name):
    col = color_for(name); key = tuple(round(c,4) for c in col)
    if key not in _mat:
        m = bpy.data.materials.new("anat")
        m.use_nodes = True
        m.diffuse_color = col
        bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if bsdf is None:
            print("!! no principled node, node types:", [n.type for n in m.node_tree.nodes])
        else:
            bsdf.inputs["Base Color"].default_value = col
            if "Roughness" in bsdf.inputs: bsdf.inputs["Roughness"].default_value = 0.65
            if "Metallic" in bsdf.inputs: bsdf.inputs["Metallic"].default_value = 0.0
        _mat[key] = m
    return _mat[key]

scene = bpy.context.scene
target = next((c for c in scene.collection.children if c.name == coll_name), None)
if target is None:
    print("!! not found:", coll_name); sys.exit(1)

src = [o for o in target.all_objects if o.type in ('MESH','CURVE')]
print("source MESH+CURVE:", len(src))

tmp = bpy.data.collections.new("EXPORT_TMP")
scene.collection.children.link(tmp)
deps = bpy.context.evaluated_depsgraph_get()

made = 0
for o in src:
    ev = o.evaluated_get(deps)
    try:
        me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=False, depsgraph=deps)
    except Exception:
        me = None
    if me is None or len(me.vertices) == 0:
        if me is not None: bpy.data.meshes.remove(me)
        continue
    nobj = bpy.data.objects.new(o.name, me)
    nobj.matrix_world = o.matrix_world.copy()
    me.materials.clear(); me.materials.append(mat_for(o.name))
    tmp.objects.link(nobj)
    made += 1
print("baked meshes:", made)

# 选中 tmp 内全部对象
bpy.ops.object.select_all(action='DESELECT')
for o in tmp.objects:
    o.select_set(True)
    bpy.context.view_layer.objects.active = o

os.makedirs(os.path.dirname(out_path), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=out_path, export_format='GLB', use_selection=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_yup=True, export_materials='EXPORT', export_normals=True,
)
print("EXPORTED ->", out_path, os.path.getsize(out_path) if os.path.exists(out_path) else "MISSING")

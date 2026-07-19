import bpy

def count_meshes(coll):
    n = 0
    for o in coll.all_objects:
        if o.type == 'MESH':
            n += 1
    return n

print("=== SCENES ===")
for sc in bpy.data.scenes:
    print("scene:", sc.name)

print("=== TOP-LEVEL COLLECTIONS ===")
scene = bpy.context.scene
def walk(coll, depth=0):
    print("  " * depth + f"- {coll.name}  (meshes: {count_meshes(coll)}, children: {len(coll.children)})")
    for c in coll.children:
        walk(c, depth + 1)

walk(scene.collection)

print("=== TOTALS ===")
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
print("total mesh objects:", len(meshes))
print("sample names:", [o.name for o in meshes[:20]])

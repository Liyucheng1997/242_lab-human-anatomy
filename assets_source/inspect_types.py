import bpy, sys
argv = sys.argv[sys.argv.index("--") + 1:]
coll_name = argv[0]
scene = bpy.context.scene
target = None
for c in scene.collection.children:
    if c.name == coll_name:
        target = c
        break
if target is None:
    print("!! not found"); sys.exit(1)

from collections import Counter
types = Counter(o.type for o in target.all_objects)
print("collection:", coll_name)
print("type counts:", dict(types))
# 看看曲线样例名
curves = [o.name for o in target.all_objects if o.type == 'CURVE']
print("curve samples:", curves[:12])
print("num curves:", len(curves))

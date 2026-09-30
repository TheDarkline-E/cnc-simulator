import json

with open('main_solids.json') as f:
    solids = json.load(f)

for s in solids:
    if s['tag'] in [15, 20, 35, 38, 39, 40]:
        bmin = s['bbox_min']
        bmax = s['bbox_max']
        dims = s['dimensions']
        center = [(bmin[i]+bmax[i])/2 for i in range(3)]
        print(f"Tag {s['tag']:2d}: {s['name']}")
        print(f"   min: {bmin}")
        print(f"   max: {bmax}")
        print(f"   center: {[round(c, 2) for c in center]}")
        print(f"   dims: {dims}")

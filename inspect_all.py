import json

with open('main_solids.json') as f:
    solids = json.load(f)

for s in solids:
    t = s['tag']
    d = [round(x, 1) for x in s['dimensions']]
    bmin = [round(x, 1) for x in s['bbox_min']]
    bmax = [round(x, 1) for x in s['bbox_max']]
    print(f"Solid Tag {t:2d}: dims={d} min={bmin} max={bmax}")

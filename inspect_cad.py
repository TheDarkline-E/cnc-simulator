import json

with open('public/models/kinematic_manifest.json') as f:
    m = json.load(f)

for k, v in m.items():
    print(f"=== {k} ===")
    print("  file:", v.get("file"))
    print("  bounds_min:", v.get("bounds_min"))
    print("  bounds_max:", v.get("bounds_max"))
    print("  center:", v.get("center"))
    print("  dimensions:", v.get("dimensions"))

import trimesh
import os
import json

out_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\public\models"

manifest = {}
names = ["frame_base", "enclosure", "frame_fixed", "gantry_x", "table", "spindle_z", "tool", "machine_full"]

for name in names:
    path = os.path.join(out_dir, f"{name}.glb")
    if os.path.exists(path):
        scene_or_mesh = trimesh.load(path)
        if isinstance(scene_or_mesh, trimesh.Scene):
            mesh = scene_or_mesh.to_geometry()
            # If multiple geometries, combine them
            if isinstance(mesh, dict):
                mesh = trimesh.util.concatenate(list(mesh.values()))
        else:
            mesh = scene_or_mesh
            
        manifest[name] = {
            "file": f"{name}.glb",
            "size_bytes": os.path.getsize(path),
            "bounds_min": [round(float(x), 2) for x in mesh.bounds[0]],
            "bounds_max": [round(float(x), 2) for x in mesh.bounds[1]],
            "center": [round(float(x), 2) for x in mesh.centroid],
            "dimensions": [round(float(x), 2) for x in (mesh.bounds[1] - mesh.bounds[0])],
            "vertices": len(mesh.vertices),
            "faces": len(mesh.faces)
        }

with open(os.path.join(out_dir, "kinematic_manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2)

print("Kinematic manifest compiled successfully:")
print(json.dumps(manifest, indent=2))

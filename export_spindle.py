import gmsh
import trimesh
import os
import json

cad_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\cad_files"
out_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\public\models"
main_step = os.path.join(cad_dir, "main.STEP")

# Spindle Z solids: holder(35), holder screws(36, 37), case(38), 3d slide(40)
spindle_tags = [35, 36, 37, 38, 40]

gmsh.initialize()
gmsh.option.setNumber("General.Terminal", 0)
gmsh.option.setNumber("Mesh.MeshSizeMin", 2.0)
gmsh.option.setNumber("Mesh.MeshSizeMax", 10.0)

gmsh.model.occ.importShapes(main_step)
gmsh.model.occ.synchronize()

solids = gmsh.model.getEntities(dim=3)
all_tags = [s[1] for s in solids]

to_remove = [(3, t) for t in all_tags if t not in spindle_tags]
gmsh.model.occ.remove(to_remove, recursive=True)
gmsh.model.occ.synchronize()

gmsh.model.mesh.generate(2)
tmp_stl = os.path.join(out_dir, "spindle_z_temp.stl")
out_glb = os.path.join(out_dir, "spindle_z.glb")
gmsh.write(tmp_stl)
gmsh.finalize()

mesh = trimesh.load(tmp_stl)
mesh.export(out_glb)
if os.path.exists(tmp_stl):
    os.remove(tmp_stl)

print(f"Exported spindle_z.glb: {len(mesh.vertices)} vertices, {os.path.getsize(out_glb)} bytes")

# Now build the full kinematic manifest from all exported GLB files
manifest = {}
for name in ["frame_fixed", "gantry_x", "table", "spindle_z", "tool", "machine_full"]:
    path = os.path.join(out_dir, f"{name}.glb")
    if os.path.exists(path):
        m = trimesh.load(path)
        manifest[name] = {
            "file": f"{name}.glb",
            "size_bytes": os.path.getsize(path),
            "bounds_min": [round(x, 2) for x in m.bounds[0].tolist()],
            "bounds_max": [round(x, 2) for x in m.bounds[1].tolist()],
            "center": [round(x, 2) for x in m.centroid.tolist()],
            "dimensions": [round(x, 2) for x in (m.bounds[1] - m.bounds[0]).tolist()],
            "vertices": len(m.vertices),
            "faces": len(m.faces)
        }

with open(os.path.join(out_dir, "kinematic_manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2)

print("Kinematic manifest updated:")
print(json.dumps(manifest, indent=2))

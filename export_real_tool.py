import gmsh
import trimesh
import os
import json

cad_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\cad_files"
out_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\public\models"
main_step = os.path.join(cad_dir, "main.STEP")

# Solid 39 in main.STEP is the tool in assembly position
gmsh.initialize()
gmsh.option.setNumber("General.Terminal", 0)
gmsh.option.setNumber("Mesh.MeshSizeMin", 1.0)
gmsh.option.setNumber("Mesh.MeshSizeMax", 3.0)

gmsh.model.occ.importShapes(main_step)
gmsh.model.occ.synchronize()

solids = gmsh.model.getEntities(dim=3)
all_tags = [s[1] for s in solids]

# Keep only Tag 39
to_remove = [(3, t) for t in all_tags if t != 39]
gmsh.model.occ.remove(to_remove, recursive=True)
gmsh.model.occ.synchronize()

gmsh.model.mesh.generate(2)
tmp_stl = os.path.join(out_dir, "tool_assembly_temp.stl")
out_glb = os.path.join(out_dir, "tool.glb")
gmsh.write(tmp_stl)
gmsh.finalize()

mesh = trimesh.load(tmp_stl)
mesh.export(out_glb)
if os.path.exists(tmp_stl):
    os.remove(tmp_stl)

print(f"Exported tool.glb from main.STEP Tag 39:")
print(f"  Bounds min: {mesh.bounds[0]}")
print(f"  Bounds max: {mesh.bounds[1]}")
print(f"  Center: {mesh.centroid}")
print(f"  Vertices: {len(mesh.vertices)}, Faces: {len(mesh.faces)}, Size: {os.path.getsize(out_glb)} bytes")

# Update kinematic manifest
with open(os.path.join(out_dir, "kinematic_manifest.json"), "r") as f:
    manifest = json.load(f)

manifest["tool"] = {
    "file": "tool.glb",
    "size_bytes": os.path.getsize(out_glb),
    "bounds_min": [round(float(x), 2) for x in mesh.bounds[0]],
    "bounds_max": [round(float(x), 2) for x in mesh.bounds[1]],
    "center": [round(float(x), 2) for x in mesh.centroid],
    "dimensions": [round(float(x), 2) for x in (mesh.bounds[1] - mesh.bounds[0])],
    "vertices": len(mesh.vertices),
    "faces": len(mesh.faces)
}

with open(os.path.join(out_dir, "kinematic_manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2)

print("Updated kinematic_manifest.json with real assembly tool!")

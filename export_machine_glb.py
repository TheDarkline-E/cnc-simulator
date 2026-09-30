import gmsh
import trimesh
import os
import json

cad_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\cad_files"
out_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\public\models"
os.makedirs(out_dir, exist_ok=True)
main_step = os.path.join(cad_dir, "main.STEP")

print("Initializing Gmsh to process main.STEP...")
gmsh.initialize()
gmsh.option.setNumber("General.Terminal", 0)
gmsh.option.setNumber("Mesh.MeshSizeMin", 2.0)
gmsh.option.setNumber("Mesh.MeshSizeMax", 15.0)

gmsh.model.occ.importShapes(main_step)
gmsh.model.occ.synchronize()

solids = gmsh.model.getEntities(dim=3)
print(f"Total solids loaded: {len(solids)}")

# First export entire machine as single high quality glb for immediate visual verification
full_stl = os.path.join(out_dir, "machine_full_temp.stl")
full_glb = os.path.join(out_dir, "machine_full.glb")

print("Generating surface mesh for complete machine...")
gmsh.model.mesh.generate(2)
gmsh.write(full_stl)
gmsh.finalize()

print("Converting complete machine STL to GLB with Trimesh...")
mesh = trimesh.load(full_stl)
# Center the machine or keep original coordinates? Let's check bounds
print(f"Machine bounds: min={mesh.bounds[0]}, max={mesh.bounds[1]}")
mesh.export(full_glb)
os.remove(full_stl)
print(f"Exported machine_full.glb ({os.path.getsize(full_glb)} bytes)")

# Save machine bounds and stats
stats = {
    "bounds_min": mesh.bounds[0].tolist(),
    "bounds_max": mesh.bounds[1].tolist(),
    "dimensions": (mesh.bounds[1] - mesh.bounds[0]).tolist(),
    "center": mesh.centroid.tolist(),
    "vertices_count": len(mesh.vertices),
    "faces_count": len(mesh.faces)
}
with open(os.path.join(out_dir, "machine_stats.json"), "w") as f:
    json.dump(stats, f, indent=2)

print("Machine stats saved:", json.dumps(stats, indent=2))

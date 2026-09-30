import gmsh
import trimesh
import os
import json

cad_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\cad_files"
out_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\public\models"
main_step = os.path.join(cad_dir, "main.STEP")

# Group definition based on CAD inspection
# Tags in Gmsh are 1-based (tag = solid_index + 1)
groups = {
    "frame_fixed": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 21, 22, 31, 32, 33, 34],
    "table": [20],
    "gantry_x": [15, 16, 17, 18, 23, 24, 25, 26, 27, 28, 29, 30],
    "spindle_z": [35, 36, 37, 38, 40],
    "tool": [39]
}

print("Loading main.STEP for kinematic group export...")
gmsh.initialize()
gmsh.option.setNumber("General.Terminal", 0)
gmsh.option.setNumber("Mesh.MeshSizeMin", 2.0)
gmsh.option.setNumber("Mesh.MeshSizeMax", 15.0)

gmsh.model.occ.importShapes(main_step)
gmsh.model.occ.synchronize()

solids = gmsh.model.getEntities(dim=3)
all_tags = [s[1] for s in solids]

kinematic_manifest = {}

for group_name, tags in groups.items():
    print(f"Meshing group '{group_name}' with {len(tags)} solids...")
    # Re-initialize for each group to isolate geometry cleanly
    gmsh.finalize()
    gmsh.initialize()
    gmsh.option.setNumber("General.Terminal", 0)
    gmsh.option.setNumber("Mesh.MeshSizeMin", 2.0)
    gmsh.option.setNumber("Mesh.MeshSizeMax", 15.0)
    
    gmsh.model.occ.importShapes(main_step)
    gmsh.model.occ.synchronize()
    
    # Remove all solids not in this group
    to_remove = [(3, t) for t in all_tags if t not in tags]
    gmsh.model.occ.remove(to_remove, recursive=True)
    gmsh.model.occ.synchronize()
    
    # Generate mesh
    gmsh.model.mesh.generate(2)
    tmp_stl = os.path.join(out_dir, f"{group_name}_temp.stl")
    out_glb = os.path.join(out_dir, f"{group_name}.glb")
    gmsh.write(tmp_stl)
    
    mesh = trimesh.load(tmp_stl)
    mesh.export(out_glb)
    if os.path.exists(tmp_stl):
        os.remove(tmp_stl)
        
    kinematic_manifest[group_name] = {
        "file": f"{group_name}.glb",
        "size_bytes": os.path.getsize(out_glb),
        "bounds_min": mesh.bounds[0].tolist(),
        "bounds_max": mesh.bounds[1].tolist(),
        "center": mesh.centroid.tolist(),
        "vertices": len(mesh.vertices),
        "faces": len(mesh.faces)
    }
    print(f"Exported {group_name}.glb: {len(mesh.vertices)} verts, {os.path.getsize(out_glb)} bytes")

gmsh.finalize()

with open(os.path.join(out_dir, "kinematic_manifest.json"), "w") as f:
    json.dump(kinematic_manifest, f, indent=2)

print("\nKinematic groups export complete!")
print(json.dumps(kinematic_manifest, indent=2))

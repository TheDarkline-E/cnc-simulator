import gmsh
import trimesh
import os
import json

cad_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\cad_files"
out_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\public\models"
main_step = os.path.join(cad_dir, "main.STEP")

# Group solids by kinematic role & material
# In Gmsh, tag = solid_index + 1
groups = {
    # 1. Base chassis: plate, leveling feet, bottom rails, central ball screw, corner brackets
    "frame_base": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 19, 21, 22, 31, 32, 33, 34],
    
    # 2. Gantry cross-beams: horizontal rails connecting columns
    "gantry_x": [15, 16, 17, 18, 23, 24, 25, 26, 27, 28, 29, 30],
    
    # 3. Work table with T-slots: Tag 20
    "table": [20],
    
    # 4. Spindle head: holder (35), screws (36, 37), motor body (38), Z carriage (40)
    "spindle_z": [35, 36, 37, 38, 40],
    
    # 5. Tool: Tag 39
    "tool": [39]
}

print("Starting high-fidelity CAD meshing pipeline...")

manifest = {}

for name, tags in groups.items():
    print(f"\n--- Meshing {name} ({len(tags)} solids) with curvature-adaptive precision ---")
    gmsh.initialize()
    gmsh.option.setNumber("General.Terminal", 0)
    # High-fidelity curvature-adaptive meshing:
    # Fine min size (0.8mm) to accurately capture screw threads and small fillets
    # Max size (4.0mm) to prevent coarse jagged triangles on planar faces
    # 24 elements per 2*pi curvature to make cylinders and circular holes perfectly round
    gmsh.option.setNumber("Mesh.MeshSizeMin", 0.8)
    gmsh.option.setNumber("Mesh.MeshSizeMax", 4.0)
    gmsh.option.setNumber("Mesh.MeshSizeFromCurvature", 24)
    gmsh.option.setNumber("Mesh.Smoothing", 10)
    
    gmsh.model.occ.importShapes(main_step)
    gmsh.model.occ.synchronize()
    
    all_solids = gmsh.model.getEntities(dim=3)
    all_tags = [s[1] for s in all_solids]
    
    to_remove = [(3, t) for t in all_tags if t not in tags]
    gmsh.model.occ.remove(to_remove, recursive=True)
    gmsh.model.occ.synchronize()
    
    gmsh.model.mesh.generate(2)
    tmp_stl = os.path.join(out_dir, f"{name}_clean.stl")
    out_glb = os.path.join(out_dir, f"{name}.glb")
    gmsh.write(tmp_stl)
    gmsh.finalize()
    
    mesh = trimesh.load(tmp_stl)
    # Compute clean vertex normals
    mesh.fix_normals()
    
    # Export clean GLB with vertex normals
    mesh.export(out_glb)
    if os.path.exists(tmp_stl):
        os.remove(tmp_stl)
        
    bounds = mesh.bounds
    manifest[name] = {
        "file": f"{name}.glb",
        "size_bytes": os.path.getsize(out_glb),
        "bounds_min": [round(float(x), 2) for x in bounds[0]],
        "bounds_max": [round(float(x), 2) for x in bounds[1]],
        "center": [round(float(x), 2) for x in mesh.centroid],
        "dimensions": [round(float(x), 2) for x in (bounds[1] - bounds[0])],
        "vertices": len(mesh.vertices),
        "faces": len(mesh.faces)
    }
    print(f"Exported {name}.glb: {len(mesh.vertices)} vertices, {len(mesh.faces)} faces, {os.path.getsize(out_glb):,} bytes")

with open(os.path.join(out_dir, "kinematic_manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2)

print("\nAll high-fidelity GLB models exported successfully!")

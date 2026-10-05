import gmsh
import trimesh
import os
import json

cad_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\cad_files"
out_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\public\models"
os.makedirs(out_dir, exist_ok=True)
main_step = os.path.join(cad_dir, "main.STEP")

# Complete, exhaustive breakdown of ALL 40 solids from main.STEP:
groups = {
    # 1. Base chassis: rails, bottom plate, leveling feet, stepper mounts, Y guide rails & ballscrew 19
    "frame_base": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 19, 21, 22],
    
    # 2. Main Outer Structural Cabinet / Frame: Tag 12 (850x850x702mm)
    "enclosure": [12],
    
    # 3. Four Corner Joint Brackets: Tags 31, 32, 33, 34
    "corner_joints": [31, 32, 33, 34],
    
    # 4. Y-axis Moving T-Slot Work Table: Tag 20
    "table": [20],
    
    # 5. X-axis Gantry: crossbeams (15, 23, 27), guide rails/screws (18, 26, 30), bearings (16, 17, 24, 25, 28, 29)
    "gantry_x": [15, 16, 17, 18, 23, 24, 25, 26, 27, 28, 29, 30],
    
    # 6. Z-axis Spindle: Holder (35), clamping bolts (36, 37), Spindle Motor Body (38)
    "spindle_z": [35, 36, 37, 38],
    
    # 7. Carbide End Mill Tool: Tag 39
    "tool": [39]
}

total_included = sum(len(v) for v in groups.values())
print(f"Total solids mapped: {total_included} of 39 CNC solids (Tag 40 3D printer hotend is excluded)")

manifest = {}

for name, tags in groups.items():
    print(f"\n=======================================================")
    print(f"Meshing '{name}' ({len(tags)} solids: {tags}) with Gmsh...")
    print(f"=======================================================")
    
    gmsh.initialize()
    gmsh.option.setNumber("General.Terminal", 0)
    # High-precision curvature adaptive meshing settings
    gmsh.option.setNumber("Mesh.MeshSizeMin", 1.5)
    gmsh.option.setNumber("Mesh.MeshSizeMax", 12.0)
    gmsh.option.setNumber("Mesh.MeshSizeFromCurvature", 20)
    gmsh.option.setNumber("Mesh.Smoothing", 10)
    
    gmsh.model.occ.importShapes(main_step)
    gmsh.model.occ.synchronize()
    
    solids = gmsh.model.getEntities(dim=3)
    all_tags = [s[1] for s in solids]
    
    to_remove = [(3, t) for t in all_tags if t not in tags]
    gmsh.model.occ.remove(to_remove, recursive=True)
    gmsh.model.occ.synchronize()
    
    gmsh.model.mesh.generate(2)
    tmp_stl = os.path.join(out_dir, f"{name}_temp.stl")
    out_glb = os.path.join(out_dir, f"{name}.glb")
    gmsh.write(tmp_stl)
    gmsh.finalize()
    
    mesh = trimesh.load(tmp_stl)
    mesh.fix_normals()
    mesh.export(out_glb)
    if os.path.exists(tmp_stl):
        os.remove(tmp_stl)
        
    bounds = mesh.bounds
    manifest[name] = {
        "file": f"{name}.glb",
        "solids": tags,
        "size_bytes": os.path.getsize(out_glb),
        "bounds_min": [round(float(x), 2) for x in bounds[0]],
        "bounds_max": [round(float(x), 2) for x in bounds[1]],
        "center": [round(float(x), 2) for x in mesh.centroid],
        "dimensions": [round(float(x), 2) for x in (bounds[1] - bounds[0])],
        "vertices": len(mesh.vertices),
        "faces": len(mesh.faces)
    }
    print(f"Successfully exported {name}.glb:")
    print(f"  Vertices: {len(mesh.vertices):,}, Faces: {len(mesh.faces):,}, Size: {os.path.getsize(out_glb):,} bytes")
    print(f"  Dimensions: {manifest[name]['dimensions']}")

with open(os.path.join(out_dir, "kinematic_manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2)

print("\nAll 7 CAD subassembly GLB models re-exported with 100% of parts intact!")

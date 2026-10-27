import gmsh
import trimesh
import numpy as np
import os
import json

cad_path = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\cad_files\main.STEP"
out_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\public\models"
os.makedirs(out_dir, exist_ok=True)

print("Initializing Gmsh and importing main.STEP...")
gmsh.initialize()
gmsh.option.setNumber("General.Terminal", 0)
# High fidelity adaptive meshing settings
gmsh.option.setNumber("Mesh.MeshSizeMin", 2.0)
gmsh.option.setNumber("Mesh.MeshSizeMax", 14.0)
gmsh.option.setNumber("Mesh.MeshSizeFromCurvature", 20)
gmsh.option.setNumber("Mesh.Smoothing", 8)

gmsh.model.occ.importShapes(cad_path)
gmsh.model.occ.synchronize()

print("Generating 2D surface mesh for all 40 CAD solids...")
gmsh.model.mesh.generate(2)
print("Mesh generation complete!")

# 1. Fetch all mesh nodes into global dict: tag -> [x, y, z]
node_tags, node_coords, _ = gmsh.model.mesh.getNodes()
node_coords = np.array(node_coords).reshape(-1, 3)
node_map = {tag: idx for idx, tag in enumerate(node_tags)}

solids = gmsh.model.getEntities(dim=3)
print(f"Found {len(solids)} solid volumes.")

def extract_solid_mesh(solid_tag):
    surfs = gmsh.model.getBoundary([(3, solid_tag)], combined=False, oriented=False)
    triangles = []
    for dim, s_tag in surfs:
        types, elem_tags, elem_nodes = gmsh.model.mesh.getElements(2, s_tag)
        for t, en in zip(types, elem_nodes):
            if t == 2: # 3-node triangle
                triangles.extend(en)
    if not triangles:
        return None
    
    tri_arr = np.array(triangles, dtype=np.int64).reshape(-1, 3)
    unique_node_tags, inverse_indices = np.unique(tri_arr, return_inverse=True)
    
    # Map to local vertex array
    vert_indices = [node_map[tag] for tag in unique_node_tags]
    local_verts = node_coords[vert_indices]
    local_faces = inverse_indices.reshape(-1, 3)
    
    mesh = trimesh.Trimesh(vertices=local_verts, faces=local_faces, process=True)
    return mesh

def combine_meshes(mesh_list):
    valid = [m for m in mesh_list if m is not None and len(m.vertices) > 0]
    if not valid:
        return None
    if len(valid) == 1:
        return valid[0]
    return trimesh.util.concatenate(valid)

# Subassemblies with distinct semantic part groups
subassembly_defs = {
    "spindle_z": {
        "spindle_clamp": [35],
        "spindle_fasteners": [36, 37],
        "spindle_motor": [38]
    },
    "gantry_x": {
        "gantry_beams": [15, 23, 27],
        "gantry_rails": [18, 26, 30],
        "gantry_carriages": [16, 17, 24, 25, 28, 29]
    },
    "frame_base": {
        "frame_extrusions": [1, 2, 3, 4, 5, 11],
        "frame_rails_y": [13, 14, 21, 22],
        "frame_ballscrew_y": [19],
        "frame_mounts": [6, 7, 8, 9, 10]
    },
    "table": {
        "table_bed": [20]
    },
    "corner_joints": {
        "corner_joints": [31, 32, 33, 34]
    },
    "enclosure": {
        "enclosure_hood": [12]
    },
    "tool": {
        "tool_cutter": [39]
    }
}

manifest = {}

for sub_name, part_groups in subassembly_defs.items():
    print(f"\nProcessing subassembly '{sub_name}'...")
    scene = trimesh.Scene()
    all_meshes = []
    
    for group_name, solid_tags in part_groups.items():
        group_meshes = [extract_solid_mesh(t) for t in solid_tags]
        combined = combine_meshes(group_meshes)
        if combined is not None:
            combined.fix_normals()
            scene.add_geometry(combined, node_name=group_name)
            all_meshes.append(combined)
            print(f"  + Added '{group_name}' (solids {solid_tags}): {len(combined.vertices):,} verts, {len(combined.faces):,} faces")
    
    out_glb = os.path.join(out_dir, f"{sub_name}.glb")
    scene.export(out_glb)
    
    full_combined = combine_meshes(all_meshes)
    bounds = full_combined.bounds if full_combined else [[0,0,0],[0,0,0]]
    all_solid_tags = [t for tags in part_groups.values() for t in tags]
    
    manifest[sub_name] = {
        "file": f"{sub_name}.glb",
        "solids": all_solid_tags,
        "parts": list(part_groups.keys()),
        "size_bytes": os.path.getsize(out_glb),
        "bounds_min": [round(float(x), 2) for x in bounds[0]],
        "bounds_max": [round(float(x), 2) for x in bounds[1]],
        "center": [round(float(x), 2) for x in (full_combined.centroid if full_combined is not None else [0,0,0])],
        "dimensions": [round(float(x), 2) for x in (bounds[1] - bounds[0])],
        "vertices": len(full_combined.vertices) if full_combined is not None else 0,
        "faces": len(full_combined.faces) if full_combined is not None else 0
    }
    print(f"Exported {sub_name}.glb: {manifest[sub_name]['size_bytes']:,} bytes, {manifest[sub_name]['faces']:,} faces")

gmsh.finalize()

with open(os.path.join(out_dir, "kinematic_manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2)

print("\nSUCCESS: All 7 CAD subassemblies re-exported with multi-solid semantic hierarchy!")

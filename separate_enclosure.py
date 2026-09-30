import gmsh
import trimesh
import os

cad_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\cad_files"
out_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\public\models"
main_step = os.path.join(cad_dir, "main.STEP")

print("Isolating solid 12 (enclosure) vs base frame...")
gmsh.initialize()
gmsh.option.setNumber("General.Terminal", 0)
gmsh.option.setNumber("Mesh.MeshSizeMin", 4.0)
gmsh.option.setNumber("Mesh.MeshSizeMax", 20.0)

# Export solid 12 as enclosure.glb
gmsh.model.occ.importShapes(main_step)
gmsh.model.occ.synchronize()
solids = gmsh.model.getEntities(dim=3)
all_tags = [s[1] for s in solids]

to_remove = [(3, t) for t in all_tags if t != 12]
gmsh.model.occ.remove(to_remove, recursive=True)
gmsh.model.occ.synchronize()
gmsh.model.mesh.generate(2)

enc_stl = os.path.join(out_dir, "enclosure_temp.stl")
gmsh.write(enc_stl)
gmsh.finalize()

m = trimesh.load(enc_stl)
enc_glb = os.path.join(out_dir, "enclosure.glb")
m.export(enc_glb)
os.remove(enc_stl)
print(f"Exported enclosure.glb: {len(m.vertices)} verts, bounds={m.bounds}")

# Now export base frame (frame solids WITHOUT tag 12)
frame_tags_without_12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 21, 22, 31, 32, 33, 34]
gmsh.initialize()
gmsh.option.setNumber("General.Terminal", 0)
gmsh.option.setNumber("Mesh.MeshSizeMin", 3.0)
gmsh.option.setNumber("Mesh.MeshSizeMax", 15.0)
gmsh.model.occ.importShapes(main_step)
gmsh.model.occ.synchronize()

to_remove = [(3, t) for t in all_tags if t not in frame_tags_without_12]
gmsh.model.occ.remove(to_remove, recursive=True)
gmsh.model.occ.synchronize()
gmsh.model.mesh.generate(2)

frame_stl = os.path.join(out_dir, "frame_base_temp.stl")
gmsh.write(frame_stl)
gmsh.finalize()

m_frame = trimesh.load(frame_stl)
frame_glb = os.path.join(out_dir, "frame_base.glb")
m_frame.export(frame_glb)
os.remove(frame_stl)
print(f"Exported frame_base.glb: {len(m_frame.vertices)} verts, bounds={m_frame.bounds}")

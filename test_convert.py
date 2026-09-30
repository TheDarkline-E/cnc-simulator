import gmsh
import trimesh
import os

cad_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\cad_files"
out_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\public\models"
os.makedirs(out_dir, exist_ok=True)

test_file = os.path.join(cad_dir, "tool.STEP")
temp_stl = os.path.join(out_dir, "tool_temp.stl")
out_glb = os.path.join(out_dir, "tool.glb")

gmsh.initialize()
gmsh.option.setNumber("General.Terminal", 0)
gmsh.option.setNumber("Mesh.CharacteristicLengthMin", 0.5)
gmsh.option.setNumber("Mesh.CharacteristicLengthMax", 2.0)
gmsh.model.occ.importShapes(test_file)
gmsh.model.occ.synchronize()
gmsh.model.mesh.generate(2) # 2D surface triangulation
gmsh.write(temp_stl)
gmsh.finalize()

mesh = trimesh.load(temp_stl)
mesh.export(out_glb)
os.remove(temp_stl)

print(f"Successfully converted tool.STEP -> {out_glb}")
print(f"Vertices: {len(mesh.vertices)}, Faces: {len(mesh.faces)}, Size: {os.path.getsize(out_glb)} bytes")

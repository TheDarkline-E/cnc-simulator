import gmsh
import os

cad_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\cad_files"
main_step = os.path.join(cad_dir, "main.STEP")

gmsh.initialize()
gmsh.option.setNumber("General.Terminal", 0)
gmsh.model.occ.importShapes(main_step)
gmsh.model.occ.synchronize()

# Get volume and surface count of Tag 12
dim = 3
tag = 12
vol = gmsh.model.occ.getMass(dim, tag)
com = gmsh.model.occ.getCenterOfMass(dim, tag)
surfs = gmsh.model.getBoundary([(dim, tag)])
print(f"Tag 12 volume: {vol}, center: {com}, surfaces: {len(surfs)}")

# Let's inspect Tag 11 as well
tag = 11
vol11 = gmsh.model.occ.getMass(dim, tag)
com11 = gmsh.model.occ.getCenterOfMass(dim, tag)
surfs11 = gmsh.model.getBoundary([(dim, tag)])
print(f"Tag 11 volume: {vol11}, center: {com11}, surfaces: {len(surfs11)}")

gmsh.finalize()

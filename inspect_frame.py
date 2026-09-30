import gmsh
import os
import json

cad_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\cad_files"
frame_path = os.path.join(cad_dir, "frame.STEP")

gmsh.initialize()
gmsh.option.setNumber("General.Terminal", 0)
gmsh.model.occ.importShapes(frame_path)
gmsh.model.occ.synchronize()

solids = gmsh.model.getEntities(dim=3)
print(f"Solids in frame.STEP: {len(solids)}")
frame_solids = []
for idx, s in enumerate(solids):
    dim, tag = s
    xmin, ymin, zmin, xmax, ymax, zmax = gmsh.model.getBoundingBox(dim, tag)
    vol = gmsh.model.occ.getMass(dim, tag)
    frame_solids.append({
        "index": idx,
        "tag": tag,
        "dims": [round(xmax - xmin, 2), round(ymax - ymin, 2), round(zmax - zmin, 2)],
        "vol": round(vol, 2)
    })
gmsh.finalize()

print("frame.STEP solids:")
for s in frame_solids:
    print(s)

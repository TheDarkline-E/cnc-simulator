import gmsh
import os
import json

cad_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\cad_files"
main_step = os.path.join(cad_dir, "main.STEP")

gmsh.initialize()
gmsh.option.setNumber("General.Terminal", 0)

# Import main.STEP
shapes = gmsh.model.occ.importShapes(main_step)
gmsh.model.occ.synchronize()

solids = gmsh.model.getEntities(dim=3)
print(f"Total solids in main.STEP: {len(solids)}")

solids_info = []

for idx, s in enumerate(solids):
    dim, tag = s
    xmin, ymin, zmin, xmax, ymax, zmax = gmsh.model.getBoundingBox(dim, tag)
    try:
        vol = gmsh.model.occ.getMass(dim, tag)
    except:
        vol = 0.0
    
    # Check if there is an entity name or label
    name = gmsh.model.getEntityName(dim, tag)
    
    solids_info.append({
        "solid_index": idx,
        "tag": tag,
        "name": name,
        "bbox_min": [round(xmin, 2), round(ymin, 2), round(zmin, 2)],
        "bbox_max": [round(xmax, 2), round(ymax, 2), round(zmax, 2)],
        "dimensions": [round(xmax - xmin, 2), round(ymax - ymin, 2), round(zmax - zmin, 2)],
        "volume": round(vol, 2)
    })

gmsh.finalize()

with open(r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\main_solids.json", "w") as f:
    json.dump(solids_info, f, indent=2)

print(f"Exported {len(solids_info)} solids metadata to main_solids.json")

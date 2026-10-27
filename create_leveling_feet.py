import numpy as np
import trimesh
import os

out_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\public\models"

def create_star_foot():
    # 8-lobed fluted star leveling foot pad matching CAD render
    num_points = 64
    angles = np.linspace(0, 2 * np.pi, num_points, endpoint=False)
    # Fluted radius varying between 33mm and 41mm
    r_outer = 37.0 + 4.0 * np.cos(8 * angles)
    
    # 2D cross-section polygon on XY plane
    poly_2d = np.column_stack([r_outer * np.cos(angles), r_outer * np.sin(angles)])
    poly = trimesh.path.polygons.Polygon(poly_2d)
    
    # Base disc extrusion (12mm thick along Z: Z=0 to Z=12)
    base_mesh = trimesh.creation.extrude_polygon(poly, height=12.0)
    
    # Upper stepped hub (diameter 32mm, height 10mm: Z=12 to Z=22)
    hub = trimesh.creation.cylinder(radius=16.0, height=10.0, sections=32)
    hub.apply_translation([0, 0, 17.0])
    
    # Tapered collar (radius 12mm, height 6mm: Z=22 to Z=28)
    collar = trimesh.creation.cylinder(radius=12.0, height=8.0, sections=32)
    collar.apply_translation([0, 0, 26.0])
    
    foot = trimesh.util.concatenate([base_mesh, hub, collar])
    
    # Currently Z goes from 0 to 30.
    # We want top of collar (Z=30) to sit at Y = 905.0 (overlapping stud by 5mm)
    # And bottom of foot (Z=0) to be at Y = 875.0.
    # In CAD space, Y is vertical.
    # To map +Z to +Y, we rotate around X by -90 degrees:
    # [x, y, z] -> [x, z, -y]
    rot = trimesh.transformations.rotation_matrix(-np.pi / 2, [1, 0, 0])
    foot.apply_transform(rot)
    
    # After rotation, Y ranges from 0 to 30.
    # We want top (Y=30) at Y=905, so translate Y by 875:
    # Then foot Y ranges from 875 to 905.
    foot.apply_translation([0, 875.0, 0])
    
    return foot

# The 4 centers from main.STEP solids 6, 7, 8, 9:
centers = [
    [493.23, 0, 2103.01],
    [493.23, 0, 1455.01],
    [1141.44, 0, 1455.01],
    [1141.44, 0, 2103.01]
]

all_feet = []
for c in centers:
    f = create_star_foot()
    f.apply_translation([c[0], 0, c[2]])
    all_feet.append(f)

combined = trimesh.util.concatenate(all_feet)
combined.fix_normals()
out_glb = os.path.join(out_dir, "leveling_feet.glb")
combined.export(out_glb)
print(f"Exported leveling_feet.glb: {len(combined.vertices)} verts, bounds=\n{combined.bounds}")

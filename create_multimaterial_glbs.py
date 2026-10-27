import trimesh
import numpy as np
import os
import json

models_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\public\models"

print("Starting fast multi-material GLB packaging...")

# 1. Process spindle_z.glb
print("\n1. Processing spindle_z.glb...")
m_spindle = trimesh.load(os.path.join(models_dir, "spindle_z.glb"), force="mesh")
spindle_bodies = trimesh.graph.split(m_spindle)
print(f"  Split into {len(spindle_bodies)} bodies.")
spindle_scene = trimesh.Scene()
for b in spindle_bodies:
    # Body 0: extents [148, 66, 152] is the billet mounting clamp
    # Body 1: extents [80, 135, 80] is the cylindrical spindle motor
    if max(b.extents) > 140:
        name = "spindle_clamp"
    else:
        name = "spindle_motor"
    spindle_scene.add_geometry(b, node_name=name)
    print(f"  -> '{name}': {len(b.vertices)} verts, extents={[round(x,1) for x in b.extents]}")

spindle_scene.export(os.path.join(models_dir, "spindle_z.glb"))
print("  Saved multi-material spindle_z.glb")

# 2. Process frame_base.glb
print("\n2. Processing frame_base.glb...")
m_frame = trimesh.load(os.path.join(models_dir, "frame_base.glb"), force="mesh")
frame_bodies = trimesh.graph.split(m_frame)
print(f"  Split into {len(frame_bodies)} bodies.")

rails_y = []
ballscrews_y = []
extrusions = []
arch = []
bed_plate = []
mounts = []

for b in frame_bodies:
    ext = b.extents
    # Guide rails: [20, 610, 20]
    if np.isclose(ext[1], 610.0, atol=15.0) and ext[0] < 30.0 and ext[2] < 30.0:
        rails_y.append(b)
    # Ballscrew: [20, 20, 690]
    elif np.isclose(ext[2], 690.0, atol=15.0) and ext[0] < 30.0 and ext[1] < 30.0:
        ballscrews_y.append(b)
    # Massive vertical arch: ~700 x ~600 x ~156
    elif ext[0] > 650.0 and ext[1] > 500.0:
        arch.append(b)
    # Base bed plate: ~600 x ~15 x ~600
    elif ext[0] > 550.0 and ext[2] > 550.0:
        bed_plate.append(b)
    elif max(ext) > 100.0:
        extrusions.append(b)
    else:
        mounts.append(b)

frame_scene = trimesh.Scene()
if rails_y:
    frame_scene.add_geometry(trimesh.util.concatenate(rails_y), node_name="frame_rails_y")
    print(f"  -> 'frame_rails_y': {len(rails_y)} rails combined")
if ballscrews_y:
    frame_scene.add_geometry(trimesh.util.concatenate(ballscrews_y), node_name="frame_ballscrew_y")
    print(f"  -> 'frame_ballscrew_y': {len(ballscrews_y)} ballscrew")
if arch:
    frame_scene.add_geometry(trimesh.util.concatenate(arch), node_name="frame_arch")
    print(f"  -> 'frame_arch': Main bridge arch")
if bed_plate:
    frame_scene.add_geometry(trimesh.util.concatenate(bed_plate), node_name="frame_bed")
    print(f"  -> 'frame_bed': Base plate")
if extrusions:
    frame_scene.add_geometry(trimesh.util.concatenate(extrusions), node_name="frame_extrusions")
    print(f"  -> 'frame_extrusions': {len(extrusions)} structural beams")
if mounts:
    frame_scene.add_geometry(trimesh.util.concatenate(mounts), node_name="frame_mounts")
    print(f"  -> 'frame_mounts': {len(mounts)} corner posts & brackets")

frame_scene.export(os.path.join(models_dir, "frame_base.glb"))
print("  Saved multi-material frame_base.glb")

# 3. Process corner_joints.glb
print("\n3. Processing corner_joints.glb...")
m_corners = trimesh.load(os.path.join(models_dir, "corner_joints.glb"), force="mesh")
corners_scene = trimesh.Scene()
corners_scene.add_geometry(m_corners, node_name="corner_joints")
corners_scene.export(os.path.join(models_dir, "corner_joints.glb"))
print("  Saved corner_joints.glb with semantic node 'corner_joints'")

# 4. Process table.glb
print("\n4. Processing table.glb...")
m_table = trimesh.load(os.path.join(models_dir, "table.glb"), force="mesh")
table_scene = trimesh.Scene()
table_scene.add_geometry(m_table, node_name="table_bed")
table_scene.export(os.path.join(models_dir, "table.glb"))
print("  Saved table.glb with semantic node 'table_bed'")

# 5. Process tool.glb
print("\n5. Processing tool.glb...")
m_tool = trimesh.load(os.path.join(models_dir, "tool.glb"), force="mesh")
tool_scene = trimesh.Scene()
tool_scene.add_geometry(m_tool, node_name="tool_carbide")
tool_scene.export(os.path.join(models_dir, "tool.glb"))
print("  Saved tool.glb with semantic node 'tool_carbide'")

# 6. Process enclosure.glb
print("\n6. Processing enclosure.glb...")
m_enc = trimesh.load(os.path.join(models_dir, "enclosure.glb"), force="mesh")
enc_scene = trimesh.Scene()
enc_scene.add_geometry(m_enc, node_name="enclosure_hood")
enc_scene.export(os.path.join(models_dir, "enclosure.glb"))
print("  Saved enclosure.glb with semantic node 'enclosure_hood'")

print("\nSUCCESS: All multi-material GLBs packaged with semantic mesh names!")

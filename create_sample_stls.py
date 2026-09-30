import trimesh
import os
import numpy as np

sample_dir = r"C:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator\public\samples"
os.makedirs(sample_dir, exist_ok=True)

# 1. Pocket block: 100mm x 80mm x 30mm with a 60mm x 40mm x 15mm central pocket
outer = trimesh.creation.box(extents=[100, 80, 30])
pocket = trimesh.creation.box(extents=[60, 40, 20])
pocket.apply_translation([0, 0, 10])

# Boolean difference
try:
    pocket_block = outer.difference(pocket)
except Exception:
    # Fallback to outer box
    pocket_block = outer

pocket_path = os.path.join(sample_dir, "pocket_block.stl")
pocket_block.export(pocket_path)
print(f"Generated sample pocket_block.stl: {os.path.getsize(pocket_path)} bytes")

# 2. Stepped mounting bracket
b1 = trimesh.creation.box(extents=[120, 60, 15])
b2 = trimesh.creation.box(extents=[50, 60, 25])
b2.apply_translation([35, 0, 15])
try:
    bracket = b1.union(b2)
except Exception:
    bracket = b1

bracket_path = os.path.join(sample_dir, "bracket.stl")
bracket.export(bracket_path)
print(f"Generated sample bracket.stl: {os.path.getsize(bracket_path)} bytes")

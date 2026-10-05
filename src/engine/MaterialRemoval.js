import * as THREE from 'three';
import { injectBilletPBRShader } from './ShaderInjection.js';

/**
 * Photorealistic PBR Material Presets
 */
export const MATERIAL_PRESETS = {
  al6061: {
    id: 'al6061',
    name: 'Aluminum 6061-T6',
    rawColor: [0.82, 0.85, 0.88],      // Matte silver-grey extruded mill finish
    cutColor: [0.96, 0.97, 0.99],      // Mirror-specular polished cut floor
    roughnessRaw: 0.42,
    roughnessCut: 0.08,
    metalness: 0.96,
    clearcoat: 0.65,
    clearcoatRoughness: 0.08,
    chipColor: 0xe2e8f0,               // Silver curled chips
    density: 2.70,                     // g/cm³
    hardness: '95 HB',
    optimalSFM: 800,
    swarfType: 'spiral'
  },
  brass: {
    id: 'brass',
    name: 'Brass 360 (Free Machining)',
    rawColor: [0.88, 0.72, 0.32],      // Warm extruded brass bar
    cutColor: [0.99, 0.86, 0.42],      // Gleaming mirror polished yellow gold
    roughnessRaw: 0.36,
    roughnessCut: 0.06,
    metalness: 0.92,
    clearcoat: 0.75,
    clearcoatRoughness: 0.06,
    chipColor: 0xfacc15,               // Brilliant golden flakes
    density: 8.50,
    hardness: '150 HB',
    optimalSFM: 600,
    swarfType: 'flake'
  },
  steel: {
    id: 'steel',
    name: 'Mild Steel 1018',
    rawColor: [0.42, 0.45, 0.48],      // Dark hot-rolled mill scale oxide
    cutColor: [0.88, 0.90, 0.92],      // Precision ground bright tool steel
    roughnessRaw: 0.52,
    roughnessCut: 0.12,
    metalness: 0.94,
    clearcoat: 0.45,
    clearcoatRoughness: 0.12,
    chipColor: 0x94a3b8,               // Dark grey steel needle chips
    density: 7.87,
    hardness: '126 HB',
    optimalSFM: 350,
    swarfType: 'needle'
  },
  stainless: {
    id: 'stainless',
    name: 'Stainless Steel 304',
    rawColor: [0.65, 0.68, 0.72],      // Cold-rolled austenitic passivation
    cutColor: [0.94, 0.95, 0.97],      // Polished surgical chrome finish
    roughnessRaw: 0.38,
    roughnessCut: 0.09,
    metalness: 0.95,
    clearcoat: 0.70,
    clearcoatRoughness: 0.08,
    chipColor: 0x60a5fa,               // Heat-tempered iridescent blue/straw chips
    density: 8.00,
    hardness: '180 HB',
    optimalSFM: 250,
    swarfType: 'ribbon'
  },
  titanium: {
    id: 'titanium',
    name: 'Titanium Ti-6Al-4V (Grade 5)',
    rawColor: [0.55, 0.54, 0.56],      // Deep satin aerospace titanium
    cutColor: [0.85, 0.86, 0.88],      // High-luster milled silver face
    roughnessRaw: 0.45,
    roughnessCut: 0.14,
    metalness: 0.90,
    clearcoat: 0.50,
    clearcoatRoughness: 0.14,
    chipColor: 0xa855f7,               // Purple/straw heat-tinted titanium turnings
    density: 4.43,
    hardness: '330 HB',
    optimalSFM: 120,
    swarfType: 'spiral'
  },
  delrin: {
    id: 'delrin',
    name: 'Delrin / POM-C (Polyacetal)',
    rawColor: [0.93, 0.92, 0.89],      // Matte engineering polymer ivory-white
    cutColor: [1.00, 1.00, 1.00],      // Pure smooth glossy white milled floor
    roughnessRaw: 0.55,
    roughnessCut: 0.18,
    metalness: 0.02,
    clearcoat: 0.35,
    clearcoatRoughness: 0.20,
    chipColor: 0xf8fafc,               // White polymer flakes
    density: 1.41,
    hardness: '85 M',
    optimalSFM: 1000,
    swarfType: 'flake'
  }
};

/**
 * MaterialRemovalEngine
 * High-resolution 320x240 heightfield with anisotropic tool mark normal perturbation,
 * steep pocket wall detection, real-time Ra/Rz surface roughness calculation,
 * and depth heatmap visualization.
 */
export class MaterialRemovalEngine {
  constructor(stock = { width: 100, length: 80, height: 30, material: 'al6061' }) {
    // 320x240 = 76,800 grid cells (high fidelity CNC tool marks)
    this.resX = 320;
    this.resY = 240;
    this.stock = { ...stock };
    this.initialVolume = (stock.width || 100) * (stock.length || 80) * (stock.height || 30);
    this.removedVolume = 0;
    this.lastCutTime = performance.now();
    this.currentMRR = 0; // Material Removal Rate in cm³/min
    this.displayMode = 'solid'; // 'solid' | 'ghost' | 'heatmap'

    this.grid = new Float32Array(this.resX * this.resY);
    this.cutDirX = new Float32Array(this.resX * this.resY);
    this.cutDirY = new Float32Array(this.resX * this.resY);

    // Dirty bounding box tracking for 60+ FPS incremental updates
    this.dirtyMinX = this.resX;
    this.dirtyMaxX = 0;
    this.dirtyMinY = this.resY;
    this.dirtyMaxY = 0;
    this.hasDirty = false;

    this.mesh = null;
    this.geometry = null;
    this.material = null;

    // Track previous tool tip position for swept volume cuts
    this.lastToolPos = null;

    // Measured surface roughness
    this.measuredRa = 1.6; // µm
    this.measuredRz = 6.3; // µm

    this.reset(stock);
  }

  reset(stock = this.stock) {
    this.stock = { ...stock };
    this.initialVolume = (stock.width || 100) * (stock.length || 80) * (stock.height || 30);
    this.removedVolume = 0;
    this.currentMRR = 0;
    this.lastToolPos = null;
    this.grid.fill(0.0);
    this.cutDirX.fill(1.0);
    this.cutDirY.fill(0.0);
    this.dirtyMinX = 0;
    this.dirtyMaxX = this.resX - 1;
    this.dirtyMinY = 0;
    this.dirtyMaxY = this.resY - 1;
    this.hasDirty = true;
    this.measuredRa = 1.6;
    this.measuredRz = 6.3;

    if (this.mesh && this.geometry) {
      this.rebuildOrUpdateAll();
    }
  }

  setGridResolution(resX, resY) {
    if (this.resX === resX && this.resY === resY) return;
    this.resX = resX;
    this.resY = resY;
    this.grid = new Float32Array(resX * resY);
    this.cutDirX = new Float32Array(resX * resY);
    this.cutDirY = new Float32Array(resX * resY);
    if (this.mesh && this.mesh.parent) {
      const parent = this.mesh.parent;
      parent.remove(this.mesh);
      this.createMesh(this.stock.material);
      parent.add(this.mesh);
    }
  }

  /**
   * Excavates material when tool plunges into or sweeps across stock.
   */
  cut(toolX, toolY, toolZ, toolDiameter = 6.0, toolType = 'flat_end_mill', feedRate = 800) {
    if (toolZ >= 0.05) {
      this.lastToolPos = { x: toolX, y: toolY, z: toolZ };
      this.currentMRR = 0;
      return false;
    }

    let modified = false;

    // Swept interpolation: if tool moved horizontally while cutting, interpolate intermediate steps
    if (this.lastToolPos && this.lastToolPos.z <= 0.05) {
      const dx = toolX - this.lastToolPos.x;
      const dy = toolY - this.lastToolPos.y;
      const dz = toolZ - this.lastToolPos.z;
      const dist = Math.hypot(dx, dy, dz);

      // Unit feed vector
      const feedLen = Math.hypot(dx, dy) || 1;
      const feedDirX = dx / feedLen;
      const feedDirY = dy / feedLen;

      const stepSize = Math.max(0.6, (toolDiameter || 6.0) * 0.28);
      if (dist > stepSize) {
        const numSteps = Math.min(24, Math.ceil(dist / stepSize));
        for (let s = 1; s < numSteps; s++) {
          const t = s / numSteps;
          const sx = this.lastToolPos.x + dx * t;
          const sy = this.lastToolPos.y + dy * t;
          const sz = this.lastToolPos.z + dz * t;
          if (this._cutSinglePoint(sx, sy, sz, toolDiameter, toolType, feedDirX, feedDirY)) {
            modified = true;
          }
        }
      }
    }

    const curFeedLen = this.lastToolPos ? Math.hypot(toolX - this.lastToolPos.x, toolY - this.lastToolPos.y) || 1 : 1;
    const curDirX = this.lastToolPos ? (toolX - this.lastToolPos.x) / curFeedLen : 1;
    const curDirY = this.lastToolPos ? (toolY - this.lastToolPos.y) / curFeedLen : 0;

    if (this._cutSinglePoint(toolX, toolY, toolZ, toolDiameter, toolType, curDirX, curDirY)) {
      modified = true;
    }

    this.lastToolPos = { x: toolX, y: toolY, z: toolZ };

    if (modified && this.mesh) {
      this.updateGeometry();
      
      const now = performance.now();
      const dt = (now - this.lastCutTime) / 1000.0;
      if (dt > 0.001) {
        const cutDepth = Math.abs(toolZ);
        const effectiveWidth = Math.min(this.stock.width, toolDiameter);
        this.currentMRR = Number(((cutDepth * effectiveWidth * (feedRate || 800)) / 1000).toFixed(1));
        
        // Approximate empirical Ra based on feed & cutter geometry
        const chipload = (feedRate || 800) / (8000 * 2); // mm per tooth
        const theoreticalRa = ((chipload * chipload) / (32 * (toolDiameter / 2))) * 1000;
        this.measuredRa = Number(Math.max(0.4, Math.min(6.3, theoreticalRa * 2.5 + 0.6)).toFixed(2));
        this.measuredRz = Number((this.measuredRa * 4.2).toFixed(2));
      }
      this.lastCutTime = now;
    }

    return modified;
  }

  _cutSinglePoint(toolX, toolY, toolZ, toolDiameter, toolType, feedDirX = 1, feedDirY = 0) {
    if (toolZ >= 0.0) return false;

    const halfW = this.stock.width / 2.0;
    const halfL = this.stock.length / 2.0;
    const radius = toolDiameter / 2.0;
    const radiusSq = radius * radius;

    // Convert tool center to grid bounds
    const minGridX = Math.max(0, Math.floor(((toolX - radius + halfW) / this.stock.width) * (this.resX - 1)));
    const maxGridX = Math.min(this.resX - 1, Math.ceil(((toolX + radius + halfW) / this.stock.width) * (this.resX - 1)));
    const minGridY = Math.max(0, Math.floor(((toolY - radius + halfL) / this.stock.length) * (this.resY - 1)));
    const maxGridY = Math.min(this.resY - 1, Math.ceil(((toolY + radius + halfL) / this.stock.length) * (this.resY - 1)));

    let modified = false;
    const cellArea = (this.stock.width / (this.resX - 1)) * (this.stock.length / (this.resY - 1));
    const isBallMill = toolType === 'ball_end_mill';

    for (let iy = minGridY; iy <= maxGridY; iy++) {
      const cellY = ((iy / (this.resY - 1)) * this.stock.length) - halfL;
      const dy = cellY - toolY;
      const dySq = dy * dy;

      for (let ix = minGridX; ix <= maxGridX; ix++) {
        const cellX = ((ix / (this.resX - 1)) * this.stock.width) - halfW;
        const dx = cellX - toolX;
        const distSq = dx * dx + dySq;

        if (distSq <= radiusSq) {
          let effectiveCutZ = toolZ;

          if (isBallMill) {
            const rOffset = Math.sqrt(Math.max(0, radiusSq - distSq));
            effectiveCutZ = toolZ + (radius - rOffset);
          }

          if (effectiveCutZ < 0) {
            const idx = iy * this.resX + ix;
            const currentDepth = this.grid[idx];
            if (effectiveCutZ < currentDepth) {
              const diff = currentDepth - effectiveCutZ;
              this.removedVolume += diff * cellArea;
              this.grid[idx] = effectiveCutZ;
              this.cutDirX[idx] = feedDirX;
              this.cutDirY[idx] = feedDirY;
              modified = true;
            }
          }
        }
      }
    }

    if (modified) {
      this.dirtyMinX = Math.min(this.dirtyMinX, Math.max(0, minGridX - 1));
      this.dirtyMaxX = Math.max(this.dirtyMaxX, Math.min(this.resX - 1, maxGridX + 1));
      this.dirtyMinY = Math.min(this.dirtyMinY, Math.max(0, minGridY - 1));
      this.dirtyMaxY = Math.max(this.dirtyMaxY, Math.min(this.resY - 1, maxGridY + 1));
      this.hasDirty = true;
    }

    return modified;
  }

  /**
   * Surface Roughness statistics
   */
  getSurfaceRoughness() {
    let isoGrade = 'N7';
    if (this.measuredRa <= 0.4) isoGrade = 'N5 (Polished)';
    else if (this.measuredRa <= 0.8) isoGrade = 'N6 (Fine Finish)';
    else if (this.measuredRa <= 1.6) isoGrade = 'N7 (Standard Milled)';
    else if (this.measuredRa <= 3.2) isoGrade = 'N8 (Medium Roughing)';
    else isoGrade = 'N9 (Heavy Roughing)';

    return {
      Ra: this.measuredRa,
      Rz: this.measuredRz,
      isoGrade
    };
  }

  /**
   * Builds the complete 3D Enclosed Volumetric Workpiece Mesh.
   */
  createMesh(presetId = 'al6061') {
    const matPreset = MATERIAL_PRESETS[this.stock.material || presetId] || MATERIAL_PRESETS.al6061;

    const resX = this.resX;
    const resY = this.resY;
    const nTop = resX * resY;
    const nSouth = resX * 2;
    const nNorth = resX * 2;
    const nWest = resY * 2;
    const nEast = resY * 2;
    const nBottom = 4;
    const totalVertices = nTop + nSouth + nNorth + nWest + nEast + nBottom;

    const positions = new Float32Array(totalVertices * 3);
    const normals = new Float32Array(totalVertices * 3);
    const colors = new Float32Array(totalVertices * 3);
    const roughnessAttrs = new Float32Array(totalVertices);
    const metalnessAttrs = new Float32Array(totalVertices);
    const aoAttrs = new Float32Array(totalVertices);
    const cutDirs = new Float32Array(totalVertices * 2);

    const totalQuads = (resX - 1) * (resY - 1) + (resX - 1) * 2 + (resY - 1) * 2 + 1;
    const totalIndices = totalQuads * 6;
    const indices = new (totalVertices > 65535 ? Uint32Array : Uint16Array)(totalIndices);

    const halfW = this.stock.width / 2.0;
    const halfL = this.stock.length / 2.0;
    const stockH = this.stock.height;

    const rawR = matPreset.rawColor[0];
    const rawG = matPreset.rawColor[1];
    const rawB = matPreset.rawColor[2];

    // 1. TOP HEIGHTFIELD
    for (let iy = 0; iy < resY; iy++) {
      const z = (iy / (resY - 1)) * this.stock.length - halfL;
      for (let ix = 0; ix < resX; ix++) {
        const x = (ix / (resX - 1)) * this.stock.width - halfW;
        const v = iy * resX + ix;

        positions[v * 3] = x;
        positions[v * 3 + 1] = 0.0;
        positions[v * 3 + 2] = z;

        normals[v * 3] = 0.0;
        normals[v * 3 + 1] = 1.0;
        normals[v * 3 + 2] = 0.0;

        colors[v * 3] = rawR;
        colors[v * 3 + 1] = rawG;
        colors[v * 3 + 2] = rawB;

        roughnessAttrs[v] = matPreset.roughnessRaw;
        metalnessAttrs[v] = matPreset.metalness;
        aoAttrs[v] = 1.0;
        cutDirs[v * 2] = 1.0;
        cutDirs[v * 2 + 1] = 0.0;
      }
    }

    let idx = 0;
    for (let iy = 0; iy < resY - 1; iy++) {
      for (let ix = 0; ix < resX - 1; ix++) {
        const i00 = iy * resX + ix;
        const i10 = i00 + 1;
        const i01 = (iy + 1) * resX + ix;
        const i11 = i01 + 1;

        indices[idx++] = i00;
        indices[idx++] = i01;
        indices[idx++] = i10;

        indices[idx++] = i10;
        indices[idx++] = i01;
        indices[idx++] = i11;
      }
    }

    // 2. SOUTH SKIRT WALL (Z = -halfL)
    const southOffset = nTop;
    for (let ix = 0; ix < resX; ix++) {
      const x = (ix / (resX - 1)) * this.stock.width - halfW;
      const topIdx = southOffset + ix * 2;
      const botIdx = topIdx + 1;

      positions[topIdx * 3] = x;
      positions[topIdx * 3 + 1] = 0.0;
      positions[topIdx * 3 + 2] = -halfL;
      normals[topIdx * 3] = 0; normals[topIdx * 3 + 1] = 0; normals[topIdx * 3 + 2] = -1;
      colors[topIdx * 3] = rawR; colors[topIdx * 3 + 1] = rawG; colors[topIdx * 3 + 2] = rawB;
      roughnessAttrs[topIdx] = matPreset.roughnessRaw;
      metalnessAttrs[topIdx] = matPreset.metalness;
      aoAttrs[topIdx] = 1.0;

      positions[botIdx * 3] = x;
      positions[botIdx * 3 + 1] = -stockH;
      positions[botIdx * 3 + 2] = -halfL;
      normals[botIdx * 3] = 0; normals[botIdx * 3 + 1] = 0; normals[botIdx * 3 + 2] = -1;
      colors[botIdx * 3] = rawR * 0.85; colors[botIdx * 3 + 1] = rawG * 0.85; colors[botIdx * 3 + 2] = rawB * 0.85;
      roughnessAttrs[botIdx] = matPreset.roughnessRaw;
      metalnessAttrs[botIdx] = matPreset.metalness;
      aoAttrs[botIdx] = 0.65;
    }

    for (let ix = 0; ix < resX - 1; ix++) {
      const t0 = southOffset + ix * 2;
      const b0 = t0 + 1;
      const t1 = southOffset + (ix + 1) * 2;
      const b1 = t1 + 1;

      indices[idx++] = t0;
      indices[idx++] = t1;
      indices[idx++] = b0;

      indices[idx++] = t1;
      indices[idx++] = b1;
      indices[idx++] = b0;
    }

    // 3. NORTH SKIRT WALL (Z = +halfL)
    const northOffset = southOffset + nSouth;
    for (let ix = 0; ix < resX; ix++) {
      const x = (ix / (resX - 1)) * this.stock.width - halfW;
      const topIdx = northOffset + ix * 2;
      const botIdx = topIdx + 1;

      positions[topIdx * 3] = x;
      positions[topIdx * 3 + 1] = 0.0;
      positions[topIdx * 3 + 2] = halfL;
      normals[topIdx * 3] = 0; normals[topIdx * 3 + 1] = 0; normals[topIdx * 3 + 2] = 1;
      colors[topIdx * 3] = rawR; colors[topIdx * 3 + 1] = rawG; colors[topIdx * 3 + 2] = rawB;
      roughnessAttrs[topIdx] = matPreset.roughnessRaw;
      metalnessAttrs[topIdx] = matPreset.metalness;
      aoAttrs[topIdx] = 1.0;

      positions[botIdx * 3] = x;
      positions[botIdx * 3 + 1] = -stockH;
      positions[botIdx * 3 + 2] = halfL;
      normals[botIdx * 3] = 0; normals[botIdx * 3 + 1] = 0; normals[botIdx * 3 + 2] = 1;
      colors[botIdx * 3] = rawR * 0.85; colors[botIdx * 3 + 1] = rawG * 0.85; colors[botIdx * 3 + 2] = rawB * 0.85;
      roughnessAttrs[botIdx] = matPreset.roughnessRaw;
      metalnessAttrs[botIdx] = matPreset.metalness;
      aoAttrs[botIdx] = 0.65;
    }

    for (let ix = 0; ix < resX - 1; ix++) {
      const t0 = northOffset + ix * 2;
      const b0 = t0 + 1;
      const t1 = northOffset + (ix + 1) * 2;
      const b1 = t1 + 1;

      indices[idx++] = t0;
      indices[idx++] = b0;
      indices[idx++] = t1;

      indices[idx++] = t1;
      indices[idx++] = b0;
      indices[idx++] = b1;
    }

    // 4. WEST SKIRT WALL (X = -halfW)
    const westOffset = northOffset + nNorth;
    for (let iy = 0; iy < resY; iy++) {
      const z = (iy / (resY - 1)) * this.stock.length - halfL;
      const topIdx = westOffset + iy * 2;
      const botIdx = topIdx + 1;

      positions[topIdx * 3] = -halfW;
      positions[topIdx * 3 + 1] = 0.0;
      positions[topIdx * 3 + 2] = z;
      normals[topIdx * 3] = -1; normals[topIdx * 3 + 1] = 0; normals[topIdx * 3 + 2] = 0;
      colors[topIdx * 3] = rawR; colors[topIdx * 3 + 1] = rawG; colors[topIdx * 3 + 2] = rawB;
      roughnessAttrs[topIdx] = matPreset.roughnessRaw;
      metalnessAttrs[topIdx] = matPreset.metalness;
      aoAttrs[topIdx] = 1.0;

      positions[botIdx * 3] = -halfW;
      positions[botIdx * 3 + 1] = -stockH;
      positions[botIdx * 3 + 2] = z;
      normals[botIdx * 3] = -1; normals[botIdx * 3 + 1] = 0; normals[botIdx * 3 + 2] = 0;
      colors[botIdx * 3] = rawR * 0.85; colors[botIdx * 3 + 1] = rawG * 0.85; colors[botIdx * 3 + 2] = rawB * 0.85;
      roughnessAttrs[botIdx] = matPreset.roughnessRaw;
      metalnessAttrs[botIdx] = matPreset.metalness;
      aoAttrs[botIdx] = 0.65;
    }

    for (let iy = 0; iy < resY - 1; iy++) {
      const t0 = westOffset + iy * 2;
      const b0 = t0 + 1;
      const t1 = westOffset + (iy + 1) * 2;
      const b1 = t1 + 1;

      indices[idx++] = t0;
      indices[idx++] = b0;
      indices[idx++] = t1;

      indices[idx++] = t1;
      indices[idx++] = b0;
      indices[idx++] = b1;
    }

    // 5. EAST SKIRT WALL (X = +halfW)
    const eastOffset = westOffset + nWest;
    for (let iy = 0; iy < resY; iy++) {
      const z = (iy / (resY - 1)) * this.stock.length - halfL;
      const topIdx = eastOffset + iy * 2;
      const botIdx = topIdx + 1;

      positions[topIdx * 3] = halfW;
      positions[topIdx * 3 + 1] = 0.0;
      positions[topIdx * 3 + 2] = z;
      normals[topIdx * 3] = 1; normals[topIdx * 3 + 1] = 0; normals[topIdx * 3 + 2] = 0;
      colors[topIdx * 3] = rawR; colors[topIdx * 3 + 1] = rawG; colors[topIdx * 3 + 2] = rawB;
      roughnessAttrs[topIdx] = matPreset.roughnessRaw;
      metalnessAttrs[topIdx] = matPreset.metalness;
      aoAttrs[topIdx] = 1.0;

      positions[botIdx * 3] = halfW;
      positions[botIdx * 3 + 1] = -stockH;
      positions[botIdx * 3 + 2] = z;
      normals[botIdx * 3] = 1; normals[botIdx * 3 + 1] = 0; normals[botIdx * 3 + 2] = 0;
      colors[botIdx * 3] = rawR * 0.85; colors[botIdx * 3 + 1] = rawG * 0.85; colors[botIdx * 3 + 2] = rawB * 0.85;
      roughnessAttrs[botIdx] = matPreset.roughnessRaw;
      metalnessAttrs[botIdx] = matPreset.metalness;
      aoAttrs[botIdx] = 0.65;
    }

    for (let iy = 0; iy < resY - 1; iy++) {
      const t0 = eastOffset + iy * 2;
      const b0 = t0 + 1;
      const t1 = eastOffset + (iy + 1) * 2;
      const b1 = t1 + 1;

      indices[idx++] = t0;
      indices[idx++] = t1;
      indices[idx++] = b0;

      indices[idx++] = t1;
      indices[idx++] = b1;
      indices[idx++] = b0;
    }

    // 6. BOTTOM BASE PLATE (Y = -stockH)
    const bottomOffset = eastOffset + nEast;
    positions[bottomOffset * 3 + 0] = -halfW; positions[bottomOffset * 3 + 1] = -stockH; positions[bottomOffset * 3 + 2] = -halfL;
    positions[(bottomOffset + 1) * 3 + 0] = halfW; positions[(bottomOffset + 1) * 3 + 1] = -stockH; positions[(bottomOffset + 1) * 3 + 2] = -halfL;
    positions[(bottomOffset + 2) * 3 + 0] = halfW; positions[(bottomOffset + 2) * 3 + 1] = -stockH; positions[(bottomOffset + 2) * 3 + 2] = halfL;
    positions[(bottomOffset + 3) * 3 + 0] = -halfW; positions[(bottomOffset + 3) * 3 + 1] = -stockH; positions[(bottomOffset + 3) * 3 + 2] = halfL;

    for (let i = 0; i < 4; i++) {
      normals[(bottomOffset + i) * 3 + 0] = 0;
      normals[(bottomOffset + i) * 3 + 1] = -1;
      normals[(bottomOffset + i) * 3 + 2] = 0;
      colors[(bottomOffset + i) * 3 + 0] = rawR * 0.75;
      colors[(bottomOffset + i) * 3 + 1] = rawG * 0.75;
      colors[(bottomOffset + i) * 3 + 2] = rawB * 0.75;
      roughnessAttrs[bottomOffset + i] = matPreset.roughnessRaw;
      metalnessAttrs[bottomOffset + i] = matPreset.metalness;
      aoAttrs[bottomOffset + i] = 0.45;
    }

    indices[idx++] = bottomOffset + 0;
    indices[idx++] = bottomOffset + 2;
    indices[idx++] = bottomOffset + 1;

    indices[idx++] = bottomOffset + 0;
    indices[idx++] = bottomOffset + 3;
    indices[idx++] = bottomOffset + 2;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aRoughness', new THREE.BufferAttribute(roughnessAttrs, 1));
    geo.setAttribute('aMetalness', new THREE.BufferAttribute(metalnessAttrs, 1));
    geo.setAttribute('aAO', new THREE.BufferAttribute(aoAttrs, 1));
    geo.setAttribute('aCutDir', new THREE.BufferAttribute(cutDirs, 2));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));

    const mat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      metalness: matPreset.metalness,
      roughness: matPreset.roughnessRaw,
      clearcoat: matPreset.clearcoat,
      clearcoatRoughness: matPreset.clearcoatRoughness,
      envMapIntensity: 2.2,
      side: THREE.DoubleSide,
      flatShading: false,
      transparent: this.displayMode === 'ghost',
      opacity: this.displayMode === 'ghost' ? 0.60 : 1.0,
      depthWrite: this.displayMode !== 'ghost'
    });

    // Inject custom per-vertex PBR roughness, metalness, AO, and anisotropic tool marks
    injectBilletPBRShader(mat);

    this.geometry = geo;
    this.material = mat;
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.rebuildOrUpdateAll();
    return this.mesh;
  }

  /**
   * Fast real-time update of excavated geometry with dirty-region bounding box optimization,
   * steep pocket wall detection, and anisotropic tool marks.
   */
  updateGeometry(fullRebuild = false) {
    if (!this.geometry || !this.mesh) return;

    const pos = this.geometry.attributes.position;
    const norm = this.geometry.attributes.normal;
    const col = this.geometry.attributes.color;
    const rough = this.geometry.attributes.aRoughness;
    const metal = this.geometry.attributes.aMetalness;
    const ao = this.geometry.attributes.aAO;
    const cutDir = this.geometry.attributes.aCutDir;

    const resX = this.resX;
    const resY = this.resY;
    const nTop = resX * resY;
    const nSouth = resX * 2;
    const nNorth = resX * 2;
    const nWest = resY * 2;

    const matPreset = MATERIAL_PRESETS[this.stock.material] || MATERIAL_PRESETS.al6061;
    const rawR = matPreset.rawColor[0];
    const rawG = matPreset.rawColor[1];
    const rawB = matPreset.rawColor[2];

    const cutR = matPreset.cutColor[0];
    const cutG = matPreset.cutColor[1];
    const cutB = matPreset.cutColor[2];

    const dx = this.stock.width / (resX - 1);
    const dz = this.stock.length / (resY - 1);

    const startY = fullRebuild ? 0 : Math.max(0, this.dirtyMinY);
    const endY = fullRebuild ? resY - 1 : Math.min(resY - 1, this.dirtyMaxY);
    const startX = fullRebuild ? 0 : Math.max(0, this.dirtyMinX);
    const endX = fullRebuild ? resX - 1 : Math.min(resX - 1, this.dirtyMaxX);

    // 1. Update Heightfield Vertices in Dirty Envelope
    for (let iy = startY; iy <= endY; iy++) {
      for (let ix = startX; ix <= endX; ix++) {
        const v = iy * resX + ix;
        const depth = this.grid[v];

        pos.setY(v, depth);

        // Dynamic Analytical Heightfield Normal via Central Differences
        const hL = ix > 0 ? this.grid[v - 1] : depth;
        const hR = ix < resX - 1 ? this.grid[v + 1] : depth;
        const hD = iy > 0 ? this.grid[v - resX] : depth;
        const hU = iy < resY - 1 ? this.grid[v + resX] : depth;

        let dHdX = (hR - hL) / (2.0 * dx);
        let dHdZ = (hU - hD) / (2.0 * dz);

        // Wall detection: sharpen vertical walls
        const slope = Math.hypot(dHdX, dHdZ);
        const isWall = slope > 0.8;

        if (depth < -0.05) {
          // Machined cut area: anisotropic tool scallop waves
          const cDx = this.cutDirX[v] || 1;
          const cDy = this.cutDirY[v] || 0;
          const scallop = Math.sin((ix * cDy - iy * cDx) * 3.5) * 0.025;
          dHdX += scallop * cDy;
          dHdZ -= scallop * cDx;
        }

        const len = Math.sqrt(dHdX * dHdX + 1.0 + dHdZ * dHdZ);
        norm.setXYZ(v, -dHdX / len, 1.0 / len, -dHdZ / len);

        if (cutDir) {
          cutDir.setXY(v, this.cutDirX[v], this.cutDirY[v]);
        }

        // Shading / Color Calculation
        if (this.displayMode === 'heatmap') {
          // Depth Heatmap: 0mm (green) -> 5mm (yellow) -> 12mm+ (red)
          const maxH = Math.max(1, this.stock.height * 0.7);
          const t = Math.min(1.0, Math.abs(depth) / maxH);

          let r, g, b;
          if (t < 0.35) {
            const f = t / 0.35;
            r = 0.06 + f * 0.90; g = 0.75 + f * 0.20; b = 0.45 * (1 - f);
          } else if (t < 0.7) {
            const f = (t - 0.35) / 0.35;
            r = 0.96; g = 0.95 - f * 0.55; b = 0.08;
          } else {
            const f = (t - 0.7) / 0.3;
            r = 0.96 - f * 0.15; g = 0.40 * (1 - f); b = 0.12;
          }

          // Subtle 1mm depth contour isolines
          const isoline = Math.abs(Math.sin(depth * Math.PI * 1.0));
          const lineDim = isoline < 0.15 ? 0.35 : 1.0;

          col.setXYZ(v, r * lineDim, g * lineDim, b * lineDim);
          if (rough) rough.setX(v, 0.25);
          if (metal) metal.setX(v, 0.4);
          if (ao) ao.setX(v, 1.0);
        } else {
          // Photorealistic Solid Mode
          if (depth < -0.05) {
            const cDx = this.cutDirX[v] || 1;
            const cDy = this.cutDirY[v] || 0;
            const swirl = Math.sin((ix * cDy - iy * cDx) * 2.8) * 0.015;

            // Pocket floor vs pocket vertical wall shading
            const wallDarken = isWall ? 0.88 : 1.0;

            col.setXYZ(
              v,
              Math.min(1.0, (cutR + swirl) * wallDarken),
              Math.min(1.0, (cutG + swirl) * wallDarken),
              Math.min(1.0, (cutB + swirl) * wallDarken)
            );

            if (rough) rough.setX(v, isWall ? matPreset.roughnessCut * 1.5 : matPreset.roughnessCut);
            if (metal) metal.setX(v, matPreset.metalness);
            if (ao) ao.setX(v, isWall ? 0.75 : 1.0);
          } else {
            col.setXYZ(v, rawR, rawG, rawB);
            if (rough) rough.setX(v, matPreset.roughnessRaw);
            if (metal) metal.setX(v, matPreset.metalness);
            if (ao) ao.setX(v, 1.0);
          }
        }
      }
    }

    // 2. Synchronize Side Skirt Wall Tops to Perimeter Cut Depths
    const southOffset = nTop;
    for (let ix = 0; ix < resX; ix++) {
      const depth = this.grid[ix];
      const topIdx = southOffset + ix * 2;
      pos.setY(topIdx, depth);
      if (depth < -0.05) col.setXYZ(topIdx, cutR, cutG, cutB);
    }

    const northOffset = southOffset + nSouth;
    const northRowStart = (resY - 1) * resX;
    for (let ix = 0; ix < resX; ix++) {
      const depth = this.grid[northRowStart + ix];
      const topIdx = northOffset + ix * 2;
      pos.setY(topIdx, depth);
      if (depth < -0.05) col.setXYZ(topIdx, cutR, cutG, cutB);
    }

    const westOffset = northOffset + nNorth;
    for (let iy = 0; iy < resY; iy++) {
      const depth = this.grid[iy * resX];
      const topIdx = westOffset + iy * 2;
      pos.setY(topIdx, depth);
      if (depth < -0.05) col.setXYZ(topIdx, cutR, cutG, cutB);
    }

    const eastOffset = westOffset + nWest;
    for (let iy = 0; iy < resY; iy++) {
      const depth = this.grid[iy * resX + (resX - 1)];
      const topIdx = eastOffset + iy * 2;
      pos.setY(topIdx, depth);
      if (depth < -0.05) col.setXYZ(topIdx, cutR, cutG, cutB);
    }

    pos.needsUpdate = true;
    norm.needsUpdate = true;
    col.needsUpdate = true;
    if (rough) rough.needsUpdate = true;
    if (metal) metal.needsUpdate = true;
    if (ao) ao.needsUpdate = true;
    if (cutDir) cutDir.needsUpdate = true;

    // Reset dirty bounding box
    this.dirtyMinX = this.resX;
    this.dirtyMaxX = 0;
    this.dirtyMinY = this.resY;
    this.dirtyMaxY = 0;
    this.hasDirty = false;
  }

  rebuildOrUpdateAll() {
    this.updateGeometry(true);
  }

  setMaterial(presetId) {
    if (!MATERIAL_PRESETS[presetId]) return;
    this.stock.material = presetId;
    const preset = MATERIAL_PRESETS[presetId];

    if (this.material) {
      this.material.metalness = preset.metalness;
      this.material.roughness = preset.roughnessRaw;
      this.material.clearcoat = preset.clearcoat;
      this.material.clearcoatRoughness = preset.clearcoatRoughness;
      this.material.needsUpdate = true;
    }
    this.updateGeometry(true);
  }

  setDisplayMode(mode) {
    this.displayMode = mode;
    if (!this.material) return;

    if (mode === 'ghost') {
      this.material.transparent = true;
      this.material.opacity = 0.55;
      this.material.depthWrite = false;
    } else {
      this.material.transparent = false;
      this.material.opacity = 1.0;
      this.material.depthWrite = true;
    }
    this.material.needsUpdate = true;
    this.updateGeometry(true);
  }

  getProgress() {
    const nominalRemovable = this.initialVolume * 0.45;
    const pct = Math.min(100, (this.removedVolume / (nominalRemovable || 1)) * 100);
    const matPreset = MATERIAL_PRESETS[this.stock.material] || MATERIAL_PRESETS.al6061;
    const removedCm3 = this.removedVolume / 1000.0;
    const removedGrams = removedCm3 * matPreset.density;

    return {
      removedVolumeMm3: Math.round(this.removedVolume),
      removedPercent: Math.round(pct),
      chipVolumeCm3: Number(removedCm3.toFixed(2)),
      chipMassGrams: Number(removedGrams.toFixed(1)),
      mrrCm3PerMin: this.currentMRR,
      material: matPreset.name,
      surfaceRoughness: this.getSurfaceRoughness()
    };
  }
}

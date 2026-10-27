/**
 * MachineKinematics.js
 * Digital Twin kinematic mapping for the user's supplied CNC machine.
 * Translates CNC G-Code / Manual coordinates (X, Y, Z in mm) into 
 * physical 3D scene transformations of the CAD subassemblies.
 */

export const MACHINE_SPECS = {
  name: "3-Axis CNC Milling Digital Twin",
  type: "Moving Gantry / Stationary Bed 3-Axis Mill",
  envelope: {
    x: { min: -150, max: 150, span: 300, name: "X Axis" },
    y: { min: -100, max: 100, span: 200, name: "Y Axis" },
    z: { min: -70, max: 50, span: 120, name: "Z Axis" },
  },
  maxFeedRate: 3000, // mm/min
  maxSpindleRPM: 12000,
  defaultFeedRate: 800,
  defaultSpindleRPM: 8000,
  homePosition: { x: 0, y: 0, z: 25 }, // Safe retract height
  // Table physical surface in Three.js world relative to machine center (0,0,0)
  tableCenterOffset: { x: 10.96, y: -332.64, z: -158.32 },
  tableDimensions: { width: 300, length: 200, height: 51.5 }
};

export class MachineKinematics {
  // Assembly park offsets from CAD rest position to Table Center + Stock Top:
  // Tool tip in CAD centered: (-208.16, +99.47, +217.64)
  // Table top center in CAD centered: (+10.41, -321.53, -158.32)
  static OFFSETS = {
    x: 218.57,       // 10.41 - (-208.16)
    tableZ: 375.96,  // Slide table along base rails to align center under spindle
    zPlunge: -421.00 // -321.53 - (+99.47)
  };

  constructor() {
    this.currentPos = { x: 0, y: 0, z: 25 };
    this.targetPos = { x: 0, y: 0, z: 25 };
    this.workOffset = { x: 0, y: 0, z: 0 }; // Work Coordinate System G54 offset
    this.stockHeight = 30.0;
    this.spindleRPM = 0;
    this.spindleActive = false;
    this.feedRate = 800;
    this.isHomed = true;
    this.limitsExceeded = false;
    this.lastError = null;

    // Operating Modes: 'work' (active digital twin machining / WCS tracking) or 'park'
    this.assemblyMode = 'work';
    this.explodedFactor = 0.0; // 0.0 = 100% solid unbroken assembly, 1.0 = full CAD inspection explosion

    // References to Three.js Object3D groups
    this.groups = {
      gantryX: null,
      tableY: null,
      spindleZ: null,
      tool: null,
      enclosure: null
    };
  }

  setStockConfig(stock) {
    if (stock && stock.height) {
      this.stockHeight = stock.height;
      this.applyTransform();
    }
  }

  setAssemblyMode(mode) {
    if (mode === 'park' || mode === 'work') {
      this.assemblyMode = mode;
      this.applyTransform();
    }
  }

  setExplodedFactor(factor) {
    this.explodedFactor = Math.max(0.0, Math.min(1.0, factor));
    this.applyTransform();
  }

  bindGroups({ gantryX, tableY, spindleZ, tool, enclosure }) {
    this.groups.gantryX = gantryX;
    this.groups.tableY = tableY;
    this.groups.spindleZ = spindleZ;
    this.groups.tool = tool;
    if (enclosure) this.groups.enclosure = enclosure;
    this.applyTransform();
  }

  setGroups(groups) {
    this.bindGroups({
      gantryX: groups.gantryX || groups.gantryGroup,
      tableY: groups.tableY || groups.tableGroup,
      spindleZ: groups.spindleZ || groups.spindleGroup,
      tool: groups.tool || groups.toolGroup,
      enclosure: groups.enclosure || groups.enclosureGroup
    });
  }

  setWorkOrigin(x = 0, y = 0, z = 0) {
    this.workOffset = { x, y, z };
  }

  checkLimits(x, y, z) {
    const env = MACHINE_SPECS.envelope;
    const errors = [];
    if (x < env.x.min || x > env.x.max) errors.push(`X limit [${env.x.min}, ${env.x.max}] exceeded: ${x.toFixed(1)} mm`);
    if (y < env.y.min || y > env.y.max) errors.push(`Y limit [${env.y.min}, ${env.y.max}] exceeded: ${y.toFixed(1)} mm`);
    if (z < env.z.min || z > env.z.max) errors.push(`Z limit [${env.z.min}, ${env.z.max}] exceeded: ${z.toFixed(1)} mm`);
    return { valid: errors.length === 0, errors };
  }

  moveTo(x, y, z, immediate = false) {
    const targetX = x !== undefined ? x : this.currentPos.x;
    const targetY = y !== undefined ? y : this.currentPos.y;
    const targetZ = z !== undefined ? z : this.currentPos.z;

    const limitCheck = this.checkLimits(targetX, targetY, targetZ);
    if (!limitCheck.valid) {
      this.limitsExceeded = true;
      this.lastError = limitCheck.errors.join('; ');
      this.currentPos.x = Math.max(MACHINE_SPECS.envelope.x.min, Math.min(MACHINE_SPECS.envelope.x.max, targetX));
      this.currentPos.y = Math.max(MACHINE_SPECS.envelope.y.min, Math.min(MACHINE_SPECS.envelope.y.max, targetY));
      this.currentPos.z = Math.max(MACHINE_SPECS.envelope.z.min, Math.min(MACHINE_SPECS.envelope.z.max, targetZ));
    } else {
      this.limitsExceeded = false;
      this.lastError = null;
      this.currentPos = { x: targetX, y: targetY, z: targetZ };
    }

    // Auto-engage active work mode when machine is moving
    if (this.assemblyMode === 'park') {
      this.assemblyMode = 'work';
    }

    this.applyTransform();
    return !this.limitsExceeded;
  }

  setSpindle(active, rpm = 8000) {
    this.spindleActive = active;
    this.spindleRPM = active ? rpm : 0;
  }

  setFeedRate(feed) {
    this.feedRate = Math.max(10, Math.min(MACHINE_SPECS.maxFeedRate, feed));
  }

  home() {
    this.currentPos = {
      x: MACHINE_SPECS.homePosition.x,
      y: MACHINE_SPECS.homePosition.y,
      z: MACHINE_SPECS.homePosition.z
    };
    this.isHomed = true;
    this.applyTransform();
  }

  /**
   * Applies the current coordinates to the actual CAD subassemblies:
   * 1. In 'park' mode: All subassemblies rest at exact (0,0,0) CAD factory alignment.
   * 2. In 'work' mode: 
   *    - Gantry crossbeam moves vertically in Y (CNC Z) along the vertical columns.
   *    - Spindle carriage moves horizontally in X (CNC X) along the gantry crossbeam.
   *    - Work table moves in Z (CNC Y) along the bed rails underneath.
   * 3. Exploded factor allows smooth, non-destructive disassembly for inspection.
   * 4. Tool rotates strictly on its own centered collet shaft.
   */
  applyTransform() {
    const { gantryX, tableY, spindleZ, tool, enclosure } = this.groups;
    if (!gantryX || !spindleZ) return;

    const ef = this.explodedFactor;

    if (this.assemblyMode === 'park') {
      // 100% Exact Factory CAD Reference Assembly matching main.STEP
      gantryX.position.set(0, ef * 80, 0);
      spindleZ.position.set(ef * 120, 0, 0);
      if (tableY) tableY.position.set(0, 0, -ef * 100);
      if (enclosure) enclosure.position.set(0, ef * 180, 0);
    } else {
      // Active Digital Twin Machining Mode
      const off = MachineKinematics.OFFSETS;

      // 1. Gantry bridge travels vertically along the upright columns to the workpiece level + Z height
      gantryX.position.set(0, off.zPlunge + this.stockHeight + this.currentPos.z + ef * 80, 0);

      // 2. Spindle carriage slides horizontally along gantry rails in X
      spindleZ.position.set(off.x + this.currentPos.x + ef * 120, 0, 0);

      // 3. Work table slides along base bed rails in Three.js Z (CNC Y depth)
      if (tableY) {
        tableY.position.set(0, 0, off.tableZ - this.currentPos.y - ef * 100);
      }

      if (enclosure) {
        enclosure.position.set(0, ef * 180, 0);
      }
    }

    // 4. Tool rotates concentrically on its own collet shaft
    if (tool && this.spindleActive) {
      tool.rotation.y += 0.35;
    }
  }

  getDRO() {
    return {
      x: this.currentPos.x,
      y: this.currentPos.y,
      z: this.currentPos.z,
      spindleRPM: this.spindleRPM,
      feedRate: this.feedRate,
      spindleActive: this.spindleActive,
      limitsExceeded: this.limitsExceeded,
      lastError: this.lastError,
      assemblyMode: this.assemblyMode,
      explodedFactor: this.explodedFactor
    };
  }
}


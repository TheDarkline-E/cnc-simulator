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

    // References to Three.js Object3D groups
    this.groups = {
      gantryX: null,
      tableY: null,
      spindleZ: null,
      tool: null
    };
  }

  setStockConfig(stock) {
    if (stock && stock.height) {
      this.stockHeight = stock.height;
      this.applyTransform();
    }
  }

  bindGroups({ gantryX, tableY, spindleZ, tool }) {
    this.groups.gantryX = gantryX;
    this.groups.tableY = tableY;
    this.groups.spindleZ = spindleZ;
    this.groups.tool = tool;
    this.applyTransform();
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
    this.moveTo(
      MACHINE_SPECS.homePosition.x,
      MACHINE_SPECS.homePosition.y,
      MACHINE_SPECS.homePosition.z,
      true
    );
    this.isHomed = true;
  }

  /**
   * Applies the current coordinates to the actual CAD subassemblies:
   * 1. Gantry bridge is fixed across columns.
   * 2. Spindle carriage slides in X and plunges vertically in Y (CNC Z).
   * 3. Work table slides in Z (CNC Y depth) with stroke offset to meet spindle.
   * 4. Tool rotates when spindle is active.
   */
  applyTransform() {
    const { gantryX, tableY, spindleZ, tool } = this.groups;
    if (!gantryX || !spindleZ) return;

    const off = MachineKinematics.OFFSETS;
    const stockTopY = off.zPlunge + this.stockHeight;

    // 1. Gantry bridge is solidly bolted across upright columns
    gantryX.position.set(0, 0, 0);

    // 2. Spindle carriage slides along gantry in X, plunges in Y (CNC Z plunge)
    spindleZ.position.x = off.x + this.currentPos.x;
    spindleZ.position.y = stockTopY + this.currentPos.z;
    spindleZ.position.z = 0;

    // 3. Work table slides along base rails in Z (CNC Y depth)
    if (tableY) {
      tableY.position.z = off.tableZ - this.currentPos.y;
    }

    // 4. Tool rotates with spindle
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
      lastError: this.lastError
    };
  }
}

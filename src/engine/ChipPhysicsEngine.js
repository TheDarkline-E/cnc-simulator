import * as THREE from 'three';

/**
 * ChipPhysicsEngine
 * Blender-grade physics-driven CNC chip / swarf simulation using THREE.InstancedMesh.
 * Simulates material-specific 3D chip geometries, centrifugal ejection from spindle RPM,
 * gravity, air drag, collision bounce with machine table/stock, and realistic swarf accumulation.
 */
export class ChipPhysicsEngine {
  constructor(maxChips = 800) {
    this.maxChips = maxChips;
    this.activeCount = 0;
    this.nextIndex = 0;

    // Per-chip physics state arrays
    this.positions = new Float32Array(maxChips * 3);
    this.velocities = new Float32Array(maxChips * 3);
    this.rotations = new Float32Array(maxChips * 4); // Quaternions
    this.angularVels = new Float32Array(maxChips * 3);
    this.scales = new Float32Array(maxChips);
    this.lifetimes = new Float32Array(maxChips);     // 0.0 -> 1.0
    this.settled = new Uint8Array(maxChips);         // 1 if resting on table

    // InstancedMesh and Geometries
    this.mesh = null;
    this.material = null;
    this.geometries = {};
    this.currentMaterialId = 'al6061';

    this.initGeometries();
    this.initInstancedMesh();
  }

  initGeometries() {
    // 1. Aluminum: Curled spiral turnings (Torus knot profile)
    this.geometries['al6061'] = new THREE.TorusGeometry(1.4, 0.35, 6, 12, Math.PI * 1.6);

    // 2. Brass: Small hexagonal golden flakes
    this.geometries['brass'] = new THREE.CylinderGeometry(1.2, 1.2, 0.25, 6);

    // 3. Mild Steel & Stainless: Segmented needle turnings
    this.geometries['steel'] = new THREE.CylinderGeometry(0.3, 0.2, 3.2, 5);
    this.geometries['stainless'] = new THREE.CylinderGeometry(0.35, 0.25, 4.0, 5);

    // 4. Titanium: Curled helix turnings with heat tinting
    this.geometries['titanium'] = new THREE.TorusGeometry(1.6, 0.45, 6, 12, Math.PI * 1.8);

    // 5. Delrin: Low-poly fluffy polymer chips
    this.geometries['delrin'] = new THREE.IcosahedronGeometry(1.1, 0);
  }

  initInstancedMesh() {
    const geo = this.geometries[this.currentMaterialId] || this.geometries['al6061'];

    this.material = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.18,
      clearcoat: 0.4,
      clearcoatRoughness: 0.1,
      envMapIntensity: 2.2,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.InstancedMesh(geo, this.material, this.maxChips);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = false;

    // Initialize all instances off-screen or scaled to 0
    const dummy = new THREE.Object3D();
    dummy.scale.set(0, 0, 0);
    dummy.position.set(0, -9999, 0);
    dummy.updateMatrix();

    for (let i = 0; i < this.maxChips; i++) {
      this.mesh.setMatrixAt(i, dummy.matrix);
      this.settled[i] = 0;
      this.lifetimes[i] = 1.0;
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  setMaterialPreset(materialId, preset) {
    if (this.currentMaterialId === materialId) return;
    this.currentMaterialId = materialId;

    if (this.material && preset) {
      this.material.color.setHex(preset.chipColor || 0xe2e8f0);
      this.material.metalness = preset.metalness !== undefined ? preset.metalness : 0.92;
      this.material.roughness = preset.roughnessCut !== undefined ? preset.roughnessCut : 0.2;
      this.material.needsUpdate = true;
    }

    // Update geometry if needed
    const targetGeo = this.geometries[materialId] || this.geometries['al6061'];
    if (this.mesh && this.mesh.geometry !== targetGeo) {
      this.mesh.geometry = targetGeo;
    }
  }

  /**
   * Spawns a batch of fresh chips at the tool-stock contact point
   */
  emitChips(toolPos, toolRadius = 3.0, rpm = 8000, mrr = 15.0, count = 3) {
    const dummy = new THREE.Object3D();
    const q = new THREE.Quaternion();
    const euler = new THREE.Euler();

    for (let c = 0; c < count; c++) {
      const idx = this.nextIndex;
      this.nextIndex = (this.nextIndex + 1) % this.maxChips;

      // Contact point jitter along tool circumference
      const contactAngle = Math.random() * Math.PI * 2;
      const r = (Math.random() * 0.6 + 0.4) * toolRadius;
      const spawnX = toolPos.x + Math.cos(contactAngle) * r;
      const spawnY = toolPos.z; // in stock coordinate frame, tool.z is depth
      const spawnZ = toolPos.y + Math.sin(contactAngle) * r;

      this.positions[idx * 3] = spawnX;
      this.positions[idx * 3 + 1] = spawnY;
      this.positions[idx * 3 + 2] = spawnZ;

      // Centrifugal tangential ejection speed (scaled with spindle RPM)
      const tangentAngle = contactAngle + Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      const speed = (rpm / 8000.0) * (Math.random() * 80 + 40); // mm/s
      const upVelocity = Math.random() * 45 + 15; // mm/s upward arc

      this.velocities[idx * 3] = Math.cos(tangentAngle) * speed;
      this.velocities[idx * 3 + 1] = upVelocity;
      this.velocities[idx * 3 + 2] = Math.sin(tangentAngle) * speed;

      // Angular tumbling velocity
      this.angularVels[idx * 3] = (Math.random() - 0.5) * 35;
      this.angularVels[idx * 3 + 1] = (Math.random() - 0.5) * 35;
      this.angularVels[idx * 3 + 2] = (Math.random() - 0.5) * 35;

      euler.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      q.setFromEuler(euler);
      this.rotations[idx * 4] = q.x;
      this.rotations[idx * 4 + 1] = q.y;
      this.rotations[idx * 4 + 2] = q.z;
      this.rotations[idx * 4 + 3] = q.w;

      // Size variation
      this.scales[idx] = Math.random() * 0.5 + 0.75;
      this.lifetimes[idx] = 0.0;
      this.settled[idx] = 0;
    }
  }

  /**
   * Physics step: applies gravity, air drag, collision bounce with table, and swarf accumulation
   */
  update(dt, isCutting, toolPos, toolRadius = 3.0, rpm = 8000, mrr = 15.0, stockHeight = 30) {
    if (!this.mesh) return;

    // Emit new chips if actively cutting
    if (isCutting && toolPos) {
      // Emit count scales with Material Removal Rate
      const emitRate = Math.max(1, Math.min(6, Math.floor((mrr || 10) / 4) + 1));
      this.emitChips(toolPos, toolRadius, rpm, mrr, emitRate);
    }

    const gravity = -9810 * 0.08; // scaled gravity for mm/s²
    const airDrag = 0.985;
    const tableLevel = -stockHeight; // Table surface plane in stock local space
    const dummy = new THREE.Object3D();
    const q = new THREE.Quaternion();
    const deltaQ = new THREE.Quaternion();
    const euler = new THREE.Euler();

    let needsMatrixUpdate = false;

    for (let i = 0; i < this.maxChips; i++) {
      if (this.lifetimes[i] >= 1.0) continue; // inactive or expired

      // If chip has settled on table, it remains visible as swarf pile
      if (this.settled[i]) {
        // Slowly age settled chips so table doesn't overflow over 10 minutes
        this.lifetimes[i] += dt * 0.02;
        if (this.lifetimes[i] >= 1.0) {
          dummy.scale.set(0, 0, 0);
          dummy.position.set(0, -9999, 0);
          dummy.updateMatrix();
          this.mesh.setMatrixAt(i, dummy.matrix);
          needsMatrixUpdate = true;
        }
        continue;
      }

      needsMatrixUpdate = true;

      // 1. Physics Integration (Verlet / Euler)
      const pIdx = i * 3;
      const rIdx = i * 4;

      // Apply gravity and air drag
      this.velocities[pIdx + 1] += gravity * dt;
      this.velocities[pIdx] *= airDrag;
      this.velocities[pIdx + 1] *= airDrag;
      this.velocities[pIdx + 2] *= airDrag;

      // Update position
      this.positions[pIdx] += this.velocities[pIdx] * dt;
      this.positions[pIdx + 1] += this.velocities[pIdx + 1] * dt;
      this.positions[pIdx + 2] += this.velocities[pIdx + 2] * dt;

      // Update rotation
      euler.set(
        this.angularVels[pIdx] * dt,
        this.angularVels[pIdx + 1] * dt,
        this.angularVels[pIdx + 2] * dt
      );
      deltaQ.setFromEuler(euler);
      q.set(this.rotations[rIdx], this.rotations[rIdx + 1], this.rotations[rIdx + 2], this.rotations[rIdx + 3]);
      q.multiply(deltaQ);
      this.rotations[rIdx] = q.x;
      this.rotations[rIdx + 1] = q.y;
      this.rotations[rIdx + 2] = q.z;
      this.rotations[rIdx + 3] = q.w;

      // 2. Collision with Table Plane
      if (this.positions[pIdx + 1] <= tableLevel) {
        this.positions[pIdx + 1] = tableLevel + Math.random() * 0.5; // slight pile height

        // Bounce restitution
        const restitution = 0.28;
        this.velocities[pIdx + 1] = -this.velocities[pIdx + 1] * restitution;
        this.velocities[pIdx] *= 0.45;     // floor friction
        this.velocities[pIdx + 2] *= 0.45;

        // If low speed, settle into swarf accumulation pile
        const speedSq = this.velocities[pIdx] ** 2 + this.velocities[pIdx + 1] ** 2 + this.velocities[pIdx + 2] ** 2;
        if (speedSq < 300 || this.lifetimes[i] > 0.45) {
          this.settled[i] = 1;
          this.velocities[pIdx] = 0;
          this.velocities[pIdx + 1] = 0;
          this.velocities[pIdx + 2] = 0;
        }
      }

      this.lifetimes[i] += dt * 0.35;

      // Update transformation matrix in InstancedMesh
      dummy.position.set(this.positions[pIdx], this.positions[pIdx + 1], this.positions[pIdx + 2]);
      dummy.quaternion.set(this.rotations[rIdx], this.rotations[rIdx + 1], this.rotations[rIdx + 2], this.rotations[rIdx + 3]);
      const s = this.scales[i];
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();

      this.mesh.setMatrixAt(i, dummy.matrix);
    }

    if (needsMatrixUpdate) {
      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  /**
   * Cleans accumulated chips off table
   */
  blowOffChips() {
    const dummy = new THREE.Object3D();
    dummy.scale.set(0, 0, 0);
    dummy.position.set(0, -9999, 0);
    dummy.updateMatrix();

    for (let i = 0; i < this.maxChips; i++) {
      this.lifetimes[i] = 1.0;
      this.settled[i] = 0;
      this.mesh.setMatrixAt(i, dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material.dispose();
    }
    Object.values(this.geometries).forEach(g => g.dispose());
  }
}

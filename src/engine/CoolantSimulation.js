import * as THREE from 'three';

/**
 * CoolantSimulation
 * Blender-grade fluid & coolant simulation for CNC machining.
 * Features:
 * 1. Dual directional pressurized nozzle streams aimed at tool-workpiece interface
 * 2. High-speed volumetric cutting mist / aerosol cloud scaling with spindle RPM
 * 3. Fluid accumulation shimmer pool on machine table
 * 4. Glass droplet splatter overlay effect
 */
export class CoolantSimulation {
  constructor(maxDroplets = 240, maxMist = 35) {
    this.maxDroplets = maxDroplets;
    this.maxMist = maxMist;
    this.active = false;
    this.mode = 'flood'; // 'flood' | 'mist' | 'off'

    this.group = new THREE.Group();
    this.group.name = 'coolant_simulation_group';

    this.dropletMesh = null;
    this.mistGroup = null;
    this.poolMesh = null;

    // Physics data for droplets
    this.dropletPositions = new Float32Array(maxDroplets * 3);
    this.dropletVelocities = new Float32Array(maxDroplets * 3);
    this.dropletLifetimes = new Float32Array(maxDroplets);

    // Mist particle data
    this.mistSprites = [];

    this.initDroplets();
    this.initMist();
    this.initTablePool();
  }

  initDroplets() {
    const geo = new THREE.SphereGeometry(1.2, 8, 6);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,       // Water-soluble coolant emulsion (pale blue-white)
      transmission: 0.82,
      opacity: 0.75,
      transparent: true,
      roughness: 0.05,
      ior: 1.333,
      metalness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      depthWrite: false
    });

    this.dropletMesh = new THREE.InstancedMesh(geo, mat, this.maxDroplets);
    this.dropletMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    dummy.scale.set(0, 0, 0);
    dummy.position.set(0, -9999, 0);
    dummy.updateMatrix();

    for (let i = 0; i < this.maxDroplets; i++) {
      this.dropletMesh.setMatrixAt(i, dummy.matrix);
      this.dropletLifetimes[i] = 1.0;
    }
    this.dropletMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.dropletMesh);
  }

  initMist() {
    this.mistGroup = new THREE.Group();
    this.group.add(this.mistGroup);

    // Procedural soft mist sprite texture
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(224, 242, 254, 0.45)');
    grad.addColorStop(0.4, 'rgba(210, 235, 255, 0.25)');
    grad.addColorStop(0.8, 'rgba(200, 225, 250, 0.08)');
    grad.addColorStop(1.0, 'rgba(200, 225, 250, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);

    for (let i = 0; i < this.maxMist; i++) {
      const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(15, 15, 1);
      sprite.position.set(0, -9999, 0);
      this.mistGroup.add(sprite);

      this.mistSprites.push({
        sprite,
        mat,
        life: Math.random(),
        baseScale: Math.random() * 18 + 14,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 8 + 4,
        vz: (Math.random() - 0.5) * 6
      });
    }
  }

  initTablePool() {
    // Thin translucent liquid puddle on table
    const geo = new THREE.PlaneGeometry(160, 140, 16, 16);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x7dd3fc,
      transmission: 0.75,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 0.8,
      transparent: true,
      opacity: 0.0, // starts invisible until flood coolant runs
      depthWrite: false
    });
    this.poolMesh = new THREE.Mesh(geo, mat);
    this.poolMesh.rotation.x = -Math.PI / 2;
    this.poolMesh.position.set(0, -29.8, 0); // slightly above stock bottom
    this.group.add(this.poolMesh);
  }

  setCoolantState(active, mode = 'flood') {
    this.active = active;
    this.mode = mode;
    if (!active) {
      // Fade out mist & pool
      if (this.dropletMesh) this.dropletMesh.visible = false;
      this.mistSprites.forEach(m => { m.mat.opacity = 0; });
      if (this.poolMesh) this.poolMesh.material.opacity = 0;
    } else {
      if (this.dropletMesh) this.dropletMesh.visible = true;
    }
  }

  /**
   * Update coolant fluid simulation
   */
  update(dt, toolPos, spindleRpm = 8000, isCutting = false) {
    if (!this.active || !toolPos) {
      if (this.poolMesh && this.poolMesh.material.opacity > 0.01) {
        this.poolMesh.material.opacity = Math.max(0, this.poolMesh.material.opacity - dt * 0.15);
      }
      return;
    }

    const dummy = new THREE.Object3D();
    let needsMatrixUpdate = false;

    // Dual nozzle emitter positions offset from tool (located on spindle nose)
    const nozzleLeft = { x: toolPos.x - 18, y: toolPos.z + 28, z: toolPos.y - 14 };
    const nozzleRight = { x: toolPos.x + 18, y: toolPos.z + 28, z: toolPos.y - 14 };
    const target = { x: toolPos.x, y: toolPos.z, z: toolPos.y };

    // Emit spray droplets
    const emitBatch = 6;
    for (let b = 0; b < emitBatch; b++) {
      const idx = Math.floor(Math.random() * this.maxDroplets);
      if (this.dropletLifetimes[idx] >= 1.0) {
        const fromNozzle = Math.random() < 0.5 ? nozzleLeft : nozzleRight;
        this.dropletPositions[idx * 3] = fromNozzle.x;
        this.dropletPositions[idx * 3 + 1] = fromNozzle.y;
        this.dropletPositions[idx * 3 + 2] = fromNozzle.z;

        // Direction vector towards tool tip + cone scatter
        const dx = target.x - fromNozzle.x + (Math.random() - 0.5) * 8;
        const dy = target.y - fromNozzle.y + (Math.random() - 0.5) * 5;
        const dz = target.z - fromNozzle.z + (Math.random() - 0.5) * 8;
        const dist = Math.hypot(dx, dy, dz) || 1;
        const speed = Math.random() * 120 + 220; // mm/s fast spray

        this.dropletVelocities[idx * 3] = (dx / dist) * speed;
        this.dropletVelocities[idx * 3 + 1] = (dy / dist) * speed;
        this.dropletVelocities[idx * 3 + 2] = (dz / dist) * speed;
        this.dropletLifetimes[idx] = 0.0;
      }
    }

    // Update droplet positions
    for (let i = 0; i < this.maxDroplets; i++) {
      if (this.dropletLifetimes[i] >= 1.0) continue;

      needsMatrixUpdate = true;
      const idx = i * 3;
      this.dropletVelocities[idx + 1] -= 9810 * 0.12 * dt; // gravity

      this.dropletPositions[idx] += this.dropletVelocities[idx] * dt;
      this.dropletPositions[idx + 1] += this.dropletVelocities[idx + 1] * dt;
      this.dropletPositions[idx + 2] += this.dropletVelocities[idx + 2] * dt;

      this.dropletLifetimes[i] += dt * 2.8;

      if (this.dropletLifetimes[i] >= 1.0 || this.dropletPositions[idx + 1] < -30) {
        this.dropletLifetimes[i] = 1.0;
        dummy.scale.set(0, 0, 0);
        dummy.position.set(0, -9999, 0);
        dummy.updateMatrix();
        this.dropletMesh.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.position.set(this.dropletPositions[idx], this.dropletPositions[idx + 1], this.dropletPositions[idx + 2]);
        const s = Math.sin((1.0 - this.dropletLifetimes[i]) * Math.PI) * 0.9;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        this.dropletMesh.setMatrixAt(i, dummy.matrix);
      }
    }

    if (needsMatrixUpdate) {
      this.dropletMesh.instanceMatrix.needsUpdate = true;
    }

    // 2. Volumetric Mist Vapor
    const mistTargetOpacity = (spindleRpm / 12000.0) * (isCutting ? 0.38 : 0.18);
    this.mistSprites.forEach((m) => {
      m.life += dt * 0.8;
      if (m.life >= 1.0) {
        m.life = 0;
        // spawn near cut interface
        m.sprite.position.set(
          toolPos.x + (Math.random() - 0.5) * 8,
          toolPos.z + Math.random() * 4,
          toolPos.y + (Math.random() - 0.5) * 8
        );
      } else {
        m.sprite.position.x += m.vx * dt;
        m.sprite.position.y += m.vy * dt;
        m.sprite.position.z += m.vz * dt;

        const progress = m.life;
        const curScale = m.baseScale * (1.0 + progress * 1.5);
        m.sprite.scale.set(curScale, curScale, 1);
        m.mat.opacity = Math.sin(progress * Math.PI) * mistTargetOpacity;
      }
    });

    // 3. Flood Pool Level
    if (this.poolMesh && this.mode === 'flood') {
      this.poolMesh.material.opacity = Math.min(0.45, this.poolMesh.material.opacity + dt * 0.1);
    }
  }

  dispose() {
    if (this.dropletMesh) {
      this.dropletMesh.geometry.dispose();
      this.dropletMesh.material.dispose();
    }
    if (this.poolMesh) {
      this.poolMesh.geometry.dispose();
      this.poolMesh.material.dispose();
    }
    this.mistSprites.forEach(m => {
      m.mat.map.dispose();
      m.mat.dispose();
    });
  }
}

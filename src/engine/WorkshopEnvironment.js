import * as THREE from 'three';

/**
 * WorkshopEnvironment
 * Generates a photorealistic industrial workshop HDRI environment map procedurally at runtime.
 * Creates an indoor CNC machine shop with overhead fluorescent tubes, structural steel trusses,
 * concrete walls, and workshop accent bounce lights baked via PMREMGenerator.
 */
export class WorkshopEnvironment {
  constructor(renderer) {
    this.renderer = renderer;
    this.pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.pmremGenerator.compileEquirectangularShader();
    this.currentTexture = null;
  }

  /**
   * Generates a PMREM cube texture representing a realistic CNC machine shop.
   * @param {boolean} isLight - Whether light theme or dark moody workshop theme
   * @returns {THREE.Texture}
   */
  generate(isLight = false) {
    if (this.currentTexture) {
      this.currentTexture.dispose();
      this.currentTexture = null;
    }

    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(isLight ? 0x2a3342 : 0x0c1018);

    // Workshop room dimensions (cube centered around origin)
    const roomSize = 50;

    // 1. Concrete Floor with subtle reflections
    const floorGeo = new THREE.PlaneGeometry(roomSize * 2, roomSize * 2);
    const floorMat = new THREE.MeshBasicMaterial({
      color: isLight ? 0x3d4856 : 0x141a24
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -roomSize / 2;
    envScene.add(floor);

    // 2. Ceiling
    const ceilGeo = new THREE.PlaneGeometry(roomSize * 2, roomSize * 2);
    const ceilMat = new THREE.MeshBasicMaterial({
      color: isLight ? 0x222a36 : 0x080b10
    });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomSize / 2;
    envScene.add(ceiling);

    // 3. Workshop Walls
    const wallMat = new THREE.MeshBasicMaterial({
      color: isLight ? 0x4a5568 : 0x161e2b
    });
    
    // Back wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize * 2, roomSize), wallMat);
    backWall.position.set(0, 0, -roomSize);
    envScene.add(backWall);

    // Front wall
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize * 2, roomSize), wallMat);
    frontWall.position.set(0, 0, roomSize);
    frontWall.rotation.y = Math.PI;
    envScene.add(frontWall);

    // Left wall (with machinery/tool cabinets silhouette)
    const leftWallMat = new THREE.MeshBasicMaterial({
      color: isLight ? 0x334155 : 0x111722
    });
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize * 2, roomSize), leftWallMat);
    leftWall.position.set(-roomSize, 0, 0);
    leftWall.rotation.y = Math.PI / 2;
    envScene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize * 2, roomSize), leftWallMat);
    rightWall.position.set(roomSize, 0, 0);
    rightWall.rotation.y = -Math.PI / 2;
    envScene.add(rightWall);

    // 4. Overhead Industrial Fluorescent Light Fixtures (High Luminance for Specular Gleam)
    // In Eevee / Cycles, realistic metal reflections come from long linear ceiling fixtures
    const lightFixtures = [
      // Main central bay overhead dual rows
      { x: -8, y: roomSize / 2 - 0.5, z: 0, w: 2.2, l: 28, color: 0xffffff, intensity: isLight ? 4.5 : 3.8 },
      { x: 8,  y: roomSize / 2 - 0.5, z: 0, w: 2.2, l: 28, color: 0xfff6eb, intensity: isLight ? 4.2 : 3.5 },
      // Side work lighting
      { x: -18, y: roomSize / 2 - 1.0, z: -6, w: 1.8, l: 18, color: 0xeef4ff, intensity: isLight ? 3.5 : 3.0 },
      { x: 18,  y: roomSize / 2 - 1.0, z: 6,  w: 1.8, l: 18, color: 0xfffaed, intensity: isLight ? 3.5 : 3.0 },
      // Front high-angle fill
      { x: 0,   y: roomSize / 2 - 1.2, z: 16, w: 24, l: 2.0, color: 0xffffff, intensity: isLight ? 3.2 : 2.8 },
      { x: 0,   y: roomSize / 2 - 1.2, z: -16, w: 24, l: 2.0, color: 0xe8f0fe, intensity: isLight ? 2.8 : 2.4 }
    ];

    lightFixtures.forEach(fix => {
      const fixGeo = new THREE.PlaneGeometry(fix.w, fix.l);
      // High intensity color for HDR specular glint
      const fixMat = new THREE.MeshBasicMaterial({
        color: fix.color
      });
      fixMat.color.multiplyScalar(fix.intensity);
      const mesh = new THREE.Mesh(fixGeo, fixMat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(fix.x, fix.y, fix.z);
      envScene.add(mesh);

      // Add dark fixture housing backing
      const housingGeo = new THREE.PlaneGeometry(fix.w + 0.8, fix.l + 0.8);
      const housingMat = new THREE.MeshBasicMaterial({ color: 0x111620 });
      const housingMesh = new THREE.Mesh(housingGeo, housingMat);
      housingMesh.rotation.x = Math.PI / 2;
      housingMesh.position.set(fix.x, fix.y + 0.1, fix.z);
      envScene.add(housingMesh);
    });

    // 5. Secondary Workshop Details (Gives complex reflections on curved machine metals)
    // Cool-tinted high bay window reflection on left wall
    const windowGeo = new THREE.PlaneGeometry(16, 8);
    const windowMat = new THREE.MeshBasicMaterial({ color: isLight ? 0x93c5fd : 0x3b82f6 });
    windowMat.color.multiplyScalar(isLight ? 4.0 : 2.5);
    const winMesh = new THREE.Mesh(windowGeo, windowMat);
    winMesh.position.set(-roomSize + 0.2, 6, -8);
    winMesh.rotation.y = Math.PI / 2;
    envScene.add(winMesh);

    // Warm safety cabinet / tool chest reflection on right wall
    const chestGeo = new THREE.PlaneGeometry(12, 10);
    const chestMat = new THREE.MeshBasicMaterial({ color: isLight ? 0xf59e0b : 0xb45309 });
    chestMat.color.multiplyScalar(isLight ? 2.5 : 1.8);
    const chestMesh = new THREE.Mesh(chestGeo, chestMat);
    chestMesh.position.set(roomSize - 0.2, -8, 4);
    chestMesh.rotation.y = -Math.PI / 2;
    envScene.add(chestMesh);

    // Steel support columns (giving vertical edge glints in spindle & gantry)
    const colGeo = new THREE.BoxGeometry(1.5, roomSize, 1.5);
    const colMat = new THREE.MeshBasicMaterial({ color: isLight ? 0x1e293b : 0x0f172a });
    const colPositions = [
      [-22, 0, -22], [-22, 0, 22], [22, 0, -22], [22, 0, 22]
    ];
    colPositions.forEach(([cx, cy, cz]) => {
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(cx, cy, cz);
      envScene.add(col);
    });

    // Bake into high quality PMREM cubemap
    const renderTarget = this.pmremGenerator.fromScene(envScene, 0.04);
    this.currentTexture = renderTarget.texture;

    // Clean up temporary scene
    envScene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });

    return this.currentTexture;
  }

  dispose() {
    if (this.currentTexture) {
      this.currentTexture.dispose();
      this.currentTexture = null;
    }
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
    }
  }
}

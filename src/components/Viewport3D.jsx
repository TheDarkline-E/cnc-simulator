import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { 
  Eye, EyeOff, Box, Compass, RotateCw, ZoomIn, 
  Layers, Maximize2, ShieldAlert, Sparkles, Activity
} from 'lucide-react';
import { CADImporter } from '../engine/CADImporter';
import { MATERIAL_PRESETS } from '../engine/MaterialRemoval';

// Machine center in CAD coordinates
const MACHINE_CENTER = new THREE.Vector3(804.5, 1384.77, 1742.33);
// Table top surface in CAD centered space
const TABLE_SURFACE_POS = new THREE.Vector3(10.41, -321.53, -158.32);

export default function Viewport3D({
  kinematics,
  materialEngine,
  toolpathData,
  stockConfig,
  userPartFile,
  simState,
  theme = 'light'
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const gridRef = useRef(null);

  // Scene group references (100% strictly CAD subassemblies from main.STEP)
  const machineRootRef = useRef(null);
  const gantryGroupRef = useRef(null);
  const tableGroupRef = useRef(null);
  const spindleGroupRef = useRef(null);
  const toolGroupRef = useRef(null);
  const workpieceGroupRef = useRef(null);
  const stockGroupRef = useRef(null);
  const toolpathGroupRef = useRef(null);
  const particleGroupRef = useRef(null);

  // Particle systems references (Metal chips / swarf)
  const chipGeoRef = useRef(null);
  const chipMatRef = useRef(null);
  const chipParticlesRef = useRef(null);
  const chipVelocitiesRef = useRef([]);

  // Visibility & Workpiece Display state
  const [showMachine, setShowMachine] = useState(true);
  const [enclosureMode, setEnclosureMode] = useState('hide'); // 'hide' | 'glass' | 'solid'
  const [workpieceMode, setWorkpieceMode] = useState('solid'); // 'solid' | 'ghost' | 'partOnly'
  const [showToolpath, setShowToolpath] = useState(true);
  const [modelLoading, setModelLoading] = useState(true);
  const [cadLoading, setCadLoading] = useState(false);

  const enclosureGroupRef = useRef(null);
  const enclosureMaterialsRef = useRef({ glass: null, solid: null });

  const cadImporter = useMemo(() => new CADImporter(), []);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    const isLight = theme === 'light';
    scene.background = new THREE.Color(isLight ? 0xe8ecf1 : 0x0a0f1a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 5, 8000);
    camera.position.set(480, 360, 580);
    cameraRef.current = camera;

    // Renderer — high-quality PBR pipeline
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLight ? 1.25 : 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Studio Environment Map for realistic metallic specular reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnvScene = new RoomEnvironment();
    const envTexture = pmremGenerator.fromScene(roomEnvScene, 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(10, -220, -100);
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controlsRef.current = controls;

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isLight ? 1.0 : 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(
      isLight ? 0xdfe6ed : 0x3a4a5c,
      isLight ? 0x8794a0 : 0x1a2530,
      isLight ? 0.9 : 0.6
    );
    scene.add(hemiLight);

    // Key light (warm industrial white)
    const dirLight1 = new THREE.DirectionalLight(isLight ? 0xfff5e6 : 0xffe8cc, isLight ? 2.2 : 1.8);
    dirLight1.position.set(700, 1000, 800);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.camera.near = 100;
    dirLight1.shadow.camera.far = 3000;
    dirLight1.shadow.camera.left = -700;
    dirLight1.shadow.camera.right = 700;
    dirLight1.shadow.camera.top = 700;
    dirLight1.shadow.camera.bottom = -700;
    dirLight1.shadow.bias = 0.0005;
    scene.add(dirLight1);

    // Fill light (cool machine floor fill)
    const dirLight2 = new THREE.DirectionalLight(isLight ? 0xe0e8f5 : 0x7090b0, isLight ? 1.5 : 1.2);
    dirLight2.position.set(-700, 600, 500);
    scene.add(dirLight2);

    // Rim light for crisp silhouettes
    const dirLight3 = new THREE.DirectionalLight(isLight ? 0xc8d6e5 : 0x506070, isLight ? 1.2 : 0.9);
    dirLight3.position.set(0, 800, -800);
    scene.add(dirLight3);

    const bottomLight = new THREE.DirectionalLight(isLight ? 0xd0d8e0 : 0x2a3540, isLight ? 0.8 : 0.6);
    bottomLight.position.set(0, -600, 0);
    scene.add(bottomLight);

    // Factory floor
    const floorGeo = new THREE.PlaneGeometry(2400, 2400);
    const floorMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xc0c8d0 : 0x1a2030,
      roughness: isLight ? 0.55 : 0.7,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -420;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridColor1 = isLight ? 0x9aa8b8 : 0x2a3848;
    const gridColor2 = isLight ? 0xb8c4d0 : 0x1e2838;
    const grid = new THREE.GridHelper(2400, 48, gridColor1, gridColor2);
    grid.position.y = -419.5;
    grid.material.transparent = true;
    grid.material.opacity = 0.35;
    scene.add(grid);
    gridRef.current = grid;

    // Create Machine Hierarchy Groups (100% strictly from user's CAD model main.STEP)
    const machineRoot = new THREE.Group();
    scene.add(machineRoot);
    machineRootRef.current = machineRoot;

    const enclosureGroup = new THREE.Group();
    const gantryGroup = new THREE.Group();
    const tableGroup = new THREE.Group();
    const spindleGroup = new THREE.Group();
    const toolGroup = new THREE.Group();
    const workpieceGroup = new THREE.Group();
    const stockGroup = new THREE.Group();
    const toolpathGroup = new THREE.Group();
    const particleGroup = new THREE.Group();

    machineRoot.add(enclosureGroup);
    machineRoot.add(tableGroup);
    machineRoot.add(gantryGroup);
    gantryGroup.add(spindleGroup);
    spindleGroup.add(toolGroup);

    enclosureGroupRef.current = enclosureGroup;

    // Mount workpiece, stock & toolpath to table so they follow Y depth kinematics
    tableGroup.add(stockGroup);
    tableGroup.add(workpieceGroup);
    tableGroup.add(toolpathGroup);
    tableGroup.add(particleGroup);

    gantryGroupRef.current = gantryGroup;
    tableGroupRef.current = tableGroup;
    spindleGroupRef.current = spindleGroup;
    toolGroupRef.current = toolGroup;
    workpieceGroupRef.current = workpieceGroup;
    stockGroupRef.current = stockGroup;
    toolpathGroupRef.current = toolpathGroup;
    particleGroupRef.current = particleGroup;

    // Origin Position for workpiece elements on the CAD table
    const stockHeight = stockConfig?.height || 30.0;
    const originPos = new THREE.Vector3(
      TABLE_SURFACE_POS.x,
      TABLE_SURFACE_POS.y + stockHeight,
      TABLE_SURFACE_POS.z
    );
    stockGroup.position.copy(originPos);
    workpieceGroup.position.copy(originPos);
    toolpathGroup.position.copy(originPos);
    particleGroup.position.copy(originPos);

    // ================= Dynamic Metal Swarf / Chip Particles =================
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = 0;
      particlePositions[i * 3 + 1] = 0;
      particlePositions[i * 3 + 2] = 0;
      particleVelocities.push({
        vx: (Math.random() - 0.5) * 16,
        vy: Math.random() * 10 + 3,
        vz: (Math.random() - 0.5) * 16,
        life: Math.random()
      });
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const initialPreset = MATERIAL_PRESETS[stockConfig?.material] || MATERIAL_PRESETS.al6061;
    const particleMat = new THREE.PointsMaterial({
      color: initialPreset.chipColor,
      size: 4.0,
      transparent: true,
      opacity: 0.90
    });
    const chipParticles = new THREE.Points(particleGeo, particleMat);
    chipParticles.visible = false;
    particleGroup.add(chipParticles);

    chipGeoRef.current = particleGeo;
    chipMatRef.current = particleMat;
    chipParticlesRef.current = chipParticles;
    chipVelocitiesRef.current = particleVelocities;

    // Bind Kinematic Groups to Engine
    if (kinematics) {
      kinematics.setStockConfig(stockConfig);
      kinematics.bindGroups({
        gantryX: gantryGroup,
        tableY: tableGroup,
        spindleZ: spindleGroup,
        tool: toolGroup
      });
    }

    // Load 100% original CAD subassembly models extracted from main.STEP
    loadMachineModels(machineRoot, enclosureGroup, gantryGroup, tableGroup, spindleGroup, toolGroup, theme);

    // ================= Animation Loop =================
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();

      // Tool Spindle Rotation
      if (kinematics && kinematics.spindleActive && toolGroupRef.current) {
        toolGroupRef.current.rotation.y += 0.35;
      }

      const curTool = kinematics ? kinematics.currentPos : { x: 0, y: 0, z: 25 };
      const isCutting = kinematics && kinematics.spindleActive && (curTool.z <= 0.05);

      // Dynamic Chip Spray with Gravity
      if (chipParticlesRef.current && chipGeoRef.current) {
        if (isCutting) {
          chipParticlesRef.current.visible = true;
          const posAttr = chipGeoRef.current.attributes.position;
          const vels = chipVelocitiesRef.current;

          for (let i = 0; i < particleCount; i++) {
            const v = vels[i];
            v.life += 0.045;
            if (v.life >= 1.0) {
              v.life = 0;
              posAttr.setXYZ(i, curTool.x, curTool.z, curTool.y);
              const angle = Math.random() * Math.PI * 2;
              const spd = Math.random() * 22 + 6;
              v.vx = Math.cos(angle) * spd;
              v.vy = Math.random() * 12 + 5;
              v.vz = Math.sin(angle) * spd;
            } else {
              v.vy -= 0.65; // Gravity pull downward
              const px = posAttr.getX(i) + v.vx * 0.12;
              const py = Math.max(-stockHeight, posAttr.getY(i) + v.vy * 0.12);
              const pz = posAttr.getZ(i) + v.vz * 0.12;
              posAttr.setXYZ(i, px, py, pz);
            }
          }
          posAttr.needsUpdate = true;
        } else {
          chipParticlesRef.current.visible = false;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update theme dynamically
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    const isLight = theme === 'light';
    sceneRef.current.background = new THREE.Color(isLight ? 0xe8ecf1 : 0x0a0f1a);
    rendererRef.current.toneMappingExposure = isLight ? 1.0 : 0.85;
    if (gridRef.current) {
      gridRef.current.material.color.setHex(isLight ? 0x94a3b8 : 0x334155);
    }
  }, [theme]);

  // Load Machine Subassemblies from CAD files
  const loadMachineModels = (root, enclosure, gantry, table, spindle, tool, currentTheme) => {
    const loader = new GLTFLoader();
    setModelLoading(true);

    const frameMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x475569,       // Cast slate machine base
      metalness: 0.5,
      roughness: 0.35,
      clearcoat: 0.4,
      clearcoatRoughness: 0.25,
      envMapIntensity: 1.5,
      side: THREE.DoubleSide,
    });

    const enclosureGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,       // Tinted safety polycarbonate glass
      metalness: 0.1,
      roughness: 0.08,
      transmission: 0.85,
      opacity: 0.32,
      transparent: true,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      ior: 1.5,
      envMapIntensity: 1.5,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const enclosureSolidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x64748b,       // Clean industrial light grey powdercoat
      metalness: 0.35,
      roughness: 0.35,
      clearcoat: 0.5,
      envMapIntensity: 1.3,
      side: THREE.DoubleSide,
    });

    enclosureMaterialsRef.current = {
      glass: enclosureGlassMaterial,
      solid: enclosureSolidMaterial
    };

    const gantryMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdde6ed,       // Anodized precision aluminum
      metalness: 0.88,
      roughness: 0.15,
      clearcoat: 0.3,
      envMapIntensity: 2.0,
      side: THREE.DoubleSide,
    });

    const tableMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,       // Precision ground tool steel
      metalness: 0.92,
      roughness: 0.18,
      envMapIntensity: 1.8,
      side: THREE.DoubleSide,
    });

    const spindleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2563eb,       // Vibrant industrial electric blue
      metalness: 0.45,
      roughness: 0.20,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.8,
      side: THREE.DoubleSide,
    });

    const toolMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,       // Tungsten carbide mirror silver
      metalness: 0.98,
      roughness: 0.04,
      envMapIntensity: 2.5,
      side: THREE.DoubleSide,
    });

    const applyMaterial = (object, mat, castShadow = true) => {
      object.traverse(child => {
        if (child.isMesh) {
          if (child.geometry.attributes.color) {
            child.geometry.deleteAttribute('color');
          }
          if (child.geometry.attributes.position.count < 80000) {
            try {
              child.geometry = toCreasedNormals(child.geometry, THREE.MathUtils.degToRad(35));
            } catch (e) {
              child.geometry.computeVertexNormals();
            }
          } else {
            child.geometry.computeVertexNormals();
          }

          child.material = mat;
          child.castShadow = castShadow;
          child.receiveShadow = false;
        }
      });
    };

    const loadPart = (url, parentGroup, mat, castShadow = true) => {
      return new Promise((resolve) => {
        loader.load(url, (gltf) => {
          const model = gltf.scene;
          applyMaterial(model, mat, castShadow);
          model.position.sub(MACHINE_CENTER);
          parentGroup.add(model);
          resolve();
        }, undefined, (err) => {
          console.warn(`Could not load ${url}`, err);
          resolve();
        });
      });
    };

    Promise.all([
      loadPart('/models/frame_base.glb', root, frameMaterial, true),
      loadPart('/models/enclosure.glb', enclosure, enclosureGlassMaterial, false),
      loadPart('/models/gantry_x.glb', gantry, gantryMaterial, true),
      loadPart('/models/table.glb', table, tableMaterial, true),
      loadPart('/models/spindle_z.glb', spindle, spindleMaterial, true),
      loadPart('/models/tool.glb', tool, toolMaterial, true)
    ]).then(() => {
      enclosure.visible = false;
      setModelLoading(false);
      if (kinematics) {
        kinematics.applyTransform();
      }
    });
  };

  // ================= Update Stock & Volumetric Solid Metal Billet =================
  useEffect(() => {
    if (!stockGroupRef.current || !stockConfig || !materialEngine) return;
    const group = stockGroupRef.current;

    const stockHeight = stockConfig.height || 30.0;
    const originPos = new THREE.Vector3(
      TABLE_SURFACE_POS.x,
      TABLE_SURFACE_POS.y + stockHeight,
      TABLE_SURFACE_POS.z
    );

    if (stockGroupRef.current) stockGroupRef.current.position.copy(originPos);
    if (workpieceGroupRef.current) workpieceGroupRef.current.position.copy(originPos);
    if (toolpathGroupRef.current) toolpathGroupRef.current.position.copy(originPos);
    if (particleGroupRef.current) particleGroupRef.current.position.copy(originPos);

    // Update Chip Particles Color based on material preset
    const preset = MATERIAL_PRESETS[stockConfig.material] || MATERIAL_PRESETS.al6061;
    if (chipMatRef.current) {
      chipMatRef.current.color.setHex(preset.chipColor);
    }

    // Update Dynamic Volumetric 3D Stock Billet resting on CAD table
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (workpieceMode !== 'partOnly') {
      materialEngine.reset(stockConfig);
      const billetMesh = materialEngine.createMesh(stockConfig.material);
      materialEngine.setDisplayMode(workpieceMode);
      group.add(billetMesh);

      // Add clean bounding edges
      const boxGeo = new THREE.BoxGeometry(stockConfig.width, stockConfig.height, stockConfig.length);
      const edges = new THREE.EdgesGeometry(boxGeo);
      const edgeLine = new THREE.LineSegments(
        edges, 
        new THREE.LineBasicMaterial({ 
          color: 0x475569, 
          linewidth: 1.5,
          transparent: true,
          opacity: 0.45
        })
      );
      edgeLine.position.set(0, -stockConfig.height / 2, 0);
      group.add(edgeLine);
    }

  }, [stockConfig, materialEngine, workpieceMode]);

  // ================= Update User Workpiece CAD Target Model =================
  useEffect(() => {
    if (!workpieceGroupRef.current) return;
    const group = workpieceGroupRef.current;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    // In solid mode, hide inner target part so the user sees the real solid metal block
    // In ghost or partOnly mode, render the target CAD part
    if (!userPartFile || workpieceMode === 'solid') return;

    setCadLoading(true);
    cadImporter.loadCAD(userPartFile).then(({ mesh, geometry, stats }) => {
      geometry.computeBoundingBox();
      const bb = geometry.boundingBox;
      const center = bb.getCenter(new THREE.Vector3());

      // Center the part in XY, rest bottom on table surface (Z=-stockHeight)
      mesh.position.set(-center.x, -bb.max.y, -center.z);

      mesh.traverse(child => {
        if (child.isMesh) {
          child.material = new THREE.MeshPhysicalMaterial({
            color: workpieceMode === 'ghost' ? 0x10b981 : 0x0284c7,
            metalness: 0.88,
            roughness: 0.18,
            clearcoat: 0.6,
            clearcoatRoughness: 0.15,
            side: THREE.DoubleSide
          });
          child.castShadow = true;
        }
      });

      const edgeGeo = new THREE.EdgesGeometry(geometry, 28);
      const edgeLines = new THREE.LineSegments(
        edgeGeo,
        new THREE.LineBasicMaterial({ 
          color: workpieceMode === 'ghost' ? 0x047857 : 0x0369a1, 
          transparent: true, 
          opacity: 0.7 
        })
      );
      mesh.add(edgeLines);

      group.add(mesh);
      setCadLoading(false);
    }).catch(err => {
      console.warn("CAD import error:", err);
      setCadLoading(false);
    });
  }, [userPartFile, workpieceMode, cadImporter]);

  // ================= Update Toolpath 3D Lines =================
  useEffect(() => {
    if (!toolpathGroupRef.current) return;
    const group = toolpathGroupRef.current;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (!toolpathData || !toolpathData.points || !showToolpath) return;

    const rapidPositions = [];
    const cutPositions = [];

    const pts = toolpathData.points;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (p.prevX !== undefined) {
        if (p.type === 'rapid' || p.type === 'retract') {
          rapidPositions.push(p.prevX, p.prevZ, p.prevY);
          rapidPositions.push(p.x, p.z, p.y);
        } else {
          cutPositions.push(p.prevX, p.prevZ, p.prevY);
          cutPositions.push(p.x, p.z, p.y);
        }
      }
    }

    if (cutPositions.length > 0) {
      const cutGeo = new THREE.BufferGeometry();
      cutGeo.setAttribute('position', new THREE.Float32BufferAttribute(cutPositions, 3));
      const cutMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 });
      const cutLines = new THREE.LineSegments(cutGeo, cutMat);
      group.add(cutLines);
    }

    if (rapidPositions.length > 0) {
      const rapidGeo = new THREE.BufferGeometry();
      rapidGeo.setAttribute('position', new THREE.Float32BufferAttribute(rapidPositions, 3));
      const rapidMat = new THREE.LineBasicMaterial({ color: 0xdc2626, transparent: true, opacity: 0.55 });
      const rapidLines = new THREE.LineSegments(rapidGeo, rapidMat);
      group.add(rapidLines);
    }
  }, [toolpathData, showToolpath]);

  // Cycle Enclosure Mode: HIDE -> GLASS -> SOLID -> HIDE
  const cycleEnclosureMode = () => {
    const nextMode = enclosureMode === 'hide' ? 'glass' : enclosureMode === 'glass' ? 'solid' : 'hide';
    setEnclosureMode(nextMode);

    if (!enclosureGroupRef.current) return;
    const enc = enclosureGroupRef.current;

    if (nextMode === 'hide') {
      enc.visible = false;
    } else {
      enc.visible = true;
      const mat = nextMode === 'glass' ? enclosureMaterialsRef.current.glass : enclosureMaterialsRef.current.solid;
      enc.traverse(child => {
        if (child.isMesh) {
          child.material = mat;
        }
      });
    }
  };

  // Cycle Workpiece Mode: SOLID BILLET -> GHOST TARGET -> CAD PART ONLY
  const cycleWorkpieceMode = () => {
    setWorkpieceMode(prev => prev === 'solid' ? 'ghost' : prev === 'ghost' ? 'partOnly' : 'solid');
  };

  // Camera preset views
  const setCameraView = (view) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const target = new THREE.Vector3(10, -220, -100);
    controls.target.copy(target);

    switch (view) {
      case 'iso':
        camera.position.set(480, 360, 580);
        break;
      case 'top':
        camera.position.set(10, 850, -100);
        break;
      case 'front':
        camera.position.set(10, -50, 720);
        break;
      case 'right':
        camera.position.set(720, -50, -100);
        break;
      case 'fit':
        camera.position.set(440, 300, 520);
        controls.target.set(10, -220, -100);
        break;
      case 'part_zoom':
        camera.position.set(120, -140, 480);
        controls.target.set(TABLE_SURFACE_POS.x, TABLE_SURFACE_POS.y + 15, 217.64);
        break;
      default:
        break;
    }
    camera.lookAt(controls.target);
    controls.update();
  };

  const currentPreset = MATERIAL_PRESETS[stockConfig?.material] || MATERIAL_PRESETS.al6061;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Loading Overlay */}
      {(modelLoading || cadLoading) && (
        <div className="glass-panel" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '16px 24px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 10
        }}>
          <RotateCw className="animate-spin" size={20} color="var(--accent-blue)" />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            {modelLoading ? 'Loading Machine Digital Twin (100% CAD)...' : 'Importing & Slicing CAD Geometry...'}
          </span>
        </div>
      )}

      {/* Top Left Camera View Controls */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        display: 'flex',
        gap: '6px',
        zIndex: 5
      }}>
        <div className="glass-panel" style={{ borderRadius: '8px', padding: '4px', display: 'flex', gap: '4px' }}>
          <button onClick={() => setCameraView('iso')} title="Isometric 3D View">ISO</button>
          <button onClick={() => setCameraView('top')} title="Top View (XY Plane)">TOP</button>
          <button onClick={() => setCameraView('front')} title="Front View (XZ Plane)">FRONT</button>
          <button onClick={() => setCameraView('right')} title="Right Side View">RIGHT</button>
          <button onClick={() => setCameraView('fit')} title="Fit Model in View"><ZoomIn size={14} /> FIT</button>
          <button onClick={() => setCameraView('part_zoom')} title="Focus Directly on Workpiece" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
            PART ZOOM
          </button>
        </div>
      </div>

      {/* Top Right Digital Twin Display Controls */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '6px',
        zIndex: 5
      }}>
        <div className="glass-panel" style={{ borderRadius: '8px', padding: '4px', display: 'flex', gap: '4px' }}>
          {/* Machine Assembly Toggle */}
          <button
            onClick={() => {
              setShowMachine(!showMachine);
              if (machineRootRef.current) machineRootRef.current.visible = !showMachine;
            }}
            style={{ color: showMachine ? 'var(--text-primary)' : 'var(--text-muted)' }}
            title="Toggle Machine Structure"
          >
            <Box size={14} /> Machine
          </button>

          {/* Enclosure Mode Toggle */}
          <button
            onClick={cycleEnclosureMode}
            style={{ 
              color: enclosureMode === 'hide' ? 'var(--text-muted)' : enclosureMode === 'glass' ? 'var(--accent-blue)' : 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Cycle Enclosure Cabinet: Hide / Tinted Glass / Solid"
          >
            <ShieldAlert size={14} /> Door: {enclosureMode.toUpperCase()}
          </button>

          {/* Workpiece Mode: Solid Billet / Ghost Target / CAD Part Only */}
          <button
            onClick={cycleWorkpieceMode}
            style={{ 
              color: workpieceMode === 'solid' ? 'var(--accent-cyan)' : workpieceMode === 'ghost' ? 'var(--accent-green)' : 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600
            }}
            title="Cycle Workpiece View Mode: Solid Billet (PBR) / Ghost Target Overlay / CAD Part Only"
          >
            <Layers size={14} /> Workpiece: {workpieceMode === 'solid' ? 'SOLID BILLET' : workpieceMode === 'ghost' ? 'GHOST CAD' : 'PART ONLY'}
          </button>

          {/* Toolpath Toggle */}
          <button
            onClick={() => setShowToolpath(!showToolpath)}
            style={{ color: showToolpath ? 'var(--accent-blue)' : 'var(--text-muted)' }}
            title="Toggle Toolpath 3D Lines"
          >
            Toolpath
          </button>
        </div>

        {/* Live Material Badge */}
        <div className="glass-panel" style={{
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: `#${currentPreset.chipColor.toString(16).padStart(6, '0')}`,
            boxShadow: '0 0 6px rgba(0,0,0,0.2)'
          }} />
          <span style={{ color: 'var(--text-secondary)' }}>Material:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentPreset.name}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>({currentPreset.density} g/cm³)</span>
        </div>
      </div>

      {/* Axis Orientation Gizmo Overlay */}
      <div className="glass-panel" style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontFamily: 'var(--font-mono)'
      }}>
        <span style={{ color: '#dc2626', fontWeight: 700 }}>X: +Right (Gantry)</span>
        <span style={{ color: '#16a34a', fontWeight: 700 }}>Y: +Depth (Table)</span>
        <span style={{ color: '#2563eb', fontWeight: 700 }}>Z: +Plunge (Spindle)</span>
      </div>
    </div>
  );
}

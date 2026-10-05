import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { 
  Eye, EyeOff, Box, Compass, RotateCw, ZoomIn, 
  Layers, Maximize2, ShieldAlert, Activity,
  Droplets, Camera, Sliders, Wind, Flame
} from 'lucide-react';
import { CADImporter } from '../engine/CADImporter';
import { MATERIAL_PRESETS } from '../engine/MaterialRemoval';
import { WorkshopEnvironment } from '../engine/WorkshopEnvironment';
import { RenderPipeline } from '../engine/RenderPipeline';
import { proceduralTextures } from '../engine/ProceduralTextures';
import { ChipPhysicsEngine } from '../engine/ChipPhysicsEngine';
import { CoolantSimulation } from '../engine/CoolantSimulation';
import { MotionPlanner } from '../engine/MotionPlanner';

// Initialize RectAreaLight uniforms once
RectAreaLightUniformsLib.init();

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
  const workshopEnvRef = useRef(null);
  const renderPipelineRef = useRef(null);

  // Scene group references
  const machineRootRef = useRef(null);
  const gantryGroupRef = useRef(null);
  const tableGroupRef = useRef(null);
  const spindleGroupRef = useRef(null);
  const toolGroupRef = useRef(null);
  const workpieceGroupRef = useRef(null);
  const stockGroupRef = useRef(null);
  const toolpathGroupRef = useRef(null);
  const particleGroupRef = useRef(null);

  // Status Indicator LEDs
  const ledGreenRef = useRef(null);
  const ledYellowRef = useRef(null);
  const ledRedRef = useRef(null);

  // Simulation Engines
  const chipEngineRef = useRef(null);
  const coolantSimRef = useRef(null);
  const motionPlannerRef = useRef(null);

  // Visibility & Display states
  const [showMachine, setShowMachine] = useState(true);
  const [enclosureMode, setEnclosureMode] = useState('glass'); // 'glass' | 'solid' | 'hide'
  const [workpieceMode, setWorkpieceMode] = useState('solid'); // 'solid' | 'heatmap' | 'ghost' | 'partOnly'
  const [showToolpath, setShowToolpath] = useState(true);
  const [modelLoading, setModelLoading] = useState(true);
  const [cadLoading, setCadLoading] = useState(false);
  const [machineAssemblyMode, setMachineAssemblyMode] = useState('park'); // Default: 'park' (exact factory CAD rest matching user CAD photo)
  const [explodedFactor, setExplodedFactor] = useState(0.0);

  // Blender-grade upgrades state
  const [qualityTier, setQualityTier] = useState('high'); // 'low' | 'medium' | 'high' | 'ultra'
  const [coolantMode, setCoolantMode] = useState('auto'); // 'auto' | 'flood' | 'mist' | 'off'
  const [followCam, setFollowCam] = useState(false);
  const [surfaceRoughness, setSurfaceRoughness] = useState({ Ra: 1.6, Rz: 6.3, isoGrade: 'N7 (Standard Milled)' });
  const [cornerColor, setCornerColor] = useState('blue'); // 'blue' (exact CAD render) | 'aluminum' (satin silver)

  const enclosureGroupRef = useRef(null);
  const enclosureMaterialsRef = useRef({ glass: null, solid: null });
  const cornerJointsGroupRef = useRef(null);
  const cornerMaterialsRef = useRef({ blue: null, aluminum: null });
  const printerHeadGroupRef = useRef(null);
  const [toolheadMode, setToolheadMode] = useState('cnc'); // 'cnc' (default: ONLY CNC WORKS)

  const cadImporter = useMemo(() => new CADImporter(), []);

  const toggleCornerColor = () => {
    const next = cornerColor === 'blue' ? 'aluminum' : 'blue';
    setCornerColor(next);
    if (cornerJointsGroupRef.current && cornerMaterialsRef.current[next]) {
      const mat = cornerMaterialsRef.current[next];
      cornerJointsGroupRef.current.traverse(child => {
        if (child.isMesh) child.material = mat;
      });
    }
  };

  // Auto-engage active work kinematics when simulation starts, return to park when idle/reset
  useEffect(() => {
    if (simState === 'running' || simState?.isRunning) {
      setMachineAssemblyMode('work');
      if (kinematics) kinematics.setAssemblyMode('work');
    }
  }, [simState]);

  // Initialize Three.js Scene, Pipeline, Lighting & Environment
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Atmospheric Fog
    const scene = new THREE.Scene();
    const isLight = theme === 'light';
    scene.background = new THREE.Color(isLight ? 0xe2e8f0 : 0x070b12);
    scene.fog = new THREE.FogExp2(isLight ? 0xe2e8f0 : 0x070b12, 0.00010);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 5, 8000);
    camera.position.set(480, 360, 580);
    cameraRef.current = camera;

    // 3. Renderer with ACES Filmic Tone Mapping & High Precision Shadow Maps
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false, // Handled by FXAA pass in RenderPipeline
      alpha: false, 
      powerPreference: 'high-performance' 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLight ? 1.25 : 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Custom Procedural Industrial Workshop Environment
    const workshopEnv = new WorkshopEnvironment(renderer);
    workshopEnvRef.current = workshopEnv;
    const envTexture = workshopEnv.generate(isLight);
    scene.environment = envTexture;

    // 5. Blender-Grade RenderPipeline (EffectComposer + GTAO + UnrealBloom + FXAA)
    const pipeline = new RenderPipeline(renderer, scene, camera, width, height);
    pipeline.setQuality(qualityTier);
    renderPipelineRef.current = pipeline;

    // 6. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(10, -220, -100);
    controls.maxPolarAngle = Math.PI / 2 + 0.04;
    controlsRef.current = controls;

    // 7. Motion Planner
    const motionPlanner = new MotionPlanner();
    motionPlannerRef.current = motionPlanner;

    // ================= Studio Lighting Rig =================
    // Soft ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, isLight ? 0.9 : 0.65);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(
      isLight ? 0xe2e8f0 : 0x1e293b,
      isLight ? 0x94a3b8 : 0x0f172a,
      isLight ? 0.95 : 0.65
    );
    scene.add(hemiLight);

    // Overhead Industrial Fluorescent 1 (Ceiling Bay Key Light)
    const rectLight1 = new THREE.RectAreaLight(isLight ? 0xfff8ee : 0xfffaed, 8.5, 340, 40);
    rectLight1.position.set(0, 650, -150);
    rectLight1.rotation.x = -Math.PI / 2;
    scene.add(rectLight1);

    // Overhead Industrial Fluorescent 2 (Ceiling Bay Secondary)
    const rectLight2 = new THREE.RectAreaLight(isLight ? 0xedf2ff : 0xe0e7ff, 6.5, 340, 40);
    rectLight2.position.set(0, 650, 250);
    rectLight2.rotation.x = -Math.PI / 2;
    scene.add(rectLight2);

    // High-Precision Directional Key Light with Soft Contact Shadows
    const keyLight = new THREE.DirectionalLight(isLight ? 0xfff5e6 : 0xffebd6, isLight ? 2.2 : 1.7);
    keyLight.position.set(700, 1100, 800);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 150;
    keyLight.shadow.camera.far = 3200;
    keyLight.shadow.camera.left = -750;
    keyLight.shadow.camera.right = 750;
    keyLight.shadow.camera.top = 750;
    keyLight.shadow.camera.bottom = -750;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.radius = 2.0;
    scene.add(keyLight);

    // Work Lamp SpotLight: Focused directly onto cutter & workpiece
    const workLamp = new THREE.SpotLight(0xfffbeb, 4.2, 1200, Math.PI / 5, 0.35, 1.2);
    workLamp.position.set(120, 280, 240);
    workLamp.target.position.copy(TABLE_SURFACE_POS);
    scene.add(workLamp);
    scene.add(workLamp.target);

    // Silhouette Rim Light
    const rimLight = new THREE.DirectionalLight(isLight ? 0xc8d6e5 : 0x475569, isLight ? 1.3 : 1.0);
    rimLight.position.set(0, 800, -850);
    scene.add(rimLight);

    // ================= Photorealistic Epoxy Floor & Shop Boundary =================
    const floorGeo = new THREE.PlaneGeometry(3200, 3200);
    const floorTex = proceduralTextures.getEpoxyFloorTexture(1024, isLight);
    const floorMat = new THREE.MeshPhysicalMaterial({
      map: floorTex,
      roughness: 0.28,
      metalness: 0.08,
      clearcoat: 0.65,
      clearcoatRoughness: 0.15,
      envMapIntensity: 1.4
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -420;
    floor.receiveShadow = true;
    scene.add(floor);

    // Contact Shadow Disc Under Machine Base
    const shadowGeo = new THREE.PlaneGeometry(1600, 1600);
    const shadowTex = proceduralTextures.getContactShadowTexture(512);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -419.8, 0);
    scene.add(shadowMesh);

    // Safety Hazard Perimeter Stripe around CNC footprint
    const hazardTex = proceduralTextures.getHazardStripeTexture(512, 64);
    const hazardMat = new THREE.MeshBasicMaterial({ map: hazardTex });
    
    const tapeThickness = 28;
    const tapeW = 1200;
    const tapeL = 1300;

    const tapeNorth = new THREE.Mesh(new THREE.PlaneGeometry(tapeW, tapeThickness), hazardMat);
    tapeNorth.rotation.x = -Math.PI / 2;
    tapeNorth.position.set(0, -419.5, tapeL / 2);
    scene.add(tapeNorth);

    const tapeSouth = new THREE.Mesh(new THREE.PlaneGeometry(tapeW, tapeThickness), hazardMat);
    tapeSouth.rotation.x = -Math.PI / 2;
    tapeSouth.position.set(0, -419.5, -tapeL / 2);
    scene.add(tapeSouth);

    const tapeWest = new THREE.Mesh(new THREE.PlaneGeometry(tapeThickness, tapeL), hazardMat);
    tapeWest.rotation.x = -Math.PI / 2;
    tapeWest.position.set(-tapeW / 2, -419.5, 0);
    scene.add(tapeWest);

    const tapeEast = new THREE.Mesh(new THREE.PlaneGeometry(tapeThickness, tapeL), hazardMat);
    tapeEast.rotation.x = -Math.PI / 2;
    tapeEast.position.set(tapeW / 2, -419.5, 0);
    scene.add(tapeEast);

    // Anti-Fatigue Operator Floor Mat in front of CNC
    const matGeo = new THREE.PlaneGeometry(750, 360);
    const matFloorMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.88,
      metalness: 0.02
    });
    const antiFatigueMat = new THREE.Mesh(matGeo, matFloorMat);
    antiFatigueMat.rotation.x = -Math.PI / 2;
    antiFatigueMat.position.set(0, -419.2, tapeL / 2 + 200);
    antiFatigueMat.receiveShadow = true;
    scene.add(antiFatigueMat);

    // Subtle Grid Helper
    const gridColor1 = isLight ? 0x94a3b8 : 0x334155;
    const gridColor2 = isLight ? 0xcbd5e1 : 0x1e293b;
    const grid = new THREE.GridHelper(3200, 64, gridColor1, gridColor2);
    grid.position.y = -419.0;
    grid.material.transparent = true;
    grid.material.opacity = 0.22;
    scene.add(grid);
    gridRef.current = grid;

    // ================= Machine Hierarchy Groups =================
    const machineRoot = new THREE.Group();
    scene.add(machineRoot);
    machineRootRef.current = machineRoot;

    const enclosureGroup = new THREE.Group();
    const cornerJointsGroup = new THREE.Group();
    const gantryGroup = new THREE.Group();
    const tableGroup = new THREE.Group();
    const spindleGroup = new THREE.Group();
    const toolGroup = new THREE.Group();
    const printerHeadGroup = new THREE.Group();
    const workpieceGroup = new THREE.Group();
    const stockGroup = new THREE.Group();
    const toolpathGroup = new THREE.Group();
    const particleGroup = new THREE.Group();

    machineRoot.add(enclosureGroup);
    machineRoot.add(cornerJointsGroup);
    machineRoot.add(tableGroup);
    machineRoot.add(gantryGroup);
    machineRoot.add(printerHeadGroup);
    gantryGroup.add(spindleGroup);
    spindleGroup.add(toolGroup);

    enclosureGroupRef.current = enclosureGroup;
    cornerJointsGroupRef.current = cornerJointsGroup;
    printerHeadGroupRef.current = printerHeadGroup;
    printerHeadGroup.visible = false; // 3D printer head disabled: ONLY CNC WORKS
    gantryGroupRef.current = gantryGroup;
    tableGroupRef.current = tableGroup;
    spindleGroupRef.current = spindleGroup;
    toolGroupRef.current = toolGroup;
    workpieceGroupRef.current = workpieceGroup;
    stockGroupRef.current = stockGroup;
    toolpathGroupRef.current = toolpathGroup;
    particleGroupRef.current = particleGroup;

    // Workpiece & swarf mount to table so they follow kinematics
    tableGroup.add(stockGroup);
    tableGroup.add(workpieceGroup);
    tableGroup.add(toolpathGroup);
    tableGroup.add(particleGroup);

    // ================= Status Indicator LEDs on Spindle Housing =================
    const ledGeo = new THREE.SphereGeometry(3.5, 12, 12);
    
    // Green (Running)
    const ledGreenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const ledGreen = new THREE.Mesh(ledGeo, ledGreenMat);
    ledGreen.position.set(-208.16 - 20, 245, 217.64);
    ledGreenRef.current = ledGreen;
    spindleGroup.add(ledGreen);

    // Yellow (Paused / Hold)
    const ledYellowMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const ledYellow = new THREE.Mesh(ledGeo, ledYellowMat);
    ledYellow.position.set(-208.16, 245, 217.64);
    ledYellowRef.current = ledYellow;
    spindleGroup.add(ledYellow);

    // Red (Alarm / Limit)
    const ledRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const ledRed = new THREE.Mesh(ledGeo, ledRedMat);
    ledRed.position.set(-208.16 + 20, 245, 217.64);
    ledRedRef.current = ledRed;
    spindleGroup.add(ledRed);

    // ================= Chip Physics Engine (Instanced 3D Swarf) =================
    const chipEngine = new ChipPhysicsEngine(800);
    chipEngineRef.current = chipEngine;
    particleGroup.add(chipEngine.mesh);

    // ================= Coolant Simulation Engine (Spray + Mist + Pool) =================
    const coolantSim = new CoolantSimulation(240, 35);
    coolantSimRef.current = coolantSim;
    tableGroup.add(coolantSim.group);

    // Connect kinematic groups
    if (kinematics) {
      kinematics.bindGroups({
        gantryX: gantryGroup,
        tableY: tableGroup,
        spindleZ: spindleGroup,
        tool: toolGroup,
        enclosure: enclosureGroup
      });
    }


    // Load Blender-Grade CAD Assemblies with Procedural PBR Textures
    loadMachineModels(machineRoot, enclosureGroup, cornerJointsGroup, gantryGroup, tableGroup, spindleGroup, toolGroup, printerHeadGroup, theme);

    // ================= Animation Loop =================
    let animId;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      try {
        const now = performance.now();
        const dt = Math.min(0.1, (now - lastTime) / 1000.0);
        lastTime = now;

        controls.update();

        const curTool = kinematics ? kinematics.currentPos : { x: 0, y: 0, z: 25 };
        const isCutting = kinematics && kinematics.spindleActive && (curTool.z <= 0.05);
        const rpm = kinematics?.spindleRPM || 8000;
        const mrr = materialEngine ? materialEngine.currentMRR : 0;
        const stockHeight = stockConfig?.height || 30.0;

        // 1. Tool Spindle Rotation proportional to RPM
        if (kinematics && kinematics.spindleActive && toolGroupRef.current) {
          const radPerSec = (rpm * Math.PI * 2) / 60.0;
          toolGroupRef.current.rotation.y += Math.min(1.5, radPerSec * dt);
        }

        // 2. Pulse Status Indicator LEDs
        const pulse = Math.sin(now * 0.008) * 0.35 + 0.65;
        if (ledGreenRef.current) {
          const isRunning = kinematics && kinematics.spindleActive;
          ledGreenRef.current.visible = isRunning;
          if (isRunning) ledGreenRef.current.scale.setScalar(pulse);
        }
        if (ledYellowRef.current) {
          const isPaused = simState === 'paused';
          ledYellowRef.current.visible = isPaused;
          if (isPaused) ledYellowRef.current.scale.setScalar(pulse);
        }
        if (ledRedRef.current) {
          const isAlarm = kinematics && kinematics.limitsExceeded;
          ledRedRef.current.visible = isAlarm;
          if (isAlarm) ledRedRef.current.scale.setScalar(pulse);
        }

        // 3. Chip Physics Update (Verlet, ejection, collision, accumulation)
        if (chipEngineRef.current) {
          chipEngineRef.current.update(dt, isCutting, curTool, 3.0, rpm, mrr, stockHeight);
        }

        // 4. Coolant Simulation Update
        const shouldCoolantRun = coolantMode === 'flood' || (coolantMode === 'auto' && kinematics && kinematics.coolantActive);
        if (coolantSimRef.current) {
          coolantSimRef.current.setCoolantState(shouldCoolantRun, 'flood');
          coolantSimRef.current.update(dt, curTool, rpm, isCutting);
        }

        // 5. Camera Shake on Heavy Roughing Cuts
        if (motionPlannerRef.current) {
          if (isCutting && mrr > 5) {
            motionPlannerRef.current.triggerImpact(mrr);
          }
          const shake = motionPlannerRef.current.getShakeOffset();
          if (shake.x !== 0 || shake.y !== 0) {
            camera.position.x += shake.x;
            camera.position.y += shake.y;
            camera.position.z += shake.z;
          }
        }

        // 6. Follow Cam (Tracking Cutter Zone)
        if (followCam && curTool) {
          const targetWorld = new THREE.Vector3(
            TABLE_SURFACE_POS.x + curTool.x,
            TABLE_SURFACE_POS.y + stockHeight + curTool.z,
            217.64
          );
          controls.target.lerp(targetWorld, 0.04);
        }

        // 7. Render through EffectComposer Post-Processing Pipeline
        if (renderPipelineRef.current) {
          renderPipelineRef.current.render(dt);
        } else {
          renderer.render(scene, camera);
        }
      } catch (err) {
        console.error("Render loop error:", err);
      }
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (renderPipelineRef.current) {
        renderPipelineRef.current.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (chipEngineRef.current) chipEngineRef.current.dispose();
      if (coolantSimRef.current) coolantSimRef.current.dispose();
      if (renderPipelineRef.current) renderPipelineRef.current.dispose();
      if (workshopEnvRef.current) workshopEnvRef.current.dispose();
      renderer.dispose();
    };
  }, []);

  // Update theme dynamically
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    const isLight = theme === 'light';
    sceneRef.current.background = new THREE.Color(isLight ? 0xe2e8f0 : 0x070b12);
    if (sceneRef.current.fog) {
      sceneRef.current.fog.color.setHex(isLight ? 0xe2e8f0 : 0x070b12);
    }
    rendererRef.current.toneMappingExposure = isLight ? 1.25 : 1.15;
    if (workshopEnvRef.current) {
      sceneRef.current.environment = workshopEnvRef.current.generate(isLight);
    }
    if (gridRef.current) {
      gridRef.current.material.color.setHex(isLight ? 0x94a3b8 : 0x334155);
    }
  }, [theme]);

  // Update Quality Tier
  useEffect(() => {
    if (renderPipelineRef.current) {
      renderPipelineRef.current.setQuality(qualityTier);
    }
    if (materialEngine) {
      if (qualityTier === 'low') {
        materialEngine.setGridResolution(160, 120);
      } else if (qualityTier === 'medium') {
        materialEngine.setGridResolution(240, 180);
      } else {
        materialEngine.setGridResolution(320, 240);
      }
    }
  }, [qualityTier, materialEngine]);

  // Load Machine Subassemblies with Blender-Grade Procedural PBR Textures
  const loadMachineModels = (root, enclosure, cornerJointsGroup, gantry, table, spindle, tool, printerHeadGroup, currentTheme) => {
    const loader = new GLTFLoader();
    setModelLoading(true);

    // 1. Frame Base: Heavy Cast Slate / Cast Iron with Perlin Bump Map
    const castIronBump = proceduralTextures.getCastIronBump(512);
    const frameMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x334155,       // Cast machine base
      bumpMap: castIronBump,
      bumpScale: 0.85,
      metalness: 0.58,
      roughness: 0.40,
      clearcoat: 0.35,
      clearcoatRoughness: 0.25,
      envMapIntensity: 1.6,
      side: THREE.DoubleSide
    });

    // 2. Enclosure Glass: Polycarbonate Safety Glass with Technical CAD Clarity & Subtle Reflections
    const enclosureGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf1f5f9,
      transmission: 0.94,
      opacity: 0.40,
      transparent: true,
      roughness: 0.05,
      ior: 1.49,             // Polycarbonate IOR
      thickness: 4.0,        // 4mm physical safety glass
      attenuationColor: new THREE.Color(0.92, 0.96, 0.99),
      attenuationDistance: 50.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      envMapIntensity: 2.2,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    // 3. Enclosure Solid: Clean Sheet Metal Powdercoat
    const powdercoatBump = proceduralTextures.getPowdercoatBump(512);
    const enclosureSolidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x64748b,
      bumpMap: powdercoatBump,
      bumpScale: 0.45,
      metalness: 0.35,
      roughness: 0.35,
      clearcoat: 0.5,
      envMapIntensity: 1.4,
      side: THREE.DoubleSide
    });

    enclosureMaterialsRef.current = {
      glass: enclosureGlassMaterial,
      solid: enclosureSolidMaterial
    };

    // 4. Gantry: Anodized Aerospace Aluminum with Brushed Grain Normal Map
    const brushedNormal = proceduralTextures.getBrushedMetalNormal(512);
    const gantryMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdbe4ee,
      normalMap: brushedNormal,
      normalScale: new THREE.Vector2(0.35, 0.35),
      metalness: 0.90,
      roughness: 0.16,
      clearcoat: 0.40,
      clearcoatRoughness: 0.12,
      envMapIntensity: 2.2,
      side: THREE.DoubleSide
    });

    // 5. Table: Precision Ground Tool Steel with Cross-Hatch Grinding Normal Map
    const groundNormal = proceduralTextures.getGroundSteelNormal(512);
    const tableMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      normalMap: groundNormal,
      normalScale: new THREE.Vector2(0.5, 0.5),
      metalness: 0.94,
      roughness: 0.16,
      clearcoat: 0.50,
      clearcoatRoughness: 0.10,
      envMapIntensity: 2.0,
      side: THREE.DoubleSide
    });

    // 6. Spindle Housing & Motor Carriage: Precision Billet Aluminium in Pure White-Silver Finish
    const spindleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,                  // Pure white aluminium / brilliant satin silver
      normalMap: brushedNormal,
      normalScale: new THREE.Vector2(0.35, 0.35),
      metalness: 0.92,                  // High metallic luster of 6061-T6 aerospace aluminum
      roughness: 0.14,                  // Fine CNC-milled surface
      clearcoat: 0.85,                  // Clear protective anodize sheen
      clearcoatRoughness: 0.08,
      envMapIntensity: 2.6,             // Crisp HDRI workshop reflections
      side: THREE.DoubleSide
    });

    // 7. Tool: Mirror-Polished Tungsten Carbide
    const toolMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      metalness: 0.98,
      roughness: 0.04,
      clearcoat: 0.90,
      clearcoatRoughness: 0.04,
      envMapIntensity: 2.8,
      side: THREE.DoubleSide
    });

    // 8. Base Corner Joint Blocks: Royal Blue Anodized Aluminum / Satin Aluminium
    const cornerJointsBlueMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1d4ed8,                  // Deep Royal / Cobalt Blue anodized (exact match to user CAD render)
      bumpMap: powdercoatBump,
      bumpScale: 0.25,
      metalness: 0.70,
      roughness: 0.24,
      clearcoat: 0.65,
      clearcoatRoughness: 0.10,
      envMapIntensity: 2.0,
      side: THREE.DoubleSide
    });

    const cornerJointsAluMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdbe4ee,                  // Clear Anodized Satin Aluminium
      bumpMap: powdercoatBump,
      bumpScale: 0.20,
      metalness: 0.88,
      roughness: 0.18,
      clearcoat: 0.70,
      clearcoatRoughness: 0.10,
      envMapIntensity: 2.2,
      side: THREE.DoubleSide
    });

    cornerMaterialsRef.current = {
      blue: cornerJointsBlueMaterial,
      aluminum: cornerJointsAluMaterial
    };

    const cornerJointsMaterial = cornerColor === 'aluminum' ? cornerJointsAluMaterial : cornerJointsBlueMaterial;

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

    // Collet Centerline Offset in MACHINE_CENTER coordinates:
    // Tool center CAD: (596.34, 1504.66, 1959.97), MACHINE_CENTER: (804.5, 1384.77, 1742.33)
    const TOOL_COLLET_OFFSET = new THREE.Vector3(-208.16, 0, 217.64);
    tool.position.copy(TOOL_COLLET_OFFSET);

    const loadPart = (url, parentGroup, mat, castShadow = true, localOffset = null) => {
      return new Promise((resolve) => {
        loader.load(url, (gltf) => {
          const model = gltf.scene;
          applyMaterial(model, mat, castShadow);
          model.position.sub(MACHINE_CENTER);
          if (localOffset) {
            model.position.sub(localOffset);
          }

          // Technical CAD edge outlines for enclosure acrylic panels matching user render
          if (url.includes('enclosure.glb')) {
            model.traverse(child => {
              if (child.isMesh) {
                try {
                  const edgeGeo = new THREE.EdgesGeometry(child.geometry, 20);
                  const edgeMat = new THREE.LineBasicMaterial({
                    color: 0x334155,
                    linewidth: 1.5,
                    transparent: true,
                    opacity: 0.65
                  });
                  const edges = new THREE.LineSegments(edgeGeo, edgeMat);
                  child.add(edges);
                } catch (e) {
                  // ignore
                }
              }
            });
          }

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
      loadPart('/models/corner_joints.glb', cornerJointsGroup, cornerJointsMaterial, true),
      loadPart('/models/enclosure.glb', enclosure, enclosureGlassMaterial, false),
      loadPart('/models/gantry_x.glb', gantry, gantryMaterial, true),
      loadPart('/models/table.glb', table, tableMaterial, true),
      loadPart('/models/spindle_z.glb', spindle, spindleMaterial, true),
      loadPart('/models/tool.glb', tool, toolMaterial, true, TOOL_COLLET_OFFSET),
      loadPart('/models/printer_head.glb', printerHeadGroup, gantryMaterial, true)
    ]).then(() => {
      enclosure.visible = enclosureMode !== 'hide';
      if (printerHeadGroup) printerHeadGroup.visible = false; // Disabled: ONLY CNC WORKS
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

    // Update Chip Physics Engine material preset
    const preset = MATERIAL_PRESETS[stockConfig.material] || MATERIAL_PRESETS.al6061;
    if (chipEngineRef.current) {
      chipEngineRef.current.setMaterialPreset(stockConfig.material, preset);
    }

    // Update Dynamic Volumetric 3D Stock Billet
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (workpieceMode !== 'partOnly') {
      materialEngine.reset(stockConfig);
      const billetMesh = materialEngine.createMesh(stockConfig.material);
      materialEngine.setDisplayMode(workpieceMode === 'heatmap' ? 'heatmap' : workpieceMode === 'ghost' ? 'ghost' : 'solid');
      group.add(billetMesh);

      // Clean bounding wireframe box
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

      setSurfaceRoughness(materialEngine.getSurfaceRoughness());
    }

  }, [stockConfig, materialEngine, workpieceMode]);

  // ================= Update User Workpiece CAD Target Model =================
  useEffect(() => {
    if (!workpieceGroupRef.current) return;
    const group = workpieceGroupRef.current;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (!userPartFile || (workpieceMode !== 'ghost' && workpieceMode !== 'partOnly')) return;

    setCadLoading(true);
    cadImporter.loadCAD(userPartFile).then(({ mesh, geometry, stats }) => {
      geometry.computeBoundingBox();
      const bb = geometry.boundingBox;
      const center = bb.getCenter(new THREE.Vector3());

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

  // Cycle Workpiece Mode: SOLID BILLET -> DEPTH HEATMAP -> GHOST CAD -> CAD PART ONLY
  const cycleWorkpieceMode = () => {
    setWorkpieceMode(prev => {
      if (prev === 'solid') return 'heatmap';
      if (prev === 'heatmap') return 'ghost';
      if (prev === 'ghost') return 'partOnly';
      return 'solid';
    });
  };

  // Cycle Quality Tier: LOW -> MED -> HIGH -> ULTRA
  const cycleQualityTier = () => {
    setQualityTier(prev => {
      if (prev === 'low') return 'medium';
      if (prev === 'medium') return 'high';
      if (prev === 'high') return 'ultra';
      return 'low';
    });
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

  const handleBlowOffChips = () => {
    if (chipEngineRef.current) {
      chipEngineRef.current.blowOffChips();
    }
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
            {modelLoading ? 'Initializing Blender-Grade Render Pipeline & PBR Models...' : 'Importing & Slicing CAD Geometry...'}
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

        {/* Follow Cam Tracking Toggle */}
        <div className="glass-panel" style={{ borderRadius: '8px', padding: '4px', display: 'flex' }}>
          <button 
            onClick={() => setFollowCam(!followCam)} 
            style={{ 
              color: followCam ? 'var(--accent-cyan)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: followCam ? 600 : 400
            }}
            title="Auto-Follow Camera: tracks the cutter head during machining"
          >
            <Camera size={14} /> {followCam ? 'TRACKING' : 'FOLLOW CAM'}
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
          {/* Graphics Quality Selector */}
          <button
            onClick={cycleQualityTier}
            style={{ 
              color: qualityTier === 'ultra' ? '#7c3aed' : qualityTier === 'high' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600
            }}
            title="Cycle Graphics Quality: Low / Medium / High / Ultra"
          >
            <Sliders size={14} /> PBR: {qualityTier.toUpperCase()}
          </button>

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

          {/* Corner Joints Color: Royal Blue vs Aluminium White */}
          <button
            onClick={toggleCornerColor}
            style={{ 
              color: cornerColor === 'blue' ? '#2563eb' : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600
            }}
            title="Toggle Corner Joints Color: Royal Blue (CAD Render Match) / White Aluminium"
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: cornerColor === 'blue' ? '#1d4ed8' : '#e2e8f0',
              border: '1px solid #94a3b8'
            }} />
            Joints: {cornerColor === 'blue' ? 'BLUE' : 'ALU'}
          </button>

          {/* Active Toolhead Mode Pill: CNC SPINDLE ONLY */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(5, 150, 105, 0.10)',
            color: 'var(--accent-green)',
            fontSize: '11px',
            fontWeight: 700,
            border: '1px solid rgba(5, 150, 105, 0.25)'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 6px rgba(5, 150, 105, 0.6)' }} />
            MODE: CNC SPINDLE ONLY (3D PRINTER OFF)
          </div>

          {/* Assembly Mode Toggle: Factory CAD Rest (0 mm) vs Active Digital Twin Work */}
          <button
            onClick={() => {
              const next = machineAssemblyMode === 'work' ? 'park' : 'work';
              setMachineAssemblyMode(next);
              if (kinematics) kinematics.setAssemblyMode(next);
            }}
            style={{ 
              color: machineAssemblyMode === 'park' ? 'var(--accent-green)' : 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600
            }}
            title="Switch between 100% Factory CAD Assembly (PARK) and Active Machining Mode (WORK)"
          >
            <Sliders size={14} /> {machineAssemblyMode === 'park' ? 'CAD REST (0mm)' : 'ACTIVE TWIN'}
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
            title="Cycle Enclosure Cabinet: Hide / Tinted Safety Glass / Solid"
          >
            <ShieldAlert size={14} /> Door: {enclosureMode.toUpperCase()}
          </button>


          {/* Workpiece Mode: Solid Billet / Depth Heatmap / Ghost Target / CAD Part Only */}
          <button
            onClick={cycleWorkpieceMode}
            style={{ 
              color: workpieceMode === 'solid' ? 'var(--accent-cyan)' : workpieceMode === 'heatmap' ? '#f59e0b' : workpieceMode === 'ghost' ? 'var(--accent-green)' : 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600
            }}
            title="Cycle Workpiece View Mode: Solid Billet (PBR) / Depth Heatmap / Ghost CAD / Part Only"
          >
            {workpieceMode === 'heatmap' ? <Flame size={14} /> : <Layers size={14} />} 
            Workpiece: {workpieceMode === 'solid' ? 'SOLID PBR' : workpieceMode === 'heatmap' ? 'HEATMAP' : workpieceMode === 'ghost' ? 'GHOST CAD' : 'PART ONLY'}
          </button>

          {/* Coolant Mode */}
          <button
            onClick={() => setCoolantMode(prev => prev === 'auto' ? 'flood' : prev === 'flood' ? 'off' : 'auto')}
            style={{ 
              color: coolantMode === 'off' ? 'var(--text-muted)' : '#06b6d4',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600
            }}
            title="Coolant Flow Mode: AUTO (G-code M8/M9) / FORCE FLOOD / OFF"
          >
            <Droplets size={14} /> Coolant: {coolantMode.toUpperCase()}
          </button>

          {/* Toolpath Toggle */}
          <button
            onClick={() => setShowToolpath(!showToolpath)}
            style={{ color: showToolpath ? 'var(--accent-blue)' : 'var(--text-muted)' }}
            title="Toggle Toolpath 3D Lines"
          >
            Toolpath
          </button>

          {/* Clean Chips / Swarf Blow-off */}
          <button
            onClick={handleBlowOffChips}
            style={{ color: 'var(--text-muted)' }}
            title="Blow-Off Swarf / Clean Table Chips"
          >
            <Wind size={14} /> Clean
          </button>
        </div>

        {/* Exploded CAD View Inspection Slider */}
        <div className="glass-panel" style={{ borderRadius: '8px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>EXPLODED CAD VIEW:</span>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.02" 
            value={explodedFactor} 
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setExplodedFactor(val);
              if (kinematics) kinematics.setExplodedFactor(val);
            }}
            style={{ width: '80px', cursor: 'pointer', accentColor: 'var(--accent-cyan)' }}
            title="Controlled smooth disassembly of subassemblies for internal CAD inspection"
          />
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: explodedFactor > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
            {Math.round(explodedFactor * 100)}%
          </span>
        </div>

        {/* Live Material & Surface Finish Badges */}

        <div style={{ display: 'flex', gap: '6px' }}>
          {/* Surface Metrology Badge */}
          <div className="glass-panel" style={{
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Finish:</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>Ra {surfaceRoughness.Ra || 1.6} µm</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>({surfaceRoughness.isoGrade || 'N7'})</span>
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
      </div>

      {/* Axis Orientation Gizmo & Camera View Presets */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 5
      }}>
        <div className="glass-panel" style={{
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

        <div className="glass-panel" style={{
          padding: '4px',
          borderRadius: '6px',
          display: 'flex',
          gap: '4px'
        }}>
          <button onClick={() => setCameraView('iso')} style={{ padding: '3px 8px', fontSize: '11px' }} title="Isometric 3D View">
            ISO
          </button>
          <button onClick={() => setCameraView('top')} style={{ padding: '3px 8px', fontSize: '11px' }} title="Top Plan View (XY)">
            TOP
          </button>
          <button onClick={() => setCameraView('front')} style={{ padding: '3px 8px', fontSize: '11px' }} title="Front Elevation View (XZ)">
            FRONT
          </button>
          <button onClick={() => setCameraView('right')} style={{ padding: '3px 8px', fontSize: '11px' }} title="Right Side View (YZ)">
            RIGHT
          </button>
          <button onClick={() => setCameraView('cutter')} style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 600 }} title="Zoom into Cutting Zone">
            CUTTER
          </button>
        </div>
      </div>
    </div>
  );
}

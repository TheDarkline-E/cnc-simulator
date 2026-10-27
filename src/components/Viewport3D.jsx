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
  theme = 'light',
  minimalUI = false,
  apiRef = null
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
  const [enclosureMode, setEnclosureMode] = useState('glass'); // 'glass' (exact CAD render match) | 'solid' | 'hide'
  const [workpieceMode, setWorkpieceMode] = useState('solid'); // 'solid' | 'heatmap' | 'ghost' | 'partOnly'
  const [showToolpath, setShowToolpath] = useState(true);
  const [modelLoading, setModelLoading] = useState(true);
  const [cadLoading, setCadLoading] = useState(false);
  const [machineAssemblyMode, setMachineAssemblyMode] = useState('work'); // Default: 'work' (active digital twin ready to cut)
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

  // Maintain active digital twin kinematics (prevents sudden 40cm jump between park and work)
  useEffect(() => {
    if (kinematics) {
      kinematics.setAssemblyMode('work');
    }
  }, [kinematics]);

  // Initialize Three.js Scene, Pipeline, Lighting & Environment
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Studio Radial Vignette Backdrop
    const scene = new THREE.Scene();
    const isLight = theme === 'light';
    const studioBackdropTex = proceduralTextures.getCADStudioBackdropTexture(1024, isLight);
    scene.background = studioBackdropTex;
    sceneRef.current = scene;

    // 2. Camera: Full Machine Overview framing 850x850x702mm envelope with generous margin matching CAD render
    const camera = new THREE.PerspectiveCamera(38, width / height, 5, 12000);
    camera.position.set(1060, 780, 1260);
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
    renderer.toneMappingExposure = isLight ? 1.05 : 0.95;
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
    controls.target.set(0, -60, 0);
    controls.maxPolarAngle = Math.PI / 2 + 0.04;
    controlsRef.current = controls;

    // 7. Motion Planner
    const motionPlanner = new MotionPlanner();
    motionPlannerRef.current = motionPlanner;

    // ================= Studio Lighting Rig (KeyShot / CAD Studio Quality) =================
    // Soft balanced ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, isLight ? 0.42 : 0.32);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(
      isLight ? 0xffffff : 0x334155,
      isLight ? 0x94a3b8 : 0x0f172a,
      isLight ? 0.55 : 0.40
    );
    scene.add(hemiLight);

    // High-Precision Directional Key Light with 4K Soft Contact Shadows
    const keyLight = new THREE.DirectionalLight(isLight ? 0xffffff : 0xffedd5, isLight ? 2.2 : 1.7);
    keyLight.position.set(850, 1300, 900);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 4096;
    keyLight.shadow.mapSize.height = 4096;
    keyLight.shadow.camera.near = 150;
    keyLight.shadow.camera.far = 3500;
    keyLight.shadow.camera.left = -850;
    keyLight.shadow.camera.right = 850;
    keyLight.shadow.camera.top = 850;
    keyLight.shadow.camera.bottom = -850;
    keyLight.shadow.bias = -0.0001;
    keyLight.shadow.radius = 2.0;
    scene.add(keyLight);

    // Soft Fill Light from opposite quadrant for balanced illumination
    const fillLight = new THREE.DirectionalLight(isLight ? 0xe2e8f0 : 0x475569, isLight ? 0.75 : 0.55);
    fillLight.position.set(-800, 700, 600);
    scene.add(fillLight);

    // Overhead Studio Strip Light for crisp specular highlights along horizontal rails
    const rectLight1 = new THREE.RectAreaLight(0xffffff, isLight ? 4.5 : 3.5, 450, 60);
    rectLight1.position.set(0, 750, -50);
    rectLight1.rotation.x = -Math.PI / 2;
    scene.add(rectLight1);

    // Front Grazing Strip Light: Long continuous specular reflection along linear rails & ballscrews
    const rectLight2 = new THREE.RectAreaLight(0xffffff, isLight ? 3.8 : 2.8, 650, 50);
    rectLight2.position.set(0, 520, 320);
    rectLight2.rotation.x = -Math.PI / 3;
    scene.add(rectLight2);

    // Work Lamp SpotLight: Focused directly onto cutter & workpiece
    const workLamp = new THREE.SpotLight(0xfffbeb, isLight ? 2.5 : 2.0, 1400, Math.PI / 5, 0.35, 1.2);
    workLamp.position.set(120, 320, 260);
    workLamp.target.position.copy(TABLE_SURFACE_POS);
    workLamp.castShadow = true;
    workLamp.shadow.mapSize.width = 1024;
    workLamp.shadow.mapSize.height = 1024;
    workLamp.shadow.bias = -0.0003;
    scene.add(workLamp);
    scene.add(workLamp.target);

    // Silhouette Rim Light: Edge glints on vertical uprights & enclosure chamfers
    const rimLight = new THREE.DirectionalLight(isLight ? 0xffffff : 0x64748b, isLight ? 1.4 : 1.0);
    rimLight.position.set(0, 900, -950);
    scene.add(rimLight);

    // ================= Seamless CAD Studio Ground & Diffuse Contact Shadow =================
    // Shadow catcher material: receives real-time 4K PCF soft shadows seamlessly on studio gradient backdrop
    const floorGeo = new THREE.PlaneGeometry(5000, 5000);
    const floorMat = new THREE.ShadowMaterial({ opacity: isLight ? 0.35 : 0.55 });
    const MACHINE_FLOOR_Y = -510.0; // Exact bottom of leveling feet pads resting on workshop floor
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = MACHINE_FLOOR_Y;
    floor.receiveShadow = true;
    scene.add(floor);

    // Soft Diffuse Ground Contact Shadow directly beneath machine chassis & feet
    const shadowGeo = new THREE.PlaneGeometry(1500, 1500);
    const shadowTex = proceduralTextures.getSoftStudioContactShadow(1024);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, MACHINE_FLOOR_Y + 0.1, 0);
    scene.add(shadowMesh);

    // Subtle CAD Alignment Grid
    const gridColor1 = isLight ? 0x94a3b8 : 0x334155;
    const gridColor2 = isLight ? 0xcbd5e1 : 0x1e293b;
    const grid = new THREE.GridHelper(3200, 64, gridColor1, gridColor2);
    grid.position.y = MACHINE_FLOOR_Y + 0.5;
    grid.material.transparent = true;
    grid.material.opacity = 0.05;
    grid.visible = false; // Kept clean studio ground matching reference render
    scene.add(grid);
    gridRef.current = grid;

    // ================= Machine Hierarchy Groups =================
    const machineRoot = new THREE.Group();
    scene.add(machineRoot);
    machineRootRef.current = machineRoot;

    const enclosureGroup = new THREE.Group();
    const cornerJointsGroup = new THREE.Group();
    const levelingFeetGroup = new THREE.Group();
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
    machineRoot.add(levelingFeetGroup);
    machineRoot.add(tableGroup);
    machineRoot.add(gantryGroup);
    gantryGroup.add(printerHeadGroup); // Attached to gantry crossbeam so it moves with gantry
    gantryGroup.add(spindleGroup);
    spindleGroup.add(toolGroup);

    enclosureGroupRef.current = enclosureGroup;
    cornerJointsGroupRef.current = cornerJointsGroup;
    printerHeadGroupRef.current = printerHeadGroup;
    printerHeadGroup.visible = true; // 100% visible on machine model matching CAD render
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
    loadMachineModels(machineRoot, enclosureGroup, cornerJointsGroup, levelingFeetGroup, gantryGroup, tableGroup, spindleGroup, toolGroup, printerHeadGroup, theme);

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

        // 5. Physical cutting impact registered without camera shake
        if (motionPlannerRef.current && isCutting && mrr > 5) {
          motionPlannerRef.current.triggerImpact(mrr);
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
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (renderPipelineRef.current) {
        renderPipelineRef.current.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
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
    const backdrop = proceduralTextures.getCADStudioBackdropTexture(1024, isLight);
    sceneRef.current.background = backdrop;
    rendererRef.current.toneMappingExposure = isLight ? 1.25 : 1.15;
    if (workshopEnvRef.current) {
      sceneRef.current.environment = workshopEnvRef.current.generate(isLight);
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
  const loadMachineModels = (root, enclosure, cornerJointsGroup, levelingFeetGroup, gantry, table, spindle, tool, printerHeadGroup, currentTheme) => {
    const loader = new GLTFLoader();
    setModelLoading(true);

    // =========================================================================
    // Authentic Industrial PBR Mechanical Materials Suite
    // Replaces flat/cheap solid colors with realistic machined surface finishes
    // =========================================================================

    // 1. Extruded 6061-T6 Structural Aluminum Beams (Longitudinal Hairline Grain)
    const hairlineExtrusionNormal = proceduralTextures.getExtrusionHairlineNormal(512);
    const frameExtrusionMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd0dce8,                  // Natural clear satin anodized aluminum
      normalMap: hairlineExtrusionNormal,
      normalScale: new THREE.Vector2(0.35, 0.35),
      metalness: 0.90,
      roughness: 0.18,
      clearcoat: 0.65,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.8,
      side: THREE.DoubleSide
    });

    // 2. Hardened Ground Bearing Steel (SUJ2 / 52100) - Linear Rails & Leadscrews
    // Mirror-ground finish with razor-sharp specular reflection glints
    const mirrorRailNormal = proceduralTextures.getMirrorRailSteelNormal(512);
    const groundRailSteelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf1f5f9,                  // Mirror chrome / bright bearing steel
      normalMap: mirrorRailNormal,
      normalScale: new THREE.Vector2(0.20, 0.20),
      metalness: 0.98,
      roughness: 0.04,
      clearcoat: 0.95,
      clearcoatRoughness: 0.02,
      envMapIntensity: 2.8,
      side: THREE.DoubleSide
    });

    // 3. Spindle Mount: Billet 7075-T6 CNC-Milled Clamp
    const brushedNormal = proceduralTextures.getBrushedMetalNormal(512);
    const spindleClampBilletMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,                  // Milled aerospace billet
      normalMap: brushedNormal,
      normalScale: new THREE.Vector2(0.25, 0.25),
      metalness: 0.92,
      roughness: 0.14,
      clearcoat: 0.85,
      clearcoatRoughness: 0.06,
      envMapIntensity: 2.0,
      side: THREE.DoubleSide
    });

    // 4. Spindle Cylindrical Motor Body: Turned Stainless Steel Barrel
    const spindleMotorCylinderMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,                  // Polished stainless steel spindle body
      normalMap: mirrorRailNormal,
      normalScale: new THREE.Vector2(0.15, 0.15),
      metalness: 0.96,
      roughness: 0.06,
      clearcoat: 0.95,
      clearcoatRoughness: 0.03,
      envMapIntensity: 2.5,
      side: THREE.DoubleSide
    });

    // 5. T-Slot Machine Bed Table: Precision Ground Cast Tooling Plate
    const groundTableNormal = proceduralTextures.getGroundSteelNormal(512);
    const tablePrecisionBedMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,                  // Dark precision ground tool steel bed
      normalMap: groundTableNormal,
      normalScale: new THREE.Vector2(0.45, 0.45),
      metalness: 0.85,
      roughness: 0.20,
      clearcoat: 0.45,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.6,
      side: THREE.DoubleSide
    });

    // 6. Corner Joint Brackets: Bead-Blasted Satin Anodized 6061 Billet
    const beadBlastNormal = proceduralTextures.getAnodizedBeadBlastNormal(512);
    const cornerJointsBlueMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2563eb,                  // Rich anodized cobalt blue with satin sheen
      normalMap: beadBlastNormal,
      normalScale: new THREE.Vector2(0.35, 0.35),
      metalness: 0.86,
      roughness: 0.22,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      envMapIntensity: 2.2,
      side: THREE.DoubleSide
    });

    const cornerJointsAluMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,                  // Clear satin anodized aluminum
      normalMap: beadBlastNormal,
      normalScale: new THREE.Vector2(0.30, 0.30),
      metalness: 0.90,
      roughness: 0.18,
      clearcoat: 0.75,
      clearcoatRoughness: 0.08,
      envMapIntensity: 2.0,
      side: THREE.DoubleSide
    });

    cornerMaterialsRef.current = {
      blue: cornerJointsBlueMaterial,
      aluminum: cornerJointsAluMaterial
    };
    const cornerJointsMaterial = cornerColor === 'aluminum' ? cornerJointsAluMaterial : cornerJointsBlueMaterial;

    // 7. Base Mounts, Posts & Couplers: Dark Industrial Phosphate/Powdercoat Metal
    const powdercoatBump = proceduralTextures.getPowdercoatBump(512);
    const frameMountsMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x334155,                  // Dark graphite industrial metal
      bumpMap: powdercoatBump,
      bumpScale: 0.35,
      metalness: 0.80,
      roughness: 0.28,
      clearcoat: 0.45,
      envMapIntensity: 1.5,
      side: THREE.DoubleSide
    });

    // 8. Leveling Feet: Heavy-Duty Industrial Dampening Polyurethane Fluted Pads
    const levelingFeetMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x18181b,                  // Matte black industrial elastomer
      roughness: 0.70,
      metalness: 0.10,
      clearcoat: 0.20,
      envMapIntensity: 1.0,
      side: THREE.DoubleSide
    });

    // 9. Tool: Mirror-Polished Tungsten Carbide Solid End Mill
    const toolMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.99,
      roughness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      envMapIntensity: 2.8,
      side: THREE.DoubleSide
    });

    // 10. Enclosure Glass: Crystal-Clear Polycarbonate Safety Acrylic
    const enclosureGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.035,
      roughness: 0.01,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      envMapIntensity: 1.8,
      depthWrite: false,
      side: THREE.FrontSide
    });

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

    // 11. Rear 3D Carriage on Gantry Rail
    const printerHeadMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      normalMap: brushedNormal,
      normalScale: new THREE.Vector2(0.25, 0.25),
      metalness: 0.88,
      roughness: 0.20,
      clearcoat: 0.50,
      envMapIntensity: 1.6,
      side: THREE.DoubleSide
    });

    // Semantic Multi-Material Dispatcher
    const applySemanticMaterials = (object, defaultMat, castShadow = true) => {
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

          const name = (child.name || '').toLowerCase();
          let mat = defaultMat;

          if (name.includes('rail') || name.includes('screw') || name.includes('ballscrew')) {
            mat = groundRailSteelMaterial;
          } else if (name.includes('spindle_motor')) {
            mat = spindleMotorCylinderMaterial;
          } else if (name.includes('spindle_clamp')) {
            mat = spindleClampBilletMaterial;
          } else if (name.includes('table_bed')) {
            mat = tablePrecisionBedMaterial;
          } else if (name.includes('frame_arch') || name.includes('frame_extrusions')) {
            mat = frameExtrusionMaterial;
          } else if (name.includes('frame_bed') || name.includes('frame_mounts')) {
            mat = frameMountsMaterial;
          } else if (name.includes('corner_joint')) {
            mat = cornerJointsMaterial;
          } else if (name.includes('tool_carbide')) {
            mat = toolMaterial;
          } else if (name.includes('leveling_foot')) {
            mat = levelingFeetMaterial;
          } else if (name.includes('enclosure')) {
            mat = enclosureGlassMaterial;
          }

          child.material = mat;
          child.castShadow = castShadow;
          child.receiveShadow = true;
        }
      });
    };

    // Collet Centerline Offset in MACHINE_CENTER coordinates:
    const TOOL_COLLET_OFFSET = new THREE.Vector3(-208.16, 0, 217.64);
    tool.position.copy(TOOL_COLLET_OFFSET);

    const loadPart = (url, parentGroup, mat, castShadow = true, localOffset = null) => {
      return new Promise((resolve) => {
        loader.load(url, (gltf) => {
          const model = gltf.scene;
          applySemanticMaterials(model, mat, castShadow);
          model.position.sub(MACHINE_CENTER);
          if (localOffset) {
            model.position.sub(localOffset);
          }

          // Technical CAD edge outlines for enclosure acrylic panels
          if (url.includes('enclosure.glb')) {
            model.traverse(child => {
              if (child.isMesh) {
                try {
                  const edgeGeo = new THREE.EdgesGeometry(child.geometry, 28);
                  const edgeMat = new THREE.LineBasicMaterial({
                    color: 0x334155,
                    linewidth: 1.5,
                    transparent: true,
                    opacity: 0.75
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
      loadPart('/models/frame_base.glb', root, frameExtrusionMaterial, true),
      loadPart('/models/leveling_feet.glb', levelingFeetGroup, levelingFeetMaterial, true),
      loadPart('/models/corner_joints.glb', cornerJointsGroup, cornerJointsMaterial, true),
      loadPart('/models/enclosure.glb', enclosure, enclosureGlassMaterial, false),
      loadPart('/models/gantry_x.glb', gantry, frameExtrusionMaterial, true),
      loadPart('/models/table.glb', table, tablePrecisionBedMaterial, true),
      loadPart('/models/spindle_z.glb', spindle, spindleClampBilletMaterial, true),
      loadPart('/models/tool.glb', tool, toolMaterial, true, TOOL_COLLET_OFFSET),
      loadPart('/models/printer_head.glb', printerHeadGroup, printerHeadMaterial, true)
    ]).then(() => {
      enclosure.visible = enclosureMode !== 'hide';
      if (printerHeadGroup) printerHeadGroup.visible = true;
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
          color: 0x64748b, 
          linewidth: 1.5,
          transparent: true,
          opacity: 0.55
        })
      );
      edgeLine.position.set(0, -stockConfig.height / 2, 0);
      group.add(edgeLine);

      // 3D G54 Work Coordinate System (WCS) Origin Triad at Stock Top Corner
      const g54Triad = new THREE.Group();
      const triadLen = 32;
      const arrowX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), triadLen, 0xef4444, 7, 3.5);
      const arrowY = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), triadLen, 0x10b981, 7, 3.5);
      const arrowZ = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), triadLen, 0x3b82f6, 7, 3.5);
      g54Triad.add(arrowX, arrowY, arrowZ);

      // Origin Bullseye Target Ring
      const ringGeo = new THREE.RingGeometry(1.2, 2.8, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x7c5cfc, side: THREE.DoubleSide });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.2;
      g54Triad.add(ringMesh);

      g54Triad.position.set(-stockConfig.width / 2, 0.5, -stockConfig.length / 2);
      group.add(g54Triad);

      // Holographic Machine Travel Limits Bounding Cage (300 x 200 x 100mm)
      const travelGeo = new THREE.BoxGeometry(320, 110, 220);
      const travelEdges = new THREE.EdgesGeometry(travelGeo);
      const travelLine = new THREE.LineSegments(
        travelEdges,
        new THREE.LineDashedMaterial({
          color: 0x7c5cfc,
          linewidth: 1,
          scale: 1,
          dashSize: 6,
          gapSize: 6,
          transparent: true,
          opacity: 0.22
        })
      );
      travelLine.computeLineDistances();
      travelLine.position.set(0, 48, 0);
      group.add(travelLine);

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
    const nextMode = enclosureMode === 'glass' ? 'hide' : enclosureMode === 'hide' ? 'solid' : 'glass';
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
          child.castShadow = nextMode === 'solid';
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

    switch (view) {
      case 'iso':
        controls.target.set(0, -60, 0);
        camera.position.set(1060, 780, 1260);
        break;
      case 'top':
        controls.target.set(0, -60, 0);
        camera.position.set(0, 1900, 0);
        break;
      case 'front':
        controls.target.set(0, -60, 0);
        camera.position.set(0, -60, 1750);
        break;
      case 'right':
        controls.target.set(0, -60, 0);
        camera.position.set(1750, -60, 0);
        break;
      case 'fit':
        controls.target.set(0, -60, 0);
        camera.position.set(1060, 780, 1260);
        break;
      case 'part_zoom':
        controls.target.set(TABLE_SURFACE_POS.x, TABLE_SURFACE_POS.y + 15, 217.64);
        camera.position.set(220, -50, 480);
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

  useEffect(() => {
    if (apiRef) {
      apiRef.current = {
        setCameraView,
        blowOffChips: handleBlowOffChips,
        cycleWorkpieceMode,
        cycleEnclosureMode,
        cycleQualityTier
      };
    }
  }, [apiRef, enclosureMode]);

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

      {!minimalUI && (
        <>
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
        </>
      )}
    </div>
  );
}

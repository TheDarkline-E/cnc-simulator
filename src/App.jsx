import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import StudioToolbar from './components/StudioToolbar';
import JobExplorer from './components/JobExplorer';
import CenterViewportCard from './components/CenterViewportCard';
import ContextualInspector from './components/ContextualInspector';
import SimulationTimeline from './components/SimulationTimeline';
import InspectionModal from './components/InspectionModal';
import MachineSetupModal from './components/MachineSetupModal';

import { MachineKinematics } from './engine/MachineKinematics';
import { MaterialRemovalEngine } from './engine/MaterialRemoval';
import { SimulationEngine } from './engine/SimulationEngine';
import { CAMEngine } from './engine/CAMEngine';
import { CADImporter } from './engine/CADImporter';

export default function App() {
  // Theme state: defaults to dark studio mode for professional engineering contrast
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Engine Singletons
  const kinematics = useMemo(() => new MachineKinematics(), []);
  const materialEngine = useMemo(() => new MaterialRemovalEngine({ width: 100, length: 80, height: 30, material: 'al6061' }), []);
  const camEngine = useMemo(() => new CAMEngine(), []);
  const cadImporter = useMemo(() => new CADImporter(), []);

  // Configuration States
  const [stockConfig, setStockConfig] = useState({
    width: 100,
    length: 80,
    height: 30,
    material: 'al6061'
  });

  const [toolConfig, setToolConfig] = useState({
    type: 'flat_end_mill',
    diameter: 6.0,
    length: 50.0,
    cuttingLength: 25.0,
    flutes: 2,
    number: 1
  });

  const [machiningParams, setMachiningParams] = useState({
    spindleRPM: 8000,
    feedRate: 800,
    plungeRate: 250,
    stepDown: 2.0,
    stepOverRatio: 0.6,
    safeZ: 5.0
  });

  const [operations, setOperations] = useState([
    { id: 1, type: 'facing', name: 'Top Surfacing Pass', depth: 1.0, enabled: true },
    { id: 2, type: 'roughing', name: '3D Adaptive Roughing', depth: 8.0, enabled: true },
    { id: 3, type: 'pocketing', name: 'Center Cavity Pocket', depth: 8.0, width: 60, length: 40, enabled: true },
    { id: 4, type: 'contouring', name: 'Perimeter Profile Finish', depth: 12.0, enabled: true }
  ]);

  const [userPartFile, setUserPartFile] = useState('/samples/pocket_block.stl');
  const [cadStats, setCadStats] = useState(null);
  const [toolpathData, setToolpathData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [needsRegen, setNeedsRegen] = useState(false);

  // Contextual Selection State: { type: 'setup' | 'stock' | 'part' | 'tool' | 'operation', id?: number }
  const [selectedItem, setSelectedItem] = useState({ type: 'operation', id: 1 });

  // Simulation State: 'ready' | 'running' | 'paused' | 'complete' | 'idle'
  const [simState, setSimState] = useState('ready');
  const [progressPercent, setProgressPercent] = useState(0);
  const [elapsedTimeSec, setElapsedTimeSec] = useState(0);
  const [removedPercent, setRemovedPercent] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('Idle');
  const [speed, setSpeed] = useState(1.0);
  const [showInspection, setShowInspection] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Live Digital Readout (DRO)
  const [dro, setDro] = useState({
    x: 0, y: 0, z: 25,
    spindleRPM: 0,
    feedRate: 800,
    spindleActive: false,
    limitsExceeded: false,
    lastError: null,
    mrr: 0,
    coolantActive: true,
    surfaceRoughness: { Ra: 1.6, Rz: 6.3, isoGrade: 'N7' }
  });

  // Simulation Engine & Viewport References
  const simEngineRef = useRef(null);
  const viewportApiRef = useRef(null);

  // Sync stock with kinematics and material engine
  useEffect(() => {
    if (kinematics) {
      kinematics.setStockConfig(stockConfig);
    }
    if (materialEngine) {
      materialEngine.reset(stockConfig);
    }
  }, [stockConfig, kinematics, materialEngine]);

  // Analyze CAD file whenever userPartFile changes
  useEffect(() => {
    if (!userPartFile) return;
    cadImporter.loadCAD(userPartFile).then(({ stats }) => {
      setCadStats(stats);
    }).catch(err => {
      console.warn("CAD stats analysis warning:", err);
    });
  }, [userPartFile, cadImporter]);

  // Generate Toolpath using CAMEngine
  const generateToolpath = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      const result = camEngine.generateProgram({
        stock: stockConfig,
        tool: toolConfig,
        operations,
        parameters: machiningParams,
        cadStats
      });

      setToolpathData(result.toolpathData);
      if (simEngineRef.current) {
        simEngineRef.current.loadToolpath(result.toolpathData);
      }
      setIsGenerating(false);
      setNeedsRegen(false);
      setSimState('ready');
    }, 120);
  }, [camEngine, stockConfig, toolConfig, operations, machiningParams, cadStats]);

  // Auto-fit Stock to CAD part dimensions
  const handleAutoFitStock = useCallback(() => {
    if (!cadStats) return;
    const paddingX = 10; // 5mm on each side
    const paddingY = 10; // 5mm on each side
    const facingAllowance = 2; // 2mm top facing pass allowance
    const newWidth = Math.max(20, Math.ceil((cadStats.width + paddingX) / 5) * 5);
    const newLength = Math.max(20, Math.ceil((cadStats.length + paddingY) / 5) * 5);
    const newHeight = Math.max(10, Math.ceil((cadStats.height + facingAllowance) / 5) * 5);

    setStockConfig(prev => ({
      ...prev,
      width: newWidth,
      length: newLength,
      height: newHeight
    }));
    setNeedsRegen(true);
  }, [cadStats]);

  // Mark regeneration needed when critical CAM settings change
  const handleUpdateOperations = (newOps) => {
    setOperations(newOps);
    setNeedsRegen(true);
  };

  // Initialize Simulation Engine
  useEffect(() => {
    const sim = new SimulationEngine({
      kinematics,
      materialEngine,
      onUpdate: (data) => {
        setSimState(data.state);
        setProgressPercent(data.progressPercent);
        setElapsedTimeSec(data.elapsedTimeSec);
        setRemovedPercent(data.removedPercent);
        setCurrentOperation(data.currentOperation);
        if (data.dro) {
          setDro(prev => ({ ...prev, ...data.dro }));
        }
      },
      onComplete: () => {
        setSimState('complete');
        setShowInspection(true);
      }
    });

    sim.setToolConfig(toolConfig);
    simEngineRef.current = sim;

    generateToolpath();
  }, [kinematics, materialEngine]);

  useEffect(() => {
    if (simEngineRef.current) {
      simEngineRef.current.setToolConfig(toolConfig);
    }
  }, [toolConfig]);

  // Simulation Playback Handlers
  const handleStart = () => {
    if (simEngineRef.current) {
      if (simState === 'paused') {
        simEngineRef.current.resume();
        return;
      }
      if (!toolpathData || needsRegen) {
        generateToolpath();
      }
      simEngineRef.current.start();
    }
  };

  const handlePause = () => {
    if (simEngineRef.current) simEngineRef.current.pause();
  };

  const handleResume = () => {
    if (simEngineRef.current) simEngineRef.current.resume();
  };

  const handleStop = () => {
    if (simEngineRef.current) simEngineRef.current.stop();
  };

  const handleReset = () => {
    if (simEngineRef.current) simEngineRef.current.reset();
    setProgressPercent(0);
    setElapsedTimeSec(0);
    setRemovedPercent(0);
    setSimState('ready');
  };

  const handleSetSpeed = (newSpeed) => {
    setSpeed(newSpeed);
    if (simEngineRef.current) simEngineRef.current.setSpeed(newSpeed);
  };

  const handleSeek = (pct) => {
    setProgressPercent(pct);
    if (simEngineRef.current) simEngineRef.current.seek(pct);
  };

  // Estimated cycle time from toolpath stats or calculated distance
  const estimatedTimeSec = toolpathData?.stats?.estimatedTimeSec || 
    (toolpathData?.points?.length ? Math.round(toolpathData.points.length * 0.14) : 85);

  return (
    <div className="cam-studio-app">
      {/* 1. Top CAD/CAM Toolbar */}
      <StudioToolbar
        projectName="Precision CNC Milling Studio"
        setupName="Setup 1 (G54)"
        stockConfig={stockConfig}
        toolConfig={toolConfig}
        simState={simState}
        isGenerating={isGenerating}
        onRegenerate={generateToolpath}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onReset={handleReset}
        onOpenInspection={() => setShowInspection(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* 2. Main 3-Column Studio Workspace */}
      <main className="studio-workspace" role="main">
        {/* Left Column: Job Explorer Tree */}
        <JobExplorer
          stockConfig={stockConfig}
          toolConfig={toolConfig}
          operations={operations}
          onUpdateOperations={handleUpdateOperations}
          userPartFile={userPartFile}
          cadStats={cadStats}
          selectedItem={selectedItem}
          onSelectItem={setSelectedItem}
          currentOperation={currentOperation}
          simState={simState}
          onRegenerate={generateToolpath}
          needsRegen={needsRegen}
        />

        {/* Center Column: 3D CAD/CAM Viewport Canvas */}
        <CenterViewportCard
          kinematics={kinematics}
          materialEngine={materialEngine}
          toolpathData={toolpathData}
          stockConfig={stockConfig}
          userPartFile={userPartFile}
          simState={simState}
          theme={theme}
          viewportApiRef={viewportApiRef}
        />

        {/* Right Column: Contextual Property Inspector */}
        <ContextualInspector
          selectedItem={selectedItem}
          stockConfig={stockConfig}
          setStockConfig={(cfg) => { setStockConfig(cfg); setNeedsRegen(true); }}
          toolConfig={toolConfig}
          setToolConfig={(t) => { setToolConfig(t); setNeedsRegen(true); }}
          machiningParams={machiningParams}
          setMachiningParams={(p) => { setMachiningParams(p); setNeedsRegen(true); }}
          operations={operations}
          setOperations={handleUpdateOperations}
          userPartFile={userPartFile}
          setUserPartFile={(f) => { setUserPartFile(f); setNeedsRegen(true); }}
          cadStats={cadStats}
          onAutoFitStock={handleAutoFitStock}
          onRegenerate={generateToolpath}
          isGenerating={isGenerating}
        />
      </main>

      {/* 3. Bottom Simulation Control Timeline */}
      <SimulationTimeline
        simState={simState}
        progressPercent={progressPercent}
        elapsedTimeSec={elapsedTimeSec}
        estimatedTimeSec={estimatedTimeSec}
        removedPercent={removedPercent}
        currentOperation={currentOperation}
        dro={dro}
        speed={speed}
        onSetSpeed={handleSetSpeed}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onReset={handleReset}
        onSeek={handleSeek}
      />

      {/* Quality Metrology & Inspection Dialog */}
      <InspectionModal
        isOpen={showInspection}
        onClose={() => setShowInspection(false)}
        stats={toolpathData?.stats}
        stockConfig={stockConfig}
        toolConfig={toolConfig}
      />

      {/* Machine Setup Reference Modal (Optional Secondary) */}
      <MachineSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        stockConfig={stockConfig}
        setStockConfig={setStockConfig}
        toolConfig={toolConfig}
        setToolConfig={setToolConfig}
        machiningParams={machiningParams}
        setMachiningParams={setMachiningParams}
        onRegenerate={generateToolpath}
      />
    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, Square, RotateCcw, Box, Cpu, 
  Settings, Layers, CheckCircle2, 
  Download, Activity, Compass, Info,
  Sun, Moon, UploadCloud, Disc, Sparkles
} from 'lucide-react';

import Viewport3D from './components/Viewport3D';
import SetupPanel from './components/SetupPanel';
import ManufacturingPanel from './components/ManufacturingPanel';
import SimControls from './components/SimControls';
import InspectionModal from './components/InspectionModal';

import { MachineKinematics } from './engine/MachineKinematics';
import { MaterialRemovalEngine } from './engine/MaterialRemoval';
import { SimulationEngine } from './engine/SimulationEngine';
import { CAMEngine } from './engine/CAMEngine';
import { CADImporter } from './engine/CADImporter';

export default function App() {
  // Theme state (default to Light mode for high visibility)
  const [theme, setTheme] = useState('light');

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

  useEffect(() => {
    if (kinematics) {
      kinematics.setStockConfig(stockConfig);
    }
    if (materialEngine) {
      materialEngine.reset(stockConfig);
    }
  }, [stockConfig, kinematics, materialEngine]);

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

  // Simulation State
  const [simState, setSimState] = useState('ready'); // 'ready' | 'running' | 'paused' | 'complete'
  const [progressPercent, setProgressPercent] = useState(0);
  const [elapsedTimeSec, setElapsedTimeSec] = useState(0);
  const [removedPercent, setRemovedPercent] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('Idle');
  const [speed, setSpeed] = useState(1.0);
  const [showInspection, setShowInspection] = useState(false);

  // Live DRO
  const [dro, setDro] = useState({
    x: 0, y: 0, z: 25,
    spindleRPM: 0,
    feedRate: 800,
    spindleActive: false,
    limitsExceeded: false,
    lastError: null
  });

  // Simulation Engine Reference
  const simEngineRef = useRef(null);

  // Analyze CAD file whenever userPartFile changes
  useEffect(() => {
    if (!userPartFile) return;
    cadImporter.loadCAD(userPartFile).then(({ stats }) => {
      setCadStats(stats);
    }).catch(err => {
      console.warn("CAD stats analysis error:", err);
    });
  }, [userPartFile, cadImporter]);

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
        setDro(data.dro);
      },
      onComplete: () => {
        setSimState('complete');
        setShowInspection(true);
      }
    });

    sim.setToolConfig(toolConfig);
    simEngineRef.current = sim;

    // Automatically generate initial toolpath for instant readiness
    generateToolpath();
  }, []);

  useEffect(() => {
    if (simEngineRef.current) {
      simEngineRef.current.setToolConfig(toolConfig);
    }
  }, [toolConfig]);

  // Generate Toolpath using CAMEngine
  const generateToolpath = () => {
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
      setSimState('ready');
    }, 100);
  };

  // Auto-fit Stock to CAD Dimensions
  const handleAutoFitStock = () => {
    if (cadStats && cadStats.recommendedStock) {
      setStockConfig({
        ...stockConfig,
        width: cadStats.recommendedStock.width,
        length: cadStats.recommendedStock.length,
        height: cadStats.recommendedStock.height
      });
    }
  };

  // Playback Handlers
  const handleStart = () => {
    if (simEngineRef.current) {
      if (simState === 'paused') {
        simEngineRef.current.resume();
        return;
      }
      if (!toolpathData) {
        const result = camEngine.generateProgram({
          stock: stockConfig,
          tool: toolConfig,
          operations,
          parameters: machiningParams,
          cadStats
        });
        setToolpathData(result.toolpathData);
        simEngineRef.current.loadToolpath(result.toolpathData);
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
  };

  const handleSetSpeed = (newSpeed) => {
    setSpeed(newSpeed);
    if (simEngineRef.current) simEngineRef.current.setSpeed(newSpeed);
  };

  const handleSeek = (pct) => {
    setProgressPercent(pct);
    if (simEngineRef.current) simEngineRef.current.seek(pct);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      overflow: 'hidden'
    }}>
      {/* Pinterest-Style Modern Studio Header */}
      <header style={{
        height: '56px',
        padding: '0 20px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 30,
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Left Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'var(--accent-primary)',
            color: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '14px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Cpu size={18} />
          </div>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              CNC DIGITAL TWIN
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>STUDIO</span>
            </h1>
          </div>
          <span style={{
            fontSize: '11px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 600
          }}>
            CAD: main.STEP
          </span>
        </div>

        {/* Center Active Part Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            padding: '5px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '12px'
          }}>
            <Box size={14} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)' }}>Workpiece:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {typeof userPartFile === 'string' ? userPartFile.split('/').pop().replace('.stl', '') : userPartFile?.name || 'Custom Model'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
              {stockConfig.material.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Right Actions: Theme Toggle, Inspection & Run */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleTheme}
            style={{ fontSize: '12px', padding: '6px 14px', borderRadius: 'var(--radius-pill)' }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>

          <button
            onClick={() => setShowInspection(true)}
            style={{ fontSize: '12px', padding: '6px 14px', borderRadius: 'var(--radius-pill)' }}
          >
            <Activity size={14} /> Quality Report
          </button>
          
          <button
            onClick={handleStart}
            className="primary"
            style={{ fontSize: '12px', padding: '6px 18px', borderRadius: 'var(--radius-pill)', gap: '6px' }}
          >
            <Play size={14} /> Run Machining
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Setup Configuration Panel */}
        <SetupPanel
          stockConfig={stockConfig}
          setStockConfig={setStockConfig}
          toolConfig={toolConfig}
          setToolConfig={setToolConfig}
          machiningParams={machiningParams}
          setMachiningParams={setMachiningParams}
          operations={operations}
          setOperations={setOperations}
          userPartFile={userPartFile}
          setUserPartFile={setUserPartFile}
          cadStats={cadStats}
          onAutoFitStock={handleAutoFitStock}
          onGenerateToolpath={generateToolpath}
          isGenerating={isGenerating}
        />

        {/* Center 3D Digital Twin Viewport */}
        <div style={{ flex: 1, position: 'relative', height: '100%', overflow: 'hidden' }}>
          <Viewport3D
            kinematics={kinematics}
            materialEngine={materialEngine}
            toolpathData={toolpathData}
            stockConfig={stockConfig}
            userPartFile={userPartFile}
            simState={simState}
            theme={theme}
          />
        </div>

        {/* Right Manufacturing Telemetry & Stage Pipeline (No G-Code clutter!) */}
        <ManufacturingPanel
          dro={dro}
          simState={simState}
          currentOperation={currentOperation}
          kinematics={kinematics}
          operations={operations}
          progressPercent={progressPercent}
          stockConfig={stockConfig}
          toolConfig={toolConfig}
          elapsedTimeSec={elapsedTimeSec}
          removedPercent={removedPercent}
        />

      </div>

      {/* Bottom Floating Simulation Controls Dock */}
      <SimControls
        simState={simState}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
        onReset={handleReset}
        speed={speed}
        onSetSpeed={handleSetSpeed}
        progressPercent={progressPercent}
        onSeek={handleSeek}
        elapsedTimeSec={elapsedTimeSec}
        estimatedTimeSec={toolpathData?.stats?.estimatedTimeMinutes ? toolpathData.stats.estimatedTimeMinutes * 60 : 120}
        removedPercent={removedPercent}
        currentOperation={currentOperation}
      />

      {/* Post-Machining Quality Inspection Dialog */}
      <InspectionModal
        isOpen={showInspection}
        onClose={() => setShowInspection(false)}
        stats={toolpathData?.stats}
        stockConfig={stockConfig}
        toolConfig={toolConfig}
      />

    </div>
  );
}

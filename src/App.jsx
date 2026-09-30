import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, Square, RotateCcw, Box, Cpu, 
  Settings, Layers, FileCode, CheckCircle2, 
  Download, Activity, Compass, Info, Sparkles,
  Sun, Moon, UploadCloud
} from 'lucide-react';

import Viewport3D from './components/Viewport3D';
import SetupPanel from './components/SetupPanel';
import StatusPanel from './components/StatusPanel';
import GCodeViewer from './components/GCodeViewer';
import SimControls from './components/SimControls';
import InspectionModal from './components/InspectionModal';

import { MachineKinematics } from './engine/MachineKinematics';
import { MaterialRemovalEngine } from './engine/MaterialRemoval';
import { SimulationEngine } from './engine/SimulationEngine';
import { CAMEngine } from './engine/CAMEngine';
import { GCodeParser } from './engine/GCodeParser';
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
  const gcodeParser = useMemo(() => new GCodeParser(), []);
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
  const [activeGCodeIndex, setActiveGCodeIndex] = useState(0);
  const [activeGCode, setActiveGCode] = useState(null);
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
        setActiveGCodeIndex(data.currentGCodeIndex);
        setActiveGCode(data.activeGCode);
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

    // Automatically generate initial toolpath for instant demo readiness
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

  // Load and Parse Custom Uploaded G-Code
  const handleLoadCustomGCode = (gcodeText) => {
    setIsGenerating(true);
    setTimeout(() => {
      const result = gcodeParser.parse(gcodeText);
      setToolpathData(result);
      if (simEngineRef.current) {
        simEngineRef.current.loadToolpath(result);
      }
      setIsGenerating(false);
      setSimState('ready');
    }, 100);
  };

  // Playback Handlers
  const handleStart = () => {
    if (!toolpathData) {
      generateToolpath();
    }
    if (simEngineRef.current) simEngineRef.current.start();
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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      
      {/* Top Navbar */}
      <header style={{
        height: '48px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 30
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Cpu size={16} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.3px' }}>
              DIGITAL CNC TWIN <span style={{ color: 'var(--accent-blue)', fontWeight: 500 }}>MILLING SIMULATOR</span>
            </h1>
          </div>
          <span style={{
            fontSize: '10px',
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            color: 'var(--accent-blue)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 600
          }}>
            CAD TWIN: main.STEP
          </span>
        </div>

        {/* Center Machine State Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: simState === 'running' ? 'var(--accent-green)' :
                          simState === 'paused' ? 'var(--accent-yellow)' :
                          simState === 'complete' ? 'var(--accent-purple)' : 'var(--accent-cyan)'
            }} />
            <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{simState}</span>
          </div>
        </div>

        {/* Right Actions: Theme Toggle, Inspection & Run */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleTheme}
            style={{ fontSize: '12px', padding: '5px 10px' }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>

          <button
            onClick={() => setShowInspection(true)}
            style={{ fontSize: '12px', padding: '5px 10px' }}
          >
            <Activity size={13} /> Inspection & Report
          </button>
          
          <button
            onClick={handleStart}
            className="primary"
            style={{ fontSize: '12px', padding: '5px 12px' }}
          >
            <Play size={13} /> Run Simulation
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
          onLoadCustomGCode={handleLoadCustomGCode}
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

        {/* Right Panels: Status DRO + G-Code Table */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '340px', height: '100%' }}>
          <div style={{ height: '52%', overflowY: 'auto' }}>
            <StatusPanel
              dro={dro}
              simState={simState}
              currentOperation={currentOperation}
              kinematics={kinematics}
              activeGCode={activeGCode}
            />
          </div>
          <div style={{ height: '48%' }}>
            <GCodeViewer
              gcode={toolpathData?.gcode || []}
              activeGCodeIndex={activeGCodeIndex}
              onSelectLine={(idx) => {
                if (simEngineRef.current) {
                  const targetPt = toolpathData?.points[idx];
                  if (targetPt) kinematics.moveTo(targetPt.x, targetPt.y, targetPt.z);
                }
              }}
            />
          </div>
        </div>

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

      {/* Post-Machining Inspection Dialog */}
      <InspectionModal
        isOpen={showInspection}
        onClose={() => setShowInspection(false)}
        stats={toolpathData?.stats}
        stockConfig={stockConfig}
        toolConfig={toolConfig}
        gcode={toolpathData?.gcode || []}
      />

    </div>
  );
}

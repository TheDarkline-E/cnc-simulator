import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import SidebarNav from './components/SidebarNav';
import CenterViewportCard from './components/CenterViewportCard';
import RightTelemetryCard from './components/RightTelemetryCard';
import FigmaPreviewDashboard from './components/FigmaPreviewDashboard';
import InspectionModal from './components/InspectionModal';
import MachineSetupModal from './components/MachineSetupModal';


import { MachineKinematics } from './engine/MachineKinematics';
import { MaterialRemovalEngine } from './engine/MaterialRemoval';
import { SimulationEngine } from './engine/SimulationEngine';
import { CAMEngine } from './engine/CAMEngine';
import { CADImporter } from './engine/CADImporter';

export default function App() {
  // Navigation State: 'machining' | 'charts' | 'machine' | 'kinematics'
  const [activeNav, setActiveNav] = useState('machining');

  // Theme state: defaults to light studio mode as in reference
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

  // Simulation State: 'ready' | 'running' | 'paused' | 'complete'
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
    lastError: null
  });

  // Simulation Engine & Viewport References
  const simEngineRef = useRef(null);
  const viewportApiRef = useRef(null);

  // Analyze CAD file whenever userPartFile changes
  useEffect(() => {
    if (!userPartFile) return;
    cadImporter.loadCAD(userPartFile).then(({ stats }) => {
      setCadStats(stats);
    }).catch(err => {
      console.warn("CAD stats analysis error:", err);
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
      setSimState('ready');
    }, 100);
  }, [camEngine, stockConfig, toolConfig, operations, machiningParams, cadStats]);

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

    generateToolpath();
  }, [kinematics, materialEngine]);

  useEffect(() => {
    if (simEngineRef.current) {
      simEngineRef.current.setToolConfig(toolConfig);
    }
  }, [toolConfig]);

  // Playback Handlers
  const handleStart = () => {
    if (simEngineRef.current) {
      if (simState === 'paused') {
        simEngineRef.current.resume();
        return;
      }
      if (!toolpathData) {
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
    <main className="app-stage">
      <div className="app-shell">
        {/* Left Column: Sidebar Navigation & CAM Pipeline */}
        <SidebarNav
          activeNav={activeNav}
          onSelectNav={(nav) => setActiveNav(nav)}
          stockConfig={stockConfig}
          setStockConfig={setStockConfig}
          operations={operations}
          currentOperation={currentOperation}
          onOpenInspection={() => setShowInspection(true)}
          onOpenSetup={() => setShowSetupModal(true)}
        />

        {activeNav === 'charts' ? (
          /* Full 6-Card Production Analytics Dashboard from Figma Preview */
          <div className="dashboard-column" style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
            <FigmaPreviewDashboard
              onSwitchPage={(page) => setActiveNav(page === 'studio' ? 'machining' : page)}
              dro={dro}
              simState={simState}
              currentOperation={currentOperation}
              progressPercent={progressPercent}
              stockConfig={stockConfig}
            />
          </div>
        ) : (
          <>
            {/* Center Column: Hero 3D CAD/CAM Viewport — Permanent Real Digital Twin */}
            <div className="center-column" style={{ flex: 1, height: '100%', display: 'flex', overflow: 'hidden' }}>
              <CenterViewportCard
                kinematics={kinematics}
                materialEngine={materialEngine}
                toolpathData={toolpathData}
                stockConfig={stockConfig}
                setStockConfig={setStockConfig}
                toolConfig={toolConfig}
                setToolConfig={setToolConfig}
                machiningParams={machiningParams}
                setMachiningParams={setMachiningParams}
                onRegenerate={generateToolpath}
                userPartFile={userPartFile}
                simState={simState}
                dro={dro}
                theme={theme}
                onStart={handleStart}
                onPause={handlePause}
                onResume={handleResume}
                onReset={handleReset}
                progressPercent={progressPercent}
                viewportApiRef={viewportApiRef}
                activeNav={activeNav}
                onNavigate={(nav) => setActiveNav(nav)}
              />
            </div>

            {/* Right Column: Telemetry, Live DRO, Spindle Dynamics & Passes Gantt */}
            <RightTelemetryCard
              dro={dro}
              simState={simState}
              currentOperation={currentOperation}
              progressPercent={progressPercent}
              removedPercent={removedPercent}
              elapsedTimeSec={elapsedTimeSec}
              onOpenSettings={() => setShowSetupModal(true)}
              onOpenInspection={() => setShowInspection(true)}
              onOpenCharts={() => setActiveNav('charts')}
              toggleTheme={toggleTheme}
              theme={theme}
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onReset={handleReset}
              speed={speed}
              onSetSpeed={handleSetSpeed}
              onSeek={handleSeek}
              activeNav={activeNav}
            />
          </>
        )}
      </div>

      {/* CNC Machine & Tooling Setup Modal */}
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

      {/* Post-Machining Quality Metrology Dialog */}
      <InspectionModal
        isOpen={showInspection}
        onClose={() => setShowInspection(false)}
        stats={toolpathData?.stats}
        stockConfig={stockConfig}
        toolConfig={toolConfig}
      />
    </main>
  );
}

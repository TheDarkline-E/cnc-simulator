import React, { useEffect, useState } from 'react';
import { 
  Play, Pause, RotateCcw, Box, Compass, 
  Maximize2, ChevronRight, Sparkles, Layers,
  Eye, Sliders, Cpu, Wrench, Activity, ScanLine,
  ShieldAlert, Droplets, CheckCircle2
} from 'lucide-react';
import Viewport3D from './Viewport3D';

const toolPresets = [
  { id: 'flat_6', name: 'Flat End Mill Ø6mm', type: 'flat_end_mill', diameter: 6.0, length: 50.0, flutes: 2, desc: 'High-precision slotting & contour' },
  { id: 'ball_6', name: 'Ball End Mill Ø6mm', type: 'ball_end_mill', diameter: 6.0, length: 50.0, flutes: 2, desc: '3D continuous surface profiling' },
  { id: 'face_12', name: 'Face Mill Ø12mm', type: 'face_mill', diameter: 12.0, length: 45.0, flutes: 4, desc: 'High-MRR surface planar facing' },
  { id: 'bull_8', name: 'Bull Nose Ø8mm', type: 'bull_nose', diameter: 8.0, length: 50.0, flutes: 3, desc: 'Radius bottom pocket milling' }
];

export default function CenterViewportCard({
  kinematics,
  materialEngine,
  toolpathData,
  stockConfig,
  setStockConfig,
  toolConfig,
  setToolConfig,
  machiningParams,
  setMachiningParams,
  onRegenerate,
  userPartFile,
  simState,
  dro,
  theme = 'light',
  onStart,
  onPause,
  onResume,
  onReset,
  progressPercent = 0,
  viewportApiRef,
  activeNav = 'machining',
  onNavigate
}) {
  const [explodedVal, setExplodedVal] = useState(0);

  // Synchronize 3D Camera with Active Engineering Navigation Mode
  useEffect(() => {
    if (viewportApiRef?.current?.setCameraView) {
      if (activeNav === 'machine') {
        viewportApiRef.current.setCameraView('fit');
      } else if (activeNav === 'kinematics') {
        viewportApiRef.current.setCameraView('top');
      } else if (activeNav === 'tooling') {
        viewportApiRef.current.setCameraView('part_zoom');
      } else if (activeNav === 'machining') {
        viewportApiRef.current.setCameraView('iso');
      } else if (activeNav === 'telemetry') {
        viewportApiRef.current.setCameraView('front');
      }
    }
  }, [activeNav, viewportApiRef]);

  // Interactive Kinematic Jog Handler
  const handleJog = (axis, delta) => {
    if (!kinematics) return;
    const current = kinematics.currentPos;
    let newX = current.x;
    let newY = current.y;
    let newZ = current.z;
    if (axis === 'x') newX = Math.max(-150, Math.min(150, current.x + delta));
    if (axis === 'y') newY = Math.max(-100, Math.min(100, current.y + delta));
    if (axis === 'z') newZ = Math.max(-70, Math.min(50, current.z + delta));
    kinematics.moveTo(newX, newY, newZ);
  };

  const handleHomeMachine = () => {
    if (!kinematics) return;
    kinematics.moveTo(0, 0, 25);
  };

  const handleExplodeChange = (val) => {
    setExplodedVal(val);
    if (kinematics) kinematics.setExplodedFactor(val);
  };

  const handleSelectToolPreset = (preset) => {
    if (setToolConfig) {
      setToolConfig(prev => ({
        ...prev,
        type: preset.type,
        diameter: preset.diameter,
        length: preset.length,
        cuttingLength: preset.diameter * 4,
        flutes: preset.flutes
      }));
    }
    if (onRegenerate) {
      setTimeout(onRegenerate, 60);
    }
  };

  return (
    <div className="center-workspace" style={{
      flex: 1,
      height: '100%',
      width: '100%',
      background: 'var(--bg-app)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Real Three.js 3D CNC CAD/CAM Viewport Canvas */}
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Viewport3D
          kinematics={kinematics}
          materialEngine={materialEngine}
          toolpathData={toolpathData}
          stockConfig={stockConfig}
          userPartFile={userPartFile}
          simState={simState}
          theme={theme}
          minimalUI={false}
          apiRef={viewportApiRef}
        />
      </div>

      {/* Mode-Specific Contextual Floating Overlays onto Live 3D Twin */}

      {/* 1. KINEMATICS MODE: Interactive Real Axis Jogging Controller */}
      {activeNav === 'kinematics' && (
        <div 
          className="glass-panel" 
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            zIndex: 10,
            borderRadius: '16px',
            padding: '16px 20px',
            minWidth: '320px',
            boxShadow: 'var(--shadow-float)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="var(--accent-purple)" />
              <strong style={{ fontSize: '12.5px', color: 'var(--text-main)' }}>Live Kinematic Jogging</strong>
            </div>
            <button
              onClick={handleHomeMachine}
              className="glass-panel"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--accent-purple)'
              }}
              title="Return Machine to Safe Home Coordinates (G28 X0 Y0 Z25)"
            >
              <RotateCcw size={12} /> G28 Home
            </button>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-sub)', margin: '0 0 12px 0' }}>
            Drive Haas VF-2SS linear servo drives directly in the 3D twin:
          </p>

          {/* X Axis Jog Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--axis-x)', width: '32px' }}>X:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => handleJog('x', -10)} style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>-10</button>
              <button onClick={() => handleJog('x', -1)} style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>-1</button>
              <button onClick={() => handleJog('x', +1)} style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>+1</button>
              <button onClick={() => handleJog('x', +10)} style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>+10</button>
            </div>
            <span className="mono" style={{ fontSize: '12px', fontWeight: 650, width: '60px', textAlign: 'right' }}>
              {(dro?.x ?? 0).toFixed(1)} mm
            </span>
          </div>

          {/* Y Axis Jog Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--axis-y)', width: '32px' }}>Y:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => handleJog('y', -10)} style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>-10</button>
              <button onClick={() => handleJog('y', -1)} style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>-1</button>
              <button onClick={() => handleJog('y', +1)} style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>+1</button>
              <button onClick={() => handleJog('y', +10)} style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>+10</button>
            </div>
            <span className="mono" style={{ fontSize: '12px', fontWeight: 650, width: '60px', textAlign: 'right' }}>
              {(dro?.y ?? 0).toFixed(1)} mm
            </span>
          </div>

          {/* Z Axis Jog Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--axis-z)', width: '32px' }}>Z:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => handleJog('z', -10)} style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>-10</button>
              <button onClick={() => handleJog('z', -1)} style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>-1</button>
              <button onClick={() => handleJog('z', +1)} style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>+1</button>
              <button onClick={() => handleJog('z', +10)} style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>+10</button>
            </div>
            <span className="mono" style={{ fontSize: '12px', fontWeight: 650, width: '60px', textAlign: 'right' }}>
              {(dro?.z ?? 25).toFixed(1)} mm
            </span>
          </div>
        </div>
      )}

      {/* 2. MACHINE TWIN MODE: Subsystem Inspection & Exploded Assembly Controls */}
      {activeNav === 'machine' && (
        <div 
          className="glass-panel" 
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            zIndex: 10,
            borderRadius: '16px',
            padding: '16px 20px',
            minWidth: '320px',
            boxShadow: 'var(--shadow-float)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={16} color="var(--accent-purple)" />
              <strong style={{ fontSize: '12.5px', color: 'var(--text-main)' }}>Machine CAD Subsystems</strong>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 700 }}>39 Solids Verified</span>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-sub)', marginBottom: '4px' }}>
              <span>Exploded Assembly:</span>
              <span className="mono">{Math.round(explodedVal * 100)}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={explodedVal}
              onChange={(e) => handleExplodeChange(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent-purple)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              onClick={() => {
                if (viewportApiRef?.current?.cycleEnclosureMode) {
                  viewportApiRef.current.cycleEnclosureMode();
                }
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-main)'
              }}
            >
              <ShieldAlert size={13} color="var(--accent-blue)" /> Cycle Door
            </button>
            <button
              onClick={() => handleExplodeChange(explodedVal > 0 ? 0 : 0.6)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-main)'
              }}
            >
              <Layers size={13} color="var(--accent-purple)" /> {explodedVal > 0 ? 'Assemble' : 'Explode 60%'}
            </button>
          </div>
        </div>
      )}

      {/* 3. TOOLING MODE: Direct Spindle Cutter Quick-Selector */}
      {activeNav === 'tooling' && (
        <div 
          className="glass-panel" 
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            zIndex: 10,
            borderRadius: '16px',
            padding: '16px 20px',
            minWidth: '320px',
            boxShadow: 'var(--shadow-float)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={16} color="var(--accent-purple)" />
              <strong style={{ fontSize: '12.5px', color: 'var(--text-main)' }}>Spindle Tooling Selector</strong>
            </div>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 700 }}>
              Ø{toolConfig?.diameter ?? 6}mm
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {toolPresets.map(preset => {
              const isSelected = toolConfig?.type === preset.type && Math.abs(toolConfig?.diameter - preset.diameter) < 0.1;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectToolPreset(preset)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: isSelected ? 'var(--accent-purple-light)' : 'var(--bg-card)',
                    border: `1px solid ${isSelected ? 'var(--accent-purple)' : 'var(--border-light)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: isSelected ? 700 : 550, color: isSelected ? 'var(--accent-purple)' : 'var(--text-main)' }}>
                      {preset.name}
                    </div>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-sub)' }}>
                      {preset.desc}
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 size={14} color="var(--accent-purple)" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SENSORS & METROLOGY MODE: Live Metrology Surface Overlay */}
      {activeNav === 'telemetry' && (
        <div 
          className="glass-panel" 
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            zIndex: 10,
            borderRadius: '16px',
            padding: '16px 20px',
            minWidth: '300px',
            boxShadow: 'var(--shadow-float)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="var(--accent-purple)" />
              <strong style={{ fontSize: '12.5px', color: 'var(--text-main)' }}>Sensors & Metrology</strong>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 700 }}>PBR Live</span>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-sub)', marginBottom: '12px' }}>
            Examine machined surface texture and heat distribution directly on the CAD workpiece:
          </div>

          <button
            onClick={() => {
              if (viewportApiRef?.current?.cycleWorkpieceMode) {
                viewportApiRef.current.cycleWorkpieceMode();
              }
            }}
            className="btn-purple-pill"
            style={{ width: '100%', padding: '8px 12px', fontSize: '11px', cursor: 'pointer' }}
          >
            <Layers size={13} /> Cycle Workpiece View (Solid / Heatmap / Ghost)
          </button>
        </div>
      )}
    </div>
  );
}

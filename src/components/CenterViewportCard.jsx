import React, { useState } from 'react';
import { 
  Play, Pause, RotateCcw, Box, Compass, 
  Maximize2, ChevronRight, Sparkles, Layers,
  Eye, Sliders
} from 'lucide-react';
import Viewport3D from './Viewport3D';

export default function CenterViewportCard({
  kinematics,
  materialEngine,
  toolpathData,
  stockConfig,
  toolConfig,
  userPartFile,
  simState,
  theme = 'light',
  onStart,
  onPause,
  onResume,
  onReset,
  progressPercent = 0,
  viewportApiRef
}) {
  const [activeCamView, setActiveCamView] = useState('iso'); // 'iso' | 'top' | 'front'

  const isRunning = simState === 'running';

  const handlePlayToggle = () => {
    if (isRunning) {
      if (onPause) onPause();
    } else {
      if (simState === 'paused') {
        if (onResume) onResume();
      } else {
        if (onStart) onStart();
      }
    }
  };

  const handleSwitchCam = (view) => {
    setActiveCamView(view);
    if (viewportApiRef?.current?.setCameraView) {
      viewportApiRef.current.setCameraView(view);
    }
  };

  const handleFitView = () => {
    if (viewportApiRef?.current?.setCameraView) {
      viewportApiRef.current.setCameraView('fit');
    }
  };

  const handleIsoView = () => {
    setActiveCamView('iso');
    if (viewportApiRef?.current?.setCameraView) {
      viewportApiRef.current.setCameraView('iso');
    }
  };

  const handleHomeReset = () => {
    if (onReset) onReset();
    setActiveCamView('iso');
    if (viewportApiRef?.current?.setCameraView) {
      viewportApiRef.current.setCameraView('iso');
    }
  };

  const materialNames = {
    al6061: 'Aluminium 6061-T6',
    brass360: 'Brass 360 Free-Cut',
    steel1018: 'Steel 1018 Cold-Roll'
  };

  return (
    <div style={{
      flex: 1,
      height: '100%',
      background: 'var(--bg-card)',
      borderRadius: '28px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-card)',
      border: '1px solid var(--border-light)'
    }}>
      {/* Top Header matching reference (Title + Functional Camera View Switcher) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '22px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <h2 style={{
            fontSize: '17px',
            fontWeight: 800,
            color: 'var(--text-main)',
            letterSpacing: '-0.3px',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Digital Twin Overview
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--bg-app)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-light)'
            }}>
              Haas 3-Axis VMC
            </span>
            <button
              onClick={() => {
                if (viewportApiRef?.current?.cycleEnclosureMode) {
                  viewportApiRef.current.cycleEnclosureMode();
                }
              }}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--bg-app)',
                color: 'var(--text-sub)',
                border: '1px solid var(--border-light)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
              title="Toggle Machine Outer Cabinet (Solid / Tinted Glass / Hidden)"
            >
              <Box size={12} color="var(--accent-purple)" /> Cabinet Door
            </button>
          </h2>
        </div>

        {/* Capsule Switcher (Camera Views: Isometric / Top XY / Front XZ) */}
        <div 
          className="capsule-switcher" 
          style={{ 
            pointerEvents: 'auto',
            background: 'var(--bg-app)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            padding: '4px',
            borderRadius: 'var(--radius-pill)'
          }}
        >
          <button
            className={activeCamView === 'iso' ? 'active' : ''}
            onClick={() => handleSwitchCam('iso')}
            title="Isometric 3D Perspective"
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '12px',
              fontWeight: 600,
              background: activeCamView === 'iso' ? 'var(--accent-purple)' : 'transparent',
              color: activeCamView === 'iso' ? '#ffffff' : 'var(--text-sub)',
              boxShadow: activeCamView === 'iso' ? '0 3px 10px rgba(124, 92, 252, 0.3)' : 'none'
            }}
          >
            Isometric
          </button>
          <button
            className={activeCamView === 'top' ? 'active' : ''}
            onClick={() => handleSwitchCam('top')}
            title="Top View (XY Machining Plane)"
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '12px',
              fontWeight: 600,
              background: activeCamView === 'top' ? 'var(--accent-purple)' : 'transparent',
              color: activeCamView === 'top' ? '#ffffff' : 'var(--text-sub)',
              boxShadow: activeCamView === 'top' ? '0 3px 10px rgba(124, 92, 252, 0.3)' : 'none'
            }}
          >
            Top XY
          </button>
          <button
            className={activeCamView === 'front' ? 'active' : ''}
            onClick={() => handleSwitchCam('front')}
            title="Front Elevation View (XZ Plane)"
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '12px',
              fontWeight: 600,
              background: activeCamView === 'front' ? 'var(--accent-purple)' : 'transparent',
              color: activeCamView === 'front' ? '#ffffff' : 'var(--text-sub)',
              boxShadow: activeCamView === 'front' ? '0 3px 10px rgba(124, 92, 252, 0.3)' : 'none'
            }}
          >
            Front XZ
          </button>
        </div>
      </div>

      {/* 3D Viewport Simulation Canvas */}
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Viewport3D
          kinematics={kinematics}
          materialEngine={materialEngine}
          toolpathData={toolpathData}
          stockConfig={stockConfig}
          userPartFile={userPartFile}
          simState={simState}
          theme={theme}
          minimalUI={true}
          apiRef={viewportApiRef}
        />
      </div>

      {/* Floating Bottom-Left Card matching reference ("Precision Milling Cycle") */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '22px',
        padding: '18px 20px',
        maxWidth: '220px',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.8)'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#14171a',
          lineHeight: '1.3',
          marginBottom: '6px',
          letterSpacing: '-0.2px'
        }}>
          Precision Milling Cycle
        </h3>

        <div style={{
          fontSize: '11px',
          color: 'var(--text-sub)',
          marginBottom: '14px',
          fontWeight: 500,
          lineHeight: 1.3
        }}>
          {materialNames[stockConfig?.material] || 'Aluminium 6061-T6'} • Carbide Endmill (Ø6mm)
        </div>

        <button
          onClick={handlePlayToggle}
          className="btn-purple-pill"
          style={{
            fontSize: '11px',
            padding: '8px 18px',
            borderRadius: 'var(--radius-pill)',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          {isRunning ? (
            <>
              <Pause size={12} /> Pause cycle
            </>
          ) : (
            <>
              <Play size={12} fill="white" /> Run Machining
            </>
          )}
        </button>
      </div>

      {/* Floating Bottom-Right 2x2 Glassy Controls Dock */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: '24px',
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.90)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '8px',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 38px)',
        gridTemplateRows: 'repeat(2, 38px)',
        gap: '6px'
      }}>
        {/* Top-Left: <> Fit Camera */}
        <button
          onClick={handleFitView}
          title="Fit Camera to Model (<>)"
          style={{
            borderRadius: '12px',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease'
          }}
        >
          &lt;&gt;
        </button>

        {/* Top-Right: Isometric Cube */}
        <button
          onClick={handleIsoView}
          title="Isometric View Angle"
          style={{
            borderRadius: '12px',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease'
          }}
        >
          <Box size={16} />
        </button>

        {/* Bottom-Left: Home / Reset */}
        <button
          onClick={handleHomeReset}
          title="Home Machine Coordinates & Reset Simulation"
          style={{
            borderRadius: '12px',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease'
          }}
        >
          <RotateCcw size={15} />
        </button>

        {/* Bottom-Right: Play / Pause */}
        <button
          onClick={handlePlayToggle}
          title={isRunning ? "Pause Machining" : "Start Machining Cycle"}
          style={{
            borderRadius: '12px',
            background: isRunning ? 'var(--accent-dark)' : 'var(--accent-purple)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isRunning ? 'none' : '0 3px 10px rgba(124, 92, 252, 0.3)',
            transition: 'all 0.15s ease'
          }}
        >
          {isRunning ? <Pause size={15} /> : <Play size={15} fill="white" />}
        </button>
      </div>
    </div>
  );
}

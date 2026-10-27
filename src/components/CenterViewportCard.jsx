import React, { useState } from 'react';
import { 
  Box, Eye, EyeOff, Layers, Maximize2, Shield, 
  Wind, ZoomIn, Sliders, Compass
} from 'lucide-react';
import Viewport3D from './Viewport3D';

export default function CenterViewportCard({
  kinematics,
  materialEngine,
  toolpathData,
  stockConfig,
  userPartFile,
  simState,
  theme = 'dark',
  viewportApiRef
}) {
  const [explodedVal, setExplodedVal] = useState(0);
  const [showMachine, setShowMachine] = useState(true);
  const [showToolpath, setShowToolpath] = useState(true);
  const [enclosureMode, setEnclosureMode] = useState('glass');
  const [workpieceMode, setWorkpieceMode] = useState('solid');

  const handleCameraView = (view) => {
    if (viewportApiRef?.current?.setCameraView) {
      viewportApiRef.current.setCameraView(view);
    }
  };

  const handleToggleMachine = () => {
    if (viewportApiRef?.current?.toggleMachine) {
      viewportApiRef.current.toggleMachine();
      setShowMachine(prev => !prev);
    }
  };

  const handleToggleToolpath = () => {
    if (viewportApiRef?.current?.toggleToolpath) {
      viewportApiRef.current.toggleToolpath();
      setShowToolpath(prev => !prev);
    }
  };

  const handleCycleEnclosure = () => {
    if (viewportApiRef?.current?.cycleEnclosureMode) {
      viewportApiRef.current.cycleEnclosureMode();
      setEnclosureMode(prev => prev === 'glass' ? 'hide' : prev === 'hide' ? 'solid' : 'glass');
    }
  };

  const handleCycleWorkpiece = () => {
    if (viewportApiRef?.current?.cycleWorkpieceMode) {
      viewportApiRef.current.cycleWorkpieceMode();
      setWorkpieceMode(prev => prev === 'solid' ? 'heatmap' : prev === 'heatmap' ? 'ghost' : 'solid');
    }
  };

  const handleCleanSwarf = () => {
    if (viewportApiRef?.current?.blowOffChips) {
      viewportApiRef.current.blowOffChips();
    }
  };

  const handleExplodeChange = (val) => {
    setExplodedVal(val);
    if (viewportApiRef?.current?.setExploded) {
      viewportApiRef.current.setExploded(val);
    } else if (kinematics) {
      kinematics.setExplodedFactor(val);
    }
  };

  return (
    <div className="cad-viewport-container">
      {/* Three.js 3D Viewport with minimalUI=true (No arcade badges) */}
      <div className="viewport-canvas">
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

      {/* Top-Right: ViewCube / Standard CAD Camera Orientations */}
      <div className="cad-view-cube-strip" role="toolbar" aria-label="Camera orientation">
        <button type="button" onClick={() => handleCameraView('iso')} title="Isometric View (Home)">ISO</button>
        <button type="button" onClick={() => handleCameraView('top')} title="Top View (XY Plane)">TOP</button>
        <button type="button" onClick={() => handleCameraView('front')} title="Front View (XZ Plane)">FRONT</button>
        <button type="button" onClick={() => handleCameraView('right')} title="Right View (YZ Plane)">RIGHT</button>
        <button type="button" onClick={() => handleCameraView('fit')} title="Fit to View">
          <ZoomIn size={12} /> FIT
        </button>
        <button type="button" onClick={() => handleCameraView('part_zoom')} title="Focus Workpiece">
          PART
        </button>
      </div>

      {/* Bottom-Center: Translucent Desktop CAD Viewport Bar (Fusion 360 / FreeCAD style) */}
      <div className="cad-viewport-toolbar" role="toolbar" aria-label="Viewport display options">
        <button
          type="button"
          className={`vp-tool-btn ${showMachine ? 'is-active' : ''}`}
          onClick={handleToggleMachine}
          title="Toggle Machine Visibility"
        >
          <Box size={13} />
          <span>Machine</span>
        </button>

        <button
          type="button"
          className={`vp-tool-btn ${enclosureMode !== 'hide' ? 'is-active' : ''}`}
          onClick={handleCycleEnclosure}
          title={`Enclosure Door: ${enclosureMode.toUpperCase()}`}
        >
          <Shield size={13} />
          <span>Door: {enclosureMode === 'glass' ? 'Glass' : enclosureMode === 'solid' ? 'Solid' : 'Off'}</span>
        </button>

        <button
          type="button"
          className="vp-tool-btn is-active"
          onClick={handleCycleWorkpiece}
          title={`Workpiece Mode: ${workpieceMode.toUpperCase()}`}
        >
          <Layers size={13} />
          <span>Stock: {workpieceMode === 'solid' ? 'Solid' : workpieceMode === 'heatmap' ? 'Heatmap' : 'Ghost'}</span>
        </button>

        <button
          type="button"
          className={`vp-tool-btn ${showToolpath ? 'is-active' : ''}`}
          onClick={handleToggleToolpath}
          title="Toggle Toolpath Lines"
        >
          <Compass size={13} />
          <span>Toolpath</span>
        </button>

        <button
          type="button"
          className="vp-tool-btn"
          onClick={handleCleanSwarf}
          title="Clear Machining Swarf / Chips"
        >
          <Wind size={13} />
          <span>Clean Chips</span>
        </button>

        <div className="vp-tool-divider" />

        <div className="vp-explode-control" title="Exploded CAD assembly slider">
          <span className="explode-label">Explode:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={explodedVal}
            onChange={(e) => handleExplodeChange(parseFloat(e.target.value))}
            className="explode-slider"
          />
          <span className="explode-val mono">{Math.round(explodedVal * 100)}%</span>
        </div>
      </div>

      {/* Bottom-Left: Subtle Axis Datum Orientation */}
      <div className="cad-axis-indicator" aria-hidden="true">
        <span className="axis-label axis-x">X+</span>
        <span className="axis-label axis-y">Y+</span>
        <span className="axis-label axis-z">Z+</span>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Box, Compass, Layers, Maximize2, ShieldAlert, 
  Droplets, Sliders, Wind, Flame, Camera, ZoomIn
} from 'lucide-react';
import Viewport3D from './Viewport3D';

export default function CenterViewportCard({
  kinematics,
  materialEngine,
  toolpathData,
  stockConfig,
  userPartFile,
  simState,
  theme = 'light',
  viewportApiRef
}) {
  const [explodedVal, setExplodedVal] = useState(0);

  const handleExplodeChange = (val) => {
    setExplodedVal(val);
    if (kinematics) kinematics.setExplodedFactor(val);
  };

  return (
    <div className="center-viewport-wrapper">
      {/* 3D Three.js WebGL Canvas */}
      <div className="canvas-container">
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

      {/* Floating HUD: Exploded View Slider (Unobtrusive floating bar at bottom right) */}
      <div className="floating-viewport-hud bottom-right">
        <div className="glass-hud-pill">
          <span className="hud-label">Exploded CAD View</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={explodedVal}
            onChange={(e) => handleExplodeChange(parseFloat(e.target.value))}
            className="hud-slider"
            title="Subassembly explosion slider for internal mechanical inspection"
          />
          <span className="hud-val mono">{Math.round(explodedVal * 100)}%</span>
        </div>
      </div>
    </div>
  );
}

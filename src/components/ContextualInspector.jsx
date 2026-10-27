import React from 'react';
import { 
  Box, Wrench, RefreshCw, Layers, Sparkles, 
  CheckCircle2, Upload, Maximize2, Compass
} from 'lucide-react';

const toolPresets = [
  { id: 'flat_6', name: 'Flat End Mill Ø6mm', type: 'flat_end_mill', diameter: 6.0, length: 50.0, cuttingLength: 25.0, flutes: 2 },
  { id: 'ball_6', name: 'Ball End Mill Ø6mm', type: 'ball_end_mill', diameter: 6.0, length: 50.0, cuttingLength: 25.0, flutes: 2 },
  { id: 'face_12', name: 'Face Mill Ø12mm', type: 'face_mill', diameter: 12.0, length: 45.0, cuttingLength: 10.0, flutes: 4 },
  { id: 'bull_8', name: 'Bull Nose Ø8mm', type: 'bull_nose', diameter: 8.0, length: 50.0, cuttingLength: 25.0, flutes: 3 },
  { id: 'rough_10', name: 'Roughing End Mill Ø10mm', type: 'flat_end_mill', diameter: 10.0, length: 60.0, cuttingLength: 30.0, flutes: 3 }
];

const materials = [
  { id: 'al6061', name: 'Aluminium 6061-T6', density: '2.70 g/cm³' },
  { id: 'brass360', name: 'Brass 360 Free-Cut', density: '8.50 g/cm³' },
  { id: 'steel1018', name: 'Mild Steel 1018', density: '7.87 g/cm³' },
  { id: 'stainless304', name: 'Stainless Steel 304', density: '8.00 g/cm³' },
  { id: 'delrin', name: 'Delrin POM-C', density: '1.41 g/cm³' }
];

const sampleParts = [
  { id: '/samples/pocket_block.stl', name: 'Pocket Block (100×80×30 mm)' },
  { id: '/samples/bracket.stl', name: 'Stepped Mounting Bracket' },
  { id: '/samples/flange_part.stl', name: 'Flange Plate (Ø90×20 mm)' },
  { id: '/samples/mold_cavity.stl', name: 'Mold Cavity Block' }
];

export default function ContextualInspector({
  selectedItem,
  stockConfig,
  setStockConfig,
  toolConfig,
  setToolConfig,
  machiningParams,
  setMachiningParams,
  operations,
  setOperations,
  userPartFile,
  setUserPartFile,
  cadStats,
  onAutoFitStock,
  onRegenerate,
  isGenerating
}) {
  const itemType = selectedItem?.type || 'operation';
  const selectedOp = itemType === 'operation'
    ? operations.find(o => o.id === selectedItem?.id) || operations[0]
    : null;

  // Stock Handlers
  const handleStockDimensionChange = (key, val) => {
    const num = Math.max(10, Math.min(300, parseFloat(val) || 10));
    setStockConfig(prev => ({ ...prev, [key]: num }));
  };

  const handleMaterialChange = (matId) => {
    setStockConfig(prev => ({ ...prev, material: matId }));
  };

  // Operation Handlers
  const handleOpFieldChange = (opId, field, val) => {
    setOperations(prev => prev.map(op => {
      if (op.id !== opId) return op;
      return { ...op, [field]: val };
    }));
  };

  // Machining Params Handlers
  const handleParamChange = (field, val) => {
    const num = parseFloat(val);
    setMachiningParams(prev => ({ ...prev, [field]: isNaN(num) ? val : num }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUserPartFile(file);
    }
  };

  // Computed values
  const toolDia = toolConfig?.diameter || 6.0;
  const rpm = machiningParams?.spindleRPM || 8000;
  const surfaceSpeed = Math.round((Math.PI * toolDia * rpm) / 1000);
  const feedRate = machiningParams?.feedRate || 800;
  const flutes = toolConfig?.flutes || 2;
  const feedPerTooth = (feedRate / (rpm * flutes)).toFixed(3);
  const stepDown = machiningParams?.stepDown || 2.0;
  const totalDepth = selectedOp?.depth || 8.0;
  const numPasses = Math.ceil(totalDepth / Math.max(0.1, stepDown));
  const stepOverMm = (toolDia * (machiningParams?.stepOverRatio || 0.6)).toFixed(1);

  return (
    <aside className="engineering-inspector" aria-label="Contextual Property Inspector">
      {/* 1. STOCK INSPECTOR */}
      {itemType === 'stock' && (
        <div className="inspector-panel-inner">
          <div className="inspector-panel-header">
            <div className="panel-title-row">
              <Box size={14} className="panel-title-glyph" />
              <span className="panel-title-text">Stock Properties</span>
            </div>
            <span className="panel-context-badge">Setup 1 · G54</span>
          </div>

          <div className="inspector-panel-content">
            <div className="prop-group">
              <div className="prop-group-title">Stock Dimensions</div>
              <div className="prop-row">
                <label className="prop-label">Width (X)</label>
                <div className="prop-input-wrap">
                  <input
                    type="number"
                    className="prop-input mono"
                    value={stockConfig?.width || 100}
                    onChange={(e) => handleStockDimensionChange('width', e.target.value)}
                    min="10"
                    max="250"
                  />
                  <span className="prop-unit">mm</span>
                </div>
              </div>
              <div className="prop-row">
                <label className="prop-label">Length (Y)</label>
                <div className="prop-input-wrap">
                  <input
                    type="number"
                    className="prop-input mono"
                    value={stockConfig?.length || 80}
                    onChange={(e) => handleStockDimensionChange('length', e.target.value)}
                    min="10"
                    max="200"
                  />
                  <span className="prop-unit">mm</span>
                </div>
              </div>
              <div className="prop-row">
                <label className="prop-label">Height (Z)</label>
                <div className="prop-input-wrap">
                  <input
                    type="number"
                    className="prop-input mono"
                    value={stockConfig?.height || 30}
                    onChange={(e) => handleStockDimensionChange('height', e.target.value)}
                    min="5"
                    max="100"
                  />
                  <span className="prop-unit">mm</span>
                </div>
              </div>
            </div>

            <div className="prop-group">
              <div className="prop-group-title">Workpiece Alloy</div>
              <div className="prop-row">
                <label className="prop-label">Material</label>
                <select
                  className="prop-select"
                  value={stockConfig?.material || 'al6061'}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.density})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="prop-group">
              <div className="prop-group-title">Geometric Summary</div>
              <div className="prop-data-row">
                <span className="data-key">Raw Stock Volume:</span>
                <span className="data-val mono">
                  {(((stockConfig?.width || 100) * (stockConfig?.length || 80) * (stockConfig?.height || 30)) / 1000).toFixed(1)} cm³
                </span>
              </div>
              <div className="prop-data-row">
                <span className="data-key">Top Datum:</span>
                <span className="data-val mono">Z = 0.00 mm (G54)</span>
              </div>
            </div>

            {cadStats && onAutoFitStock && (
              <div className="prop-action-row">
                <button
                  type="button"
                  className="btn-eng-secondary"
                  onClick={onAutoFitStock}
                  title="Compute bounding dimensions from loaded CAD model"
                >
                  <Maximize2 size={12} />
                  <span>Auto-Fit Stock to CAD Model</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. PART CAD MODEL INSPECTOR */}
      {itemType === 'part' && (
        <div className="inspector-panel-inner">
          <div className="inspector-panel-header">
            <div className="panel-title-row">
              <Sparkles size={14} className="panel-title-glyph" />
              <span className="panel-title-text">CAD Model Properties</span>
            </div>
            <span className="panel-context-badge">Target Part</span>
          </div>

          <div className="inspector-panel-content">
            <div className="prop-group">
              <div className="prop-group-title">Loaded Part Model</div>
              <div className="prop-row">
                <label className="prop-label">Sample Part</label>
                <select
                  className="prop-select"
                  value={typeof userPartFile === 'string' ? userPartFile : ''}
                  onChange={(e) => setUserPartFile(e.target.value)}
                >
                  {sampleParts.map(sp => (
                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="prop-group">
              <div className="prop-group-title">Import Custom Model</div>
              <label className="eng-file-drop">
                <Upload size={14} />
                <span>Upload .STEP, .STL, or .OBJ</span>
                <input
                  type="file"
                  accept=".stl,.obj,.step,.stp"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {cadStats && (
              <div className="prop-group">
                <div className="prop-group-title">CAD Geometry Analysis</div>
                <div className="prop-data-row">
                  <span className="data-key">Bounding Box:</span>
                  <span className="data-val mono">
                    {Math.round(cadStats.width)} × {Math.round(cadStats.length)} × {Math.round(cadStats.height)} mm
                  </span>
                </div>
                <div className="prop-data-row">
                  <span className="data-key">Triangulation:</span>
                  <span className="data-val mono">{(cadStats.triangles || 0).toLocaleString()} facets</span>
                </div>
                <div className="prop-data-row">
                  <span className="data-key">Estimated Volume:</span>
                  <span className="data-val mono">{((cadStats.volume || 120000) / 1000).toFixed(1)} cm³</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. TOOL INSPECTOR */}
      {itemType === 'tool' && (
        <div className="inspector-panel-inner">
          <div className="inspector-panel-header">
            <div className="panel-title-row">
              <Wrench size={14} className="panel-title-glyph" />
              <span className="panel-title-text">Tool Specification</span>
            </div>
            <span className="panel-context-badge">T{toolConfig?.number || 1}</span>
          </div>

          <div className="inspector-panel-content">
            <div className="prop-group">
              <div className="prop-group-title">Tool Presets</div>
              <div className="tool-preset-list">
                {toolPresets.map(preset => {
                  const isSelected = toolConfig?.diameter === preset.diameter && toolConfig?.type === preset.type;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`tool-preset-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => {
                        setToolConfig(prev => ({
                          ...prev,
                          type: preset.type,
                          diameter: preset.diameter,
                          length: preset.length,
                          cuttingLength: preset.cuttingLength,
                          flutes: preset.flutes
                        }));
                      }}
                    >
                      <span className="preset-name">{preset.name}</span>
                      <span className="preset-meta mono">{preset.flutes}F · L{preset.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="prop-group">
              <div className="prop-group-title">Geometric Parameters</div>
              <div className="prop-row">
                <label className="prop-label">Diameter (D)</label>
                <div className="prop-input-wrap">
                  <input
                    type="number"
                    className="prop-input mono"
                    value={toolConfig?.diameter || 6.0}
                    onChange={(e) => setToolConfig(prev => ({ ...prev, diameter: parseFloat(e.target.value) || 1 }))}
                    step="0.5"
                    min="1"
                    max="25"
                  />
                  <span className="prop-unit">mm</span>
                </div>
              </div>
              <div className="prop-row">
                <label className="prop-label">Flute Length (Lc)</label>
                <div className="prop-input-wrap">
                  <input
                    type="number"
                    className="prop-input mono"
                    value={toolConfig?.cuttingLength || 25.0}
                    onChange={(e) => setToolConfig(prev => ({ ...prev, cuttingLength: parseFloat(e.target.value) || 10 }))}
                    step="1"
                    min="5"
                    max="60"
                  />
                  <span className="prop-unit">mm</span>
                </div>
              </div>
              <div className="prop-row">
                <label className="prop-label">Total Length (L)</label>
                <div className="prop-input-wrap">
                  <input
                    type="number"
                    className="prop-input mono"
                    value={toolConfig?.length || 50.0}
                    onChange={(e) => setToolConfig(prev => ({ ...prev, length: parseFloat(e.target.value) || 20 }))}
                    step="5"
                    min="20"
                    max="100"
                  />
                  <span className="prop-unit">mm</span>
                </div>
              </div>
              <div className="prop-row">
                <label className="prop-label">Flutes</label>
                <select
                  className="prop-select"
                  value={toolConfig?.flutes || 2}
                  onChange={(e) => setToolConfig(prev => ({ ...prev, flutes: parseInt(e.target.value) || 2 }))}
                >
                  <option value="1">1 Flute (Plastics / Acrylic)</option>
                  <option value="2">2 Flutes (Slotting / Aluminum)</option>
                  <option value="3">3 Flutes (High-Speed Aluminum)</option>
                  <option value="4">4 Flutes (Steels & Finishing)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. OPERATION PARAMETERS INSPECTOR */}
      {itemType === 'operation' && selectedOp && (
        <div className="inspector-panel-inner">
          <div className="inspector-panel-header">
            <div className="panel-title-row">
              <Layers size={14} className="panel-title-glyph" />
              <span className="panel-title-text">{selectedOp.name}</span>
            </div>
            <label className="eng-checkbox-label" title="Enable or suppress this machining pass">
              <input
                type="checkbox"
                checked={selectedOp.enabled}
                onChange={(e) => handleOpFieldChange(selectedOp.id, 'enabled', e.target.checked)}
              />
              <span>{selectedOp.enabled ? 'Active' : 'Suppressed'}</span>
            </label>
          </div>

          <div className="inspector-panel-content">
            {/* General Section */}
            <div className="prop-group">
              <div className="prop-group-title">General</div>
              <div className="prop-field-block">
                <label className="prop-label">Operation Label</label>
                <input
                  type="text"
                  className="prop-text-input"
                  value={selectedOp.name}
                  onChange={(e) => handleOpFieldChange(selectedOp.id, 'name', e.target.value)}
                />
              </div>
              <div className="prop-row">
                <label className="prop-label">Strategy Type</label>
                <span className="prop-readonly-val mono">{selectedOp.type?.toUpperCase()}</span>
              </div>
            </div>

            {/* Depths & Passes */}
            <div className="prop-group">
              <div className="prop-group-title">Depths & Stepdown</div>
              <div className="prop-row">
                <label className="prop-label">Total Cutting Depth (Z)</label>
                <div className="prop-input-wrap">
                  <input
                    type="number"
                    className="prop-input mono"
                    value={selectedOp.depth}
                    onChange={(e) => handleOpFieldChange(selectedOp.id, 'depth', parseFloat(e.target.value) || 0.5)}
                    step="0.5"
                    min="0.2"
                    max="40"
                  />
                  <span className="prop-unit">mm</span>
                </div>
              </div>
              <div className="prop-row">
                <label className="prop-label">Stepdown per Pass</label>
                <div className="prop-input-wrap">
                  <input
                    type="number"
                    className="prop-input mono"
                    value={machiningParams?.stepDown || 2.0}
                    onChange={(e) => handleParamChange('stepDown', e.target.value)}
                    step="0.5"
                    min="0.2"
                    max="10"
                  />
                  <span className="prop-unit">mm</span>
                </div>
              </div>
              <div className="prop-row">
                <label className="prop-label">Calculated Passes</label>
                <span className="prop-readonly-val mono">{numPasses} Z-levels</span>
              </div>
            </div>

            {/* Passes & Stepover */}
            <div className="prop-group">
              <div className="prop-group-title">Passes & Stepover</div>
              <div className="prop-row">
                <label className="prop-label">Radial Stepover</label>
                <div className="prop-input-wrap">
                  <input
                    type="number"
                    className="prop-input mono"
                    value={Math.round((machiningParams?.stepOverRatio || 0.6) * 100)}
                    onChange={(e) => handleParamChange('stepOverRatio', (parseFloat(e.target.value) || 50) / 100)}
                    step="5"
                    min="10"
                    max="90"
                  />
                  <span className="prop-unit">%</span>
                </div>
              </div>
              <div className="prop-row">
                <label className="prop-label">Actual Stepover</label>
                <span className="prop-readonly-val mono">{stepOverMm} mm</span>
              </div>
              <div className="prop-row">
                <label className="prop-label">Direction</label>
                <span className="prop-readonly-val">Climb (Standard)</span>
              </div>
            </div>

            {/* Feeds & Speeds */}
            <div className="prop-group">
              <div className="prop-group-title">Feeds & Speeds</div>
              <div className="prop-row">
                <label className="prop-label">Spindle Speed</label>
                <div className="prop-input-wrap">
                  <input
                    type="number"
                    className="prop-input mono"
                    value={machiningParams?.spindleRPM || 8000}
                    onChange={(e) => handleParamChange('spindleRPM', e.target.value)}
                    step="500"
                    min="1000"
                    max="15000"
                  />
                  <span className="prop-unit">RPM</span>
                </div>
              </div>
              <div className="prop-row">
                <label className="prop-label">Cutting Feedrate</label>
                <div className="prop-input-wrap">
                  <input
                    type="number"
                    className="prop-input mono"
                    value={machiningParams?.feedRate || 800}
                    onChange={(e) => handleParamChange('feedRate', e.target.value)}
                    step="50"
                    min="50"
                    max="5000"
                  />
                  <span className="prop-unit">mm/min</span>
                </div>
              </div>
              <div className="prop-row">
                <label className="prop-label">Plunge Feedrate</label>
                <div className="prop-input-wrap">
                  <input
                    type="number"
                    className="prop-input mono"
                    value={machiningParams?.plungeRate || 250}
                    onChange={(e) => handleParamChange('plungeRate', e.target.value)}
                    step="25"
                    min="25"
                    max="1000"
                  />
                  <span className="prop-unit">mm/min</span>
                </div>
              </div>
              <div className="prop-row">
                <label className="prop-label">Surface Speed (Vc)</label>
                <span className="prop-readonly-val mono">{surfaceSpeed} m/min</span>
              </div>
              <div className="prop-row">
                <label className="prop-label">Feed per Tooth (Fz)</label>
                <span className="prop-readonly-val mono">{feedPerTooth} mm/tooth</span>
              </div>
            </div>

            {/* Regenerate Action */}
            <div className="prop-action-row">
              <button
                type="button"
                className="btn-eng-primary"
                onClick={onRegenerate}
                disabled={isGenerating}
                title="Re-compute toolpath geometry for all passes"
              >
                <RefreshCw size={12} className={isGenerating ? 'spin-icon' : ''} />
                <span>{isGenerating ? 'Regenerating...' : 'Regenerate Toolpaths'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. SETUP INSPECTOR */}
      {itemType === 'setup' && (
        <div className="inspector-panel-inner">
          <div className="inspector-panel-header">
            <div className="panel-title-row">
              <Compass size={14} className="panel-title-glyph" />
              <span className="panel-title-text">Setup 1 Configuration</span>
            </div>
            <span className="panel-context-badge">WCS G54</span>
          </div>

          <div className="inspector-panel-content">
            <div className="prop-group">
              <div className="prop-group-title">Machine Specification</div>
              <div className="prop-data-row">
                <span className="data-key">Machine:</span>
                <span className="data-val">Haas VF-2SS 3-Axis VMC</span>
              </div>
              <div className="prop-data-row">
                <span className="data-key">Spindle Limit:</span>
                <span className="data-val mono">12,000 RPM</span>
              </div>
              <div className="prop-data-row">
                <span className="data-key">Travel Envelopes:</span>
                <span className="data-val mono">X: ±150 · Y: ±100 · Z: -70/+50 mm</span>
              </div>
            </div>

            <div className="prop-group">
              <div className="prop-group-title">Clearance Planes</div>
              <div className="prop-row">
                <label className="prop-label">Safe Clearance (Z)</label>
                <div className="prop-input-wrap">
                  <input
                    type="number"
                    className="prop-input mono"
                    value={machiningParams?.safeZ || 5.0}
                    onChange={(e) => handleParamChange('safeZ', e.target.value)}
                    step="1"
                    min="2"
                    max="30"
                  />
                  <span className="prop-unit">mm</span>
                </div>
              </div>
              <div className="prop-row">
                <label className="prop-label">Rapid Retract (Z)</label>
                <div className="prop-input-wrap">
                  <input
                    type="number"
                    className="prop-input mono"
                    defaultValue="20"
                    disabled
                  />
                  <span className="prop-unit">mm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

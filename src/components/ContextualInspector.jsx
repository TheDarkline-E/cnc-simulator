import React from 'react';
import { 
  Box, Wrench, Sliders, RefreshCw, Layers, 
  Sparkles, CheckCircle2, Disc, ShieldCheck, 
  Upload, HelpCircle, AlertCircle, ArrowUpRight,
  Maximize2, Eye, Compass
} from 'lucide-react';

const toolPresets = [
  { id: 'flat_6', name: 'Flat End Mill Ø6mm', type: 'flat_end_mill', diameter: 6.0, length: 50.0, cuttingLength: 25.0, flutes: 2 },
  { id: 'ball_6', name: 'Ball End Mill Ø6mm', type: 'ball_end_mill', diameter: 6.0, length: 50.0, cuttingLength: 25.0, flutes: 2 },
  { id: 'face_12', name: 'Face Mill Ø12mm', type: 'face_mill', diameter: 12.0, length: 45.0, cuttingLength: 10.0, flutes: 4 },
  { id: 'bull_8', name: 'Bull Nose Ø8mm', type: 'bull_nose', diameter: 8.0, length: 50.0, cuttingLength: 25.0, flutes: 3 },
  { id: 'rough_10', name: 'Roughing End Mill Ø10mm', type: 'flat_end_mill', diameter: 10.0, length: 60.0, cuttingLength: 30.0, flutes: 3 }
];

const materials = [
  { id: 'al6061', name: 'Aluminium 6061-T6', density: '2.70 g/cm³', hardness: '95 HB' },
  { id: 'brass360', name: 'Brass 360 Free-Cut', density: '8.50 g/cm³', hardness: '130 HB' },
  { id: 'steel1018', name: 'Mild Steel 1018', density: '7.87 g/cm³', hardness: '126 HB' },
  { id: 'stainless304', name: 'Stainless Steel 304', density: '8.00 g/cm³', hardness: '170 HB' },
  { id: 'delrin', name: 'Delrin POM-C', density: '1.41 g/cm³', hardness: '85 M' }
];

const sampleParts = [
  { id: '/samples/pocket_block.stl', name: 'Pocket Block (100×80×30mm)' },
  { id: '/samples/bracket.stl', name: 'Stepped Mounting Bracket' },
  { id: '/samples/flange_part.stl', name: 'Flange Plate (Ø90×20mm)' },
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

  // File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUserPartFile(file);
    }
  };

  return (
    <aside className="contextual-inspector" aria-label="Contextual Inspector">
      {/* Inspector Section 1: STOCK BILLET INSPECTOR */}
      {itemType === 'stock' && (
        <div className="inspector-content">
          <header className="inspector-header">
            <div className="inspector-title-lockup">
              <Box size={16} className="inspector-icon icon-stock" />
              <div>
                <h3 className="inspector-title">Raw Stock Definition</h3>
                <span className="inspector-subtitle">Billet Bounding Envelope & Work Alloy</span>
              </div>
            </div>
          </header>

          <div className="inspector-body">
            {/* Stock Alloy */}
            <div className="form-group">
              <label className="form-label">Material Alloy</label>
              <select
                className="form-select"
                value={stockConfig?.material || 'al6061'}
                onChange={(e) => handleMaterialChange(e.target.value)}
              >
                {materials.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.density})</option>
                ))}
              </select>
            </div>

            {/* Dimensions */}
            <div className="form-group">
              <label className="form-label">Dimensions (X × Y × Z)</label>
              <div className="grid-3col">
                <div className="input-with-unit">
                  <span className="unit-prefix">X</span>
                  <input
                    type="number"
                    className="form-input mono"
                    value={stockConfig?.width || 100}
                    onChange={(e) => handleStockDimensionChange('width', e.target.value)}
                    min="10"
                    max="250"
                  />
                  <span className="unit-suffix">mm</span>
                </div>
                <div className="input-with-unit">
                  <span className="unit-prefix">Y</span>
                  <input
                    type="number"
                    className="form-input mono"
                    value={stockConfig?.length || 80}
                    onChange={(e) => handleStockDimensionChange('length', e.target.value)}
                    min="10"
                    max="200"
                  />
                  <span className="unit-suffix">mm</span>
                </div>
                <div className="input-with-unit">
                  <span className="unit-prefix">Z</span>
                  <input
                    type="number"
                    className="form-input mono"
                    value={stockConfig?.height || 30}
                    onChange={(e) => handleStockDimensionChange('height', e.target.value)}
                    min="5"
                    max="100"
                  />
                  <span className="unit-suffix">mm</span>
                </div>
              </div>
            </div>

            {/* Volume Calculation */}
            <div className="calc-summary-card">
              <span className="calc-label">Total Raw Billet Volume:</span>
              <strong className="calc-value mono">
                {(((stockConfig?.width || 100) * (stockConfig?.length || 80) * (stockConfig?.height || 30)) / 1000).toFixed(1)} cm³
              </strong>
            </div>

            {/* Auto-Fit Stock Action */}
            {cadStats && onAutoFitStock && (
              <div className="action-strip">
                <button
                  type="button"
                  className="btn-inspector-action"
                  onClick={onAutoFitStock}
                  title="Automatically size raw stock around imported CAD part bounds with facing allowance"
                >
                  <Maximize2 size={13} />
                  <span>Auto-Fit Stock to CAD Part</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inspector Section 2: PART CAD MODEL INSPECTOR */}
      {itemType === 'part' && (
        <div className="inspector-content">
          <header className="inspector-header">
            <div className="inspector-title-lockup">
              <Sparkles size={16} className="inspector-icon icon-part" />
              <div>
                <h3 className="inspector-title">CAD Part Model</h3>
                <span className="inspector-subtitle">Target Machining Geometry & Analysis</span>
              </div>
            </div>
          </header>

          <div className="inspector-body">
            {/* Sample Parts Picker */}
            <div className="form-group">
              <label className="form-label">Select Standard Sample Part</label>
              <select
                className="form-select"
                value={typeof userPartFile === 'string' ? userPartFile : ''}
                onChange={(e) => setUserPartFile(e.target.value)}
              >
                {sampleParts.map(sp => (
                  <option key={sp.id} value={sp.id}>{sp.name}</option>
                ))}
              </select>
            </div>

            {/* Custom File Upload */}
            <div className="form-group">
              <label className="form-label">Or Import Custom CAD Model</label>
              <label className="file-drop-zone">
                <Upload size={18} className="upload-icon" />
                <span className="drop-title">Upload .STEP, .STL, or .OBJ</span>
                <span className="drop-subtitle">Direct client-side mesh analysis</span>
                <input
                  type="file"
                  accept=".stl,.obj,.step,.stp"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* CAD Stats */}
            {cadStats && (
              <div className="cad-stats-card">
                <h4 className="card-subtitle">Mesh Geometry Metrics</h4>
                <div className="stats-row">
                  <span>Bounding Size:</span>
                  <span className="mono">
                    {Math.round(cadStats.width)} × {Math.round(cadStats.length)} × {Math.round(cadStats.height)} mm
                  </span>
                </div>
                <div className="stats-row">
                  <span>Surface Triangles:</span>
                  <span className="mono">{(cadStats.triangles || 0).toLocaleString()} facets</span>
                </div>
                <div className="stats-row">
                  <span>Est. Part Volume:</span>
                  <span className="mono">{((cadStats.volume || 120000) / 1000).toFixed(1)} cm³</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inspector Section 3: TOOL GEOMETRY INSPECTOR */}
      {itemType === 'tool' && (
        <div className="inspector-content">
          <header className="inspector-header">
            <div className="inspector-title-lockup">
              <Wrench size={16} className="inspector-icon icon-tool" />
              <div>
                <h3 className="inspector-title">Cutting Tool Specification</h3>
                <span className="inspector-subtitle">End Mill Geometry & Flute Definition</span>
              </div>
            </div>
          </header>

          <div className="inspector-body">
            {/* Tool Presets */}
            <div className="form-group">
              <label className="form-label">Tool Preset Library</label>
              <div className="preset-pill-grid">
                {toolPresets.map(preset => {
                  const isSelected = toolConfig?.diameter === preset.diameter && toolConfig?.type === preset.type;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`preset-pill ${isSelected ? 'is-selected' : ''}`}
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
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tool Dimensions */}
            <div className="form-group">
              <label className="form-label">Tool Diameter & Gauge Length</label>
              <div className="grid-2col">
                <div className="input-with-unit">
                  <span className="unit-prefix">Ø</span>
                  <input
                    type="number"
                    className="form-input mono"
                    value={toolConfig?.diameter || 6.0}
                    onChange={(e) => setToolConfig(prev => ({ ...prev, diameter: parseFloat(e.target.value) || 1 }))}
                    step="0.5"
                    min="1"
                    max="25"
                  />
                  <span className="unit-suffix">mm</span>
                </div>
                <div className="input-with-unit">
                  <span className="unit-prefix">L</span>
                  <input
                    type="number"
                    className="form-input mono"
                    value={toolConfig?.length || 50.0}
                    onChange={(e) => setToolConfig(prev => ({ ...prev, length: parseFloat(e.target.value) || 20 }))}
                    step="5"
                    min="20"
                    max="100"
                  />
                  <span className="unit-suffix">mm</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Flute Count & Tool Number</label>
              <div className="grid-2col">
                <select
                  className="form-select"
                  value={toolConfig?.flutes || 2}
                  onChange={(e) => setToolConfig(prev => ({ ...prev, flutes: parseInt(e.target.value) || 2 }))}
                >
                  <option value="1">1 Flute (Plastics / Wood)</option>
                  <option value="2">2 Flutes (Slotting / Al)</option>
                  <option value="3">3 Flutes (High-Speed Al)</option>
                  <option value="4">4 Flutes (Steel Profile)</option>
                </select>
                <div className="input-with-unit">
                  <span className="unit-prefix">T</span>
                  <input
                    type="number"
                    className="form-input mono"
                    value={toolConfig?.number || 1}
                    onChange={(e) => setToolConfig(prev => ({ ...prev, number: parseInt(e.target.value) || 1 }))}
                    min="1"
                    max="24"
                  />
                  <span className="unit-suffix">slot</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspector Section 4: OPERATION PARAMETERS INSPECTOR */}
      {itemType === 'operation' && selectedOp && (
        <div className="inspector-content">
          <header className="inspector-header">
            <div className="inspector-title-lockup">
              <Layers size={16} className="inspector-icon icon-op" />
              <div>
                <h3 className="inspector-title">{selectedOp.name}</h3>
                <span className="inspector-subtitle">Type: {selectedOp.type?.toUpperCase()} · Pass Parameters</span>
              </div>
            </div>
            <div className="header-status-toggle">
              <label className="toggle-label" title="Enable or suppress this operation in the CAM cycle">
                <input
                  type="checkbox"
                  checked={selectedOp.enabled}
                  onChange={(e) => handleOpFieldChange(selectedOp.id, 'enabled', e.target.checked)}
                />
                <span className="toggle-text">{selectedOp.enabled ? 'Enabled' : 'Suppressed'}</span>
              </label>
            </div>
          </header>

          <div className="inspector-body">
            {/* Operation Name */}
            <div className="form-group">
              <label className="form-label">Operation Label</label>
              <input
                type="text"
                className="form-input"
                value={selectedOp.name}
                onChange={(e) => handleOpFieldChange(selectedOp.id, 'name', e.target.value)}
              />
            </div>

            {/* Depths & Passes */}
            <div className="form-group">
              <label className="form-label">Cutting Depths & Stepdown</label>
              <div className="grid-2col">
                <div className="input-with-unit">
                  <span className="unit-prefix">Total Z</span>
                  <input
                    type="number"
                    className="form-input mono"
                    value={selectedOp.depth}
                    onChange={(e) => handleOpFieldChange(selectedOp.id, 'depth', parseFloat(e.target.value) || 0.5)}
                    step="0.5"
                    min="0.2"
                    max="40"
                  />
                  <span className="unit-suffix">mm</span>
                </div>
                <div className="input-with-unit">
                  <span className="unit-prefix">Stepdown</span>
                  <input
                    type="number"
                    className="form-input mono"
                    value={machiningParams?.stepDown || 2.0}
                    onChange={(e) => handleParamChange('stepDown', e.target.value)}
                    step="0.5"
                    min="0.2"
                    max="10"
                  />
                  <span className="unit-suffix">mm</span>
                </div>
              </div>
            </div>

            {/* Stepover & Direction */}
            <div className="form-group">
              <label className="form-label">Radial Stepover (% of Tool Ø)</label>
              <div className="slider-control">
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={machiningParams?.stepOverRatio || 0.6}
                  onChange={(e) => handleParamChange('stepOverRatio', e.target.value)}
                  className="form-slider"
                />
                <span className="slider-value mono">
                  {Math.round((machiningParams?.stepOverRatio || 0.6) * 100)}% ({((toolConfig?.diameter || 6) * (machiningParams?.stepOverRatio || 0.6)).toFixed(1)} mm)
                </span>
              </div>
            </div>

            {/* Speeds & Feeds */}
            <div className="form-group">
              <label className="form-label">Feeds & Speeds</label>
              <div className="grid-2col">
                <div className="input-with-unit">
                  <span className="unit-prefix">RPM</span>
                  <input
                    type="number"
                    className="form-input mono"
                    value={machiningParams?.spindleRPM || 8000}
                    onChange={(e) => handleParamChange('spindleRPM', e.target.value)}
                    step="500"
                    min="1000"
                    max="15000"
                  />
                  <span className="unit-suffix">rpm</span>
                </div>
                <div className="input-with-unit">
                  <span className="unit-prefix">Feed</span>
                  <input
                    type="number"
                    className="form-input mono"
                    value={machiningParams?.feedRate || 800}
                    onChange={(e) => handleParamChange('feedRate', e.target.value)}
                    step="50"
                    min="50"
                    max="5000"
                  />
                  <span className="unit-suffix">mm/m</span>
                </div>
              </div>
            </div>

            {/* Regenerate Action */}
            <div className="action-strip">
              <button
                type="button"
                className="btn-inspector-action primary"
                onClick={onRegenerate}
                disabled={isGenerating}
                title="Re-compute toolpath geometry for all passes"
              >
                <RefreshCw size={13} className={isGenerating ? 'spin-icon' : ''} />
                <span>{isGenerating ? 'Computing...' : 'Regenerate Toolpaths'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspector Section 5: SETUP & MACHINE SPECIFICATION */}
      {itemType === 'setup' && (
        <div className="inspector-content">
          <header className="inspector-header">
            <div className="inspector-title-lockup">
              <Compass size={16} className="inspector-icon icon-setup" />
              <div>
                <h3 className="inspector-title">Machining Setup 1</h3>
                <span className="inspector-subtitle">Machine Kinematics & Work Coordinates</span>
              </div>
            </div>
          </header>

          <div className="inspector-body">
            <div className="info-badge-card">
              <span className="info-label">Active CNC Machine:</span>
              <strong className="info-value">Haas VF-2SS 3-Axis Precision VMC</strong>
            </div>

            <div className="form-group">
              <label className="form-label">Work Coordinate System (WCS)</label>
              <select className="form-select" defaultValue="G54">
                <option value="G54">G54 (Stock Top Center · X0 Y0 Z0)</option>
                <option value="G55">G55 (Top-Left Corner)</option>
                <option value="G56">G56 (Fixture Datum)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Safety Clearance Planes</label>
              <div className="grid-2col">
                <div className="input-with-unit">
                  <span className="unit-prefix">Safe Z</span>
                  <input
                    type="number"
                    className="form-input mono"
                    value={machiningParams?.safeZ || 5.0}
                    onChange={(e) => handleParamChange('safeZ', e.target.value)}
                    step="1"
                    min="2"
                    max="30"
                  />
                  <span className="unit-suffix">mm</span>
                </div>
                <div className="input-with-unit">
                  <span className="unit-prefix">Rapid Z</span>
                  <input
                    type="number"
                    className="form-input mono"
                    defaultValue="20"
                    disabled
                  />
                  <span className="unit-suffix">mm</span>
                </div>
              </div>
            </div>

            <div className="machine-limits-card">
              <h4 className="card-subtitle">Machine Physical Travel Limits</h4>
              <div className="stats-row"><span>X-Axis Travel:</span><span className="mono">±150.0 mm</span></div>
              <div className="stats-row"><span>Y-Axis Travel:</span><span className="mono">±100.0 mm</span></div>
              <div className="stats-row"><span>Z-Axis Travel:</span><span className="mono">-70.0 / +50.0 mm</span></div>
              <div className="stats-row"><span>Spindle Max:</span><span className="mono">12,000 RPM</span></div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

import React, { useState } from 'react';
import { 
  Cpu, Box, Wrench, Settings, Play, Plus, 
  Trash2, CheckCircle2, AlertTriangle, Layers, 
  Upload, FileCode, Sparkles, ArrowRight, ShieldCheck
} from 'lucide-react';
import { MACHINE_SPECS } from '../engine/MachineKinematics';

export default function SetupPanel({
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
  onGenerateToolpath,
  onLoadCustomGCode,
  isGenerating
}) {
  const [activeTab, setActiveTab] = useState('part'); // 'part' | 'stock' | 'tool' | 'operations' | 'gcode' | 'machine'
  const [customGCodeText, setCustomGCodeText] = useState('');

  const materials = [
    { id: 'al6061', name: 'Aluminium 6061-T6', density: '2.70 g/cm³', hardness: '95 HB', color: '#c8d0d8', chips: 'Bright silver curled chips' },
    { id: 'brass', name: 'Brass 360 Free-Cutting', density: '8.50 g/cm³', hardness: '130 HB', color: '#d4a434', chips: 'Shimmering gold flakes' },
    { id: 'steel', name: 'Mild Steel 1018', density: '7.87 g/cm³', hardness: '126 HB', color: '#525c66', chips: 'Steel grey turnings' },
    { id: 'stainless', name: 'Stainless 304', density: '8.00 g/cm³', hardness: '170 HB', color: '#9ca3af', chips: 'Blue-annealed ribbons' },
    { id: 'titanium', name: 'Titanium Ti-6Al-4V Gr5', density: '4.43 g/cm³', hardness: '330 HB', color: '#64748b', chips: 'Heat-tinted violet curls' },
    { id: 'delrin', name: 'Delrin / POM-C', density: '1.41 g/cm³', hardness: '85 M', color: '#f3f4f6', chips: 'Opaque white shavings' },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserPartFile(file);
    }
  };

  const handleGCodeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        setCustomGCodeText(text);
        if (onLoadCustomGCode) {
          onLoadCustomGCode(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const addOperation = (type) => {
    const names = {
      facing: 'Top Surfacing Pass',
      roughing: '3D Adaptive Roughing',
      pocketing: 'Center Cavity Pocket',
      contouring: 'Perimeter Profile Finish',
      finishing: '3D Surface Scallop Finish'
    };
    const depths = {
      facing: 1.0,
      roughing: 12.0,
      pocketing: 8.0,
      contouring: 14.0,
      finishing: 10.0
    };

    const newOp = {
      id: Date.now(),
      type,
      name: names[type] || 'Machining Pass',
      depth: depths[type] || 6.0,
      width: 60,
      length: 40,
      enabled: true
    };
    setOperations([...operations, newOp]);
  };

  const removeOperation = (id) => {
    setOperations(operations.filter(op => op.id !== id));
  };

  const toggleOperation = (id) => {
    setOperations(operations.map(op => op.id === id ? { ...op, enabled: !op.enabled } : op));
  };

  return (
    <div style={{
      width: '390px',
      height: '100%',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.2px' }}>
            MACHINING CONFIGURATION
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            CAD Import • Stock • Tooling • CAM Pipeline
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-primary)',
        overflowX: 'auto'
      }}>
        {[
          { id: 'part', label: 'CAD Part', icon: Box },
          { id: 'stock', label: 'Stock', icon: Layers },
          { id: 'tool', label: 'Tooling', icon: Wrench },
          { id: 'operations', label: 'CAM Ops', icon: Settings },
          { id: 'gcode', label: 'G-Code', icon: FileCode },
          { id: 'machine', label: 'Machine', icon: Cpu }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '9px 2px',
                borderRadius: 0,
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                background: isActive ? 'var(--bg-secondary)' : 'transparent',
                color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* 1. CAD PART TAB */}
        {activeTab === 'part' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Dropzone */}
            <div style={{
              border: '2px dashed var(--accent-blue)',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(37, 99, 235, 0.04)',
              transition: 'background 0.2s ease'
            }}>
              <input
                type="file"
                accept=".stl,.obj,.step,.stp"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="cad-upload"
              />
              <label htmlFor="cad-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <Upload size={24} color="var(--accent-blue)" />
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Upload CAD Design File
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  Drag & drop .STEP, .STP, .STL, or .OBJ from CAD software
                </div>
              </label>
            </div>

            {/* Active Part Feedback */}
            {userPartFile && (
              <div style={{
                padding: '10px',
                borderRadius: '6px',
                background: 'rgba(22, 163, 74, 0.08)',
                border: '1px solid rgba(22, 163, 74, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="var(--accent-green)" />
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-green)' }}>
                      {typeof userPartFile === 'string' ? userPartFile.split('/').pop() : userPartFile.name}
                    </div>
                    {cadStats && (
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {cadStats.dimensions?.width} × {cadStats.dimensions?.length} × {cadStats.dimensions?.height} mm
                      </div>
                    )}
                  </div>
                </div>
                {onAutoFitStock && (
                  <button
                    onClick={onAutoFitStock}
                    style={{ fontSize: '10px', padding: '4px 8px', background: 'var(--bg-primary)' }}
                    title="Automatically set stock billet dimensions based on CAD boundaries"
                  >
                    Auto-Fit Stock
                  </button>
                )}
              </div>
            )}

            {/* Built-in CAD Samples Library */}
            <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>CAD Sample Library</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { file: '/samples/pocket_block.stl', title: 'Pocket Block (100×80×30 mm)', desc: 'Billet with deep rectangular central pocket' },
                { file: '/samples/bracket.stl', title: 'Stepped Bracket (120×60×25 mm)', desc: 'Two-tiered mechanical mounting bracket' },
                { file: '/samples/flange_part.stl', title: 'Flange Plate (Ø90×20 mm)', desc: 'Circular bearing flange with center through-bore' },
                { file: '/samples/mold_cavity.stl', title: 'Mold Cavity Block (90×90×25 mm)', desc: '3D hemisphere injection mold cavity' }
              ].map(sample => {
                const isSelected = userPartFile === sample.file;
                return (
                  <button
                    key={sample.file}
                    onClick={() => setUserPartFile(sample.file)}
                    className={isSelected ? 'accent' : ''}
                    style={{ justifyContent: 'flex-start', padding: '10px' }}
                  >
                    <Box size={14} color={isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)'} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px' }}>{sample.title}</div>
                      <div style={{ fontSize: '10px', opacity: 0.8 }}>{sample.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        )}

        {/* 2. STOCK TAB */}
        {activeTab === 'stock' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>Raw Stock Dimensions (mm)</div>
              {onAutoFitStock && (
                <button onClick={onAutoFitStock} style={{ fontSize: '10px', padding: '3px 8px' }}>
                  Auto-Size from CAD
                </button>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Width (X)</label>
                <input
                  type="number"
                  value={stockConfig.width}
                  onChange={(e) => setStockConfig({ ...stockConfig, width: Number(e.target.value) })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Length (Y)</label>
                <input
                  type="number"
                  value={stockConfig.length}
                  onChange={(e) => setStockConfig({ ...stockConfig, length: Number(e.target.value) })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Height (Z)</label>
                <input
                  type="number"
                  value={stockConfig.height}
                  onChange={(e) => setStockConfig({ ...stockConfig, height: Number(e.target.value) })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>Workpiece Material</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {materials.map(mat => (
                <div
                  key={mat.id}
                  onClick={() => setStockConfig({ ...stockConfig, material: mat.id })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: stockConfig.material === mat.id ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-primary)',
                    border: `1px solid ${stockConfig.material === mat.id ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      background: mat.color,
                      border: '1px solid rgba(0,0,0,0.25)',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4)'
                    }} />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>{mat.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {mat.density} • {mat.hardness} • <span style={{ color: 'var(--text-secondary)' }}>{mat.chips}</span>
                      </div>
                    </div>
                  </div>
                  {stockConfig.material === mat.id && <CheckCircle2 size={16} color="var(--accent-blue)" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. TOOLING TAB */}
        {activeTab === 'tool' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>Cutter Specifications</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tool Geometry</label>
                <select 
                  style={{ width: '100%', marginTop: '4px' }} 
                  value={toolConfig.type || 'flat_end_mill'}
                  onChange={(e) => setToolConfig({ ...toolConfig, type: e.target.value })}
                >
                  <option value="flat_end_mill">Flat End Mill (Solid Carbide)</option>
                  <option value="ball_end_mill">Ball Nose End Mill (3D Contouring)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Diameter (mm)</label>
                  <input
                    type="number"
                    value={toolConfig.diameter}
                    onChange={(e) => setToolConfig({ ...toolConfig, diameter: Number(e.target.value) })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Flute Count</label>
                  <input
                    type="number"
                    value={toolConfig.flutes}
                    onChange={(e) => setToolConfig({ ...toolConfig, flutes: Number(e.target.value) })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '8px' }}>Feeds & Speeds</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Spindle RPM</label>
                <input
                  type="number"
                  value={machiningParams.spindleRPM}
                  onChange={(e) => setMachiningParams({ ...machiningParams, spindleRPM: Number(e.target.value) })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Feed Rate (mm/min)</label>
                <input
                  type="number"
                  value={machiningParams.feedRate}
                  onChange={(e) => setMachiningParams({ ...machiningParams, feedRate: Number(e.target.value) })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Step Down (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={machiningParams.stepDown}
                  onChange={(e) => setMachiningParams({ ...machiningParams, stepDown: Number(e.target.value) })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Plunge Rate (mm/min)</label>
                <input
                  type="number"
                  value={machiningParams.plungeRate}
                  onChange={(e) => setMachiningParams({ ...machiningParams, plungeRate: Number(e.target.value) })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. CAM OPERATIONS TAB */}
        {activeTab === 'operations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>Machining Sequence</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <button onClick={() => addOperation('facing')} style={{ fontSize: '10px', padding: '3px 6px' }}>+ Facing</button>
                <button onClick={() => addOperation('roughing')} style={{ fontSize: '10px', padding: '3px 6px' }}>+ Rough</button>
                <button onClick={() => addOperation('pocketing')} style={{ fontSize: '10px', padding: '3px 6px' }}>+ Pocket</button>
                <button onClick={() => addOperation('contouring')} style={{ fontSize: '10px', padding: '3px 6px' }}>+ Profile</button>
                <button onClick={() => addOperation('finishing')} style={{ fontSize: '10px', padding: '3px 6px' }}>+ 3D Finish</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {operations.map((op, idx) => (
                <div
                  key={op.id}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    opacity: op.enabled ? 1 : 0.5
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={op.enabled}
                        onChange={() => toggleOperation(op.id)}
                      />
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{idx + 1}. {op.name}</span>
                    </div>
                    <button onClick={() => removeOperation(op.id)} style={{ padding: '4px', border: 'none', background: 'transparent', color: 'var(--accent-red)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>Depth: -{op.depth} mm</span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>Type: {op.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. G-CODE DIRECT IMPORT TAB */}
        {activeTab === 'gcode' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>Direct G-Code Import / Manual Program</div>
            
            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '8px',
              padding: '14px',
              textAlign: 'center',
              background: 'var(--bg-primary)'
            }}>
              <input
                type="file"
                accept=".nc,.gcode,.tap,.ngc,.txt"
                onChange={handleGCodeUpload}
                style={{ display: 'none' }}
                id="gcode-file-upload"
              />
              <label htmlFor="gcode-file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <FileCode size={22} color="var(--accent-blue)" />
                <div style={{ fontSize: '12px', fontWeight: 600 }}>Load .NC / .GCode File</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>From Fusion 360, Mastercam, SolidWorks, FreeCAD</div>
              </label>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Or Paste / Edit G-Code Directly:
              </label>
              <textarea
                rows={7}
                value={customGCodeText}
                onChange={(e) => setCustomGCodeText(e.target.value)}
                placeholder="G21 ; Metric&#10;G90 ; Absolute&#10;G0 Z20.0&#10;M3 S8000&#10;G0 X-30.0 Y-30.0&#10;G1 Z-5.0 F250&#10;G1 X30.0 Y-30.0 F800&#10;G2 X30.0 Y30.0 R30.0&#10;G1 X-30.0 Y30.0&#10;G0 Z20.0&#10;M5&#10;M30"
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  lineHeight: '16px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px',
                  color: 'var(--text-primary)',
                  resize: 'vertical'
                }}
              />
              {customGCodeText && onLoadCustomGCode && (
                <button
                  onClick={() => onLoadCustomGCode(customGCodeText)}
                  className="primary"
                  style={{ width: '100%', marginTop: '6px', fontSize: '12px', padding: '8px' }}
                >
                  <FileCode size={13} /> Load & Parse G-Code into Digital Twin
                </button>
              )}
            </div>
          </div>
        )}

        {/* 6. MACHINE SPECS TAB */}
        {activeTab === 'machine' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                User CAD Machine Digital Twin
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Source CAD:</strong> main.STEP (40 solids verified)</div>
                <div><strong>Kinematic Architecture:</strong> Moving Table (Y) & Moving Gantry (X/Z)</div>
                <div><strong>Assembly Footprint:</strong> 872 × 958 × 763 mm</div>
                <div><strong>Spindle:</strong> Collet Chuck with Carbide End Mill</div>
              </div>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 600 }}>Axis Working Envelope</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div style={{ padding: '8px', background: 'var(--bg-primary)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '10px', color: '#f85149', fontWeight: 700 }}>X GANTRY</div>
                <div style={{ fontSize: '13px', fontWeight: 600, margin: '2px 0' }}>300 mm</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>-150 to +150</div>
              </div>
              <div style={{ padding: '8px', background: 'var(--bg-primary)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '10px', color: '#3fb950', fontWeight: 700 }}>Y TABLE</div>
                <div style={{ fontSize: '13px', fontWeight: 600, margin: '2px 0' }}>200 mm</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>-100 to +100</div>
              </div>
              <div style={{ padding: '8px', background: 'var(--bg-primary)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '10px', color: '#58a6ff', fontWeight: 700 }}>Z SPINDLE</div>
                <div style={{ fontSize: '13px', fontWeight: 600, margin: '2px 0' }}>120 mm</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>-70 to +50</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer / Generate Button */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={onGenerateToolpath}
          disabled={isGenerating || !operations.some(o => o.enabled)}
          className="primary"
          style={{ width: '100%', padding: '11px', fontSize: '13px', fontWeight: 700 }}
        >
          <Play size={15} />
          {isGenerating ? 'Generating CAM Program...' : 'Generate Machining Toolpath'}
        </button>
      </div>
    </div>
  );
}

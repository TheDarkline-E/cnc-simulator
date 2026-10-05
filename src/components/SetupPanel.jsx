import React, { useState } from 'react';
import { 
  Box, Wrench, Settings, Play, Plus, 
  Trash2, CheckCircle2, Layers, 
  Upload, Sliders, Cpu, ShieldCheck,
  Disc, ChevronRight
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
  isGenerating
}) {
  const [activeTab, setActiveTab] = useState('part'); // 'part' | 'stock' | 'tool' | 'operations' | 'params' | 'machine'

  const materials = [
    { id: 'al6061', name: 'Aluminium 6061-T6', density: '2.70 g/cm³', hardness: '95 HB', color: '#c8d0d8', chips: 'Bright silver curled chips' },
    { id: 'brass', name: 'Brass 360 Free-Cutting', density: '8.50 g/cm³', hardness: '130 HB', color: '#d4a434', chips: 'Shimmering gold flakes' },
    { id: 'steel', name: 'Mild Steel 1018', density: '7.87 g/cm³', hardness: '126 HB', color: '#525c66', chips: 'Steel grey turnings' },
    { id: 'stainless', name: 'Stainless 304', density: '8.00 g/cm³', hardness: '170 HB', color: '#9ca3af', chips: 'Blue-annealed ribbons' },
    { id: 'titanium', name: 'Titanium Ti-6Al-4V', density: '4.43 g/cm³', hardness: '330 HB', color: '#64748b', chips: 'Heat-tinted violet curls' },
    { id: 'delrin', name: 'Delrin / POM-C', density: '1.41 g/cm³', hardness: '85 M', color: '#f3f4f6', chips: 'Opaque white shavings' },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserPartFile(file);
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
    <aside style={{
      width: '380px',
      height: '100%',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
            Machining Setup
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Part Model • Stock Spec • Tooling • Passes
          </p>
        </div>
      </div>

      {/* Pinterest Pill Navigation Switcher */}
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '8px 12px',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        overflowX: 'auto'
      }}>
        {[
          { id: 'part', label: 'CAD Part', icon: Box },
          { id: 'stock', label: 'Stock Billet', icon: Layers },
          { id: 'tool', label: 'Tooling', icon: Wrench },
          { id: 'operations', label: 'Passes', icon: Settings },
          { id: 'params', label: 'Feeds/Speeds', icon: Sliders },
          { id: 'machine', label: 'Machine', icon: Cpu }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flexShrink: 0,
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                background: isActive ? 'var(--bg-secondary)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '11px',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                gap: '5px'
              }}
            >
              <Icon size={13} />
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
            
            {/* Clean Dropzone */}
            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--bg-primary)',
              transition: 'all 0.2s ease'
            }}>
              <input
                type="file"
                accept=".stl,.obj,.step,.stp"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="cad-upload"
              />
              <label htmlFor="cad-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <Upload size={18} color="var(--accent-primary)" />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Import CAD Model
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Drop .STEP, .STP, .STL, or .OBJ from your CAD software
                </div>
              </label>
            </div>

            {/* Active Part Feedback */}
            {userPartFile && (
              <div style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle2 size={16} color="#15803d" />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {typeof userPartFile === 'string' ? userPartFile.split('/').pop() : userPartFile.name}
                    </div>
                    {cadStats && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {cadStats.dimensions?.width} × {cadStats.dimensions?.length} × {cadStats.dimensions?.height} mm
                      </div>
                    )}
                  </div>
                </div>
                {onAutoFitStock && (
                  <button
                    onClick={onAutoFitStock}
                    style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--radius-pill)' }}
                  >
                    Auto-Fit Billet
                  </button>
                )}
              </div>
            )}

            {/* Sample Parts Collection (Pinterest Card Grid) */}
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '4px' }}>
              Sample CAD Parts
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { file: '/samples/pocket_block.stl', title: 'Pocket Block', dims: '100×80×30 mm', desc: 'Central cavity pocketing demo' },
                { file: '/samples/bracket.stl', title: 'Stepped Bracket', dims: '120×60×25 mm', desc: 'Two-tier mechanical bracket' },
                { file: '/samples/flange_part.stl', title: 'Flange Plate', dims: 'Ø90×20 mm', desc: 'Bearing flange with center bore' },
                { file: '/samples/mold_cavity.stl', title: 'Mold Cavity', dims: '90×90×25 mm', desc: '3D curved injection mold cavity' }
              ].map(sample => {
                const isSelected = userPartFile === sample.file;
                return (
                  <div
                    key={sample.file}
                    onClick={() => setUserPartFile(sample.file)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {sample.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {sample.dims} • {sample.desc}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 size={16} color="var(--accent-primary)" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. STOCK BILLET SPEC TAB */}
        {activeTab === 'stock' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Billet Raw Stock Dimensions
              </span>
              {onAutoFitStock && (
                <button
                  onClick={onAutoFitStock}
                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--radius-pill)' }}
                >
                  Match to CAD
                </button>
              )}
            </div>

            {/* Dimension Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Width (X Axis)</span>
                  <span style={{ fontWeight: 700 }}>{stockConfig.width} mm</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={stockConfig.width}
                  onChange={(e) => setStockConfig({ ...stockConfig, width: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Length (Y Axis)</span>
                  <span style={{ fontWeight: 700 }}>{stockConfig.length} mm</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="160"
                  value={stockConfig.length}
                  onChange={(e) => setStockConfig({ ...stockConfig, length: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Thickness (Z Axis)</span>
                  <span style={{ fontWeight: 700 }}>{stockConfig.height} mm</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={stockConfig.height}
                  onChange={(e) => setStockConfig({ ...stockConfig, height: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>
            </div>

            {/* Material Alloy Selection Cards */}
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '8px' }}>
              Workpiece Alloy & Material
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {materials.map(mat => {
                const isSelected = stockConfig.material === mat.id;
                return (
                  <div
                    key={mat.id}
                    onClick={() => setStockConfig({ ...stockConfig, material: mat.id })}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: mat.color,
                      border: '1px solid var(--border-color)',
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {mat.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {mat.density} • Hardness: {mat.hardness}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 size={16} color="var(--accent-primary)" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. TOOLING SPEC TAB */}
        {activeTab === 'tool' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Cutter Geometry & Collet Tooling
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Tool Profile
                </label>
                <select
                  value={toolConfig.type}
                  onChange={(e) => setToolConfig({ ...toolConfig, type: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="flat_end_mill">Flat End Mill (Carbide)</option>
                  <option value="ball_nose">Ball Nose (3D Profiling)</option>
                  <option value="bull_nose">Bull Nose / Corner Radius</option>
                  <option value="chamfer_mill">Chamfer Mill 90°</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Cutter Diameter (Ø)</span>
                  <span style={{ fontWeight: 700 }}>{toolConfig.diameter} mm</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="16"
                  step="1"
                  value={toolConfig.diameter}
                  onChange={(e) => setToolConfig({ ...toolConfig, diameter: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Flute Cutting Length</span>
                  <span style={{ fontWeight: 700 }}>{toolConfig.cuttingLength} mm</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={toolConfig.cuttingLength}
                  onChange={(e) => setToolConfig({ ...toolConfig, cuttingLength: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Flute Count</span>
                  <span style={{ fontWeight: 700 }}>{toolConfig.flutes} Flutes</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4].map(n => (
                    <button
                      key={n}
                      onClick={() => setToolConfig({ ...toolConfig, flutes: n })}
                      style={{
                        flex: 1,
                        borderRadius: 'var(--radius-pill)',
                        background: toolConfig.flutes === n ? 'var(--accent-primary)' : 'var(--bg-primary)',
                        color: toolConfig.flutes === n ? '#ffffff' : 'var(--text-primary)'
                      }}
                    >
                      {n} Flute
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. MACHINING PASSES TAB */}
        {activeTab === 'operations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Manufacturing Sequence
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => addOperation('roughing')}
                  style={{ padding: '4px 8px', fontSize: '11px', borderRadius: 'var(--radius-pill)' }}
                >
                  <Plus size={12} /> Add Pass
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {operations.map((op, idx) => (
                <div
                  key={op.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: op.enabled ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    opacity: op.enabled ? 1 : 0.6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={op.enabled}
                        onChange={() => toggleOperation(op.id)}
                        style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{idx + 1}. {op.name}</span>
                    </div>
                    <button
                      onClick={() => removeOperation(op.id)}
                      style={{ padding: '4px', border: 'none', background: 'transparent', color: 'var(--accent-red)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Target Depth: -{op.depth} mm</span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>Strategy: {op.type}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onGenerateToolpath}
              className="primary"
              disabled={isGenerating}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-pill)', marginTop: '8px' }}
            >
              {isGenerating ? 'Compiling Toolpaths...' : 'Update Toolpath Passes'}
            </button>
          </div>
        )}

        {/* 5. FEEDS & SPEEDS PARAMETERS TAB */}
        {activeTab === 'params' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Machining Speeds & Cutting Feeds
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Spindle RPM</span>
                  <span style={{ fontWeight: 700 }}>{machiningParams.spindleRPM.toLocaleString()} RPM</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="12000"
                  step="500"
                  value={machiningParams.spindleRPM}
                  onChange={(e) => setMachiningParams({ ...machiningParams, spindleRPM: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Cutting Feed Rate</span>
                  <span style={{ fontWeight: 700 }}>{machiningParams.feedRate} mm/min</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="50"
                  value={machiningParams.feedRate}
                  onChange={(e) => setMachiningParams({ ...machiningParams, feedRate: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Step-Down per Pass</span>
                  <span style={{ fontWeight: 700 }}>{machiningParams.stepDown} mm</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.5"
                  value={machiningParams.stepDown}
                  onChange={(e) => setMachiningParams({ ...machiningParams, stepDown: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Step-Over Ratio</span>
                  <span style={{ fontWeight: 700 }}>{(machiningParams.stepOverRatio * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.9"
                  step="0.05"
                  value={machiningParams.stepOverRatio}
                  onChange={(e) => setMachiningParams({ ...machiningParams, stepOverRatio: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. MACHINE SPECS TAB */}
        {activeTab === 'machine' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                3-Axis Digital Twin Specification
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>CAD Source</span>
                  <span style={{ fontWeight: 600 }}>main.STEP (40 solids)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>X-Axis Travel</span>
                  <span style={{ fontWeight: 600 }}>{MACHINE_SPECS.travelX} mm (Spindle Carriage)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Y-Axis Travel</span>
                  <span style={{ fontWeight: 600 }}>{MACHINE_SPECS.travelY} mm (Moving Work Table)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Z-Axis Travel</span>
                  <span style={{ fontWeight: 600 }}>{MACHINE_SPECS.travelZ} mm (Vertical Gantry)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Max Spindle Speed</span>
                  <span style={{ fontWeight: 600 }}>{MACHINE_SPECS.maxRPM.toLocaleString()} RPM</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Max Rapid Velocity</span>
                  <span style={{ fontWeight: 600 }}>{MACHINE_SPECS.maxRapidFeed} mm/min</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}

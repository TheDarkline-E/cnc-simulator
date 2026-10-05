import React from 'react';
import { X, Sliders, Box, Wrench, Check, RotateCcw } from 'lucide-react';

export default function MachineSetupModal({
  isOpen,
  onClose,
  stockConfig,
  setStockConfig,
  toolConfig,
  setToolConfig,
  machiningParams,
  setMachiningParams,
  onRegenerate
}) {
  if (!isOpen) return null;

  const materials = [
    { id: 'al6061', name: 'Aluminium 6061-T6', density: '2.70 g/cm³', hardness: '95 HB' },
    { id: 'brass360', name: 'Brass 360 Free-Cut', density: '8.50 g/cm³', hardness: '130 HB' },
    { id: 'steel1018', name: 'Mild Steel 1018', density: '7.87 g/cm³', hardness: '126 HB' }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-app)',
        borderRadius: '28px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: 'var(--shadow-app)',
        border: '1px solid var(--border-light)',
        padding: '28px',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '22px'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              CNC Machine & Tooling Setup
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Configure spindle kinematics, cutting parameters, and workpiece billet.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--bg-pill)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Spindle & Feed Rate */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '16px',
            borderRadius: '18px',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={14} color="var(--accent-purple)" />
              Spindle & Feed Kinematics
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-sub)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Spindle Speed ({machiningParams.spindleRPM} RPM)
                </label>
                <input
                  type="range"
                  min="2000"
                  max="16000"
                  step="500"
                  value={machiningParams.spindleRPM}
                  onChange={(e) => setMachiningParams(prev => ({ ...prev, spindleRPM: parseInt(e.target.value) }))}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-sub)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Feed Rate ({machiningParams.feedRate} mm/min)
                </label>
                <input
                  type="range"
                  min="200"
                  max="2400"
                  step="50"
                  value={machiningParams.feedRate}
                  onChange={(e) => setMachiningParams(prev => ({ ...prev, feedRate: parseInt(e.target.value) }))}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                />
              </div>
            </div>
          </div>

          {/* Cutting Tool Config */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '16px',
            borderRadius: '18px',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wrench size={14} color="var(--accent-purple)" />
              End Mill Geometry
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-sub)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Tool Diameter: {toolConfig.diameter} mm
                </label>
                <input
                  type="range"
                  min="2.0"
                  max="12.0"
                  step="1.0"
                  value={toolConfig.diameter}
                  onChange={(e) => setToolConfig(prev => ({ ...prev, diameter: parseFloat(e.target.value) }))}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-sub)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Flutes Count: {toolConfig.flutes} Flutes
                </label>
                <select
                  value={toolConfig.flutes}
                  onChange={(e) => setToolConfig(prev => ({ ...prev, flutes: parseInt(e.target.value) }))}
                  style={{ width: '100%', borderRadius: 'var(--radius-pill)', padding: '6px 12px' }}
                >
                  <option value={1}>1 Flute (Plastics / Acrylic)</option>
                  <option value={2}>2 Flutes (Aluminium & Non-Ferrous)</option>
                  <option value={3}>3 Flutes (High-Speed Finishing)</option>
                  <option value={4}>4 Flutes (Steels & Hard Alloys)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Workpiece Billet Material */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '16px',
            borderRadius: '18px',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Box size={14} color="var(--accent-purple)" />
              Billet Alloy & Dimensions
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {materials.map(m => {
                const isSelected = stockConfig.material === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setStockConfig(prev => ({ ...prev, material: m.id }))}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--accent-purple)' : 'var(--bg-app)',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: isSelected ? 'none' : '1px solid var(--border-light)',
                      boxShadow: isSelected ? '0 4px 12px rgba(124, 92, 252, 0.25)' : 'none'
                    }}
                  >
                    {m.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Width (X mm)</label>
                <input
                  type="number"
                  value={stockConfig.width}
                  onChange={(e) => setStockConfig(prev => ({ ...prev, width: parseFloat(e.target.value) || 100 }))}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Length (Y mm)</label>
                <input
                  type="number"
                  value={stockConfig.length}
                  onChange={(e) => setStockConfig(prev => ({ ...prev, length: parseFloat(e.target.value) || 80 }))}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Height (Z mm)</label>
                <input
                  type="number"
                  value={stockConfig.height}
                  onChange={(e) => setStockConfig(prev => ({ ...prev, height: parseFloat(e.target.value) || 30 }))}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
          <button
            onClick={onClose}
            className="btn-secondary-pill"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (onRegenerate) onRegenerate();
              onClose();
            }}
            className="btn-purple-pill"
          >
            Apply & Recalculate
          </button>
        </div>
      </div>
    </div>
  );
}

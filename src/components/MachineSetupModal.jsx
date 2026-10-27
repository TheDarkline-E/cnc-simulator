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
    { id: 'steel1018', name: 'Mild Steel 1018', density: '7.87 g/cm³', hardness: '126 HB' },
    { id: 'stainless304', name: 'Stainless 304', density: '8.00 g/cm³', hardness: '170 HB' },
    { id: 'ti6al4v', name: 'Titanium Ti-6Al-4V', density: '4.43 g/cm³', hardness: '330 HB' },
    { id: 'delrin', name: 'Delrin POM-C', density: '1.41 g/cm³', hardness: '85 M' }
  ];

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="modal-panel setup-modal-panel" style={{
        background: 'var(--bg-app)',
        borderRadius: 'var(--radius-card)',
        width: '100%',
        maxWidth: '560px',
        boxShadow: 'var(--shadow-app)',
        border: '1px solid var(--border-light)',
        padding: '24px 28px',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border-light)'
        }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.2px' }}>
              CNC Machine Kinematics & Tooling Setup
            </h2>
            <p style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Configure spindle kinematics, cutting parameters, and raw billet alloy.
            </p>
          </div>

          <button
            onClick={onClose}
            className="circle-btn-dark"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Spindle & Feed Rate */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '16px',
            borderRadius: '18px',
            border: '1px solid var(--border-card)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={14} color="var(--accent-purple)" />
              Spindle & Feed Kinematics
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-sub)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Spindle Speed ({machiningParams.spindleRPM} RPM)
                </label>
                <input
                  type="range"
                  min="2000"
                  max="12000"
                  step="500"
                  value={machiningParams.spindleRPM}
                  onChange={(e) => setMachiningParams({ ...machiningParams, spindleRPM: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-sub)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Cutting Feed ({machiningParams.feedRate} mm/min)
                </label>
                <input
                  type="range"
                  min="200"
                  max="3000"
                  step="50"
                  value={machiningParams.feedRate}
                  onChange={(e) => setMachiningParams({ ...machiningParams, feedRate: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-sub)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Axial Step Down (ap: {machiningParams.stepDown} mm)
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.5"
                  value={machiningParams.stepDown}
                  onChange={(e) => setMachiningParams({ ...machiningParams, stepDown: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-sub)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Radial Step Over ({Math.round(machiningParams.stepOverRatio * 100)}% ae)
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="0.9"
                  step="0.05"
                  value={machiningParams.stepOverRatio}
                  onChange={(e) => setMachiningParams({ ...machiningParams, stepOverRatio: Number(e.target.value) })}
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
            border: '1px solid var(--border-card)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={14} color="var(--accent-purple)" />
              Spindle Cutter Geometry (T01)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-sub)', display: 'block', marginBottom: '4px' }}>
                  Diameter (Ø)
                </label>
                <select
                  value={toolConfig.diameter}
                  onChange={(e) => setToolConfig({ ...toolConfig, diameter: Number(e.target.value) })}
                  style={{ width: '100%' }}
                >
                  <option value={3.0}>Ø3.0 mm Micro</option>
                  <option value={6.0}>Ø6.0 mm Standard</option>
                  <option value={8.0}>Ø8.0 mm Medium</option>
                  <option value={10.0}>Ø10.0 mm Heavy</option>
                  <option value={12.0}>Ø12.0 mm Roughing</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-sub)', display: 'block', marginBottom: '4px' }}>
                  Cutter Type
                </label>
                <select
                  value={toolConfig.type}
                  onChange={(e) => setToolConfig({ ...toolConfig, type: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="flat_end_mill">Flat End Mill</option>
                  <option value="ball_nose">Ball Nose Mill</option>
                  <option value="bull_nose">Bull Nose / Corner Rad</option>
                  <option value="face_mill">Face Mill</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-sub)', display: 'block', marginBottom: '4px' }}>
                  Flute Count
                </label>
                <select
                  value={toolConfig.flutes}
                  onChange={(e) => setToolConfig({ ...toolConfig, flutes: Number(e.target.value) })}
                  style={{ width: '100%' }}
                >
                  <option value={2}>2-Flute (Aluminium)</option>
                  <option value={3}>3-Flute (High Speed)</option>
                  <option value={4}>4-Flute (Steel/Cast)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Workpiece Billet Material */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '16px',
            borderRadius: '18px',
            border: '1px solid var(--border-card)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={14} color="var(--accent-purple)" />
              Workpiece Material Alloy
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {materials.map(m => {
                const isSelected = stockConfig.material === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setStockConfig({ ...stockConfig, material: m.id })}
                    style={{
                      background: isSelected ? 'var(--accent-purple)' : 'var(--bg-app)',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      border: isSelected ? '1px solid var(--accent-purple)' : '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '2px',
                      textAlign: 'left',
                      boxShadow: isSelected ? '0 4px 12px var(--accent-purple-glow)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>
                      {m.name.split(' ')[0]}
                    </span>
                    <span style={{ fontSize: '9px', opacity: isSelected ? 0.9 : 0.6, fontFamily: 'var(--font-mono)' }}>
                      {m.hardness}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '10px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-light)'
        }}>
          <button
            className="btn-secondary-pill"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="btn-purple-pill"
            onClick={() => {
              if (onRegenerate) onRegenerate();
              onClose();
            }}
          >
            <Check size={14} /> Apply & Regenerate Toolpath
          </button>
        </div>
      </div>
    </div>
  );
}

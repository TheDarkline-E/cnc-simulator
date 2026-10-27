import React, { useState } from 'react';
import { 
  Box, ShieldAlert, Cpu, Sliders, CheckCircle2, RotateCcw, 
  Layers, ArrowUpRight, Wrench, Activity 
} from 'lucide-react';

export default function MachineTwinScreen({
  kinematics,
  viewportApiRef,
  onNavigate
}) {
  const [exploded, setExploded] = useState(0);
  const [doorMode, setDoorMode] = useState('glass');

  const handleToggleDoor = () => {
    if (viewportApiRef?.current?.cycleEnclosureMode) {
      viewportApiRef.current.cycleEnclosureMode();
    }
    setDoorMode(prev => prev === 'glass' ? 'solid' : prev === 'solid' ? 'hide' : 'glass');
  };

  const handleExplodeChange = (e) => {
    const val = parseFloat(e.target.value);
    setExploded(val);
    if (kinematics) kinematics.setExplodedFactor(val);
  };

  return (
    <div className="screen-scroll-container">
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <p className="two-tier-eyebrow">DIGITAL TWIN ARCHITECTURE</p>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
          Haas VF-2SS Machine Subsystems
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '640px', margin: '0 auto' }}>
          Full 3-axis moving gantry / stationary bed CAD model. Inspect assemblies, toggle protective enclosure glass, and examine precision motion drives.
        </p>
      </div>

      <div className="screen-cards-grid">
        {/* Card 1: Machine Frame & CAD Assembly */}
        <div className="two-tier-card">
          <div className="two-tier-top" style={{ height: '240px' }}>
            <div style={{
              width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '16px'
            }}>
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(138, 143, 255, 0.15), rgba(91, 97, 255, 0.25))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 12px 30px rgba(91, 97, 255, 0.2)'
              }}>
                <Box size={54} color="var(--icon-blue-dark)" />
              </div>
              <div style={{
                position: 'absolute', bottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)',
                padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34C759' }} />
                39 Solid CAD Solids Verified
              </div>
            </div>
          </div>
          <div className="two-tier-body">
            <p className="two-tier-eyebrow">ASSEMBLY SPECIFICATION</p>
            <h2 className="two-tier-title">Chassis & Gantry Structure</h2>
            <p className="two-tier-desc">
              Cast iron base frame with structural vibration dampening. Rigid moving X-gantry and vertical column guiding Z-spindle head.
            </p>
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>CAD Exploded View:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{Math.round(exploded * 100)}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={exploded}
                onChange={handleExplodeChange}
                style={{ width: '100%', accentColor: 'var(--icon-blue-dark)' }}
              />
              <button 
                className="gradient-pill-btn" 
                onClick={() => onNavigate && onNavigate('machining')}
                style={{ width: '100%', marginTop: '6px' }}
              >
                <span>View in 3D Studio</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Spindle Motor & Inline Drive */}
        <div className="two-tier-card">
          <div className="two-tier-top" style={{ height: '240px' }}>
            <div style={{
              width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', position: 'relative'
            }}>
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(52, 199, 89, 0.15), rgba(16, 185, 129, 0.25))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 12px 30px rgba(16, 185, 129, 0.2)'
              }}>
                <Cpu size={54} color="#10b981" />
              </div>
              <div style={{
                position: 'absolute', bottom: '16px', background: 'rgba(255, 255, 255, 0.9)',
                padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, color: '#10b981'
              }}>
                12,000 RPM Max Speed
              </div>
            </div>
          </div>
          <div className="two-tier-body">
            <p className="two-tier-eyebrow">DRIVE SUBSYSTEM</p>
            <h2 className="two-tier-title">Direct Inline Spindle</h2>
            <p className="two-tier-desc">
              CAT40 mechanical taper with automated drawbar. 22.4 kW vector drive motor delivering smooth continuous torque up to 12,000 RPM.
            </p>
            <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px', textAlign: 'left' }}>
              <div style={{ background: 'var(--top-section-bg)', padding: '8px 10px', borderRadius: '12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-accent)', display: 'block' }}>Taper</span>
                <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>CAT40 Toolholder</strong>
              </div>
              <div style={{ background: 'var(--top-section-bg)', padding: '8px 10px', borderRadius: '12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-accent)', display: 'block' }}>Coolant</span>
                <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>M08 Flood System</strong>
              </div>
            </div>
            <button 
              className="gradient-pill-btn"
              onClick={() => onNavigate && onNavigate('tooling')}
              style={{ width: '100%' }}
            >
              <span>Inspect Tooling Tapers</span>
              <Wrench size={14} />
            </button>
          </div>
        </div>

        {/* Card 3: Moving Work Table & Guideways */}
        <div className="two-tier-card">
          <div className="two-tier-top" style={{ height: '240px' }}>
            <div style={{
              width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', position: 'relative'
            }}>
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255, 149, 0, 0.15), rgba(245, 158, 11, 0.25))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 12px 30px rgba(245, 158, 11, 0.2)'
              }}>
                <Layers size={54} color="#f59e0b" />
              </div>
              <div style={{
                position: 'absolute', bottom: '16px', background: 'rgba(255, 255, 255, 0.9)',
                padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, color: '#f59e0b'
              }}>
                300 × 200 mm Work Table
              </div>
            </div>
          </div>
          <div className="two-tier-body">
            <p className="two-tier-eyebrow">MOTION PLATFORM</p>
            <h2 className="two-tier-title">Precision T-Slot Bed</h2>
            <p className="two-tier-desc">
              Ground cast iron machining table with T-slots for modular vises and fixturing. Guided along pre-loaded linear guide rails.
            </p>
            <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px', textAlign: 'left' }}>
              <div style={{ background: 'var(--top-section-bg)', padding: '8px 10px', borderRadius: '12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-accent)', display: 'block' }}>X Travel</span>
                <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>300 mm Span</strong>
              </div>
              <div style={{ background: 'var(--top-section-bg)', padding: '8px 10px', borderRadius: '12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-accent)', display: 'block' }}>Y Travel</span>
                <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>200 mm Span</strong>
              </div>
            </div>
            <button 
              className="gradient-pill-btn"
              onClick={() => onNavigate && onNavigate('kinematics')}
              style={{ width: '100%' }}
            >
              <span>Explore Motion Limits</span>
              <Activity size={14} />
            </button>
          </div>
        </div>

        {/* Card 4: Enclosure & Safety Door */}
        <div className="two-tier-card">
          <div className="two-tier-top" style={{ height: '240px' }}>
            <div style={{
              width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', position: 'relative'
            }}>
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.25))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 12px 30px rgba(220, 38, 38, 0.2)'
              }}>
                <ShieldAlert size={54} color="#ef4444" />
              </div>
              <div style={{
                position: 'absolute', bottom: '16px', background: 'rgba(255, 255, 255, 0.9)',
                padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, color: '#ef4444'
              }}>
                Door: {doorMode.toUpperCase()}
              </div>
            </div>
          </div>
          <div className="two-tier-body">
            <p className="two-tier-eyebrow">SAFETY ENCLOSURE</p>
            <h2 className="two-tier-title">Chip & Coolant Cabinet</h2>
            <p className="two-tier-desc">
              Full machine sheet metal enclosure with poly-carbonate safety glass. Protects operators from high-speed flying chips and coolant spray.
            </p>
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                className="gradient-pill-btn"
                onClick={handleToggleDoor}
                style={{ width: '100%' }}
              >
                <span>Cycle Cabinet (Glass / Solid / Hide)</span>
              </button>
              <button 
                onClick={() => { if (kinematics) kinematics.home(); }}
                style={{
                  padding: '9px 16px', borderRadius: '9999px', border: '1px solid rgba(0,0,0,0.08)',
                  background: 'var(--card-bg)', color: 'var(--text-secondary)', fontSize: '11px',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Home All Machine Axes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

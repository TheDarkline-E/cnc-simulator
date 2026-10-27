import React, { useState } from 'react';
import { 
  Compass, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, 
  AlertCircle, ShieldCheck, Activity, Target, Zap 
} from 'lucide-react';

export default function KinematicsScreen({
  dro = { x: 0, y: 0, z: 25 },
  kinematics,
  onNavigate
}) {
  const [jogStep, setJogStep] = useState(1.0); // 0.1, 1.0, 10.0 mm

  const handleJog = (axis, dir) => {
    if (!kinematics) return;
    const delta = jogStep * dir;
    let newX = dro.x;
    let newY = dro.y;
    let newZ = dro.z;

    if (axis === 'X') newX += delta;
    if (axis === 'Y') newY += delta;
    if (axis === 'Z') newZ += delta;

    kinematics.moveTo(newX, newY, newZ);
  };

  const handleHome = () => {
    if (kinematics) kinematics.home();
  };

  const handleZero = () => {
    if (kinematics) kinematics.setWorkOrigin(dro.x, dro.y, dro.z);
  };

  const handleGoZero = () => {
    if (kinematics) kinematics.moveTo(0, 0, 0);
  };

  return (
    <div className="screen-scroll-container">
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <p className="two-tier-eyebrow">AXIS MOTION & ENVELOPE</p>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
          3-Axis Machine Kinematics
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '640px', margin: '0 auto' }}>
          Direct manual jog control, digital readout monitoring, and physical limit enforcement across all three linear motion axes.
        </p>

        {/* Global Jog Step Selector Pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'var(--card-bg)', padding: '4px 10px', borderRadius: '9999px',
          border: '1px solid rgba(0,0,0,0.06)', marginTop: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-accent)', marginRight: '4px' }}>JOG INCREMENT:</span>
          {[0.1, 1.0, 10.0].map(step => (
            <button
              key={step}
              onClick={() => setJogStep(step)}
              style={{
                padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
                background: jogStep === step ? 'var(--icon-blue-dark)' : 'transparent',
                color: jogStep === step ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              {step.toFixed(1)} mm
            </button>
          ))}
        </div>
      </div>

      <div className="screen-cards-grid">
        {/* Card 1: X Axis Longitudinal Gantry */}
        <div className="two-tier-card">
          <div className="two-tier-top" style={{ height: '220px', flexDirection: 'column' }}>
            <span style={{
              fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-mono)',
              color: 'var(--axis-x)', letterSpacing: '-0.05em'
            }}>
              {(dro.x >= 0 ? `+${dro.x.toFixed(2)}` : dro.x.toFixed(2))}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-accent)', marginTop: '4px' }}>
              MILLIMETERS (G54 X)
            </span>
            <div style={{
              position: 'absolute', bottom: '12px', display: 'flex', gap: '8px',
              background: 'rgba(255, 255, 255, 0.85)', padding: '3px 10px', borderRadius: '9999px',
              fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)'
            }}>
              <span>MIN: -150.00 mm</span>
              <span>·</span>
              <span>MAX: +150.00 mm</span>
            </div>
          </div>
          <div className="two-tier-body">
            <p className="two-tier-eyebrow" style={{ color: 'var(--axis-x)' }}>AXIS 01 · GANTRY</p>
            <h2 className="two-tier-title">X-Axis Motion</h2>
            <p className="two-tier-desc">
              Longitudinal gantry translation along precision dual linear guide rails. Rapid speed 3,000 mm/min.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button
                className="gradient-pill-btn"
                onClick={() => handleJog('X', -1)}
                style={{ flex: 1 }}
                title={`Jog X Left by ${jogStep}mm`}
              >
                <ArrowLeft size={14} />
                <span>X- Jog</span>
              </button>
              <button
                className="gradient-pill-btn"
                onClick={() => handleJog('X', 1)}
                style={{ flex: 1 }}
                title={`Jog X Right by ${jogStep}mm`}
              >
                <span>X+ Jog</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Y Axis Transverse Table */}
        <div className="two-tier-card">
          <div className="two-tier-top" style={{ height: '220px', flexDirection: 'column' }}>
            <span style={{
              fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-mono)',
              color: 'var(--axis-y)', letterSpacing: '-0.05em'
            }}>
              {(dro.y >= 0 ? `+${dro.y.toFixed(2)}` : dro.y.toFixed(2))}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-accent)', marginTop: '4px' }}>
              MILLIMETERS (G54 Y)
            </span>
            <div style={{
              position: 'absolute', bottom: '12px', display: 'flex', gap: '8px',
              background: 'rgba(255, 255, 255, 0.85)', padding: '3px 10px', borderRadius: '9999px',
              fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)'
            }}>
              <span>MIN: -100.00 mm</span>
              <span>·</span>
              <span>MAX: +100.00 mm</span>
            </div>
          </div>
          <div className="two-tier-body">
            <p className="two-tier-eyebrow" style={{ color: 'var(--axis-y)' }}>AXIS 02 · SADDLE</p>
            <h2 className="two-tier-title">Y-Axis Motion</h2>
            <p className="two-tier-desc">
              Transverse table saddle travel along base linear guideways. Ground ballscrew drive with anti-backlash nut.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button
                className="gradient-pill-btn"
                onClick={() => handleJog('Y', -1)}
                style={{ flex: 1 }}
                title={`Jog Y Forward by ${jogStep}mm`}
              >
                <ArrowDown size={14} />
                <span>Y- Jog</span>
              </button>
              <button
                className="gradient-pill-btn"
                onClick={() => handleJog('Y', 1)}
                style={{ flex: 1 }}
                title={`Jog Y Backward by ${jogStep}mm`}
              >
                <span>Y+ Jog</span>
                <ArrowUp size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Z Axis Vertical Spindle Plunge */}
        <div className="two-tier-card">
          <div className="two-tier-top" style={{ height: '220px', flexDirection: 'column' }}>
            <span style={{
              fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-mono)',
              color: 'var(--axis-z)', letterSpacing: '-0.05em'
            }}>
              {(dro.z >= 0 ? `+${dro.z.toFixed(2)}` : dro.z.toFixed(2))}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-accent)', marginTop: '4px' }}>
              MILLIMETERS (G54 Z)
            </span>
            <div style={{
              position: 'absolute', bottom: '12px', display: 'flex', gap: '8px',
              background: 'rgba(255, 255, 255, 0.85)', padding: '3px 10px', borderRadius: '9999px',
              fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)'
            }}>
              <span>MIN: -70.00 mm</span>
              <span>·</span>
              <span>MAX: +50.00 mm</span>
            </div>
          </div>
          <div className="two-tier-body">
            <p className="two-tier-eyebrow" style={{ color: 'var(--axis-z)' }}>AXIS 03 · VERTICAL</p>
            <h2 className="two-tier-title">Z-Axis Motion</h2>
            <p className="two-tier-desc">
              Vertical spindle slide plunge and retract. Safe clearance plane standard height +25.00 mm.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button
                className="gradient-pill-btn"
                onClick={() => handleJog('Z', -1)}
                style={{ flex: 1 }}
                title={`Plunge Z Down by ${jogStep}mm`}
              >
                <ArrowDown size={14} />
                <span>Z- Plunge</span>
              </button>
              <button
                className="gradient-pill-btn"
                onClick={() => handleJog('Z', 1)}
                style={{ flex: 1 }}
                title={`Retract Z Up by ${jogStep}mm`}
              >
                <span>Z+ Retract</span>
                <ArrowUp size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: Work Coordinate Calibration & Origin */}
        <div className="two-tier-card">
          <div className="two-tier-top" style={{ height: '220px' }}>
            <div style={{
              width: '120px', height: '120px', borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(138, 143, 255, 0.2), rgba(91, 97, 255, 0.35))',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Target size={52} color="var(--icon-blue-dark)" />
            </div>
          </div>
          <div className="two-tier-body">
            <p className="two-tier-eyebrow">COORDINATE ZEROING</p>
            <h2 className="two-tier-title">G54 Work Coordinate Zero</h2>
            <p className="two-tier-desc">
              Set the current machine position as the workpiece origin (X0, Y0, Z0) or command a safe traverse to zero.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto' }}>
              <button
                className="gradient-pill-btn"
                onClick={handleZero}
                style={{ padding: '8px 12px' }}
              >
                Set Work Zero
              </button>
              <button
                onClick={handleGoZero}
                style={{
                  padding: '8px 12px', borderRadius: '9999px', border: '1px solid rgba(0,0,0,0.1)',
                  background: 'var(--card-bg)', color: 'var(--text-primary)', fontSize: '11px',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Go To Zero (0,0,0)
              </button>
              <button
                onClick={handleHome}
                style={{
                  gridColumn: 'span 2', padding: '9px 12px', borderRadius: '9999px',
                  border: '1px solid rgba(0,0,0,0.1)', background: 'var(--top-section-bg)',
                  color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <RotateCcw size={13} />
                <span>Home All Axes (Safe Clearance Z=+25)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

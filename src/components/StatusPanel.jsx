import React, { useState } from 'react';
import { 
  Gauge, Activity, Compass, ArrowUp, ArrowDown, 
  ArrowLeft, ArrowRight, CornerDownLeft, RotateCcw,
  AlertCircle, ShieldCheck
} from 'lucide-react';
import { MACHINE_SPECS } from '../engine/MachineKinematics';

export default function StatusPanel({
  dro,
  simState,
  currentOperation,
  kinematics,
  activeGCode
}) {
  const [jogStep, setJogStep] = useState(1.0); // 0.1 | 1.0 | 10.0 mm

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
    <div style={{
      width: '320px',
      height: '100%',
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10,
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--accent-blue)" />
          <h2 style={{ fontSize: '15px', fontWeight: 600 }}>Digital Machine Status</h2>
        </div>
        <span className={`badge badge-${simState}`}>
          {simState.toUpperCase()}
        </span>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* DRO Display */}
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
              LIVE DRO (MACHINE COORDINATES)
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>G54 [mm]</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '4px' }}>
              <span style={{ color: '#f85149', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>X AXIS</span>
              <span className="mono" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {dro.x.toFixed(3)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '4px' }}>
              <span style={{ color: '#3fb950', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Y AXIS</span>
              <span className="mono" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {dro.y.toFixed(3)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '4px' }}>
              <span style={{ color: '#58a6ff', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Z AXIS</span>
              <span className="mono" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {dro.z.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Feeds, MRR & Operation */}
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          padding: '12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          fontSize: '11px'
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Spindle RPM</div>
            <div className="mono" style={{ fontSize: '14px', fontWeight: 600, color: dro.spindleActive ? 'var(--accent-cyan)' : 'var(--text-primary)', marginTop: '2px' }}>
              {dro.spindleActive ? dro.spindleRPM : 0} RPM
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Feed Rate</div>
            <div className="mono" style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
              {dro.feedRate} mm/min
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Material Removal (MRR)</div>
            <div className="mono" style={{ fontSize: '14px', fontWeight: 600, color: (dro.mrr || 0) > 0 ? 'var(--accent-green)' : 'var(--text-primary)', marginTop: '2px' }}>
              {(dro.mrr || 0).toFixed(1)} cm³/min
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Coolant System</div>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              color: dro.coolantActive ? '#06b6d4' : 'var(--text-muted)',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: dro.coolantActive ? '#06b6d4' : 'var(--text-muted)'
              }} />
              {dro.coolantActive ? 'FLOOD (M08)' : 'OFF (M09)'}
            </div>
          </div>
          <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
            <div style={{ color: 'var(--text-muted)' }}>Active Operation</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-blue)', marginTop: '2px' }}>
              {currentOperation}
            </div>
          </div>
        </div>

        {/* Real-time Surface Roughness & Metrology */}
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
              SURFACE FINISH & METROLOGY
            </span>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 700, 
              color: '#10b981', 
              background: 'rgba(16, 185, 129, 0.12)', 
              padding: '2px 6px', 
              borderRadius: '4px' 
            }}>
              {dro.surfaceRoughness?.isoGrade || 'N7'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '6px 8px', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Arithmetic Mean Ra</div>
              <div className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                {dro.surfaceRoughness?.Ra !== undefined ? dro.surfaceRoughness.Ra.toFixed(2) : '1.60'} µm
              </div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '6px 8px', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Peak-to-Valley Rz</div>
              <div className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-blue)', marginTop: '2px' }}>
                {dro.surfaceRoughness?.Rz !== undefined ? dro.surfaceRoughness.Rz.toFixed(2) : '6.30'} µm
              </div>
            </div>
          </div>
        </div>

        {/* Safety Checks & Limit Warnings */}
        {dro.limitsExceeded && (
          <div style={{
            padding: '10px',
            borderRadius: '6px',
            background: 'rgba(248, 81, 73, 0.15)',
            border: '1px solid var(--accent-red)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <AlertCircle size={16} color="var(--accent-red)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: '11px', color: 'var(--accent-red)' }}>
              <strong>Safety Alarm:</strong> {dro.lastError}
            </div>
          </div>
        )}

        {/* Manual Jog Controls */}
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Manual Machine Jog</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0.1, 1.0, 10.0].map(step => (
                <button
                  key={step}
                  onClick={() => setJogStep(step)}
                  className={jogStep === step ? 'accent' : ''}
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                >
                  {step} mm
                </button>
              ))}
            </div>
          </div>

          {/* Jog Pad (X, Y, Z) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <div />
            <button onClick={() => handleJog('Y', 1)} title="Y+ (Back)">Y+</button>
            <button onClick={() => handleJog('Z', 1)} style={{ background: 'rgba(88, 166, 255, 0.2)' }} title="Z+ (Up)">Z+</button>

            <button onClick={() => handleJog('X', -1)} title="X- (Left)">X-</button>
            <button onClick={handleHome} title="Home"><RotateCcw size={12} /> HOME</button>
            <button onClick={() => handleJog('X', 1)} title="X+ (Right)">X+</button>

            <div />
            <button onClick={() => handleJog('Y', -1)} title="Y- (Front)">Y-</button>
            <button onClick={() => handleJog('Z', -1)} style={{ background: 'rgba(88, 166, 255, 0.2)' }} title="Z- (Plunge)">Z-</button>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <button onClick={handleZero} style={{ flex: 1, fontSize: '11px' }}>
              Set Work Zero
            </button>
            <button onClick={handleGoZero} style={{ flex: 1, fontSize: '11px' }}>
              Go To Zero
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

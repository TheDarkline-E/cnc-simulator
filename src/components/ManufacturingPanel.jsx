import React, { useState } from 'react';
import { 
  Activity, CheckCircle2, Clock, Play, Pause, 
  RotateCcw, Compass, ArrowUp, ArrowDown, ArrowLeft, 
  ArrowRight, ShieldCheck, Sparkles, Disc, Scissors,
  Layers, ChevronRight, Gauge, Wrench, Box
} from 'lucide-react';

export default function ManufacturingPanel({
  dro,
  simState,
  currentOperation,
  kinematics,
  operations = [],
  progressPercent = 0,
  stockConfig,
  toolConfig,
  elapsedTimeSec = 0,
  removedPercent = 0
}) {
  const [jogStep, setJogStep] = useState(1.0);
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'telemetry' | 'jog'

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

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // Determine stage status based on overall progress
  const getStageStatus = (idx, total) => {
    if (simState === 'complete') return 'completed';
    if (simState === 'ready') return 'queued';
    const currentIdx = Math.min(total - 1, Math.floor((progressPercent / 100) * total));
    if (idx < currentIdx) return 'completed';
    if (idx === currentIdx) return simState === 'running' ? 'active' : 'paused';
    return 'queued';
  };

  return (
    <aside style={{
      width: '360px',
      height: '100%',
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10,
      overflow: 'hidden'
    }}>
      {/* Top Header Card */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: simState === 'running' ? 'var(--accent-green)' :
                          simState === 'paused' ? 'var(--accent-yellow)' :
                          simState === 'complete' ? '#7c3aed' : '#0284c7',
              boxShadow: simState === 'running' ? '0 0 10px rgba(5, 150, 105, 0.5)' : 'none'
            }} />
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
              Manufacturing Flow
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Automated CAD/CAM Execution
          </p>
        </div>

        <span className={`badge badge-${simState}`}>
          {simState === 'running' ? 'Machining' :
           simState === 'paused' ? 'Feed Hold' :
           simState === 'complete' ? 'Finished' : 'Ready'}
        </span>
      </div>

      {/* Pinterest Pill Navigation Switcher */}
      <div style={{
        display: 'flex',
        padding: '8px 16px',
        gap: '6px',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {[
          { id: 'pipeline', label: 'Operations' },
          { id: 'telemetry', label: 'Cutter Specs' },
          { id: 'jog', label: 'Manual Jog' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              border: activeTab === tab.id ? '1px solid var(--border-color)' : '1px solid transparent',
              background: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '12px',
              boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* 1. Live Cutter Stage Hero Card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '16px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Process
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              background: dro.spindleActive ? 'rgba(5, 150, 105, 0.12)' : 'rgba(148, 163, 184, 0.15)',
              color: dro.spindleActive ? 'var(--accent-green)' : 'var(--text-muted)'
            }}>
              {dro.spindleActive ? 'Spindle Active' : 'Spindle Idle'}
            </span>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentOperation || 'Idle (Standby)'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Tool: Ø{toolConfig?.diameter || 6.0}mm 2-Flute Carbide • Feed: {dro.feedRate} mm/min
            </p>
          </div>

          {/* Progress Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Progress</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{progressPercent}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--border-color)',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'var(--accent-primary)',
                borderRadius: 'var(--radius-pill)',
                transition: 'width 0.2s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Tab 1: Operations Pipeline (The modern replacement for G-Code table) */}
        {activeTab === 'pipeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Machining Pipeline (4 Passes)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {operations.filter(o => o.enabled).length} Enabled
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {operations.map((op, idx) => {
                const status = getStageStatus(idx, operations.length);
                const isCurrent = status === 'active';
                return (
                  <div
                    key={op.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isCurrent ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      border: isCurrent ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      boxShadow: isCurrent ? 'var(--shadow-md)' : 'none',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    {/* Status Circle */}
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: status === 'completed' ? '#dcfce7' :
                                  status === 'active' ? 'var(--accent-primary)' :
                                  status === 'paused' ? '#fef3c7' : 'var(--bg-tertiary)',
                      color: status === 'completed' ? '#15803d' :
                             status === 'active' ? '#ffffff' :
                             status === 'paused' ? '#b45309' : 'var(--text-muted)'
                    }}>
                      {status === 'completed' ? <CheckCircle2 size={15} /> :
                       status === 'active' ? <Disc size={15} className="spin-slow" /> :
                       <span style={{ fontSize: '11px', fontWeight: 700 }}>{idx + 1}</span>}
                    </div>

                    {/* Stage Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: isCurrent ? 700 : 600,
                          color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {op.name}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-pill)',
                          background: status === 'completed' ? '#dcfce7' :
                                      status === 'active' ? '#e0f2fe' : 'var(--bg-tertiary)',
                          color: status === 'completed' ? '#15803d' :
                                 status === 'active' ? '#0369a1' : 'var(--text-muted)'
                        }}>
                          {status === 'completed' ? 'Done' :
                           status === 'active' ? 'Cutting' :
                           status === 'paused' ? 'Hold' : 'Queued'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <span>Depth: {op.depth} mm</span>
                        <span>•</span>
                        <span>{op.type.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Cutter Telemetry & Material Spec */}
        {activeTab === 'telemetry' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Tool Library Card */}
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Tool Configuration
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Tool Profile</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>Flat End Mill</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Cutter Diameter</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>Ø{toolConfig?.diameter || 6.0} mm</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Flute Count</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>2 Flutes Carbide</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Flute Length</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{toolConfig?.cuttingLength || 25.0} mm</div>
                </div>
              </div>
            </div>

            {/* Billet Stock Spec */}
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Stock Billet Specifications
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Alloy Grade</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>Aluminium 6061-T6</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Dimensions</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>
                    {stockConfig?.width}×{stockConfig?.length}×{stockConfig?.height} mm
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Removed Volume</div>
                  <div style={{ fontWeight: 600, color: 'var(--accent-green)', marginTop: '2px' }}>
                    {removedPercent}%
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Surface Quality</div>
                  <div style={{ fontWeight: 600, color: 'var(--accent-blue)', marginTop: '2px' }}>
                    Ra {dro.surfaceRoughness?.Ra ? dro.surfaceRoughness.Ra.toFixed(2) : '1.60'} µm
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Manual Jog Controls */}
        {activeTab === 'jog' && (
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>Axis Motion Jog</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0.1, 1.0, 10.0].map(step => (
                  <button
                    key={step}
                    onClick={() => setJogStep(step)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      borderRadius: 'var(--radius-pill)',
                      background: jogStep === step ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      color: jogStep === step ? '#ffffff' : 'var(--text-primary)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {step} mm
                  </button>
                ))}
              </div>
            </div>

            {/* Jog Pad (X, Y, Z) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div />
              <button onClick={() => handleJog('Y', 1)} style={{ padding: '10px' }}>Y+</button>
              <button onClick={() => handleJog('Z', 1)} style={{ padding: '10px', background: '#e0f2fe', color: '#0369a1' }}>Z+ (Retract)</button>

              <button onClick={() => handleJog('X', -1)} style={{ padding: '10px' }}>X-</button>
              <button onClick={handleHome} style={{ padding: '10px', background: 'var(--bg-secondary)', fontWeight: 700 }}>
                HOME
              </button>
              <button onClick={() => handleJog('X', 1)} style={{ padding: '10px' }}>X+</button>

              <div />
              <button onClick={() => handleJog('Y', -1)} style={{ padding: '10px' }}>Y-</button>
              <button onClick={() => handleJog('Z', -1)} style={{ padding: '10px', background: '#e0f2fe', color: '#0369a1' }}>Z- (Plunge)</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button onClick={handleZero} style={{ flex: 1, padding: '8px' }}>
                Set Origin (0,0,0)
              </button>
              <button onClick={handleGoZero} style={{ flex: 1, padding: '8px' }}>
                Rapid to Origin
              </button>
            </div>
          </div>
        )}

        {/* 2. Precision Live Coordinates (DRO) - Clean Pinterest style */}
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Machine Coordinates (mm)
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Spindle Collet</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {/* X */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#e11d48' }}>X AXIS</span>
              <span className="mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {dro.x.toFixed(2)}
              </span>
            </div>

            {/* Y */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669' }}>Y AXIS</span>
              <span className="mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {dro.y.toFixed(2)}
              </span>
            </div>

            {/* Z */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb' }}>Z AXIS</span>
              <span className="mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {dro.z.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Live Spindle & Cutting Dynamics Metrics */}
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '14px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Spindle Speed</div>
            <div className="mono" style={{ fontSize: '15px', fontWeight: 700, color: dro.spindleActive ? 'var(--accent-blue)' : 'var(--text-primary)', marginTop: '2px' }}>
              {dro.spindleActive ? `${dro.spindleRPM.toLocaleString()} RPM` : '0 RPM'}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Feed Velocity</div>
            <div className="mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {dro.feedRate} mm/min
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Material Cut Rate</div>
            <div className="mono" style={{ fontSize: '15px', fontWeight: 700, color: (dro.mrr || 0) > 0 ? 'var(--accent-green)' : 'var(--text-primary)', marginTop: '2px' }}>
              {(dro.mrr || 0).toFixed(1)} cm³/min
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Coolant Flood</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: dro.coolantActive ? '#0284c7' : 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dro.coolantActive ? '#0284c7' : 'var(--text-muted)' }} />
              {dro.coolantActive ? 'Active' : 'Standby'}
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
}

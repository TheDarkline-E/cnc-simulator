import React, { useState } from 'react';
import { 
  Settings, Bell, MoreHorizontal, ArrowUpRight, 
  ChevronLeft, ChevronRight, ChevronDown, Activity, 
  Sliders, Gauge, CheckCircle2, Disc, Cpu
} from 'lucide-react';

export default function RightTelemetryCard({
  dro,
  simState,
  currentOperation,
  progressPercent = 0,
  onOpenSettings,
  onOpenInspection,
  toggleTheme,
  theme
}) {
  const [feedMode, setFeedMode] = useState('Auto');
  
  const isRunning = simState === 'running';
  const spindleRpm = isRunning ? (dro?.spindleRPM || 8000) : 0;
  const feedRate = dro?.feedRate || 800;

  return (
    <aside style={{
      width: '340px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      padding: '24px 18px',
      background: 'transparent',
      flexShrink: 0,
      userSelect: 'none',
      overflowY: 'auto'
    }}>
      {/* Top Profile & Circular Dark Action Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 4px'
      }}>
        {/* Machine Digital Twin Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            position: 'relative',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
          }}>
            <Cpu size={20} color="var(--accent-purple)" />
            {/* Green Online Status Dot */}
            <span style={{
              position: 'absolute',
              bottom: '1px',
              right: '1px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#10b981',
              border: '2px solid #ffffff'
            }} />
          </div>

          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-main)',
              lineHeight: 1.2
            }}>
              Haas VMC-3X Twin
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontWeight: 500
            }}>
              Direct Spindle • Online
            </div>
          </div>
        </div>

        {/* Circular Action Buttons (Settings & Notifications) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="circle-btn-dark"
            onClick={onOpenSettings}
            title="Machining Parameters & Tool Config"
          >
            <Settings size={16} />
          </button>

          <button 
            className="circle-btn-dark"
            onClick={onOpenInspection}
            title="Quality Metrology & Part Verification"
            style={{ position: 'relative' }}
          >
            <Bell size={16} />
            {/* Notification alert dot */}
            <span style={{
              position: 'absolute',
              top: '9px',
              right: '10px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--accent-purple)'
            }} />
          </button>
        </div>
      </div>

      {/* Quick CNC Metrics Row: Feed Rate & Precision Tolerance */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        padding: '0 4px',
        marginTop: '6px'
      }}>
        {/* Metric 1: Feed Rate */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{
            color: 'var(--text-main)',
            marginTop: '3px'
          }}>
            <Sliders size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--text-main)',
              lineHeight: 1
            }}>
              {feedRate}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontWeight: 500,
              marginTop: '4px'
            }}>
              Feed mm/min
            </div>
          </div>
        </div>

        {/* Metric 2: Part Tolerance */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{
            color: 'var(--text-main)',
            marginTop: '3px'
          }}>
            <Activity size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--text-main)',
              lineHeight: 1
            }}>
              ±0.01
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontWeight: 500,
              marginTop: '4px'
            }}>
              Tolerance mm
            </div>
          </div>
        </div>
      </div>

      {/* Middle Card: Spindle Velocity Dynamics */}
      <div style={{
        background: 'var(--bg-app)',
        borderRadius: '24px',
        padding: '20px',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border-light)',
        marginTop: '4px'
      }}>
        {/* Card Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px'
        }}>
          <span style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontWeight: 600
          }}>
            Spindle Dynamics
          </span>

          <button 
            onClick={onOpenSettings}
            style={{ color: 'var(--text-muted)', padding: '2px' }}
            title="Adjust Spindle RPM"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Big Title */}
        <h3 style={{
          fontSize: '17px',
          fontWeight: 800,
          color: 'var(--text-main)',
          margin: '0 0 4px 0',
          letterSpacing: '-0.3px'
        }}>
          Cutter Velocity
        </h3>

        {/* Subtitle */}
        <p style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          margin: '0 0 16px 0',
          lineHeight: '1.4'
        }}>
          Direct brushless spindle motor with real-time vector torque feedback.
        </p>

        {/* Number RPM + SVG Waveform Chart */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          {/* Big Number: 8000 RPM */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{
              fontSize: '38px',
              fontWeight: 800,
              color: 'var(--text-main)',
              lineHeight: 0.9,
              letterSpacing: '-1px'
            }}>
              {spindleRpm.toLocaleString()}
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-muted)'
            }}>
              RPM
            </span>
          </div>

          {/* SVG Waveform Graphic with Peak marker */}
          <div style={{ position: 'relative', width: '150px', height: '65px' }}>
            <svg
              viewBox="0 0 150 65"
              fill="none"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              {/* Soft purple gradient fill under pulse */}
              <defs>
                <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path
                d={isRunning 
                  ? "M 0 45 L 25 45 L 35 38 L 45 52 L 58 10 L 70 58 L 80 40 L 92 48 L 150 45"
                  : "M 0 45 L 35 45 L 45 42 L 52 48 L 58 10 L 65 58 L 72 45 L 150 45"
                }
                stroke="var(--accent-purple)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d={isRunning
                  ? "M 0 45 L 25 45 L 35 38 L 45 52 L 58 10 L 70 58 L 80 40 L 92 48 L 150 45 L 150 65 L 0 65 Z"
                  : "M 0 45 L 35 45 L 45 42 L 52 48 L 58 10 L 65 58 L 72 45 L 150 45 L 150 65 L 0 65 Z"
                }
                fill="url(#purpleGlow)"
              />

              {/* Peak Circle Marker */}
              <circle
                cx="58"
                cy="10"
                r="4"
                fill="#ffffff"
                stroke="var(--accent-purple)"
                strokeWidth="2"
              />
            </svg>

            {/* Floating "Peak" Pill Badge above the peak */}
            <div style={{
              position: 'absolute',
              top: '-4px',
              left: '42px',
              background: 'var(--bg-app)',
              border: '1px solid var(--accent-purple-light)',
              borderRadius: 'var(--radius-pill)',
              padding: '1px 6px',
              fontSize: '9px',
              fontWeight: 700,
              color: 'var(--accent-purple)',
              boxShadow: '0 2px 6px rgba(124, 92, 252, 0.2)'
            }}>
              Peak
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Card: Manufacturing Sequence Gantt Timeline */}
      <div style={{
        background: 'var(--bg-app)',
        borderRadius: '24px',
        padding: '20px',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border-light)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header: Machining Passes + Cycle Pill + Mode Dropdown */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px'
        }}>
          <h3 style={{
            fontSize: '17px',
            fontWeight: 800,
            color: 'var(--text-main)',
            margin: 0,
            letterSpacing: '-0.3px'
          }}>
            Machining Passes
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Cycle Pill: < Program #001 > */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-pill)',
              borderRadius: 'var(--radius-pill)',
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-sub)',
              gap: '4px'
            }}>
              <ChevronLeft size={12} style={{ cursor: 'pointer' }} />
              <span>Program #001</span>
              <ChevronRight size={12} style={{ cursor: 'pointer' }} />
            </div>

            {/* Dropdown Pill: Auto ▾ */}
            <div 
              onClick={() => setFeedMode(prev => prev === 'Auto' ? 'Manual' : 'Auto')}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--bg-pill)',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-sub)',
                gap: '2px',
                cursor: 'pointer'
              }}
              title="Toggle Auto Feed / Manual Control"
            >
              <span>{feedMode}</span>
              <ChevronDown size={11} />
            </div>
          </div>
        </div>

        {/* Stage Columns with Active Pass Highlight */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          position: 'relative',
          marginBottom: '14px',
          textAlign: 'center'
        }}>
          {['P1 Facing', 'P2 Rough', 'P3 Pocket', 'P4 Contour'].map((stage, idx) => {
            const isActive = idx === 1; // P2 Roughing active
            return (
              <div key={stage} style={{ position: 'relative', padding: '4px 0' }}>
                {isActive ? (
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--accent-purple)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(124, 92, 252, 0.3)'
                  }}>
                    {stage}
                  </div>
                ) : (
                  <span style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    fontWeight: 600
                  }}>
                    {stage}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Timeline Canvas with Vertical Dotted Line for Active Column */}
        <div style={{ position: 'relative', flex: 1, minHeight: '130px' }}>
          {/* Vertical Dotted Line dropping from active pass column */}
          <div style={{
            position: 'absolute',
            top: '-6px',
            left: '37%',
            bottom: '10px',
            width: '1px',
            borderLeft: '1.5px dashed var(--accent-purple)',
            zIndex: 1,
            pointerEvents: 'none'
          }} />

          {/* Horizontal Gantt Pass Bars */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            position: 'relative',
            zIndex: 2,
            paddingTop: '6px'
          }}>
            {/* Pass 1: Top Surfacing */}
            <div style={{
              marginLeft: '0%',
              width: '45%',
              background: 'var(--bg-pill)',
              borderRadius: 'var(--radius-pill)',
              padding: '8px 14px',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-sub)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              Top Surfacing (Facing 1.0mm)
            </div>

            {/* Pass 2: Active 3D Adaptive Roughing */}
            <div style={{
              marginLeft: '25%',
              width: '65%',
              background: 'var(--accent-purple)',
              color: '#ffffff',
              borderRadius: 'var(--radius-pill)',
              padding: '8px 14px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 14px rgba(124, 92, 252, 0.28)'
            }}>
              <span style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                3D Adaptive Roughing (8.0mm)
              </span>
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginLeft: '6px'
              }}>
                <ArrowUpRight size={11} />
              </div>
            </div>

            {/* Pass 3: Cavity Pocket & Contour Finish */}
            <div style={{
              marginLeft: '45%',
              width: '52%',
              background: 'var(--bg-pill)',
              borderRadius: 'var(--radius-pill)',
              padding: '8px 14px',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-sub)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <span style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Cavity Pocket & Contour (12mm)
              </span>
              <ArrowUpRight size={12} color="var(--text-muted)" />
            </div>
          </div>

          {/* Bottom Live Progress Slider */}
          <div style={{
            position: 'absolute',
            bottom: '4px',
            left: '5%',
            right: '5%',
            height: '5px',
            background: 'var(--bg-pill)',
            borderRadius: 'var(--radius-pill)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.max(5, progressPercent)}%`,
              height: '100%',
              background: 'var(--accent-purple)',
              borderRadius: 'var(--radius-pill)',
              transition: 'width 0.2s ease'
            }} />
          </div>
        </div>
      </div>
    </aside>
  );
}

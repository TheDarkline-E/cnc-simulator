import React from 'react';
import { 
  Home, Cpu, Activity, Wrench, Radio, 
  Search, ChevronRight, ArrowUpRight, Disc, Layers, 
  Box, CheckCircle2, Sliders, RefreshCw
} from 'lucide-react';

export default function SidebarNav({
  activeNav = 'machining',
  onSelectNav,
  operations = [],
  stockConfig,
  setStockConfig,
  currentOperation = 'Idle',
  onOpenInspection,
  onOpenSetup
}) {
  const materials = [
    { id: 'al6061', label: 'Al', name: 'Aluminium 6061-T6', color: '#94a3b8' },
    { id: 'brass360', label: 'Cu', name: 'Brass 360 Free-Cut', color: '#d97706' },
    { id: 'steel1018', label: 'Fe', name: 'Steel 1018 Cold-Roll', color: '#475569' }
  ];

  const handleSelectMaterial = (matId) => {
    if (setStockConfig) {
      setStockConfig(prev => ({ ...prev, material: matId }));
    }
  };

  return (
    <aside style={{
      width: '260px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 18px',
      background: 'transparent',
      flexShrink: 0,
      userSelect: 'none'
    }}>
      {/* Top Header & Brand */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '26px',
          padding: '0 4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '-0.6px',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-sans)'
            }}>
              CNC STUDIO
            </span>
          </div>

          <button 
            className="circle-btn-dark"
            onClick={onOpenSetup}
            title="Configure CNC Parameters"
            style={{ width: '36px', height: '36px' }}
          >
            <Sliders size={16} />
          </button>
        </div>

        {/* Navigation List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Machine Twin */}
          <button
            onClick={() => onSelectNav && onSelectNav('machine')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-pill)',
              color: activeNav === 'machine' ? 'var(--text-main)' : 'var(--text-sub)',
              fontWeight: activeNav === 'machine' ? 700 : 500,
              fontSize: '13px',
              width: '100%',
              justifyContent: 'flex-start'
            }}
          >
            <Home size={18} />
            <span>Machine Twin</span>
          </button>

          {/* Kinematics */}
          <button
            onClick={() => onSelectNav && onSelectNav('kinematics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-pill)',
              color: activeNav === 'kinematics' ? 'var(--text-main)' : 'var(--text-sub)',
              fontWeight: activeNav === 'kinematics' ? 700 : 500,
              fontSize: '13px',
              width: '100%',
              justifyContent: 'flex-start'
            }}
          >
            <Cpu size={18} />
            <span>Kinematics</span>
          </button>

          {/* Machining (Active Purple Pill matching reference) */}
          <button
            onClick={() => onSelectNav && onSelectNav('machining')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 18px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--accent-purple)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '13px',
              width: '100%',
              boxShadow: '0 6px 18px rgba(124, 92, 252, 0.32)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Activity size={18} />
              <span>Machining</span>
            </div>
            <ChevronRight size={16} />
          </button>

          {/* Tooling Library */}
          <button
            onClick={onOpenSetup}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-pill)',
              color: activeNav === 'tooling' ? 'var(--text-main)' : 'var(--text-sub)',
              fontWeight: activeNav === 'tooling' ? 700 : 500,
              fontSize: '13px',
              width: '100%',
              justifyContent: 'flex-start'
            }}
          >
            <Wrench size={18} />
            <span>Tooling Library</span>
          </button>

          {/* Telemetry with active axes badge '3' */}
          <button
            onClick={onOpenInspection}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-pill)',
              color: activeNav === 'telemetry' ? 'var(--text-main)' : 'var(--text-sub)',
              fontWeight: activeNav === 'telemetry' ? 700 : 500,
              fontSize: '13px',
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Radio size={18} />
              <span>Sensors & Axes</span>
            </div>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--accent-purple-light)',
              color: 'var(--accent-purple)',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} title="3 Synchronized Motion Axes: X, Y, Z">
              3
            </span>
          </button>
        </nav>

        {/* Workpiece Material Alloys Section */}
        <div style={{ marginTop: '24px', padding: '0 4px' }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--text-main)',
            marginBottom: '10px'
          }}>
            Workpiece Alloy
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Overlapping Material Avatars */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {materials.map((m, idx) => {
                const isSelected = stockConfig?.material === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMaterial(m.id)}
                    title={`${m.name} (Click to apply billet material)`}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: m.color,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: isSelected ? '2px solid var(--accent-purple)' : '2px solid #ffffff',
                      marginLeft: idx > 0 ? '-8px' : '0',
                      boxShadow: isSelected ? '0 0 0 2px var(--accent-purple)' : '0 2px 6px rgba(0,0,0,0.12)',
                      transform: isSelected ? 'scale(1.08)' : 'scale(1.0)',
                      transition: 'all 0.15s ease',
                      zIndex: isSelected ? 5 : 3 - idx
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Configure Stock Dimensions Button (Black pill) */}
            <button
              onClick={onOpenSetup}
              title="Edit Billet Dimensions & Material Properties"
              style={{
                background: 'var(--accent-dark)',
                color: 'var(--bg-app)',
                fontSize: '10px',
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                letterSpacing: '-0.2px'
              }}
            >
              Edit Stock
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Digital CAM Pipeline Sequence */}
      <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          padding: '0 4px'
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Digital CAM
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
              Toolpath Pipeline
            </div>
          </div>

          <button
            onClick={onOpenInspection}
            title="Open Quality Metrology & Part Verification"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--bg-pill)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowUpRight size={15} />
          </button>
        </div>

        {/* 4 Pipeline Rows (First active purple, other 3 off-white) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {/* Row 1: Top Surfacing (Active Purple Capsule) */}
          <div style={{
            background: 'var(--accent-purple)',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '9px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(124, 92, 252, 0.28)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Disc size={15} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.1 }}>Top Surfacing</div>
                <div style={{ fontSize: '10px', opacity: 0.85, fontWeight: 500 }}>Facing 1.0mm | Active</div>
              </div>
            </div>
            <ChevronRight size={14} opacity={0.9} />
          </div>

          {/* Row 2: Adaptive Roughing */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '9px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--bg-pill)',
                color: 'var(--text-sub)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Layers size={14} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>Adaptive Roughing</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Trochoidal 8mm | Queued</div>
              </div>
            </div>
            <ChevronRight size={14} color="var(--text-muted)" />
          </div>

          {/* Row 3: Cavity Pocket */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '9px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--bg-pill)',
                color: 'var(--text-sub)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Box size={14} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>Cavity Pocket</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Pocket 8mm | Queued</div>
              </div>
            </div>
            <ChevronRight size={14} color="var(--text-muted)" />
          </div>

          {/* Row 4: Perimeter Finish */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '9px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--bg-pill)',
                color: 'var(--text-sub)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle2 size={14} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>Perimeter Finish</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Contour 12mm | Queued</div>
              </div>
            </div>
            <ChevronRight size={14} color="var(--text-muted)" />
          </div>
        </div>
      </div>
    </aside>
  );
}

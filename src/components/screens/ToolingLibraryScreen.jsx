import React from 'react';
import { Wrench, Check, Sliders, ArrowUpRight, Zap, Layers } from 'lucide-react';

const catalogTools = [
  {
    type: 'flat_end_mill',
    name: 'Flat End Mill (Carbide)',
    diameter: 6.0,
    flutes: 2,
    length: 50.0,
    cuttingLength: 25.0,
    eyebrow: 'STANDARD ROUGHING · T01',
    desc: 'Square shoulder end mill for facing, pocketing, and 2.5D contour slotting in non-ferrous and steel alloys.',
    accent: '#5b61ff'
  },
  {
    type: 'ball_nose',
    name: 'Ball Nose End Mill',
    diameter: 6.0,
    flutes: 2,
    length: 50.0,
    cuttingLength: 20.0,
    eyebrow: '3D SCALLOP FINISHING · T02',
    desc: 'Full hemispherical tip for continuous 3D contouring, organic mold cavity surfacing, and fillets.',
    accent: '#34C759'
  },
  {
    type: 'bull_nose',
    name: 'Bull Nose (Toroidal) Mill',
    diameter: 8.0,
    flutes: 3,
    length: 60.0,
    cuttingLength: 30.0,
    eyebrow: 'CORNER RADIUS · T03',
    desc: 'High-strength bottom corner radii preventing tip chipout during aggressive pocket clearing.',
    accent: '#FF9500'
  },
  {
    type: 'face_mill',
    name: 'Indexable Face Mill',
    diameter: 12.0,
    flutes: 4,
    length: 45.0,
    cuttingLength: 15.0,
    eyebrow: 'TOP SURFACING · T04',
    desc: 'Large diameter cutter with carbide inserts for ultra-flat, high MRR top stock planar finishing.',
    accent: '#AF52DE'
  }
];

export default function ToolingLibraryScreen({
  toolConfig,
  setToolConfig,
  onNavigate
}) {
  const handleSelectTool = (tool) => {
    if (setToolConfig) {
      setToolConfig({
        ...toolConfig,
        type: tool.type,
        diameter: tool.diameter,
        flutes: tool.flutes,
        length: tool.length,
        cuttingLength: tool.cuttingLength
      });
    }
  };

  return (
    <div className="screen-scroll-container">
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <p className="two-tier-eyebrow">SPINDLE CUTTER INVENTORY</p>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
          Cutting Tool Library & Geometries
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '640px', margin: '0 auto' }}>
          Select active spindle end mills, verify flute geometry, and inspect tooth parameters calibrated for dynamic material removal.
        </p>
      </div>

      <div className="screen-cards-grid">
        {catalogTools.map((tool) => {
          const isSelected = toolConfig?.type === tool.type && toolConfig?.diameter === tool.diameter;
          return (
            <div key={tool.type + tool.diameter} className="two-tier-card">
              <div className="two-tier-top" style={{ height: '220px', flexDirection: 'column' }}>
                <div style={{
                  width: '100px', height: '100px', borderRadius: '50%',
                  background: `linear-gradient(135deg, ${tool.accent}20, ${tool.accent}35)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 10px 24px ${tool.accent}25`
                }}>
                  <Wrench size={44} color={tool.accent} />
                </div>
                <div style={{
                  position: 'absolute', bottom: '12px', background: 'rgba(255, 255, 255, 0.9)',
                  padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)'
                }}>
                  Ø{tool.diameter.toFixed(1)} mm · {tool.flutes}-Flute
                </div>
              </div>

              <div className="two-tier-body">
                <p className="two-tier-eyebrow" style={{ color: tool.accent }}>{tool.eyebrow}</p>
                <h2 className="two-tier-title">{tool.name}</h2>
                <p className="two-tier-desc">{tool.desc}</p>

                <div style={{
                  marginTop: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px', marginBottom: '14px', textAlign: 'left'
                }}>
                  <div style={{ background: 'var(--top-section-bg)', padding: '6px 8px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-accent)', display: 'block' }}>Gauge</span>
                    <strong style={{ fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{tool.length} mm</strong>
                  </div>
                  <div style={{ background: 'var(--top-section-bg)', padding: '6px 8px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-accent)', display: 'block' }}>Cut Depth</span>
                    <strong style={{ fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{tool.cuttingLength} mm</strong>
                  </div>
                  <div style={{ background: 'var(--top-section-bg)', padding: '6px 8px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-accent)', display: 'block' }}>Helix</span>
                    <strong style={{ fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>30° Flute</strong>
                  </div>
                </div>

                <button
                  className="gradient-pill-btn"
                  onClick={() => handleSelectTool(tool)}
                  style={{
                    width: '100%',
                    background: isSelected ? 'var(--icon-blue-dark)' : 'linear-gradient(135deg, #8a8fff 0%, #5b61ff 100%)',
                    boxShadow: isSelected ? '0 0 0 2px var(--icon-blue-dark)' : 'var(--shadow-custom-btn)'
                  }}
                >
                  {isSelected ? (
                    <>
                      <Check size={14} />
                      <span>Active Spindle Cutter</span>
                    </>
                  ) : (
                    <span>Equip in Spindle T01</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React from 'react';

/**
 * HorizontalBarChartCard - 100% Parity with Figma component.html (.card-bar-chart2)
 * Structure & classes based directly on exported component.html
 */
export default function HorizontalBarChartCard({
  title = "Bar chart",
  totalDuration = "22.6",
  durationLabel = "Hours\nspent",
  activePassIndex = 1,
  progressPercent = 45,
  passes = [
    { id: 1, name: "P1 Facing", sub: "Surfacing", progress: 100, color: "#34C759" },
    { id: 2, name: "P2 Roughing", sub: "Adaptive", progress: 65, color: "#007AFF" },
    { id: 3, name: "P3 Pocket", sub: "Cavity", progress: 0, color: "#AF52DE" },
    { id: 4, name: "P4 Contour", sub: "Perimeter", progress: 0, color: "#FF9500" }
  ],
  style = {}
}) {
  return (
    <div 
      className="card-bar-chart2 card1"
      style={{
        gap: 'var(--_16)',
        ...style
      }}
    >
      {/* 1. Header icon-text-a from component.html */}
      <div className="icon-text-a">
        <img 
          src="/src/assets/figma/icon-text/icon-text-icon2.svg" 
          className="icon-text-icon-a" 
          alt="Bar Chart Icon"
        />
        <h2 className="icon-text-subtitle">{title}</h2>
      </div>

      {/* 2. text-a from component.html: Big 22.6 + Hours spent */}
      <div className="text-a">
        <h1 className="text-title _48-semibold" style={{ fontSize: '38px', lineHeight: 1 }}>
          {totalDuration}
        </h1>
        <p className="text-text1 _14-regular" style={{ lineHeight: '1.2', whiteSpace: 'pre-line' }}>
          {durationLabel}
        </p>
      </div>

      {/* 3. Horizontal Multi-Bar Stacked Graphic matching component.html */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
        {passes.map((pass, idx) => {
          const isActive = idx === activePassIndex;
          const isDone = pass.progress === 100;
          
          return (
            <div key={pass.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: pass.color,
                    boxShadow: isActive ? `0 0 8px ${pass.color}` : 'none'
                  }} />
                  <span className="_12-regular" style={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--text-main)' : undefined
                  }}>
                    {pass.name}
                  </span>
                  <span className="_12-regular" style={{ opacity: 0.7 }}>
                    • {pass.sub}
                  </span>
                </div>

                <span 
                  className="mono _12-regular" 
                  style={{
                    fontWeight: 600,
                    color: isDone ? 'var(--secondary-green)' : isActive ? 'var(--text-main)' : undefined
                  }}
                >
                  {pass.progress}%
                </span>
              </div>

              {/* Multi-layered track & bar */}
              <div style={{
                width: '100%',
                height: '7px',
                background: 'var(--border-light)',
                borderRadius: 'var(--_80)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${pass.progress}%`,
                  height: '100%',
                  background: pass.color,
                  borderRadius: 'var(--_80)',
                  transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive ? `0 0 10px ${pass.color}` : 'none'
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. bottom-text-b from component.html (0 to 50K scale ticks) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: '6px',
        borderTop: '1px solid var(--border-light)',
        marginTop: '2px'
      }}>
        {['0', '10K', '20K', '30K', '40K', '50K'].map((tick) => (
          <span key={tick} className="_12-regular" style={{ fontSize: '10px' }}>
            {tick}
          </span>
        ))}
      </div>
    </div>
  );
}

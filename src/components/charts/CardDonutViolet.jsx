import React from 'react';

/**
 * CardDonutViolet - Bottom-Center Card from Preview
 * Solid royal lavender card (#7474F8), white icon, white Donut chart title,
 * large centered white segmented circular donut graphic
 */
export default function CardDonutViolet({
  title = "Donut chart",
  subtitle = "Machine OEE Distribution",
  style = {}
}) {
  return (
    <div 
      className="card1"
      style={{
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.25) 100%), #7474F8',
        color: '#ffffff',
        borderRadius: '28px',
        padding: '24px',
        boxShadow: '0 10px 30px rgba(116, 116, 248, 0.35)',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '16px',
        ...style
      }}
    >
      {/* 1. Header with White Icon & White Text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img 
          src="/src/assets/figma/icon-text/icon-text-icon6.svg" 
          alt="Donut Chart Icon" 
          style={{ width: '26px', height: '26px', filter: 'brightness(0) invert(1)' }}
        />
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.2px' }}>
          {title}
        </span>
      </div>

      {/* 2. Large Centered White Segmented Donut Chart Graphic */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 0 6px 0'
      }}>
        <div style={{ width: '170px', height: '170px', position: 'relative' }}>
          <img 
            src="/src/assets/figma/card-donut-chart-donut-chart.svg" 
            alt="Donut Graphic" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      </div>
    </div>
  );
}

import React from 'react';

/**
 * CardTickGauge - Bottom-Right Card from Preview
 * White card, green icon, 987.29 title, radiating green/gray tick capsules
 * with 17% Jan in center
 */
export default function CardTickGauge({
  title = "Donut chart",
  metricValue = "987.29",
  centerValue = "17%",
  centerPeriod = "Jan",
  style = {}
}) {
  return (
    <div 
      className="card1"
      style={{
        background: '#FFFFFF',
        color: '#000000',
        borderRadius: '28px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        ...style
      }}
    >
      {/* 1. Header with Green Icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img 
          src="/src/assets/figma/icon-text/icon-text-icon7.svg" 
          alt="Donut Chart Icon" 
          style={{ width: '26px', height: '26px' }}
        />
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#000000', letterSpacing: '-0.2px' }}>
          {title}
        </span>
      </div>

      {/* 2. Hero Value: 987.29 */}
      <h1 className="_48-semibold" style={{ fontSize: '42px', lineHeight: 1, color: '#000000' }}>
        {metricValue}
      </h1>

      {/* 3. Radiating Tick Pill Capsules Gauge Area with Center 17% Jan */}
      <div style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '6px'
      }}>
        <div style={{ width: '100%', maxWidth: '270px', height: '135px', position: 'relative' }}>
          <img 
            src="/src/assets/figma/semicircle-chart/semicircle-chart-gauge-style2.svg" 
            alt="Tick Gauge" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* Center Readout inside Tick Gauge: 17% Jan */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 600,
            color: 'var(--text-main)',
            lineHeight: 1,
            margin: 0,
            fontFamily: 'var(--font-sans)'
          }}>
            {centerValue}
          </h2>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            margin: '3px 0 0 0',
            fontFamily: 'var(--font-sans)'
          }}>
            {centerPeriod}
          </p>
        </div>
      </div>
    </div>
  );
}

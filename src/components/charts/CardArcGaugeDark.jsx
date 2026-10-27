import React from 'react';

/**
 * CardArcGaugeDark - Bottom-Left Card from Preview
 * Pitch-black card (#000000), purple icon, 57% Total activity,
 * thick tri-color arc gauge (Orange, Purple, Red) with 17% Jan in center
 */
export default function CardArcGaugeDark({
  title = "Donut chart",
  metricValue = "57%",
  metricSubtitle = "Total\nactivity",
  centerValue = "17%",
  centerPeriod = "Jan",
  style = {}
}) {
  return (
    <div 
      className="card1"
      style={{
        background: '#000000',
        color: '#ffffff',
        borderRadius: '28px',
        padding: '24px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        ...style
      }}
    >
      {/* 1. Header with Purple Icon & White Text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img 
          src="/src/assets/figma/icon-text/icon-text-icon5.svg" 
          alt="Donut Chart Icon" 
          style={{ width: '26px', height: '26px' }}
        />
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.2px' }}>
          {title}
        </span>
      </div>

      {/* 2. Hero Value: 57% + Stacked 'Total activity' */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h1 style={{
          fontSize: '44px',
          fontWeight: 600,
          color: '#ffffff',
          lineHeight: 1,
          fontFamily: 'var(--font-sans)',
          letterSpacing: '-1px'
        }}>
          {metricValue}
        </h1>
        <p style={{
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.45)',
          lineHeight: '1.25',
          fontFamily: 'var(--font-sans)'
        }}>
          {typeof metricSubtitle === 'string' ? (
            metricSubtitle.split(/\\n|\n/).map((line, idx, arr) => (
              <React.Fragment key={idx}>
                {line}
                {idx < arr.length - 1 && <br />}
              </React.Fragment>
            ))
          ) : metricSubtitle}
        </p>
      </div>

      {/* 3. Tri-Color Semicircle Arc Gauge Area with Center 17% Jan */}
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
            src="/src/assets/figma/semicircle-chart/semicircle-chart-gauge-style1.svg" 
            alt="Tri-Color Arc Gauge" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* Center Readout inside Arc: 17% Jan */}
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
            color: '#ffffff',
            lineHeight: 1,
            margin: 0,
            fontFamily: 'var(--font-sans)'
          }}>
            {centerValue}
          </h2>
          <p style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.45)',
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

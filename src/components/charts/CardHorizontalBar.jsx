import React from 'react';

/**
 * CardHorizontalBar - Top-Center Card from Preview
 * Pure pitch-black card (#000000), green icon, 22.6 Hours spent,
 * 6 horizontal segmented multi-color bars (Blue, Green, White), 0-50K scale
 */
export default function CardHorizontalBar({
  title = "Bar chart",
  metricValue = "22.6",
  metricSubtitle = "Hours\nspent",
  rows = [
    { label: "Jun", bluePct: 40, greenPct: 20, whitePct: 15 },
    { label: "May", bluePct: 60, greenPct: 25, whitePct: 10 },
    { label: "Apr", bluePct: 45, greenPct: 18, whitePct: 22 },
    { label: "Mar", bluePct: 70, greenPct: 20, whitePct: 8 },
    { label: "Feb", bluePct: 35, greenPct: 15, whitePct: 10 },
    { label: "Jan", bluePct: 55, greenPct: 18, whitePct: 12 }
  ],
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
      {/* 1. Header with Green Icon & White Text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img 
          src="/src/assets/figma/icon-text/icon-text-icon2.svg" 
          alt="Bar Chart Icon" 
          style={{ width: '26px', height: '26px' }}
        />
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.2px' }}>
          {title}
        </span>
      </div>

      {/* 2. Hero Value: Giant White 22.6 + Stacked 'Hours spent' */}
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

      {/* 3. 6 Horizontal Segmented Bars Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Y-axis Label */}
            <span style={{
              width: '28px',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.45)',
              fontFamily: 'var(--font-sans)'
            }}>
              {row.label}
            </span>

            {/* Segmented Bar Track */}
            <div style={{
              flex: 1,
              height: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '9999px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center'
            }}>
              {/* Blue Segment */}
              <div style={{
                width: `${row.bluePct}%`,
                height: '100%',
                background: '#007AFF',
                borderRadius: '9999px 0 0 9999px'
              }} />
              {/* Green Segment */}
              <div style={{
                width: `${row.greenPct}%`,
                height: '100%',
                background: '#34C759'
              }} />
              {/* White Segment */}
              <div style={{
                width: `${row.whitePct}%`,
                height: '100%',
                background: '#FFFFFF',
                borderRadius: '0 9999px 9999px 0'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* 4. Bottom Scale Ticks (0, 10K, 20K, 30K, 40K, 50K) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingLeft: '40px',
        paddingTop: '6px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '10px',
        color: 'rgba(255, 255, 255, 0.35)',
        fontFamily: 'var(--font-mono)'
      }}>
        <span>0</span>
        <span>10K</span>
        <span>20K</span>
        <span>30K</span>
        <span>40K</span>
        <span>50K</span>
      </div>
    </div>
  );
}

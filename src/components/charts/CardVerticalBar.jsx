import React from 'react';

/**
 * CardVerticalBar - Top-Left Card from Preview
 * White card, orange icon, 5.42K metric, 22.41% pill, vertical pill bars with active orange pill
 */
export default function CardVerticalBar({
  title = "Bar chart",
  metricValue = "5.42K",
  metricLabel = "Material Removed (cm³)",
  trend = "22.41%",
  bars = [
    { label: "Jan", heightPct: 45, active: false },
    { label: "Feb", heightPct: 75, active: false },
    { label: "Mar", heightPct: 60, active: true },
    { label: "Apr", heightPct: 90, active: false },
    { label: "May", heightPct: 35, active: false },
    { label: "Jun", heightPct: 70, active: false }
  ],
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
      {/* 1. Header with Orange Icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img 
          src="/src/assets/figma/icon-text/icon-text-icon1.svg" 
          alt="Bar Chart Icon" 
          style={{ width: '26px', height: '26px' }}
        />
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#000000', letterSpacing: '-0.2px' }}>
          {title}
        </span>
      </div>

      {/* 2. Hero Value + Green Trend Pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <h1 className="_48-semibold" style={{ fontSize: '42px', lineHeight: 1, color: '#000000' }}>
            {metricValue}
          </h1>
        </div>

        {/* Green Trend Pill */}
        <div className="btn-icon-text">
          <img 
            src="/src/assets/figma/btn-icon-text/btn-icon-text-icon4.svg" 
            className="btn-icon-text-icon" 
            alt="Trend" 
          />
          <span className="btn-icon-text-label _12-regular">
            {trend}
          </span>
        </div>
      </div>

      {/* 3. Vertical Rounded Pill Bars Area */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: '140px',
        padding: '10px 4px 0 4px',
        gap: '10px'
      }}>
        {bars.map((bar) => {
          return (
            <div 
              key={bar.label} 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                height: '100%',
                justifyContent: 'flex-end',
                gap: '12px'
              }}
            >
              {/* The Pill Bar */}
              <div style={{
                width: '100%',
                maxWidth: '36px',
                height: `${bar.heightPct}%`,
                borderRadius: '9999px',
                background: bar.active 
                  ? 'linear-gradient(180deg, #FFB55B 0%, #FF9500 100%)' 
                  : 'rgba(0, 0, 0, 0.08)',
                boxShadow: bar.active ? '0 6px 16px rgba(255, 149, 0, 0.35)' : 'none',
                transition: 'all 0.3s ease'
              }} />

              {/* Month Label or Active Pill Button */}
              {bar.active ? (
                <div style={{
                  background: '#000000',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  lineHeight: 1.2
                }}>
                  {bar.label}
                </div>
              ) : (
                <span className="_12-regular" style={{ fontSize: '11px', color: 'rgba(0, 0, 0, 0.4)' }}>
                  {bar.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

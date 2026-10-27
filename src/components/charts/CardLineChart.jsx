import React from 'react';

/**
 * CardLineChart - Top-Right Card from Preview
 * White card, red icon, 4.38K metric, 22.41% green pill,
 * vibrant red #FF3B30 smooth spline curve with Jan-Dec x-axis
 */
export default function CardLineChart({
  title = "Line chart",
  metricValue = "4.38K",
  unit = "Feed (mm/min)",
  trend = "22.41%",
  style = {}
}) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
      {/* 1. Header with Red Icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img 
          src="/src/assets/figma/icon-text/icon-text-icon3.svg" 
          alt="Line Chart Icon" 
          style={{ width: '26px', height: '26px' }}
        />
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#000000', letterSpacing: '-0.2px' }}>
          {title}
        </span>
      </div>

      {/* 2. Hero Value: 4.38K + Green Trend Pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="_48-semibold" style={{ fontSize: '42px', lineHeight: 1, color: '#000000' }}>
          {metricValue}
        </h1>

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

      {/* 3. Red Spline Curve Area matching preview */}
      <div style={{ width: '100%', position: 'relative', height: '110px', marginTop: '6px' }}>
        <svg 
          viewBox="0 0 436 126" 
          fill="none" 
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          {/* Authentic curve path from preview */}
          <path 
            d="M1.5 96.4L15.6 90.2C23 87 31.6 89.7 35.8 96.6L47.7 116.6C52.1 123.8 61.4 126.4 68.9 122.5L76.7 118.4C80.4 116.5 84.8 116.1 88.8 117.3L97.5 120C104.5 122.1 112.2 119.2 115.9 112.8L133 83.9C135.2 80.2 138.9 77.5 143.2 76.5L156.6 73.4C161 72.5 165.6 73.3 169.3 75.9L174.5 79.5C182.8 85.3 194.3 82 198.3 72.8L212.3 40.5C215.4 33.5 222.8 29.7 230.2 31.2L235.7 32.3C241.2 33.4 246.8 31.6 250.6 27.5L268 8.7C270.3 6.2 273.3 4.6 276.5 3.9L286.6 1.8C293.7 0.4 300.8 3.8 304.1 10.2L317.4 36C321.7 44.4 332.5 47.1 340.4 42C347.3 37.5 356.5 38.9 361.7 45.3L368.6 53.9C374.5 61.2 385.3 61.9 392.1 55.5L403.7 44.6C405.5 42.8 407.8 41.5 410.2 40.8L433.8 34.1" 
            stroke="#FF3B30" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>

      {/* 4. Jan to Dec X-Axis Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: '6px',
        borderTop: '1px solid var(--border-light)',
        fontSize: '10px',
        color: 'var(--text-muted)'
      }}>
        {months.map(m => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}

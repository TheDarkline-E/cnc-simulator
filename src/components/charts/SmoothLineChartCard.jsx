import React, { useMemo } from 'react';

/**
 * SmoothLineChartCard - 100% Parity with Figma component.html (.card-line-chart)
 * Structure & classes based directly on exported component.html
 */
export default function SmoothLineChartCard({
  title = "Line chart",
  subtitle = "Feed Dynamics",
  currentValue = 800,
  unit = "mm/min",
  trend = "22.41%",
  trendLabel = "Optimal",
  trendPositive = true,
  history = [620, 680, 710, 690, 750, 790, 800, 820, 800, 810, 800],
  maxExpected = 1200,
  lineColor = "#007AFF",
  style = {}
}) {
  const width = 290;
  const height = 90;
  const paddingX = 10;
  const paddingTop = 10;
  const paddingBottom = 16;
  
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingTop - paddingBottom;

  // Compute smooth bezier path from telemetry points
  const { pathD, areaD, lastPoint } = useMemo(() => {
    const data = history.length > 1 ? history : [currentValue, currentValue];
    const minVal = Math.min(...data, 0);
    const maxVal = Math.max(...data, maxExpected * 0.8, 1);
    const range = maxVal - minVal || 1;

    const pts = data.map((val, idx) => {
      const x = paddingX + (idx / (data.length - 1)) * innerWidth;
      const normalizedY = (val - minVal) / range;
      const y = paddingTop + innerHeight - normalizedY * innerHeight;
      return { x, y, val };
    });

    if (pts.length < 2) return { pathD: '', areaD: '', lastPoint: { x: 0, y: 0 } };

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const last = pts[pts.length - 1];
    const area = `${d} L ${last.x} ${height - paddingBottom} L ${pts[0].x} ${height - paddingBottom} Z`;

    return { pathD: d, areaD: area, lastPoint: last };
  }, [history, currentValue, maxExpected, innerWidth, innerHeight, height]);

  const gradientId = useMemo(() => `lineGrad_${Math.random().toString(36).substr(2, 9)}`, []);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div 
      className="card-line-chart card1"
      style={{
        gap: 'var(--_16)',
        ...style
      }}
    >
      {/* 1. Header icon-text-a from component.html */}
      <div className="icon-text-a">
        <img 
          src="/src/assets/figma/icon-text/icon-text-icon3.svg" 
          className="icon-text-icon-a" 
          alt="Line Chart Icon"
        />
        <h2 className="icon-text-subtitle">{title}</h2>
      </div>

      {/* 2. frame-b from component.html: Title Value + Green Trend Pill */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--_8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <h1 className="frame-title2 _48-semibold" style={{ fontSize: '36px', lineHeight: 1 }}>
            {typeof currentValue === 'number' ? currentValue.toLocaleString() : currentValue}
          </h1>
          <span className="_14-regular" style={{ color: 'var(--text-muted)' }}>
            {unit}
          </span>
        </div>

        {/* Upward Trend Pill matching component.html btn-icon-text */}
        <div className="btn-icon-text">
          <img 
            src="/src/assets/figma/btn-icon-text/btn-icon-text-icon4.svg" 
            className="btn-icon-text-icon" 
            alt="Trend Icon"
          />
          <span className="btn-icon-text-label _12-regular">
            {trend}
          </span>
        </div>
      </div>

      {/* 3. Live Spline Graphic Canvas */}
      <div style={{ width: '100%', position: 'relative', height: `${height}px`, marginTop: '2px' }}>
        <svg 
          width="100%" 
          height={height} 
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.35" />
              <stop offset="60%" stopColor={lineColor} stopOpacity="0.08" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
            </linearGradient>
            <filter id={`lineGlow_${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Hairline subtle background grid */}
          <line 
            x1={paddingX} 
            y1={paddingTop + innerHeight * 0.5} 
            x2={width - paddingX} 
            y2={paddingTop + innerHeight * 0.5} 
            stroke="var(--border-light)" 
            strokeDasharray="3 3" 
            strokeWidth="1"
          />

          {/* Area fill under curve */}
          <path
            d={areaD}
            fill={`url(#${gradientId})`}
          />

          {/* Glowing Stroke Curve */}
          <path
            d={pathD}
            fill="none"
            stroke={lineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#lineGlow_${gradientId})`}
          />

          {/* Live pulsing dot on the latest telemetry point */}
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={7}
            fill={lineColor}
            opacity="0.3"
            className="pulse-halo"
          />
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={4}
            fill="#ffffff"
            stroke={lineColor}
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* 4. bottom-text-c from component.html (Jan to Dec x-axis labels) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '-8px',
        padding: '0 2px'
      }}>
        {['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov', 'LIVE'].map((label, idx) => (
          <span 
            key={label} 
            className="_12-regular" 
            style={{ 
              fontSize: '10px', 
              color: label === 'LIVE' ? 'var(--secondary-green)' : undefined,
              fontWeight: label === 'LIVE' ? 600 : 400
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

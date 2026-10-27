import React from 'react';

/**
 * DonutMetricCard - 100% Parity with Figma component.html (.card-donut-chart2)
 * Structure & classes based directly on exported component.html
 */
export default function DonutMetricCard({
  title = "Donut chart",
  subtitle = "OEE & Cycle Efficiency",
  overallValue = "92.4%",
  overallLabel = "Machine OEE",
  segments = [
    { id: 1, label: "Chip Cutting", percent: 68, color: "var(--secondary-green)" },
    { id: 2, label: "Rapid G00", percent: 20, color: "var(--secondary-indigo)" },
    { id: 3, label: "Tool Setup", percent: 12, color: "var(--secondary-purple)" }
  ],
  style = {}
}) {
  const size = 120;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulativePercent = 0;

  return (
    <div 
      className="card1"
      style={{
        gap: 'var(--_16)',
        ...style
      }}
    >
      {/* 1. Header icon-text-a from component.html */}
      <div className="icon-text-a">
        <img 
          src="/src/assets/figma/icon-text/icon-text-icon6.svg" 
          className="icon-text-icon-a" 
          alt="Donut Chart Icon"
        />
        <h2 className="icon-text-subtitle">{title}</h2>
      </div>

      {/* 2. Title Metric Row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <h1 className="_48-semibold" style={{ fontSize: '38px', lineHeight: 1 }}>
          {overallValue}
        </h1>
        <span className="_14-regular" style={{ color: 'var(--text-muted)' }}>
          {overallLabel}
        </span>
      </div>

      {/* 3. Donut Ring & Legend Layout */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        justifyContent: 'center',
        margin: '4px 0'
      }}>
        {/* SVG Donut */}
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="var(--border-light)"
              strokeWidth={strokeWidth}
            />

            {segments.map((seg) => {
              const strokeDasharray = `${(seg.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += seg.percent;

              return (
                <circle
                  key={seg.id}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${center} ${center})`}
                  style={{
                    transition: 'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease'
                  }}
                />
              );
            })}
          </svg>

          {/* Center Cutout */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            <span className="mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              {overallValue}
            </span>
            <span className="_12-regular" style={{ fontSize: '9px' }}>
              OEE
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', flex: 1 }}>
          {segments.map(seg => (
            <div key={seg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: seg.color,
                  flexShrink: 0
                }} />
                <span className="_12-regular" style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                  {seg.label}
                </span>
              </div>
              <span className="mono _12-regular" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {seg.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

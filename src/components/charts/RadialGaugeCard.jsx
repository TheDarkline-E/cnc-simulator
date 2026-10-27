import React from 'react';

/**
 * RadialGaugeCard - 100% Parity with Figma component.html (.card-donut-chart3)
 * Structure & classes based directly on exported component.html
 */
export default function RadialGaugeCard({
  title = "Donut chart",
  subtitle = "Direct Vector Spindle",
  value = 8000,
  maxValue = 12000,
  unit = "RPM",
  badgeValue = "17%",
  badgePeriod = "Jan",
  loadPercent = 53,
  style = {}
}) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  
  // 250 degree arc calculation
  const radius = 64;
  const strokeWidth = 12;
  const cx = 80;
  const cy = 76;
  const startAngle = 145;
  const endAngle = 395;
  const angleRange = endAngle - startAngle;
  
  const currentAngle = startAngle + (angleRange * (percentage / 100));
  
  const polarToCartesian = (centerX, centerY, r, angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians)
    };
  };

  const describeArc = (x, y, r, startAng, endAng) => {
    const start = polarToCartesian(x, y, r, endAng);
    const end = polarToCartesian(x, y, r, startAng);
    const largeArcFlag = endAng - startAng <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", r, r, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  const bgPath = describeArc(cx, cy, radius, startAngle, endAngle);
  const progressPath = describeArc(cx, cy, radius, startAngle, Math.max(startAngle + 1, currentAngle));
  const tipPos = polarToCartesian(cx, cy, radius, currentAngle);

  return (
    <div 
      className="card-donut-chart3 card1"
      style={{
        gap: 'var(--_16)',
        ...style
      }}
    >
      {/* 1. Header icon-text-a from component.html */}
      <div className="icon-text-a">
        <img 
          src="/src/assets/figma/icon-text/icon-text-icon7.svg" 
          className="icon-text-icon-a" 
          alt="Donut Chart Icon"
        />
        <h2 className="icon-text-subtitle">{title}</h2>
      </div>

      {/* 2. card-donut-chart-title _48-semibold from component.html */}
      <h1 className="card-donut-chart-title _48-semibold" style={{ fontSize: '38px', lineHeight: 1 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        <span className="_14-regular" style={{ fontSize: '14px', marginLeft: '6px', color: 'var(--text-muted)' }}>
          {unit}
        </span>
      </h1>

      {/* 3. semicircle-chart from component.html with live gauge and center text-b */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '2px 0 -10px 0'
      }}>
        <svg 
          width="170" 
          height="124" 
          viewBox="0 0 160 124"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Tri-Color gradient: Orange -> Purple -> Coral Red */}
            <linearGradient id="componentGaugeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--secondary-orange)" />
              <stop offset="50%" stopColor="var(--secondary-purple)" />
              <stop offset="100%" stopColor="var(--secondary-red)" />
            </linearGradient>
            <filter id="gaugeFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={bgPath}
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity="0.25"
          />

          {/* Active Gradient Arc */}
          <path
            d={progressPath}
            fill="none"
            stroke="url(#componentGaugeGrad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#gaugeFilter)"
            style={{
              transition: 'stroke-dashoffset 0.35s ease'
            }}
          />

          {/* Needle Indicator Dot */}
          <circle
            cx={tipPos.x}
            cy={tipPos.y}
            r={5.5}
            fill="#ffffff"
            stroke="var(--secondary-purple)"
            strokeWidth="2.5"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
          />
        </svg>

        {/* 4. text-b from component.html in the center of the semicircle */}
        <div className="text-b" style={{
          position: 'absolute',
          top: '38px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none'
        }}>
          <h2 className="text-subtitle _32-semibold" style={{ fontSize: '24px', lineHeight: 1 }}>
            {loadPercent}%
          </h2>
          <p className="text-text2 _14-regular" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Load
          </p>
        </div>
      </div>

      {/* Sub-Metrics Footer Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '8px',
        borderTop: '1px solid var(--border-light)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="_12-regular">Spindle Status:</span>
          <span className="mono _12-regular" style={{ fontWeight: 600, color: 'var(--secondary-green)' }}>
            Optimal
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="_12-regular">Max Cap:</span>
          <span className="mono _12-regular" style={{ fontWeight: 600, color: 'var(--text-sub)' }}>
            {(maxValue / 1000).toFixed(0)}k {unit}
          </span>
        </div>
      </div>
    </div>
  );
}

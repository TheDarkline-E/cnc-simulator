import React, { useState } from 'react';
import { Maximize2, Minimize2, ChevronDown, Activity, Sparkles, RefreshCw, Layers } from 'lucide-react';
import CardVerticalBar from './charts/CardVerticalBar';
import CardHorizontalBar from './charts/CardHorizontalBar';
import CardLineChart from './charts/CardLineChart';
import CardArcGaugeDark from './charts/CardArcGaugeDark';
import CardDonutViolet from './charts/CardDonutViolet';
import CardTickGauge from './charts/CardTickGauge';

/**
 * FigmaPreviewDashboard - Complete 6-Card Production Layout from Preview Screenshot
 * Implements the exact UI/UX principles:
 * - 3x2 High-Contrast Card Triad (Pure White, Pitch Black, Royal Lavender)
 * - Authentic SVG charts and radiating tick/arc gauges
 * - Floating Page switcher capsule and Zoom/Fullscreen pill controls
 * - Toggleable Live CNC Telemetry vs Golden Spec data
 */
export default function FigmaPreviewDashboard({
  onSwitchPage,
  dro,
  simState,
  currentOperation,
  progressPercent = 0,
  stockConfig
}) {
  const [zoomLevel, setZoomLevel] = useState(100); // 60, 80, 100, 120
  const [useLiveTelemetry, setUseLiveTelemetry] = useState(false);
  const [showPageMenu, setShowPageMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 120));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 60));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Live CNC values when toggled
  const isRunning = simState === 'running';
  const cycleActivity = Math.round(progressPercent);
  const feedSpeed = dro?.feedRate || 800;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 20px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* 1. Header Bar matching Preview design */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        padding: '0 4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-main)',
            letterSpacing: '-0.3px',
            margin: 0,
            fontFamily: 'var(--font-sans)'
          }}>
            Preview
          </h2>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--secondary-indigo)',
            background: 'rgba(116, 116, 248, 0.12)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid rgba(116, 116, 248, 0.25)'
          }}>
            Figma Design System • 6 Core Cards
          </span>
        </div>

        {/* Live Telemetry Sync Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setUseLiveTelemetry(!useLiveTelemetry)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              background: useLiveTelemetry ? 'var(--secondary-green)' : 'var(--bg-card)',
              color: useLiveTelemetry ? '#ffffff' : 'var(--text-main)',
              border: '1px solid var(--border-card)',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: useLiveTelemetry ? '0 2px 10px rgba(52, 199, 89, 0.35)' : 'none',
              cursor: 'pointer'
            }}
            title="Toggle between Live CNC Simulation telemetry and golden sample data"
          >
            <Activity size={14} />
            <span>{useLiveTelemetry ? 'Live CNC Telemetry Active' : 'Sample Figma Data'}</span>
          </button>

          {/* Quick jump to 3D Studio */}
          <button
            onClick={() => onSwitchPage && onSwitchPage('studio')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--accent-purple)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: 'var(--shadow-btn)',
              cursor: 'pointer'
            }}
          >
            <Layers size={14} />
            <span>3D Machine Studio</span>
          </button>
        </div>
      </div>

      {/* 2. Master Outer Canvas Card (#eef1f5 / #151824) */}
      <div style={{
        flex: 1,
        background: 'var(--bg-card-hover)',
        borderRadius: '32px',
        padding: '24px 28px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid var(--border-card)'
      }}>
        {/* Zoom Scaler Container */}
        <div style={{
          width: '100%',
          height: '100%',
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: '20px',
          alignContent: 'center'
        }}>
          {/* Card 1 (Top-Left): White Card, Orange Bar Chart, 5.42K */}
          <CardVerticalBar
            title="Bar chart"
            metricValue={useLiveTelemetry ? `${(5.42 + progressPercent * 0.05).toFixed(2)}K` : "5.42K"}
            trend="22.41%"
          />

          {/* Card 2 (Top-Center): Pitch Black Card, Green Bar Chart, 22.6 Hours spent */}
          <CardHorizontalBar
            title="Bar chart"
            metricValue={useLiveTelemetry ? `${(22.6 + progressPercent * 0.1).toFixed(1)}` : "22.6"}
            metricSubtitle="Hours\nspent"
          />

          {/* Card 3 (Top-Right): White Card, Red Line Chart, 4.38K */}
          <CardLineChart
            title="Line chart"
            metricValue={useLiveTelemetry ? `${(feedSpeed / 1000).toFixed(2)}K` : "4.38K"}
            trend="22.41%"
          />

          {/* Card 4 (Bottom-Left): Pitch Black Card, Purple Donut Chart, 57% Total activity */}
          <CardArcGaugeDark
            title="Donut chart"
            metricValue={useLiveTelemetry ? `${cycleActivity}%` : "57%"}
            metricSubtitle="Total\nactivity"
            centerValue={useLiveTelemetry ? `${cycleActivity}%` : "17%"}
            centerPeriod={useLiveTelemetry ? currentOperation : "Jan"}
          />

          {/* Card 5 (Bottom-Center): Royal Lavender Card (#7474F8), White Donut */}
          <CardDonutViolet
            title="Donut chart"
            subtitle="Machine OEE Distribution"
          />

          {/* Card 6 (Bottom-Right): White Card, Green Donut Chart, 987.29 */}
          <CardTickGauge
            title="Donut chart"
            metricValue={useLiveTelemetry ? `${(987.29 - progressPercent * 2).toFixed(2)}` : "987.29"}
            centerValue={useLiveTelemetry ? `${cycleActivity}%` : "17%"}
            centerPeriod={useLiveTelemetry ? currentOperation : "Jan"}
          />
        </div>

        {/* 3. Floating Bottom Navigation & Controls */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '24px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          zIndex: 50
        }}>
          {/* Bottom-Left: Page Capsule Selector */}
          <div style={{ position: 'relative', pointerEvents: 'auto' }}>
            <button
              onClick={() => setShowPageMenu(!showPageMenu)}
              style={{
                background: '#141416',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '80px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 500,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer'
              }}
            >
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Page:</span>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: '#7474F8',
                display: 'inline-block'
              }} />
              <span style={{ fontWeight: 600 }}>Charts</span>
              <ChevronDown size={14} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
            </button>

            {/* Dropdown Menu */}
            {showPageMenu && (
              <div style={{
                position: 'absolute',
                bottom: '44px',
                left: 0,
                background: '#1e2029',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '6px',
                width: '200px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <button
                  onClick={() => {
                    setShowPageMenu(false);
                    onSwitchPage && onSwitchPage('charts');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(116, 116, 248, 0.2)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#7474F8' }} />
                  <span>Charts & Analytics</span>
                </button>

                <button
                  onClick={() => {
                    setShowPageMenu(false);
                    onSwitchPage && onSwitchPage('studio');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.75)',
                    fontSize: '12px',
                    fontWeight: 500,
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#34C759' }} />
                  <span>3D Digital Twin Studio</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom-Right: Zoom Controls + Fullscreen Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
            <div style={{
              background: '#141416',
              borderRadius: '80px',
              padding: '4px 6px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  color: '#ffffff',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                —
              </button>

              <span style={{
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                padding: '0 10px',
                fontFamily: 'var(--font-mono)'
              }}>
                {zoomLevel}%
              </span>

              <button
                onClick={handleZoomIn}
                title="Zoom In"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  color: '#ffffff',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: '#141416',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer'
              }}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { 
  Play, Pause, Square, RotateCcw, 
  Clock, Gauge, Scissors, Layers 
} from 'lucide-react';

export default function SimControls({
  simState,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  speed,
  onSetSpeed,
  progressPercent,
  onSeek,
  elapsedTimeSec,
  estimatedTimeSec,
  removedPercent,
  currentOperation
}) {
  const speeds = [0.5, 1.0, 2.0, 4.0];

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{
      padding: '10px 24px 14px 24px',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 20
    }}>
      {/* Top Timeline Scrub Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: '40px' }}>
          {formatTime(elapsedTimeSec)}
        </span>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="range"
            min="0"
            max="100"
            value={progressPercent}
            onChange={(e) => onSeek(Number(e.target.value))}
            style={{
              width: '100%',
              accentColor: 'var(--accent-primary)',
              cursor: 'pointer',
              height: '5px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--border-color)'
            }}
          />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '40px', textAlign: 'right' }}>
          {progressPercent}%
        </span>
      </div>

      {/* Bottom Controls Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Playback Buttons (Pinterest Tactile Pills) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {simState === 'running' ? (
            <button
              onClick={onPause}
              className="accent"
              style={{ padding: '7px 18px', borderRadius: 'var(--radius-pill)', gap: '6px' }}
            >
              <Pause size={15} /> Pause
            </button>
          ) : simState === 'paused' ? (
            <button
              onClick={onResume}
              className="primary"
              style={{ padding: '7px 18px', borderRadius: 'var(--radius-pill)', gap: '6px' }}
            >
              <Play size={15} /> Resume Machining
            </button>
          ) : (
            <button
              onClick={onStart}
              className="primary"
              style={{ padding: '7px 20px', borderRadius: 'var(--radius-pill)', gap: '6px' }}
            >
              <Play size={15} /> Run Machining
            </button>
          )}

          <button
            onClick={onStop}
            title="Stop Simulation"
            style={{ padding: '7px 14px', borderRadius: 'var(--radius-pill)' }}
          >
            <Square size={13} /> Stop
          </button>

          <button
            onClick={onReset}
            title="Reset Stock & Origin"
            style={{ padding: '7px 14px', borderRadius: 'var(--radius-pill)' }}
          >
            <RotateCcw size={13} /> Reset
          </button>

          {/* Speed Presets Pill Switcher */}
          <div style={{
            display: 'flex',
            gap: '2px',
            marginLeft: '10px',
            background: 'var(--bg-primary)',
            padding: '3px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-color)'
          }}>
            {speeds.map(s => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                style={{
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: speed === s ? 'var(--accent-primary)' : 'transparent',
                  color: speed === s ? 'var(--bg-secondary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  boxShadow: speed === s ? 'var(--shadow-sm)' : 'none'
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Live Machining Metrics Readout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Scissors size={14} color="var(--accent-blue)" />
            <span style={{ color: 'var(--text-muted)' }}>Material Cut:</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{removedPercent}%</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} color="var(--accent-primary)" />
            <span style={{ color: 'var(--text-muted)' }}>Active Stage:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentOperation}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)' }}>Remaining:</span>
            <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {formatTime(Math.max(0, estimatedTimeSec - elapsedTimeSec))}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

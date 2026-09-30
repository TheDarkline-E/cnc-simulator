import React from 'react';
import { 
  Play, Pause, Square, RotateCcw, FastForward, 
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
  const speeds = [0.25, 0.5, 1.0, 2.0, 4.0];

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{
      height: '84px',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '8px 24px',
      zIndex: 20
    }}>
      {/* Top Timeline Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {formatTime(elapsedTimeSec)}
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={progressPercent}
          onChange={(e) => onSeek(Number(e.target.value))}
          style={{
            flex: 1,
            accentColor: 'var(--accent-blue)',
            cursor: 'pointer',
            height: '6px'
          }}
        />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {progressPercent}%
        </span>
      </div>

      {/* Bottom Controls Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Playback Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {simState === 'running' ? (
            <button onClick={onPause} className="accent" style={{ padding: '6px 14px' }}>
              <Pause size={15} /> Pause
            </button>
          ) : simState === 'paused' ? (
            <button onClick={onResume} className="primary" style={{ padding: '6px 14px' }}>
              <Play size={15} /> Resume
            </button>
          ) : (
            <button onClick={onStart} className="primary" style={{ padding: '6px 14px' }}>
              <Play size={15} /> Start Simulation
            </button>
          )}

          <button onClick={onStop} title="Stop Simulation">
            <Square size={14} /> Stop
          </button>

          <button onClick={onReset} title="Reset Position">
            <RotateCcw size={14} /> Reset
          </button>

          {/* Speed Presets */}
          <div style={{ display: 'flex', gap: '2px', marginLeft: '12px', background: 'var(--bg-primary)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            {speeds.map(s => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  background: speed === s ? 'var(--accent-blue)' : 'transparent',
                  color: speed === s ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Live Metrics Readout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Scissors size={14} color="var(--accent-blue)" />
            <span style={{ color: 'var(--text-muted)' }}>Material Removed:</span>
            <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{removedPercent}%</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} color="var(--accent-green)" />
            <span style={{ color: 'var(--text-muted)' }}>Current Op:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentOperation}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} color="var(--accent-yellow)" />
            <span style={{ color: 'var(--text-muted)' }}>Est. Remaining:</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {formatTime(Math.max(0, estimatedTimeSec - elapsedTimeSec))}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

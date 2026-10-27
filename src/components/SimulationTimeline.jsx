import React from 'react';
import { 
  Play, Pause, RotateCcw, Clock, AlertTriangle
} from 'lucide-react';

export default function SimulationTimeline({
  simState = 'ready',
  progressPercent = 0,
  elapsedTimeSec = 0,
  estimatedTimeSec = 0,
  removedPercent = 0,
  currentOperation = 'Idle',
  dro = { x: 0, y: 0, z: 25, spindleRPM: 0, feedRate: 800 },
  speed = 1.0,
  onSetSpeed,
  onStart,
  onPause,
  onResume,
  onReset,
  onSeek
}) {
  const isRunning = simState === 'running';
  const isPaused = simState === 'paused';

  const formatTime = (secs) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const speeds = [0.5, 1.0, 2.0, 4.0];

  const handleTogglePlay = () => {
    if (isRunning) {
      onPause();
    } else if (isPaused) {
      onResume();
    } else {
      onStart();
    }
  };

  const handleSliderChange = (e) => {
    const pct = parseFloat(e.target.value) || 0;
    onSeek(pct);
  };

  const formatCoord = (val = 0) => {
    const n = Number(val) || 0;
    return `${n >= 0 ? '+' : ''}${n.toFixed(2)}`;
  };

  return (
    <footer className="cad-simulation-bar" role="region" aria-label="Simulation Player">
      {/* Left: Standard Transport Controls */}
      <div className="sim-transport-group">
        <button
          type="button"
          className="sim-transport-btn"
          onClick={onReset}
          title="Reset to Start"
          aria-label="Reset simulation"
        >
          <RotateCcw size={12} />
        </button>

        <button
          type="button"
          className={`sim-transport-btn is-play ${isRunning ? 'is-running' : ''}`}
          onClick={handleTogglePlay}
          title={isRunning ? "Feed Hold (Pause)" : "Simulate"}
          aria-label={isRunning ? "Pause" : "Play"}
        >
          {isRunning ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
        </button>

        {/* Speed Selector */}
        <div className="sim-speed-strip" role="group" aria-label="Playback speed">
          {speeds.map(sp => (
            <button
              key={sp}
              type="button"
              className={`sim-speed-btn ${speed === sp ? 'is-active' : ''}`}
              onClick={() => onSetSpeed(sp)}
            >
              {sp}x
            </button>
          ))}
        </div>

        <div className="sim-bar-divider" />

        {/* Current Operation Text */}
        <div className="sim-active-op mono" title="Current Executing Operation">
          <span className="op-bullet" />
          <span className="op-text">{currentOperation || (simState === 'complete' ? 'Cycle Complete' : 'Ready')}</span>
        </div>
      </div>

      {/* Center: Timeline Scrubber & Elapsed Time */}
      <div className="sim-timeline-group">
        <span className="sim-time-tag mono">{formatTime(elapsedTimeSec)}</span>
        <div className="sim-scrubber-track">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progressPercent}
            onChange={handleSliderChange}
            className="sim-scrubber-slider"
            aria-label="Simulation timeline scrub"
          />
          <div 
            className="sim-scrubber-fill"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
        <span className="sim-time-tag mono sim-total-time">
          {estimatedTimeSec > 0 ? formatTime(estimatedTimeSec) : '--:--'}
        </span>
      </div>

      {/* Right: Technical DRO & Spindle Readout */}
      <div className="sim-dro-group">
        {/* Coordinates */}
        <div className="dro-axis-readout mono">
          <span className="dro-axis"><b className="axis-x">X</b> {formatCoord(dro?.x)}</span>
          <span className="dro-axis"><b className="axis-y">Y</b> {formatCoord(dro?.y)}</span>
          <span className="dro-axis"><b className="axis-z">Z</b> {formatCoord(dro?.z ?? 25)}</span>
        </div>

        <div className="sim-bar-divider" />

        {/* Feed & Speed */}
        <div className="dro-telemetry-readout mono">
          <span>{isRunning ? (Number(dro?.spindleRPM) || 8000) : 0} <small>RPM</small></span>
          <span>{(Number(dro?.feedRate) || 800).toFixed(0)} <small>mm/m</small></span>
          <span>{Math.round(removedPercent)}% <small>Cut</small></span>
        </div>

        {dro?.limitsExceeded && (
          <div className="dro-alarm-tag" title="Axis soft limit exceeded">
            <AlertTriangle size={11} />
            <span>LIMIT</span>
          </div>
        )}
      </div>
    </footer>
  );
}

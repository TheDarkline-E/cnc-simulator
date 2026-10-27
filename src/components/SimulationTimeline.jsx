import React from 'react';
import { 
  Play, Pause, RotateCcw, Clock, Gauge, 
  Activity, AlertTriangle, Layers, ChevronRight,
  FastForward, Scissors
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
    <footer className="simulation-timeline" role="region" aria-label="Simulation Playback Timeline">
      {/* Top Scrubber & Progress Strip */}
      <div className="timeline-scrubber-row">
        <div className="time-display time-elapsed mono">
          <Clock size={12} className="time-icon" />
          <span>{formatTime(elapsedTimeSec)}</span>
        </div>

        <div className="scrubber-track-container">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progressPercent}
            onChange={handleSliderChange}
            className="timeline-slider"
            aria-label="Simulation progress scrub"
          />
          <div 
            className="timeline-fill"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>

        <div className="time-display time-total mono">
          <span>{estimatedTimeSec > 0 ? formatTime(estimatedTimeSec) : '--:--'}</span>
        </div>
      </div>

      {/* Main Controls & Live Telemetry Strip */}
      <div className="timeline-controls-row">
        {/* Playback Controls Left */}
        <div className="controls-left">
          <button
            type="button"
            className={`btn-play-pause ${isRunning ? 'is-running' : ''}`}
            onClick={handleTogglePlay}
            title={isRunning ? "Pause simulation (Feed Hold)" : "Start simulation"}
            aria-label={isRunning ? "Pause" : "Play"}
          >
            {isRunning ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" style={{ marginLeft: '2px' }} />
            )}
          </button>

          <button
            type="button"
            className="btn-timeline-action"
            onClick={onReset}
            title="Reset simulation to beginning and clear cuts"
            aria-label="Reset simulation"
          >
            <RotateCcw size={15} />
          </button>

          {/* Speed Selector */}
          <div className="speed-selector" role="group" aria-label="Playback speed">
            {speeds.map(sp => (
              <button
                key={sp}
                type="button"
                className={`btn-speed ${speed === sp ? 'is-selected' : ''}`}
                onClick={() => onSetSpeed(sp)}
              >
                {sp}x
              </button>
            ))}
          </div>

          <div className="v-divider" />

          {/* Current Operation Name */}
          <div className="current-op-badge" title="Active Machining Operation">
            <Layers size={13} className="op-icon" />
            <span className="op-label">
              {currentOperation || (simState === 'complete' ? 'Machining Complete' : 'Idle / Standby')}
            </span>
          </div>
        </div>

        {/* Live Metrics & DRO Right */}
        <div className="controls-right">
          {/* Live Cutting DRO */}
          <div className="dro-pill-group">
            <div className="dro-coordinate">
              <span className="coord-axis axis-x">X</span>
              <span className="coord-val mono">{formatCoord(dro?.x)}</span>
            </div>
            <div className="dro-coordinate">
              <span className="coord-axis axis-y">Y</span>
              <span className="coord-val mono">{formatCoord(dro?.y)}</span>
            </div>
            <div className="dro-coordinate">
              <span className="coord-axis axis-z">Z</span>
              <span className="coord-val mono">{formatCoord(dro?.z ?? 25)}</span>
            </div>
          </div>

          {/* Spindle & Feed Indicators */}
          <div className="telemetry-compact-pill">
            <span className="metric-tag">
              <Gauge size={12} />
              <span className="mono">{isRunning ? (Number(dro?.spindleRPM) || 8000) : 0}</span>
              <small>RPM</small>
            </span>
            <span className="metric-tag">
              <Activity size={12} />
              <span className="mono">{(Number(dro?.feedRate) || 800).toFixed(0)}</span>
              <small>mm/m</small>
            </span>
            <span className="metric-tag">
              <Scissors size={12} />
              <span className="mono">{Math.round(removedPercent)}%</span>
              <small>Cut</small>
            </span>
          </div>

          {/* Limit Alarm Warning Pill if tripped */}
          {dro?.limitsExceeded && (
            <div className="alarm-pill" title="Axis soft limit exceeded!">
              <AlertTriangle size={13} />
              <span>Limit Alarm</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

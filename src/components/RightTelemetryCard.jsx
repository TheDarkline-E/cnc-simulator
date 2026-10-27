import React, { useState } from 'react';
import {
  Settings2, ClipboardCheck, Sun, Moon, Gauge, Activity, RotateCcw,
  Play, Pause, ChevronRight, CircleDot, ScanLine, ChartNoAxesCombined
} from 'lucide-react';

const formatCoordinate = (value = 0) => {
  const number = Number(value) || 0;
  return `${number >= 0 ? '+' : ''}${number.toFixed(2)}`;
};

export default function RightTelemetryCard({
  dro = { x: 0, y: 0, z: 25, spindleRPM: 0, feedRate: 800 },
  simState = 'ready',
  currentOperation = 'Idle',
  progressPercent = 0,
  removedPercent = 0,
  elapsedTimeSec = 0,
  onOpenSettings,
  onOpenInspection,
  onOpenCharts,
  toggleTheme,
  theme = 'light',
  onStart,
  onPause,
  onResume,
  onReset,
  speed = 1,
  onSetSpeed,
  onSeek
}) {
  const [activeTab, setActiveTab] = useState('telemetry');
  const isRunning = simState === 'running';
  const isPaused = simState === 'paused';
  const rpm = isRunning ? (Number(dro?.spindleRPM) || 8000) : 0;
  const mrr = isRunning ? (Number(dro?.mrr) || 0) : 0;
  const roughness = dro?.surfaceRoughness || { Ra: 1.6, Rz: 6.3, isoGrade: 'N7' };
  const stateLabel = ({ running: 'Cycle running', paused: 'Feed hold', complete: 'Cycle complete' })[simState] || 'Simulator ready';
  const speeds = [0.5, 1, 2, 4];
  const runAction = isRunning ? onPause : isPaused ? onResume : onStart;

  return (
    <aside className="telemetry-rail" aria-label="Machine telemetry and controls">
      <header className="rail-header">
        <div className="machine-identity">
          <div className="machine-mark" aria-hidden="true"><Gauge size={19} strokeWidth={1.7} /></div>
          <div className="machine-identity-copy">
            <div className="machine-name">Haas VF-2SS</div>
            <div className="machine-subtitle"><span className={`status-dot ${isRunning ? 'is-running' : ''}`} />{stateLabel}</div>
          </div>
        </div>
        <div className="rail-actions">
          <button className="icon-action" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} appearance`} aria-label="Toggle appearance">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="icon-action" onClick={onOpenSettings} title="Machine and tooling setup" aria-label="Machine settings"><Settings2 size={16} /></button>
          <button className="icon-action" onClick={onOpenInspection} title="Quality metrology certificate" aria-label="Quality inspection"><ClipboardCheck size={16} /></button>
        </div>
      </header>

      <div className="rail-sections-switcher" role="tablist" aria-label="Right panel views">
        <button role="tab" aria-selected={activeTab === 'telemetry'} className={activeTab === 'telemetry' ? 'is-active' : ''} onClick={() => setActiveTab('telemetry')}>Telemetry</button>
        <button role="tab" aria-selected={activeTab === 'analytics'} className={activeTab === 'analytics' ? 'is-active' : ''} onClick={() => setActiveTab('analytics')}>Analytics</button>
        <button role="tab" aria-selected={activeTab === 'all'} className={activeTab === 'all' ? 'is-active' : ''} onClick={() => { setActiveTab('all'); onOpenCharts?.(); }}>All 6</button>
      </div>

      {activeTab === 'telemetry' ? (
        <div className="telemetry-content">
          <section className="telemetry-card coordinate-card">
            <div className="panel-heading">
              <div className="panel-title-group"><ScanLine size={15} /><h3>Coordinate readout</h3></div>
              <span className="unit-tag">G54 · mm</span>
            </div>
            <div className="coordinate-list">
              <div className="coordinate-row"><span className="axis-label axis-x">X</span><span className="coordinate-value">{formatCoordinate(dro?.x)}</span><span className="coordinate-unit">mm</span><span className="axis-limit">±150.00</span></div>
              <div className="coordinate-row"><span className="axis-label axis-y">Y</span><span className="coordinate-value">{formatCoordinate(dro?.y)}</span><span className="coordinate-unit">mm</span><span className="axis-limit">±100.00</span></div>
              <div className="coordinate-row"><span className="axis-label axis-z">Z</span><span className="coordinate-value">{formatCoordinate(dro?.z ?? 25)}</span><span className="coordinate-unit">mm</span><span className="axis-limit">−70 / +50</span></div>
            </div>
          </section>

          <section className="telemetry-card cutting-card">
            <div className="panel-heading">
              <div className="panel-title-group"><Activity size={15} /><h3>Live cutting</h3></div>
              <span className={`live-state ${isRunning ? 'active' : ''}`}><span />{isRunning ? 'Live' : 'Standby'}</span>
            </div>
            <div className="cutting-metrics-grid">
              <div className="cutting-metric"><span className="metric-label"><span className="metric-indicator cyan" />Spindle speed</span><div className="metric-readout">{rpm.toLocaleString('en-US')}<small>RPM</small></div></div>
              <div className="cutting-metric"><span className="metric-label"><span className="metric-indicator green" />Feed rate</span><div className="metric-readout">{(Number(dro?.feedRate) || 800).toLocaleString('en-US')}<small>mm/min</small></div></div>
              <div className="cutting-metric"><span className="metric-label"><span className="metric-indicator neutral" />Material removal</span><div className="metric-readout">{mrr.toFixed(1)}<small>cm³/min</small></div></div>
              <div className="cutting-metric"><span className="metric-label"><span className="metric-indicator blue" />Coolant</span><div className="metric-readout metric-readout-text">{dro?.coolantActive ? 'Flood · M08' : 'Off · M09'}</div></div>
            </div>
            <div className="roughness-strip">
              <div><span>Surface roughness</span><strong>Ra <b>{Number(roughness?.Ra ?? 1.6).toFixed(2)}</b> µm <i>·</i> Rz <b>{Number(roughness?.Rz ?? 6.3).toFixed(2)}</b> µm</strong></div>
              <span className="roughness-grade">{String(roughness?.isoGrade || 'N7').split(' ')[0]}</span>
            </div>
          </section>

          <section className="telemetry-card simulation-card">
            <div className="panel-heading simulation-heading"><div className="panel-title-group"><CircleDot size={15} /><h3>Simulation</h3></div><span className="simulation-percent">{Math.round(progressPercent)}%</span></div>
            <div className="progress-meta"><span>{currentOperation || 'Waiting for cycle'}</span><span className="mono">{Math.round(progressPercent)}%</span></div>
            <input className="progress-slider" aria-label="Simulation progress" type="range" min="0" max="100" step="1" value={Math.round(progressPercent)} onChange={(e) => onSeek?.(Number(e.target.value))} />
            <div className="simulation-actions">
              <button className="simulation-primary" onClick={runAction}>
                {isRunning ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
                {isRunning ? 'Feed hold' : isPaused ? 'Resume cycle' : simState === 'complete' ? 'Run again' : 'Run machining'}
              </button>
              <button className="simulation-reset" onClick={onReset} title="Reset stock and return the machine to home"><RotateCcw size={15} /><span>Reset</span></button>
            </div>
            <div className="speed-control"><span>Playback</span><div className="speed-options" role="group" aria-label="Simulation speed">
              {speeds.map((value) => <button key={value} className={speed === value ? 'is-active' : ''} onClick={() => onSetSpeed?.(value)} aria-pressed={speed === value}>{value.toFixed(1)}×</button>)}
            </div></div>
          </section>

          <button className="analytics-link" onClick={() => onOpenCharts?.()}><span className="analytics-link-icon"><ChartNoAxesCombined size={16} /></span><span><strong>Production analytics</strong><small>Explore the six chart dashboard</small></span><ChevronRight size={16} /></button>
        </div>
      ) : (
        <div className="live-analytics-content">
          <div className="analytics-intro"><span className="eyebrow">LIVE SESSION</span><h3>Process overview</h3><p>Measurements from the active simulation engine. Values update with machine motion.</p></div>
          <section className="telemetry-card analytics-snapshot-card">
            <div className="analytics-value-row"><span>Toolpath completed</span><strong>{Math.round(progressPercent)}<small>%</small></strong></div>
            <div className="analytics-track"><span style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }} /></div>
          </section>
          <section className="telemetry-card analytics-snapshot-card">
            <div className="analytics-value-row"><span>Material removed</span><strong>{Math.round(removedPercent)}<small>%</small></strong></div>
            <div className="analytics-track material-track"><span style={{ width: `${Math.min(100, Math.max(0, removedPercent))}%` }} /></div>
          </section>
          <div className="analytics-pair-grid">
            <section className="telemetry-card analytics-small-card"><span>Material removal rate</span><strong>{mrr.toFixed(1)}<small>cm³/min</small></strong></section>
            <section className="telemetry-card analytics-small-card"><span>Elapsed cycle</span><strong>{Math.floor(elapsedTimeSec / 60)}<small>m</small> {Math.floor(elapsedTimeSec % 60).toString().padStart(2, '0')}<small>s</small></strong></section>
          </div>
          <section className="telemetry-card finish-summary"><div className="finish-heading"><Activity size={15} /><span>Surface finish estimate</span></div><div className="finish-values"><div><small>Ra</small><strong>{Number(roughness?.Ra ?? 1.6).toFixed(2)} <i>µm</i></strong></div><div><small>Rz</small><strong>{Number(roughness?.Rz ?? 6.3).toFixed(2)} <i>µm</i></strong></div><span className="roughness-grade">{String(roughness?.isoGrade || 'N7').split(' ')[0]}</span></div></section>
          <button className="analytics-link" onClick={() => onOpenCharts?.()}><span className="analytics-link-icon"><ChartNoAxesCombined size={16} /></span><span><strong>Open chart dashboard</strong><small>Explore visual analysis cards</small></span><ChevronRight size={16} /></button>
        </div>
      )}
    </aside>
  );
}

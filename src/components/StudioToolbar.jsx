import React from 'react';
import { 
  Box, Play, Pause, RotateCcw, RefreshCw, 
  Sun, Moon, ClipboardCheck, Sliders, Layers,
  Compass, ShieldCheck, CheckCircle2, ChevronRight,
  Sparkles
} from 'lucide-react';

export default function StudioToolbar({
  projectName = "Precision CNC Milling Studio",
  setupName = "Setup 1 (G54)",
  stockConfig,
  toolConfig,
  simState = 'ready',
  isGenerating = false,
  onRegenerate,
  onStart,
  onPause,
  onResume,
  onReset,
  onOpenInspection,
  theme = 'light',
  onToggleTheme
}) {
  const isRunning = simState === 'running';
  const isPaused = simState === 'paused';

  const materialNames = {
    al6061: 'Al 6061-T6',
    brass360: 'Brass 360',
    brass: 'Brass 360',
    steel1018: 'Steel 1018',
    steel: 'Steel 1018',
    stainless304: 'SS 304',
    stainless: 'SS 304',
    delrin: 'Delrin POM'
  };

  const matName = materialNames[stockConfig?.material] || 'Al 6061-T6';

  return (
    <header className="studio-toolbar" role="banner">
      {/* Left: Branding & Setup Lockup */}
      <div className="toolbar-left">
        <div className="toolbar-brand">
          <div className="brand-badge" aria-hidden="true">
            <Box size={18} strokeWidth={2.2} />
          </div>
          <div className="brand-titles">
            <h1 className="brand-heading">{projectName}</h1>
            <div className="brand-subline">
              <span className="setup-chip">{setupName}</span>
              <span className="bullet-sep">·</span>
              <span className="spec-chip">WCS: G54 (Top-Center)</span>
              <span className="bullet-sep">·</span>
              <span className="spec-chip">{stockConfig?.width}×{stockConfig?.length}×{stockConfig?.height} mm</span>
              <span className="bullet-sep">·</span>
              <span className="alloy-chip">{matName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Live Studio Status / Feedback Pill */}
      <div className="toolbar-center">
        <div className={`status-pill status-${simState}`}>
          <span className="status-indicator-dot" />
          <span className="status-pill-text">
            {simState === 'running' && 'Simulation Active'}
            {simState === 'paused' && 'Feed Hold / Paused'}
            {simState === 'complete' && 'Cycle Complete · Inspection Ready'}
            {simState === 'ready' && 'Machining Program Ready'}
            {simState === 'idle' && 'Standby'}
          </span>
          {isGenerating && (
            <span className="generating-badge">
              <RefreshCw size={12} className="spin-icon" /> Computing Passes...
            </span>
          )}
        </div>
      </div>

      {/* Right: Primary CAM Actions */}
      <div className="toolbar-right">
        {/* Regenerate Toolpaths Button */}
        <button
          type="button"
          className="btn-toolbar btn-secondary"
          onClick={onRegenerate}
          disabled={isRunning || isGenerating}
          title="Regenerate all CAM toolpaths with current parameters"
        >
          <RefreshCw size={14} className={isGenerating ? 'spin-icon' : ''} />
          <span>Regenerate Passes</span>
        </button>

        {/* Primary Simulation Action */}
        {isRunning ? (
          <button
            type="button"
            className="btn-toolbar btn-primary is-pause"
            onClick={onPause}
            title="Pause physical simulation (Feed Hold)"
          >
            <Pause size={14} fill="currentColor" />
            <span>Feed Hold</span>
          </button>
        ) : isPaused ? (
          <button
            type="button"
            className="btn-toolbar btn-primary is-resume"
            onClick={onResume}
            title="Resume machining simulation"
          >
            <Play size={14} fill="currentColor" />
            <span>Resume Cycle</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-toolbar btn-primary is-start"
            onClick={onStart}
            disabled={isGenerating}
            title="Start CNC digital twin simulation"
          >
            <Play size={14} fill="currentColor" />
            <span>Simulate Job</span>
          </button>
        )}

        <button
          type="button"
          className="btn-toolbar btn-ghost"
          onClick={onReset}
          disabled={isRunning}
          title="Reset tool to safe home and restore stock"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>

        <div className="toolbar-divider" />

        {/* Quality Metrology Certificate Dialog */}
        <button
          type="button"
          className="btn-toolbar btn-ghost icon-only"
          onClick={onOpenInspection}
          title="View Machining Metrology & Quality Certificate"
          aria-label="Quality Certificate"
        >
          <ClipboardCheck size={16} />
        </button>

        {/* Theme Switcher */}
        <button
          type="button"
          className="btn-toolbar btn-ghost icon-only"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}

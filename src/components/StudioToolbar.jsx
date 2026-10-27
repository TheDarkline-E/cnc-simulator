import React from 'react';
import { 
  Box, Play, Pause, RotateCcw, RefreshCw, 
  Sun, Moon, ClipboardCheck, Sliders, Layers,
  Disc, CheckCircle2
} from 'lucide-react';

export default function StudioToolbar({
  projectName = "Haas VF-2SS Machining Studio",
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
  theme = 'dark',
  onToggleTheme,
  onQuickAddOp
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
    <header className="cad-studio-ribbon" role="banner">
      {/* Left: Aura Brand & Workspace Identity */}
      <div className="ribbon-section ribbon-left">
        <div className="app-symbol" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 80 80" fill="none" className="aura-brand-orb">
            <defs>
              <linearGradient id="orbLimeTop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e3f9b3" />
                <stop offset="55%" stopColor="#c6ee78" />
                <stop offset="100%" stopColor="#a5d856" />
              </linearGradient>
              <linearGradient id="orbPurpleMid" x1="15%" y1="0%" x2="85%" y2="100%">
                <stop offset="0%" stopColor="#dcd0ff" />
                <stop offset="50%" stopColor="#b69ef8" />
                <stop offset="100%" stopColor="#9e82f2" />
              </linearGradient>
              <radialGradient id="orbFrostLeft" cx="35%" cy="45%" r="65%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="55%" stopColor="#e3e2ea" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#c4bce0" stopOpacity="0.85" />
              </radialGradient>
              <linearGradient id="orbLimeBottom" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#eefd80" />
                <stop offset="40%" stopColor="#d2f48e" />
                <stop offset="100%" stopColor="#b8e468" />
              </linearGradient>
            </defs>
            <ellipse cx="40" cy="40" rx="22" ry="33" transform="rotate(-28 40 40)" fill="url(#orbLimeTop)" />
            <ellipse cx="45" cy="44" rx="18" ry="29" transform="rotate(-24 45 44)" fill="url(#orbLimeBottom)" opacity="0.85" />
            <ellipse cx="42" cy="41" rx="21" ry="32" transform="rotate(32 42 41)" fill="url(#orbPurpleMid)" opacity="0.92" />
            <circle cx="35" cy="41" r="21" fill="url(#orbFrostLeft)" />
          </svg>
        </div>
        <div className="doc-metadata">
          <div className="brand-wordmark-row">
            <span className="brand-aura-name">aura</span>
            <span className="brand-aura-tag">cnc studio</span>
          </div>
          <span className="doc-setup-tag">Setup 1 · G54</span>
        </div>
      </div>

      {/* Center: Quick CAM Operations & Simulation Pill Controls */}
      <div className="ribbon-section ribbon-center">
        {/* Quick Operation Inserters */}
        <div className="ribbon-tool-group" role="group" aria-label="Quick operations">
          <button
            type="button"
            className="ribbon-btn pill-btn-op"
            onClick={() => onQuickAddOp?.('facing')}
            title="Create Face Milling Operation"
          >
            <Disc size={13} />
            <span>Face</span>
          </button>
          <button
            type="button"
            className="ribbon-btn pill-btn-op"
            onClick={() => onQuickAddOp?.('roughing')}
            title="Create 3D Adaptive Roughing Operation"
          >
            <Layers size={13} />
            <span>Adaptive</span>
          </button>
          <button
            type="button"
            className="ribbon-btn pill-btn-op"
            onClick={() => onQuickAddOp?.('pocketing')}
            title="Create Cavity Pocket Operation"
          >
            <Box size={13} />
            <span>Pocket</span>
          </button>
          <button
            type="button"
            className="ribbon-btn pill-btn-op"
            onClick={() => onQuickAddOp?.('contouring')}
            title="Create 2D Contour Finish Operation"
          >
            <CheckCircle2 size={13} />
            <span>Contour</span>
          </button>
        </div>

        <div className="ribbon-divider" />

        {/* Regenerate Action */}
        <button
          type="button"
          className="ribbon-btn pill-btn-regen"
          onClick={onRegenerate}
          disabled={isRunning || isGenerating}
          title="Regenerate all toolpaths with current parameters"
        >
          <RefreshCw size={13} className={isGenerating ? 'spin-icon' : ''} />
          <span>{isGenerating ? 'Regenerating...' : 'Regenerate'}</span>
        </button>

        {/* Primary Simulation Button */}
        {isRunning ? (
          <button
            type="button"
            className="ribbon-btn btn-state-pause pill-btn-primary"
            onClick={onPause}
            title="Pause physical simulation (Feed Hold)"
          >
            <Pause size={13} fill="currentColor" />
            <span>Feed Hold</span>
          </button>
        ) : isPaused ? (
          <button
            type="button"
            className="ribbon-btn btn-state-run pill-btn-primary"
            onClick={onResume}
            title="Resume machining cycle"
          >
            <Play size={13} fill="currentColor" />
            <span>Resume Cycle</span>
          </button>
        ) : (
          <button
            type="button"
            className="ribbon-btn btn-state-run pill-btn-primary"
            onClick={onStart}
            disabled={isGenerating}
            title="Run CAM simulation with physical material removal"
          >
            <Play size={13} fill="currentColor" />
            <span>Simulate Job</span>
          </button>
        )}

        <button
          type="button"
          className="ribbon-btn pill-btn-reset"
          onClick={onReset}
          disabled={isRunning}
          title="Reset spindle to home and restore raw stock"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>

      {/* Right: Technical Metadata & Aura Swatches */}
      <div className="ribbon-section ribbon-right">
        <div className="ribbon-stock-spec" title="Raw Stock Billet Dimensions">
          <span className="spec-alloy">{matName}</span>
          <span className="spec-dim mono">{stockConfig?.width}×{stockConfig?.length}×{stockConfig?.height}</span>
        </div>

        {/* Aura Brand Bento Swatches */}
        <div className="aura-swatches-pill-group" title="Aura Brand Swatches">
          <div className="aura-mini-swatch swatch-lime" />
          <div className="aura-mini-swatch swatch-lavender" />
        </div>

        <div className="ribbon-divider" />

        <button
          type="button"
          className="ribbon-btn icon-only pill-icon-btn"
          onClick={onOpenInspection}
          title="Inspection & Metrology Certificate"
          aria-label="Quality Certificate"
        >
          <ClipboardCheck size={14} />
        </button>

        <button
          type="button"
          className="ribbon-btn icon-only pill-icon-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} UI mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}

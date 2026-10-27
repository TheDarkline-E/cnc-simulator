import React, { useState } from 'react';
import { 
  Folder, FolderOpen, Box, Layers, Wrench, Disc, 
  CheckCircle2, Plus, Trash2, Eye, EyeOff, 
  ChevronRight, ChevronDown, Activity, RefreshCw,
  Sparkles, FileCode, Sliders, AlertCircle, X
} from 'lucide-react';

export default function JobExplorer({
  stockConfig,
  toolConfig,
  operations = [],
  onUpdateOperations,
  userPartFile,
  cadStats,
  selectedItem,
  onSelectItem,
  currentOperation = 'Idle',
  simState = 'ready',
  onRegenerate,
  needsRegen = false
}) {
  const [setupExpanded, setSetupExpanded] = useState(true);
  const [opsExpanded, setOpsExpanded] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const partDisplayName = typeof userPartFile === 'string'
    ? userPartFile.split('/').pop().replace('.stl', '').replace('.obj', '').replace(/_/g, ' ')
    : (userPartFile?.name || 'Custom CAD Part');

  const handleToggleOp = (e, id) => {
    e.stopPropagation();
    const updated = operations.map(op => 
      op.id === id ? { ...op, enabled: !op.enabled } : op
    );
    onUpdateOperations(updated);
  };

  const handleDeleteOp = (e, id) => {
    e.stopPropagation();
    const updated = operations.filter(op => op.id !== id);
    onUpdateOperations(updated);
  };

  const handleAddOperation = (type) => {
    setShowAddMenu(false);
    const templates = {
      facing: { name: 'Top Surfacing Pass', depth: 1.0, type: 'facing', enabled: true },
      roughing: { name: '3D Adaptive Roughing', depth: 8.0, type: 'roughing', enabled: true },
      pocketing: { name: 'Center Cavity Pocket', depth: 8.0, width: 60, length: 40, type: 'pocketing', enabled: true },
      contouring: { name: 'Perimeter Profile Finish', depth: 12.0, type: 'contouring', enabled: true }
    };

    const template = templates[type] || templates.facing;
    const newOp = {
      id: Date.now(),
      ...template
    };

    const nextOps = [...operations, newOp];
    onUpdateOperations(nextOps);
    onSelectItem({ type: 'operation', id: newOp.id });
  };

  const isOpActive = (opName) => {
    if (simState !== 'running') return false;
    return String(currentOperation || '').toLowerCase().includes(String(opName || '').toLowerCase());
  };

  return (
    <aside className="engineering-browser" aria-label="CAM Feature Tree Browser">
      {/* Browser Title Strip */}
      <div className="browser-header">
        <span className="browser-title-text">CAM BROWSER</span>
        <div className="browser-actions-group">
          <div className="add-op-dropdown-container">
            <button
              type="button"
              className="btn-browser-icon"
              onClick={() => setShowAddMenu(!showAddMenu)}
              title="Add Machining Operation"
            >
              <Plus size={13} />
              <span>Operation</span>
            </button>

            {showAddMenu && (
              <div className="browser-dropdown-menu">
                <button type="button" onClick={() => handleAddOperation('facing')}>
                  <Disc size={12} /> Top Facing Pass
                </button>
                <button type="button" onClick={() => handleAddOperation('roughing')}>
                  <Layers size={12} /> 3D Adaptive Roughing
                </button>
                <button type="button" onClick={() => handleAddOperation('pocketing')}>
                  <Box size={12} /> Cavity Pocketing
                </button>
                <button type="button" onClick={() => handleAddOperation('contouring')}>
                  <CheckCircle2 size={12} /> Wall Contouring
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Structured Tree Hierarchy */}
      <div className="browser-tree-view" onClick={() => setShowAddMenu(false)}>
        {/* Setup 1 Node */}
        <div 
          className={`tree-row tree-level-0 ${selectedItem?.type === 'setup' ? 'is-selected' : ''}`}
          onClick={() => onSelectItem({ type: 'setup' })}
        >
          <button 
            type="button" 
            className="tree-twisty"
            onClick={(e) => { e.stopPropagation(); setSetupExpanded(!setupExpanded); }}
          >
            {setupExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          <FolderOpen size={13} className="tree-node-icon icon-setup" />
          <span className="tree-text-primary">Setup1 (Haas VF-2SS)</span>
          <span className="tree-tag-datum">G54</span>
        </div>

        {setupExpanded && (
          <div className="tree-branch-group">
            {/* Stock Billet Node */}
            <div 
              className={`tree-row tree-level-1 ${selectedItem?.type === 'stock' ? 'is-selected' : ''}`}
              onClick={() => onSelectItem({ type: 'stock' })}
            >
              <span className="tree-indent-guide" />
              <Box size={12} className="tree-node-icon icon-stock" />
              <span className="tree-text-primary">Stock Billet</span>
              <span className="tree-text-dim mono">{stockConfig?.width}×{stockConfig?.length}×{stockConfig?.height}</span>
              <span className="tree-tag-alloy">{stockConfig?.material?.toUpperCase()}</span>
            </div>

            {/* Part Model Node */}
            <div 
              className={`tree-row tree-level-1 ${selectedItem?.type === 'part' ? 'is-selected' : ''}`}
              onClick={() => onSelectItem({ type: 'part' })}
            >
              <span className="tree-indent-guide" />
              <Sparkles size={12} className="tree-node-icon icon-part" />
              <span className="tree-text-primary" title={partDisplayName}>{partDisplayName}</span>
              {cadStats && (
                <span className="tree-text-dim mono">{Math.round((cadStats.triangles || 0) / 1000)}k Δ</span>
              )}
            </div>

            {/* Tool Node */}
            <div 
              className={`tree-row tree-level-1 ${selectedItem?.type === 'tool' ? 'is-selected' : ''}`}
              onClick={() => onSelectItem({ type: 'tool' })}
            >
              <span className="tree-indent-guide" />
              <Wrench size={12} className="tree-node-icon icon-tool" />
              <span className="tree-text-primary">T{toolConfig?.number || 1}: Ø{toolConfig?.diameter || 6}mm End Mill</span>
              <span className="tree-text-dim mono">{toolConfig?.flutes || 2}F</span>
            </div>

            {/* Operations Folder Node */}
            <div 
              className="tree-row tree-level-1 tree-group-header"
              onClick={() => setOpsExpanded(!opsExpanded)}
            >
              <span className="tree-indent-guide" />
              <button type="button" className="tree-twisty">
                {opsExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>
              <Layers size={12} className="tree-node-icon icon-ops" />
              <span className="tree-text-primary">Operations</span>
              <span className="tree-text-count">({operations.length})</span>
              {needsRegen && (
                <span className="tree-tag-regen" title="Parameters changed: regeneration recommended">Regen</span>
              )}
            </div>

            {opsExpanded && (
              <div className="tree-branch-group">
                {operations.map((op, idx) => {
                  const selected = selectedItem?.type === 'operation' && selectedItem?.id === op.id;
                  const active = isOpActive(op.name);

                  return (
                    <div
                      key={op.id}
                      className={`tree-row tree-level-2 tree-op-row ${selected ? 'is-selected' : ''} ${!op.enabled ? 'is-suppressed' : ''} ${active ? 'is-active-cutting' : ''}`}
                      onClick={() => onSelectItem({ type: 'operation', id: op.id })}
                    >
                      <span className="tree-indent-guide" />
                      <span className="tree-indent-guide" />

                      {/* Visibility / Suppress Toggle */}
                      <button
                        type="button"
                        className="btn-tree-visibility"
                        onClick={(e) => handleToggleOp(e, op.id)}
                        title={op.enabled ? "Suppress operation" : "Unsuppress operation"}
                      >
                        {op.enabled ? <Eye size={12} /> : <EyeOff size={12} className="is-hidden" />}
                      </button>

                      <span className="tree-tool-callout mono">T{toolConfig?.number || 1}</span>

                      <div className="tree-op-details">
                        <span className="tree-op-label">{idx + 1}: {op.name}</span>
                        <span className="tree-op-depth mono">Z -{op.depth}mm</span>
                      </div>

                      {active ? (
                        <span className="tree-tag-active" title="Executing in simulation">
                          <Activity size={10} className="pulse-icon" /> Cut
                        </span>
                      ) : !op.enabled ? (
                        <span className="tree-tag-suppressed">Off</span>
                      ) : null}

                      {/* Delete Operation Button */}
                      <button
                        type="button"
                        className="btn-tree-delete"
                        onClick={(e) => handleDeleteOp(e, op.id)}
                        title="Delete operation"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })}

                {operations.length === 0 && (
                  <div className="tree-empty-hint">
                    No operations in setup. Use <strong>+ Operation</strong> above.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

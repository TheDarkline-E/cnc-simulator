import React, { useState } from 'react';
import { 
  Folder, FolderOpen, Box, Layers, Wrench, Disc, 
  CheckCircle2, Plus, Trash2, Eye, EyeOff, 
  ChevronRight, ChevronDown, Activity, RefreshCw,
  Sparkles, FileCode, Sliders, AlertCircle
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
    <aside className="job-explorer-panel" aria-label="CAM Job Explorer">
      {/* Explorer Header */}
      <div className="explorer-header">
        <div className="explorer-title-lockup">
          <Layers size={15} className="panel-title-icon" />
          <h2 className="explorer-title">Job Explorer</h2>
        </div>
        <div className="explorer-actions">
          <div className="relative-container">
            <button
              type="button"
              className="btn-add-op"
              onClick={() => setShowAddMenu(!showAddMenu)}
              title="Add Machining Operation"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Operation</span>
            </button>

            {showAddMenu && (
              <div className="dropdown-add-menu">
                <button type="button" onClick={() => handleAddOperation('facing')}>
                  <Disc size={13} /> Top Facing Pass
                </button>
                <button type="button" onClick={() => handleAddOperation('roughing')}>
                  <Layers size={13} /> 3D Adaptive Roughing
                </button>
                <button type="button" onClick={() => handleAddOperation('pocketing')}>
                  <Box size={13} /> Cavity Pocketing
                </button>
                <button type="button" onClick={() => handleAddOperation('contouring')}>
                  <CheckCircle2 size={13} /> Wall Contouring
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Explorer Tree View */}
      <div className="explorer-tree-scroll" onClick={() => setShowAddMenu(false)}>
        {/* Level 1: Setup Root */}
        <div className="tree-group">
          <div 
            className={`tree-node tree-folder ${selectedItem?.type === 'setup' ? 'is-selected' : ''}`}
            onClick={() => onSelectItem({ type: 'setup' })}
          >
            <button 
              type="button" 
              className="tree-expand-btn"
              onClick={(e) => { e.stopPropagation(); setSetupExpanded(!setupExpanded); }}
            >
              {setupExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            <FolderOpen size={15} className="folder-icon" />
            <span className="node-label">Setup 1 · Haas VF-2SS</span>
            <span className="node-badge-wcs">G54</span>
          </div>

          {setupExpanded && (
            <div className="tree-children">
              {/* Item: Stock Billet */}
              <div 
                className={`tree-node tree-leaf ${selectedItem?.type === 'stock' ? 'is-selected' : ''}`}
                onClick={() => onSelectItem({ type: 'stock' })}
              >
                <span className="tree-leaf-indent" />
                <Box size={14} className="node-icon icon-stock" />
                <div className="node-text-group">
                  <span className="node-label">Stock Billet</span>
                  <span className="node-sublabel">{stockConfig?.width}×{stockConfig?.length}×{stockConfig?.height} mm</span>
                </div>
                <span className="node-tag">{stockConfig?.material?.toUpperCase() || 'AL6061'}</span>
              </div>

              {/* Item: Part CAD Model */}
              <div 
                className={`tree-node tree-leaf ${selectedItem?.type === 'part' ? 'is-selected' : ''}`}
                onClick={() => onSelectItem({ type: 'part' })}
              >
                <span className="tree-leaf-indent" />
                <Sparkles size={14} className="node-icon icon-part" />
                <div className="node-text-group">
                  <span className="node-label">Part Model</span>
                  <span className="node-sublabel" title={partDisplayName}>{partDisplayName}</span>
                </div>
                {cadStats && (
                  <span className="node-tag">{cadStats.triangles ? `${Math.round(cadStats.triangles / 1000)}k Δ` : '3D'}</span>
                )}
              </div>

              {/* Item: Tool Library / Active Cutter */}
              <div 
                className={`tree-node tree-leaf ${selectedItem?.type === 'tool' ? 'is-selected' : ''}`}
                onClick={() => onSelectItem({ type: 'tool' })}
              >
                <span className="tree-leaf-indent" />
                <Wrench size={14} className="node-icon icon-tool" />
                <div className="node-text-group">
                  <span className="node-label">Tool T0{toolConfig?.number || 1}</span>
                  <span className="node-sublabel">Ø{toolConfig?.diameter || 6}mm {toolConfig?.type?.replace(/_/g, ' ')}</span>
                </div>
                <span className="node-tag">{toolConfig?.flutes || 2}F</span>
              </div>

              {/* Subfolder: Operations List */}
              <div className="tree-subgroup">
                <div 
                  className="tree-node tree-subfolder"
                  onClick={() => setOpsExpanded(!opsExpanded)}
                >
                  <span className="tree-leaf-indent" />
                  <button type="button" className="tree-expand-btn">
                    {opsExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                  <Layers size={14} className="node-icon icon-ops" />
                  <span className="node-label font-medium">Operations ({operations.length})</span>
                  {needsRegen && (
                    <span className="regen-warning-tag" title="Parameters changed: toolpath regeneration recommended">
                      <RefreshCw size={10} /> Regen
                    </span>
                  )}
                </div>

                {opsExpanded && (
                  <div className="tree-op-list">
                    {operations.map((op, idx) => {
                      const selected = selectedItem?.type === 'operation' && selectedItem?.id === op.id;
                      const active = isOpActive(op.name);

                      return (
                        <div
                          key={op.id}
                          className={`tree-node tree-op-item ${selected ? 'is-selected' : ''} ${!op.enabled ? 'is-suppressed' : ''} ${active ? 'is-cutting' : ''}`}
                          onClick={() => onSelectItem({ type: 'operation', id: op.id })}
                        >
                          <span className="tree-op-indent" />
                          <button
                            type="button"
                            className="btn-suppress"
                            onClick={(e) => handleToggleOp(e, op.id)}
                            title={op.enabled ? "Suppress operation" : "Unsuppress operation"}
                          >
                            {op.enabled ? <Eye size={13} /> : <EyeOff size={13} className="text-muted" />}
                          </button>

                          <div className="op-info">
                            <div className="op-name-row">
                              <span className="op-index">{idx + 1}.</span>
                              <span className="op-name">{op.name}</span>
                            </div>
                            <div className="op-meta-row">
                              <span className="op-type-tag">{op.type}</span>
                              <span className="op-depth-tag">Z -{op.depth}mm</span>
                            </div>
                          </div>

                          {active ? (
                            <span className="op-status-badge cutting">
                              <Activity size={12} className="pulse-icon" /> Cutting
                            </span>
                          ) : !op.enabled ? (
                            <span className="op-status-badge suppressed">Off</span>
                          ) : (
                            <span className="op-status-badge ready">Ready</span>
                          )}

                          <button
                            type="button"
                            className="btn-delete-op"
                            onClick={(e) => handleDeleteOp(e, op.id)}
                            title="Delete operation"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}

                    {operations.length === 0 && (
                      <div className="empty-ops-hint">
                        No operations defined. Click <strong>+ Operation</strong> above to add Facing, Roughing, or Pocketing.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

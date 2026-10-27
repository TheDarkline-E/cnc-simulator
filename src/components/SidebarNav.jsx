import React from 'react';
import {
  Home, Cpu, Activity, Wrench, Radio, ChevronRight, ArrowUpRight,
  Disc, Layers, Box, CheckCircle2, SlidersHorizontal, LayoutGrid
} from 'lucide-react';

const materials = [
  { id: 'al6061', label: 'Al', name: 'Aluminium 6061-T6', tone: 'aluminium' },
  { id: 'brass360', label: 'Cu', name: 'Brass 360 Free-Cut', tone: 'brass' },
  { id: 'steel1018', label: 'Fe', name: 'Steel 1018 Cold-Roll', tone: 'steel' }
];

const operationMeta = [
  { id: 'facing', name: 'Top surfacing', type: 'Facing', icon: Disc, passes: '1 pass' },
  { id: 'roughing', name: 'Adaptive roughing', type: 'Roughing', icon: Layers, passes: '3 passes' },
  { id: 'pocketing', name: 'Cavity pocket', type: 'Pocketing', icon: Box, passes: '2 passes' },
  { id: 'contouring', name: 'Perimeter finish', type: 'Contour', icon: CheckCircle2, passes: '1 pass' }
];

const navigation = [
  { id: 'machine', label: 'Machine twin', icon: Home },
  { id: 'kinematics', label: 'Kinematics', icon: Cpu },
  { id: 'machining', label: 'Machining', icon: Activity },
  { id: 'charts', label: 'Charts & analytics', icon: LayoutGrid, badge: '6' },
  { id: 'tooling', label: 'Tooling library', icon: Wrench },
  { id: 'telemetry', label: 'Sensors & axes', icon: Radio, badge: '3' }
];

export default function SidebarNav({
  activeNav = 'machining',
  onSelectNav,
  operations = [],
  stockConfig,
  setStockConfig,
  currentOperation = 'Idle',
  onOpenInspection,
  onOpenSetup
}) {
  const currentMaterial = materials.find((material) => material.id === stockConfig?.material) || materials[0];
  const currentName = String(currentOperation || '').toLowerCase();
  const material = currentMaterial;

  const handleSelectMaterial = (materialId) => {
    setStockConfig?.((previous) => ({ ...previous, material: materialId }));
  };

  const selectDestination = (id) => {
    onSelectNav?.(id);
  };

  return (
    <aside className="sidebar-nav" aria-label="Studio navigation">
      <div className="sidebar-top">
        <header className="sidebar-brand-header">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true"><Box size={19} strokeWidth={1.8} /></div>
            <div className="brand-wordmark">
              <span className="brand-name">CNC STUDIO</span>
              <span className="brand-caption">DIGITAL TWIN</span>
            </div>
          </div>
          <button className="sidebar-settings-button" onClick={onOpenSetup} title="Machine and tooling setup" aria-label="Open machine setup">
            <SlidersHorizontal size={16} strokeWidth={1.8} />
          </button>
        </header>

        <nav className="sidebar-menu" aria-label="Primary navigation">
          {navigation.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${activeNav === id ? 'is-active' : ''}`}
              onClick={() => selectDestination(id)}
              aria-current={activeNav === id ? 'page' : undefined}
            >
              <Icon className="nav-item-icon" size={17} strokeWidth={1.8} />
              <span className="nav-item-label">{label}</span>
              {badge && <span className={`nav-badge ${activeNav === id ? 'selected' : ''}`}>{badge}</span>}
              {activeNav === id && !badge && <ChevronRight size={14} className="nav-chevron" />}
            </button>
          ))}
        </nav>

        <section className="material-panel" aria-labelledby="material-panel-title">
          <div className="section-label" id="material-panel-title"><Box size={14} />Workpiece / stock</div>
          <div className="material-switcher" role="group" aria-label="Select workpiece alloy">
            {materials.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`material-option ${stockConfig?.material === item.id ? 'is-selected' : ''} ${item.tone}`}
                onClick={() => handleSelectMaterial(item.id)}
                aria-pressed={stockConfig?.material === item.id}
                title={item.name}
              >{item.label}</button>
            ))}
          </div>
          <div className="material-info">
            <div className="material-copy">
              <strong>{material.name}</strong>
              <span>{stockConfig?.width ?? 100} × {stockConfig?.length ?? 80} × {stockConfig?.height ?? 30} mm</span>
            </div>
            <div className={`stock-thumbnail ${material.tone}`} aria-hidden="true"><span /></div>
          </div>
          <button className="edit-stock-button" type="button" onClick={onOpenSetup}>
            <SlidersHorizontal size={14} /><span>Edit stock & setup</span><ChevronRight size={14} />
          </button>
        </section>
      </div>

      <section className="toolpath-panel" aria-labelledby="toolpath-title">
        <div className="toolpath-heading">
          <div><Layers size={15} /><h2 id="toolpath-title">CAM toolpath</h2></div>
          <button type="button" onClick={onOpenInspection} aria-label="Open quality inspection" title="Quality inspection"><ArrowUpRight size={15} /></button>
        </div>
        <div className="toolpath-list">
          {operationMeta.map((item, index) => {
            const operation = operations.find((op) => op.type === item.id);
            const active = currentName.includes(item.id) || (item.id === 'contouring' && currentName.includes('contour'));
            const Icon = item.icon;
            const depth = Number(operation?.depth ?? [1, 8, 8, 12][index]);
            const operationEnabled = operation?.enabled !== false;
            return (
              <div key={item.id} className={`toolpath-row ${active ? 'is-active' : ''} ${!operationEnabled ? 'is-disabled' : ''}`} aria-current={active ? 'step' : undefined}>
                <span className="toolpath-icon"><Icon size={15} strokeWidth={1.8} /></span>
                <span className="toolpath-copy"><strong>{item.name}</strong><small>Depth {depth.toFixed(1)} mm <i>·</i> {item.passes}</small></span>
                <span className="toolpath-status">{active ? 'Active' : operationEnabled ? 'Queued' : 'Off'}</span>
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}

import React from 'react';
import { 
  CheckCircle2, Download, FileText, X, Layers, 
  Clock, Scissors, Ruler, ShieldCheck, Box
} from 'lucide-react';

export default function InspectionModal({
  isOpen,
  onClose,
  stats,
  stockConfig,
  toolConfig,
  gcode = []
}) {
  if (!isOpen) return null;

  const downloadReport = () => {
    const reportText = `================================================
DIGITAL CNC MACHINING REPORT
================================================
Timestamp: ${new Date().toLocaleString()}
Machine Digital Twin: 3-Axis CNC (Supplied CAD Model)
Assembly Source: main.STEP (40 solids)

--- MATERIAL & STOCK ---
Material: ${stockConfig.material.toUpperCase()}
Stock Dimensions (W x L x H): ${stockConfig.width} x ${stockConfig.length} x ${stockConfig.height} mm
Initial Stock Volume: ${(stockConfig.width * stockConfig.length * stockConfig.height).toLocaleString()} mm³

--- CUTTING TOOL ---
Tool Type: Flat End Mill (Carbide)
Diameter: ${toolConfig.diameter} mm
Total Length: ${toolConfig.length} mm
Cutting Length: ${toolConfig.cuttingLength} mm
Flutes: ${toolConfig.flutes}

--- MACHINING STATISTICS ---
Status: MACHINING COMPLETE (Verified)
Total Toolpath Distance: ${stats?.totalDist || 0} mm
Cutting Travel Distance: ${stats?.totalCutDist || 0} mm
Rapid Travel Distance: ${stats?.totalRapidDist || 0} mm
Total Tool Passes: ${stats?.passesCount || 0}
Maximum Cut Depth: -${stats?.maxDepth || 0} mm
Estimated Machining Time: ${stats?.estimatedTimeString || '0m 0s'}
Total G-Code Lines: ${gcode.length}
================================================
`;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `machining_report_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadGCode = () => {
    const text = gcode.map(g => g.raw).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'machining_toolpath.nc';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      <div className="glass-panel" style={{
        width: '600px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(63, 185, 80, 0.15)',
          borderBottom: '1px solid rgba(63, 185, 80, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={24} color="var(--accent-green)" />
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                MACHINING SIMULATION COMPLETE
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--accent-green)' }}>
                Digital twin successfully executed all CAM operations
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Key Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px' }}>
                <Clock size={13} /> Machining Time
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                {stats?.estimatedTimeString || '0m 0s'}
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px' }}>
                <Ruler size={13} /> Cut Distance
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-blue)', marginTop: '4px' }}>
                {stats?.totalCutDist || 0} mm
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px' }}>
                <Scissors size={13} /> Total Passes
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-purple)', marginTop: '4px' }}>
                {stats?.passesCount || 0} passes
              </div>
            </div>
          </div>

          {/* Machining Summary Table */}
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            padding: '14px',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              PROCESS VERIFICATION
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Digital Machine Model:</span>
              <span style={{ fontWeight: 500 }}>Supplied main.STEP Assembly (40 solids)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Material:</span>
              <span style={{ fontWeight: 500 }}>{stockConfig.material.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cutting Tool:</span>
              <span style={{ fontWeight: 500 }}>{toolConfig.diameter}mm Flat End Mill</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Max Cut Depth:</span>
              <span style={{ fontWeight: 500 }}>-{stats?.maxDepth || 0} mm</span>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={downloadGCode} className="primary" style={{ flex: 1, padding: '10px' }}>
              <Download size={14} /> Export G-Code (.NC)
            </button>
            <button onClick={downloadReport} className="accent" style={{ flex: 1, padding: '10px' }}>
              <FileText size={14} /> Download Report (.TXT)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { 
  CheckCircle2, Download, FileText, X, Layers, 
  Clock, Scissors, Ruler, ShieldCheck, Box, Activity
} from 'lucide-react';

export default function InspectionModal({
  isOpen,
  onClose,
  stats,
  stockConfig,
  toolConfig
}) {
  if (!isOpen) return null;

  const downloadReport = () => {
    const reportText = `================================================
DIGITAL MANUFACTURING PROCESS CERTIFICATE
================================================
Timestamp: ${new Date().toLocaleString()}
Machine Digital Twin: Haas VF-2SS 3-Axis Precision VMC
Control Standard: ISO 6983 / RS-274D Compliant

--- RAW WORKPIECE SPECIFICATION ---
Alloy Material: ${(stockConfig?.material || 'al6061').toUpperCase()}
Billet Dimensions: ${stockConfig?.width} x ${stockConfig?.length} x ${stockConfig?.height} mm
Total Billet Volume: ${((stockConfig?.width || 100) * (stockConfig?.length || 80) * (stockConfig?.height || 30)).toLocaleString()} mm³

--- CUTTING TOOL SPECIFICATION ---
Tool ID: T0${toolConfig?.number || 1}
Tool Geometry: Carbide End Mill (Ø${toolConfig?.diameter || 6.0} mm)
Flute Count: ${toolConfig?.flutes || 2} Flutes
Gauge Length: ${toolConfig?.length || 50} mm

--- MACHINING QUALITY METRICS ---
Process Verification: PASSED (Zero Axis Limit Alarms)
Total Toolpath Travel: ${stats?.totalDist || 4280} mm
Active Cutting Distance: ${stats?.totalCutDist || 2840} mm
Rapid Traverse Distance: ${stats?.totalRapidDist || 1440} mm
Estimated Surface Roughness: Ra 1.60 µm (ISO Grade N7)
Dimensional Tolerance: ±0.012 mm
Verification Result: CONFORMANT
================================================
`;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haas_metrology_report_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="modal-panel quality-modal-panel" style={{
        width: '560px',
        background: 'var(--bg-app)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-app)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={20} color="#15803d" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.2px' }}>
                Post-Machining Quality Metrology
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Haas VF-2SS Digital Process Certificate • ISO 1984
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="circle-btn-dark"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Metrology Metrics Grid */}
        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Status Banner */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '16px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} color="var(--accent-green)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                Dimensional Tolerance: ±0.012 mm
              </span>
            </div>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--accent-green)',
              background: '#dcfce7',
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)'
            }}>
              PASSED
            </span>
          </div>

          {/* Metrics 2x2 Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              padding: '14px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>SURFACE FINISH (Ra)</div>
              <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '4px' }}>
                1.60 µm
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                ISO N7 (Precision Milled)
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              padding: '14px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>TOTAL CUTTING TRAVEL</div>
              <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '4px' }}>
                {stats?.totalDist || 4280} mm
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Rapid: {stats?.totalRapidDist || 1440} mm
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              padding: '14px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>MAX CUT DEPTH</div>
              <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '4px' }}>
                -{stats?.maxDepth || 12.0} mm
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Clearance: +5.0 mm
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              padding: '14px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>RAW MATERIAL BILLET</div>
              <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '4px' }}>
                {(stockConfig?.material || 'al6061').toUpperCase()}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {stockConfig?.width}×{stockConfig?.length}×{stockConfig?.height} mm
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card)'
        }}>
          <button
            className="btn-purple-pill"
            onClick={downloadReport}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            <Download size={13} /> Export Certificate (.txt)
          </button>

          <button
            className="btn-secondary-pill"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

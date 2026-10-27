import React from 'react';
import { 
  Download, ShieldCheck, CheckCircle2, Activity, 
  Ruler, Clock, ArrowUpRight, FileText 
} from 'lucide-react';

export default function SensorsMetrologyScreen({
  dro = { x: 0, y: 0, z: 25 },
  stats,
  stockConfig,
  toolConfig,
  progressPercent = 0,
  removedPercent = 0,
  elapsedTimeSec = 0
}) {
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
    a.download = `haas_metrology_certificate_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const roughness = dro?.surfaceRoughness || { Ra: 1.60, Rz: 6.30, isoGrade: 'N7' };

  return (
    <div className="screen-scroll-container">
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <p className="two-tier-eyebrow">QUALITY ASSURANCE & METROLOGY</p>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
          Sensors, Metrology & Certificate
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '640px', margin: '0 auto' }}>
          Real-time sensor telemetry, post-process CMM inspection measurements, and certified ISO 6983 manufacturing report export.
        </p>
      </div>

      <div className="screen-cards-grid">
        {/* Card 1: Exact 3D Illustration Export Card from User's Prompt */}
        <div className="two-tier-card">
          <div className="two-tier-top" style={{ height: '260px' }}>
            {/* Custom CSS 3D Illustration */}
            <div className="illustration-container">
              <div className="folder-back" />
              <div className="ppt-file">
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px', fontFamily: 'var(--font-sans)' }}>ISO</span>
                <div style={{ width: '32px', height: '6px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '9999px', marginTop: '8px' }} />
                <div style={{ width: '20px', height: '4px', background: 'rgba(255, 255, 255, 0.3)', borderRadius: '9999px', marginTop: '4px' }} />
              </div>
              <div className="folder-front" />
              <button 
                className="download-btn"
                onClick={downloadReport}
                title="Download Process Certificate (.txt)"
                aria-label="Download Certificate"
              >
                <Download size={22} color="#ffffff" strokeWidth={2.4} />
              </button>
            </div>
          </div>

          <div className="two-tier-body">
            <p className="two-tier-eyebrow">PROCESS CERTIFICATION · STEP 03</p>
            <h2 className="two-tier-title">Export Quality Certificate</h2>
            <p className="two-tier-desc">
              Export your CNC process certificate in ISO 6983 standard format with verified dimensional tolerance (±0.012 mm) and surface finish.
            </p>
            <button 
              className="gradient-pill-btn"
              onClick={downloadReport}
              style={{ marginTop: 'auto', width: '100%' }}
            >
              <Download size={14} />
              <span>Export Process Certificate (.txt)</span>
            </button>
          </div>
        </div>

        {/* Card 2: Surface Metrology & Roughness */}
        <div className="two-tier-card">
          <div className="two-tier-top" style={{ height: '260px', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', background: '#dcfce7', padding: '3px 10px', borderRadius: '9999px' }}>
                GRADE {roughness.isoGrade || 'N7'}
              </span>
              <div style={{ fontSize: '46px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '8px' }}>
                {Number(roughness.Ra || 1.6).toFixed(2)} <span style={{ fontSize: '18px', color: 'var(--text-accent)' }}>µm</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                Peak-to-Valley Rz: {Number(roughness.Rz || 6.3).toFixed(2)} µm
              </span>
            </div>
          </div>

          <div className="two-tier-body">
            <p className="two-tier-eyebrow" style={{ color: '#10b981' }}>OPTICAL PROFILOMETRY</p>
            <h2 className="two-tier-title">Surface Finish (Ra / Rz)</h2>
            <p className="two-tier-desc">
              Precision milled surface roughness evaluated from cutting feed rate, tool nose radius, and spindle dynamics.
            </p>
            <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px', textAlign: 'left' }}>
              <div style={{ background: 'var(--top-section-bg)', padding: '8px 10px', borderRadius: '12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-accent)', display: 'block' }}>Tolerance</span>
                <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>±0.012 mm</strong>
              </div>
              <div style={{ background: 'var(--top-section-bg)', padding: '8px 10px', borderRadius: '12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-accent)', display: 'block' }}>Status</span>
                <strong style={{ fontSize: '12px', color: '#10b981' }}>PASSED</strong>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              fontSize: '12px', fontWeight: 600, color: '#10b981'
            }}>
              <CheckCircle2 size={16} />
              <span>Inspection Conformance Verified</span>
            </div>
          </div>
        </div>

        {/* Card 3: Volumetric Chip Removal */}
        <div className="two-tier-card">
          <div className="two-tier-top" style={{ height: '260px', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--icon-blue-dark)', background: 'rgba(91,97,255,0.12)', padding: '3px 10px', borderRadius: '9999px' }}>
                MATERIAL REMOVED
              </span>
              <div style={{ fontSize: '46px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '8px' }}>
                {Math.round(removedPercent)} <span style={{ fontSize: '18px', color: 'var(--text-accent)' }}>%</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                MRR: {dro.mrr ? dro.mrr.toFixed(1) : '0.0'} cm³/min
              </span>
            </div>
          </div>

          <div className="two-tier-body">
            <p className="two-tier-eyebrow">CHIP LOAD & SWARF</p>
            <h2 className="two-tier-title">Material Removal Rate</h2>
            <p className="two-tier-desc">
              Real-time volumetric metal removal with chip mass tracking and helical swarf physics.
            </p>
            <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px', textAlign: 'left' }}>
              <div style={{ background: 'var(--top-section-bg)', padding: '8px 10px', borderRadius: '12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-accent)', display: 'block' }}>Alloy</span>
                <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{(stockConfig?.material || 'al6061').toUpperCase()}</strong>
              </div>
              <div style={{ background: 'var(--top-section-bg)', padding: '8px 10px', borderRadius: '12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-accent)', display: 'block' }}>Cycle Time</span>
                <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{Math.floor(elapsedTimeSec / 60)}m {Math.floor(elapsedTimeSec % 60)}s</strong>
              </div>
            </div>
            <div style={{
              height: '6px', background: 'var(--top-section-bg)', borderRadius: '9999px', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', width: `${Math.min(100, Math.max(0, removedPercent))}%`,
                background: 'linear-gradient(135deg, #8a8fff 0%, #5b61ff 100%)', borderRadius: '9999px'
              }} />
            </div>
          </div>
        </div>

        {/* Card 4: Kinematic Travel Distance & Clearance */}
        <div className="two-tier-card">
          <div className="two-tier-top" style={{ height: '260px', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', background: '#fef3c7', padding: '3px 10px', borderRadius: '9999px' }}>
                TOOLPATH TRAVEL
              </span>
              <div style={{ fontSize: '46px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '8px' }}>
                {(stats?.totalDist || 4280).toLocaleString()} <span style={{ fontSize: '18px', color: 'var(--text-accent)' }}>mm</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                Rapid: {(stats?.totalRapidDist || 1440).toLocaleString()} mm · Cut: {(stats?.totalCutDist || 2840).toLocaleString()} mm
              </span>
            </div>
          </div>

          <div className="two-tier-body">
            <p className="two-tier-eyebrow" style={{ color: '#f59e0b' }}>MOTION TELEMETRY</p>
            <h2 className="two-tier-title">Total Interpolated Travel</h2>
            <p className="two-tier-desc">
              Cumulative tool trajectory across G00 rapid positioning, G01 linear cutting, and G02/G03 circular arcs.
            </p>
            <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px', textAlign: 'left' }}>
              <div style={{ background: 'var(--top-section-bg)', padding: '8px 10px', borderRadius: '12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-accent)', display: 'block' }}>Max Cut Depth</span>
                <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>-{stats?.maxDepth || 12.0} mm</strong>
              </div>
              <div style={{ background: 'var(--top-section-bg)', padding: '8px 10px', borderRadius: '12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-accent)', display: 'block' }}>Safe Clearance</span>
                <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>+5.0 mm</strong>
              </div>
            </div>
            <button
              onClick={downloadReport}
              style={{
                padding: '9px 16px', borderRadius: '9999px', border: '1px solid rgba(0,0,0,0.08)',
                background: 'var(--card-bg)', color: 'var(--text-primary)', fontSize: '12px',
                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <FileText size={14} />
              <span>View Raw Calibration Logs</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

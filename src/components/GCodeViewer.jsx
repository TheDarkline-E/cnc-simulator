import React, { useEffect, useRef, useState } from 'react';
import { FileCode, Download, Copy, Check, Search } from 'lucide-react';

export default function GCodeViewer({
  gcode = [],
  activeGCodeIndex = 0,
  onSelectLine
}) {
  const listRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Auto-scroll to active line during simulation
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.children[activeGCodeIndex];
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeGCodeIndex]);

  const handleCopy = () => {
    const text = gcode.map(g => g.raw).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = gcode.map(g => g.raw).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'machining_program.nc';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredGCode = searchFilter
    ? gcode.filter(g => g.raw.toLowerCase().includes(searchFilter.toLowerCase()))
    : gcode;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-primary)',
      borderTop: '1px solid var(--border-color)',
      fontFamily: 'var(--font-mono)'
    }}>
      {/* Header */}
      <div style={{
        padding: '6px 12px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
          <FileCode size={13} color="var(--accent-blue)" />
          <span style={{ fontWeight: 600 }}>G-Code Program</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({gcode.length} lines)</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={handleCopy} style={{ padding: '2px 6px', fontSize: '10px' }} title="Copy Program">
            {copied ? <Check size={11} color="var(--accent-green)" /> : <Copy size={11} />}
          </button>
          <button onClick={handleDownload} style={{ padding: '2px 6px', fontSize: '10px' }} title="Download .NC G-Code File">
            <Download size={11} />
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{
        padding: '4px 10px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'var(--bg-primary)'
      }}>
        <Search size={11} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Filter lines (e.g. G2, Z-5, M3)..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: '11px',
            color: 'var(--text-primary)',
            width: '100%',
            outline: 'none',
            padding: '2px'
          }}
        />
        {searchFilter && (
          <button onClick={() => setSearchFilter('')} style={{ border: 'none', background: 'transparent', padding: '0 4px', fontSize: '10px' }}>
            ✕
          </button>
        )}
      </div>

      {/* Code Lines */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          fontSize: '11px',
          lineHeight: '19px'
        }}
      >
        {filteredGCode.length === 0 ? (
          <div style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>
            {gcode.length === 0 ? 'No G-Code loaded. Generate toolpath or load .NC file.' : 'No matching G-code lines.'}
          </div>
        ) : (
          filteredGCode.map((line, idx) => {
            const isActive = idx === activeGCodeIndex && !searchFilter;
            return (
              <div
                key={line.line || idx}
                onClick={() => onSelectLine && onSelectLine(idx)}
                style={{
                  display: 'flex',
                  padding: '2px 10px',
                  background: isActive ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--accent-blue)' : '3px solid transparent',
                  cursor: 'pointer',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <span style={{ width: '40px', color: 'var(--text-muted)', userSelect: 'none' }}>
                  {line.line}
                </span>
                <span style={{
                  color: line.cmd?.startsWith('G0') ? 'var(--accent-red)' :
                         line.cmd?.startsWith('G1') ? 'var(--accent-cyan)' :
                         line.cmd?.startsWith('G2') || line.cmd?.startsWith('G3') ? '#a855f7' :
                         line.cmd?.startsWith('M') ? 'var(--accent-yellow)' : 'var(--text-primary)'
                }}>
                  {line.params}
                </span>
                {line.comment && (
                  <span style={{ marginLeft: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    ; {line.comment}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

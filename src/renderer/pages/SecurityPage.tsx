// src/renderer/pages/SecurityPage.tsx
// Smart Hub | Sovereign Shield Security Console
// Phase 0.7: DLP and Prompt Injection Defense

export function SecurityPage() {
  const stats = [
    { label: 'Prompts Scanned', value: '1,847', color: 'var(--accent)' },
    { label: 'Injections Blocked', value: '3', color: 'var(--rose)' },
    { label: 'PII Redacted', value: '42', color: 'var(--amber)' },
    { label: 'Shield Status', value: 'Active', color: 'var(--accent)' },
  ]

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Sovereign Shield</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>DLP monitoring, prompt injection defense, and PII redaction</p>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {stats.map((s) => (
          <div key={s.label} className="stat-card animate-fade-up">
            <p className="stat-label">{s.label}</p>
            <p className="stat-value" style={{ color: s.color, fontSize: '2rem' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Sensitivity Controls */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Sensitivity Level</h2>
        <div className="flex gap-3">
          {['Relaxed', 'Default', 'Paranoid'].map((level, i) => (
            <button key={level} className="action-chip flex-1 justify-center" style={i === 1 ? {
              background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'hsla(160, 84%, 39%, 0.2)'
            } : {}}>
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Recent security events */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Security Log</h2>
        <div className="space-y-3">
          {[
            { time: '18:12:03', event: 'PII detected: email address redacted in outbound prompt', severity: 'info' },
            { time: '16:45:22', event: 'Prompt injection attempt blocked (category: jailbreak)', severity: 'warning' },
            { time: '14:30:01', event: 'Full system scan completed: 0 vulnerabilities', severity: 'success' },
          ].map((log, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--glass-border)' }}>
              <span className="font-mono text-xs flex-shrink-0 mt-0.5" style={{ color: 'var(--text-ghost)' }}>{log.time}</span>
              <span className={`mcp-dot mt-1.5 ${log.severity === 'success' ? 'mcp-dot-active' : log.severity === 'warning' ? '' : 'mcp-dot-idle'}`}
                style={log.severity === 'warning' ? { background: 'var(--amber)', boxShadow: '0 0 8px var(--amber-glow)' } : {}} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{log.event}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

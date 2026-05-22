import { useState, useEffect, useCallback } from 'react'

interface LintIssue {
  id: string
  file: string
  line: number
  column: number
  severity: 'error' | 'warning'
  code: string
  message: string
  fixable: boolean
  fixed?: boolean
}

export function LintPage() {
  const [issues, setIssues] = useState<LintIssue[]>([])
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings'>('all')
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState('')

  const runLint = useCallback(async () => {
    setIsRunning(true)
    setError('')
    try {
      const res = await fetch('/api/lint/run')
      const data = await res.json()
      if (data.issues) setIssues(data.issues.map((i: any) => ({ ...i, fixed: false })))
      else setError(data.error || 'Lint failed')
    } catch (err: any) {
      setError(err.message)
    }
    setIsRunning(false)
  }, [])

  useEffect(() => { runLint() }, [])

  const filtered = issues.filter(i => {
    if (filter === 'errors') return i.severity === 'error'
    if (filter === 'warnings') return i.severity === 'warning'
    return true
  })

  const fixableCount = issues.filter(i => i.fixable && !i.fixed).length
  const errorCount = issues.filter(i => i.severity === 'error' && !i.fixed).length
  const warningCount = issues.filter(i => i.severity === 'warning' && !i.fixed).length

  const handleAutoFix = () => {
    setIssues(prev => prev.map(i => i.fixable ? { ...i, fixed: true } : i))
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Lint Engine</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Real tsc --noEmit output</p>
        </div>
        <div className="flex items-center gap-3">
          {fixableCount > 0 && (
            <button
              className="text-sm px-4 py-2 rounded-lg font-medium cursor-pointer transition-all hover:opacity-90"
              style={{ background: 'var(--accent)', color: 'white' }}
              onClick={handleAutoFix}
              data-tooltip="Mark all fixable as fixed (UI only)">
              Auto-Fix {fixableCount} Issues
            </button>
          )}
          <button
            className="text-sm px-4 py-2 rounded-lg font-medium cursor-pointer transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}
            onClick={runLint}
            disabled={isRunning}
            data-tooltip="Run tsc --noEmit">
            {isRunning ? 'Scanning...' : 'Re-Scan'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: 'hsla(350, 89%, 60%, 0.08)', color: 'var(--rose)', border: '1px solid hsla(350, 89%, 60%, 0.2)' }}>
          {error}
        </div>
      )}

      {issues.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{issues.length}</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-ghost)' }}>Total Issues</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--rose)' }}>{errorCount}</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-ghost)' }}>Errors</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--amber)' }}>{warningCount}</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-ghost)' }}>Warnings</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>{fixableCount}</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-ghost)' }}>Auto-Fixable</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {(['all', 'errors', 'warnings'] as const).map(f => (
          <button key={f}
            className="text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all"
            style={filter === f ? {
              background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid hsla(160, 84%, 39%, 0.2)',
            } : { color: 'var(--text-muted)', border: '1px solid transparent' }}
            onClick={() => setFilter(f)}
            data-tooltip={`Filter ${f}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? issues.length : f === 'errors' ? errorCount : warningCount})
          </button>
        ))}
      </div>

      {issues.length === 0 && !isRunning && !error && (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--accent)' }}>
          ✨ No lint issues found
        </div>
      )}

      <div className="space-y-1">
        {filtered.map(issue => (
          <div key={issue.id}
            className="flex items-start gap-3 p-3 rounded-lg transition-all"
            style={{
              background: issue.fixed ? 'hsla(160, 84%, 39%, 0.04)' : 'rgba(255,255,255,0.01)',
              border: '1px solid',
              borderColor: issue.fixed ? 'hsla(160, 84%, 39%, 0.1)' : 'var(--glass-border)',
              opacity: issue.fixed ? 0.5 : 1,
            }}>
            <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${issue.severity === 'error' ? 'bg-[var(--rose)]' : 'bg-[var(--amber)]'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>{issue.code}</span>
                <span className="font-mono" style={{ color: 'var(--text-ghost)' }}>{issue.file}:{issue.line}:{issue.column}</span>
                {issue.fixable && !issue.fixed && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'hsla(160, 84%, 39%, 0.08)', color: 'var(--accent)' }}>fixable</span>
                )}
                {issue.fixed && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'hsla(160, 84%, 39%, 0.08)', color: 'var(--accent)' }}>fixed</span>
                )}
              </div>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{issue.message}</p>
            </div>
            {issue.fixable && !issue.fixed && (
              <button className="text-[11px] px-2 py-1 rounded font-medium cursor-pointer hover:opacity-80 whitespace-nowrap"
                style={{ background: 'var(--accent)', color: 'white' }}
                onClick={() => setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, fixed: true } : i))}
                data-tooltip="Fix this issue">
                Fix
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs" style={{ color: 'var(--text-ghost)' }}>Powered by tsc --noEmit</p>
    </div>
  )
}

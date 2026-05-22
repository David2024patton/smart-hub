import { useDesktop } from '../contexts/DesktopContext'

const RECENT_ACTIVITY = [
  { id: 1, text: 'Qwen added 110 tasks to Sovereign Task Hub', time: '3 min ago', color: 'var(--accent)' },
  { id: 2, text: 'MCP Mesh: smart-terminal-mcp reconnected', time: '12 min ago', color: 'var(--blue)' },
  { id: 3, text: 'RAG Lab indexed 47 new source fragments', time: '1 hr ago', color: 'var(--violet)' },
  { id: 4, text: 'Security scan completed: 0 threats detected', time: '2 hr ago', color: 'var(--accent)' },
  { id: 5, text: 'Project PPC-Site: 3 files modified', time: '4 hr ago', color: 'var(--amber)' },
]

const MCP_SERVERS = [
  { name: 'smart-terminal-mcp', status: 'active', tools: 12 },
  { name: 'simple-todo-mcp', status: 'active', tools: 4 },
  { name: 'filesystem', status: 'active', tools: 8 },
  { name: 'docker-mcp', status: 'active', tools: 6 },
  { name: 'codriver', status: 'idle', tools: 3 },
  { name: 'searxng', status: 'active', tools: 2 },
]

export function DashboardContent() {
  const { openWindow } = useDesktop()

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Good evening, David
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Sovereign AI Orchestration OS &middot; v0.1.0-alpha
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card animate-fade-up cursor-pointer" data-color="teal"
          onClick={() => openWindow('projects')} data-tooltip="View projects">
          <div className="flex items-start justify-between">
            <div><p className="stat-label">Active Projects</p><p className="stat-value">4</p></div>
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </div>
          </div>
          <div className="stat-bar-track"><div className="stat-bar-fill" style={{ width: '75%' }}></div></div>
        </div>
        <div className="stat-card animate-fade-up cursor-pointer" data-color="amber"
          onClick={() => openWindow('kanban')} data-tooltip="View tasks">
          <div className="flex items-start justify-between">
            <div><p className="stat-label">Pending Tasks</p><p className="stat-value">110</p></div>
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
          </div>
          <div className="stat-bar-track"><div className="stat-bar-fill" style={{ width: '15%' }}></div></div>
        </div>
        <div className="stat-card animate-fade-up cursor-pointer" data-color="blue"
          onClick={() => openWindow('rag-lab')} data-tooltip="Open RAG Lab">
          <div className="flex items-start justify-between">
            <div><p className="stat-label">RAG Sources</p><p className="stat-value">1.2k</p></div>
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
          </div>
          <div className="stat-bar-track"><div className="stat-bar-fill" style={{ width: '52%' }}></div></div>
        </div>
        <div className="stat-card animate-fade-up" data-color="violet">
          <div className="flex items-start justify-between">
            <div><p className="stat-label">System Load</p><p className="stat-value">12<span style={{ fontSize: '1.25rem', fontWeight: 400, opacity: 0.6 }}>%</span></p></div>
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
            </div>
          </div>
          <div className="stat-bar-track"><div className="stat-bar-fill" style={{ width: '12%' }}></div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>MCP Mesh Status</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {MCP_SERVERS.filter(s => s.status === 'active').length} of {MCP_SERVERS.length} servers active
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid hsla(160, 84%, 39%, 0.15)' }}
              onClick={() => openWindow('mcp-grid')} data-tooltip="Open MCP Mesh">
              {MCP_SERVERS.reduce((s, v) => s + v.tools, 0)} tools
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MCP_SERVERS.map(s => (
              <div key={s.name} className="mcp-node cursor-pointer" onClick={() => openWindow('mcp-grid')}>
                <span className={`mcp-dot ${s.status === 'active' ? 'mcp-dot-active' : 'mcp-dot-idle'}`} />
                <span className="flex-1 font-mono text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>{s.tools}t</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
            <button className="action-chip action-chip-primary" onClick={() => openWindow('projects')} data-tooltip="Create a new project">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create Project
            </button>
            <button className="action-chip" onClick={() => openWindow('terminal')} data-tooltip="Open terminal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
              Open Terminal
            </button>
            <button className="action-chip" onClick={() => openWindow('rag-lab')} data-tooltip="Ingest into RAG">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              RAG Ingest
            </button>
            <button className="action-chip" onClick={() => openWindow('security')} data-tooltip="Open security shield">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Security Shield
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 glass-card p-5">
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
          <div className="space-y-1">
            {RECENT_ACTIVITY.map((item, idx) => (
              <div key={item.id} className="activity-item">
                <div className="activity-dot" style={{ background: item.color }} />
                {idx < RECENT_ACTIVITY.length - 1 && <div className="activity-line" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>{item.text}</p>
                  <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-ghost)' }}>{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

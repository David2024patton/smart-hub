import { useState } from 'react'

interface Tunnel {
  id: string; name: string; localPort: number; remoteUrl: string; status: 'active' | 'connecting' | 'closed' | 'error'
  protocol: string; latency: string; startedAt: string
}

interface LogEntry {
  time: string
  level: string
  message: string
}

interface Server {
  name: string
  status: 'active' | 'idle'
  tools: number
  type: 'core' | 'on-demand'
  port: number | null
  logs: LogEntry[]
}

const SERVER_LOG_TEMPLATES: Record<string, LogEntry[]> = {
  'smart-terminal-mcp': [
    { time: '10:23:45', level: 'INFO', message: 'PTY session opened (pid=8712)' },
    { time: '10:23:46', level: 'INFO', message: 'Shell detected: powershell.exe' },
    { time: '10:24:01', level: 'WARN', message: 'Working directory not found, fallback to $HOME' },
    { time: '10:24:12', level: 'INFO', message: 'Command executed: git status (exit=0)' },
    { time: '10:25:00', level: 'INFO', message: 'PTY session closed (pid=8712)' },
    { time: '10:25:30', level: 'DEBUG', message: 'Reaping orphaned child process' },
  ],
  'simple-todo-mcp': [
    { time: '10:20:00', level: 'INFO', message: 'MCP server started on stdio' },
    { time: '10:20:01', level: 'INFO', message: 'Registered 4 tools: list, add, update, delete' },
    { time: '10:22:15', level: 'INFO', message: 'Tool call: list_todos (duration=12ms)' },
    { time: '10:28:33', level: 'INFO', message: 'Tool call: add_todo (duration=8ms)' },
  ],
  'filesystem': [
    { time: '10:15:00', level: 'INFO', message: 'File watcher initialized' },
    { time: '10:15:01', level: 'INFO', message: 'Watching: C:\\Users\\David\\AI (recursive)' },
    { time: '10:17:22', level: 'INFO', message: 'Change detected: src/renderer/App.tsx modified' },
    { time: '10:19:45', level: 'WARN', message: 'File size exceeds diff threshold (2.1MB)' },
  ],
  'docker-mcp': [
    { time: '10:10:00', level: 'INFO', message: 'Docker daemon connected (v24.0.7)' },
    { time: '10:10:05', level: 'INFO', message: 'Pulled image: node:20-alpine' },
    { time: '10:12:30', level: 'INFO', message: 'Container started: smart-hub-dev (id=a3f2...)' },
    { time: '10:14:00', level: 'ERROR', message: 'Container smart-hub-dev OOM killed' },
  ],
  'codriver': [
    { time: '09:55:00', level: 'INFO', message: 'Win32 UI Automation initialized' },
    { time: '09:55:02', level: 'INFO', message: 'Webcam device not found (fallback to screen capture)' },
    { time: '09:56:10', level: 'DEBUG', message: 'Cursor position: (1420, 860)' },
  ],
  'searxng': [
    { time: '09:30:00', level: 'INFO', message: 'Search instance: https://searx.local' },
    { time: '09:30:05', level: 'INFO', message: 'Index health: 98.2%' },
    { time: '09:35:22', level: 'WARN', message: 'Rate limit approaching (42/60 req/min)' },
  ],
  'context7': [
    { time: '09:00:00', level: 'INFO', message: 'Documentation indexer started' },
    { time: '09:00:30', level: 'INFO', message: 'Loaded 1,247 doc pages from cache' },
    { time: '09:05:00', level: 'INFO', message: 'Server listening on port 29700' },
    { time: '09:12:00', level: 'INFO', message: 'Query: "Tauri invoke error handling" (3 results)' },
  ],
  'playwright': [
    { time: '08:45:00', level: 'INFO', message: 'Browser launch: chromium headless' },
    { time: '08:45:02', level: 'INFO', message: 'Browser version: Chromium 124.0.6367.91' },
    { time: '08:46:30', level: 'INFO', message: 'Navigating to https://example.com' },
    { time: '08:46:33', level: 'INFO', message: 'Screenshot captured (1920x1080)' },
  ],
}

function buildDefaultLogs(name: string): LogEntry[] {
  return SERVER_LOG_TEMPLATES[name] ?? [
    { time: new Date().toLocaleTimeString(), level: 'INFO', message: `${name} server connected` },
    { time: new Date().toLocaleTimeString(), level: 'INFO', message: 'Awaiting tool calls' },
  ]
}

const INITIAL_SERVERS: Server[] = [
  { name: 'smart-terminal-mcp', status: 'active', tools: 12, type: 'core', port: null, logs: buildDefaultLogs('smart-terminal-mcp') },
  { name: 'simple-todo-mcp', status: 'active', tools: 4, type: 'core', port: 52981, logs: buildDefaultLogs('simple-todo-mcp') },
  { name: 'filesystem', status: 'active', tools: 8, type: 'core', port: null, logs: buildDefaultLogs('filesystem') },
  { name: 'docker-mcp', status: 'active', tools: 6, type: 'core', port: null, logs: buildDefaultLogs('docker-mcp') },
  { name: 'codriver', status: 'idle', tools: 3, type: 'on-demand', port: null, logs: buildDefaultLogs('codriver') },
  { name: 'searxng', status: 'active', tools: 2, type: 'on-demand', port: null, logs: buildDefaultLogs('searxng') },
  { name: 'context7', status: 'active', tools: 1, type: 'on-demand', port: 29700, logs: buildDefaultLogs('context7') },
  { name: 'playwright', status: 'idle', tools: 4, type: 'on-demand', port: null, logs: buildDefaultLogs('playwright') },
]

const INITIAL_TUNNELS: Tunnel[] = [
  { id: 't1', name: 'dev-ssh', localPort: 3000, remoteUrl: 'https://dev-smart-hub.ngrok.app', status: 'active', protocol: 'ngrok', latency: '24ms', startedAt: '09:15:00' },
  { id: 't2', name: 'mcp-proxy', localPort: 52981, remoteUrl: 'https://mcp-proxy.cf.dev', status: 'active', protocol: 'cloudflare', latency: '42ms', startedAt: '09:20:00' },
  { id: 't3', name: 'db-tunnel', localPort: 5432, remoteUrl: 'https://db-relay.bore.pub', status: 'connecting', protocol: 'bore', latency: '—', startedAt: '10:05:00' },
  { id: 't4', name: 'debug-relay', localPort: 9229, remoteUrl: 'https://debug-session.loca.lt', status: 'closed', protocol: 'localtunnel', latency: '—', startedAt: '08:45:00' },
  { id: 't5', name: 'metrics', localPort: 9090, remoteUrl: 'https://metrics-sh.pinggy.io', status: 'error', protocol: 'pinggy', latency: '—', startedAt: '10:30:00' },
]

export function McpMeshPage() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [servers, setServers] = useState(INITIAL_SERVERS)
  const [logServer, setLogServer] = useState<string | null>(null)
  const [showCreator, setShowCreator] = useState(false)
  const [creatorMode, setCreatorMode] = useState<'quick' | 'full' | 'paste'>('quick')
  const [tunnels, setTunnels] = useState(INITIAL_TUNNELS)

  const [quickForm, setQuickForm] = useState({ name: '', command: '', type: 'on-demand' as Server['type'], port: '' })
  const [fullConfigJson, setFullConfigJson] = useState('{\n  "name": "",\n  "type": "on-demand",\n  "command": "",\n  "port": null\n}')
  const [pasteJson, setPasteJson] = useState('')

  const filteredServers = servers.filter((srv) => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Core') return srv.type === 'core'
    if (activeFilter === 'On-Demand') return srv.type === 'on-demand'
    if (activeFilter === 'Active') return srv.status === 'active'
    if (activeFilter === 'Idle') return srv.status === 'idle'
    return true
  })

  const totalTools = servers.reduce((s, srv) => s + srv.tools, 0)
  const activeCount = servers.filter(s => s.status === 'active').length
  const selectedServer = logServer ? servers.find(s => s.name === logServer) : null

  function addServer(srv: Server) {
    setServers(prev => [...prev, srv])
    setShowCreator(false)
    setQuickForm({ name: '', command: '', type: 'on-demand', port: '' })
    setFullConfigJson('{\n  "name": "",\n  "type": "on-demand",\n  "command": "",\n  "port": null\n}')
    setPasteJson('')
  }

  function handleQuickAdd() {
    if (!quickForm.name.trim()) return
    addServer({
      name: quickForm.name.trim(),
      status: 'idle',
      tools: 0,
      type: quickForm.type,
      port: quickForm.port ? parseInt(quickForm.port) : null,
      logs: buildDefaultLogs(quickForm.name.trim()),
    })
  }

  function handleFullConfig() {
    try {
      const parsed = JSON.parse(fullConfigJson)
      if (!parsed.name) return
      addServer({
        name: parsed.name,
        status: 'idle',
        tools: 0,
        type: parsed.type ?? 'on-demand',
        port: parsed.port ?? null,
        logs: buildDefaultLogs(parsed.name),
      })
    } catch { /* invalid json */ }
  }

  function handlePasteJson() {
    try {
      const parsed = JSON.parse(pasteJson)
      if (!parsed.name) return
      addServer({
        name: parsed.name,
        status: parsed.status ?? 'idle',
        tools: parsed.tools ?? 0,
        type: parsed.type ?? 'on-demand',
        port: parsed.port ?? null,
        logs: buildDefaultLogs(parsed.name),
      })
    } catch { /* invalid json */ }
  }

  function addMockLogLine(serverName: string) {
    setServers(prev => prev.map(s => {
      if (s.name !== serverName) return s
      const levels = ['INFO', 'INFO', 'INFO', 'WARN', 'DEBUG'] as const
      const level = levels[Math.floor(Math.random() * levels.length)]
      const messages = [
        'Tool call dispatched', 'Heartbeat OK', 'Memory usage: 42MB',
        'Connection pool refreshed', 'Cache TTL expired, re-fetching',
        'Configuration reloaded', 'Idle timeout reset',
      ]
      return {
        ...s,
        logs: [
          ...s.logs,
          { time: new Date().toLocaleTimeString(), level, message: messages[Math.floor(Math.random() * messages.length)] },
        ],
      }
    }))
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>MCP Mesh</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage connected tool servers and their capabilities</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="action-chip cursor-pointer"
            style={{
              background: 'var(--accent-subtle)', color: 'var(--accent)',
              border: '1px solid hsla(160, 84%, 39%, 0.2)',
            }}
            onClick={() => setShowCreator(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Server
          </button>
          <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{
            background: 'var(--accent-subtle)', color: 'var(--accent)',
            border: '1px solid hsla(160, 84%, 39%, 0.15)'
          }}>
            {activeCount}/{servers.length} active
          </span>
          <span className="text-xs px-3 py-1.5 rounded-full font-mono" style={{
            background: 'hsla(217, 91%, 60%, 0.08)', color: 'var(--blue)',
            border: '1px solid hsla(217, 91%, 60%, 0.15)'
          }}>
            {totalTools} tools
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2">
        {['All', 'Core', 'On-Demand', 'Active', 'Idle'].map((filter) => {
          const isActive = activeFilter === filter
          return (
            <button
              key={filter}
              className="action-chip cursor-pointer"
              style={isActive ? {
                background: 'var(--accent-subtle)', color: 'var(--accent)',
                borderColor: 'hsla(160, 84%, 39%, 0.2)'
              } : {}}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          )
        })}
      </div>

      {/* Server Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
        {filteredServers.map((srv) => (
          <div key={srv.name} className="glass-card p-5 animate-fade-up">
            <div className="flex items-center gap-3 mb-3">
              <span className={`mcp-dot ${srv.status === 'active' ? 'mcp-dot-active' : 'mcp-dot-idle'}`} />
              <h3 className="text-base font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{srv.name}</h3>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded uppercase font-medium tracking-wider" style={{
                background: srv.type === 'core' ? 'hsla(262, 83%, 58%, 0.08)' : 'rgba(255,255,255,0.03)',
                color: srv.type === 'core' ? 'var(--violet)' : 'var(--text-muted)',
                border: `1px solid ${srv.type === 'core' ? 'hsla(262, 83%, 58%, 0.15)' : 'var(--glass-border)'}`
              }}>
                {srv.type}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span>{srv.tools} tools registered</span>
              {srv.port && <span className="font-mono text-xs" style={{ color: 'var(--text-ghost)' }}>:{srv.port}</span>}
            </div>
            <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
              <button
                className="text-xs px-2.5 py-1 rounded font-medium cursor-pointer transition-all hover:opacity-80"
                style={{
                  background: 'hsla(160, 84%, 39%, 0.08)', color: 'var(--accent)',
                  border: '1px solid hsla(160, 84%, 39%, 0.12)',
                }}
                onClick={() => setLogServer(srv.name)}
              >
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  Logs
                </span>
              </button>
              <button
                className="text-xs px-2.5 py-1 rounded font-medium cursor-pointer transition-all hover:opacity-80"
                style={{
                  background: 'hsla(217, 91%, 60%, 0.08)', color: 'var(--blue)',
                  border: '1px solid hsla(217, 91%, 60%, 0.12)',
                }}
                onClick={() => {
                  setLogServer(srv.name)
                  addMockLogLine(srv.name)
                }}
              >
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  Refresh
                </span>
              </button>
            </div>
          </div>
        ))}
        {filteredServers.length === 0 && (
          <div className="col-span-2 text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            No connected servers match the active filter.
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────
           Tunnel GUI (#27)
           ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Tunnels</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Remote access tunnels for exposing local MCP servers</p>
          </div>
          <button
            className="text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all hover:opacity-80"
            style={{
              background: 'hsla(160, 84%, 39%, 0.08)', color: 'var(--accent)',
              border: '1px solid hsla(160, 84%, 39%, 0.15)',
            }}
            onClick={() => {
              setTunnels(prev => [...prev, {
                id: `t${Date.now()}`, name: `tunnel-${prev.length + 1}`, localPort: 8000 + prev.length,
                remoteUrl: 'https://pending.bore.pub', status: 'connecting' as const,
                protocol: 'bore', latency: '—', startedAt: new Date().toLocaleTimeString(),
              }])
            }}
          >
            + New Tunnel
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
          {tunnels.map(t => {
            const statusColors: Record<string, string> = {
              active: 'var(--accent)', connecting: 'var(--amber)',
              closed: 'var(--text-ghost)', error: 'var(--rose)',
            }
            return (
              <div key={t.id} className="glass-card p-4 animate-fade-up">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: statusColors[t.status] }} />
                    <h3 className="text-sm font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{t.name}</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded uppercase font-medium tracking-wider"
                    style={{
                      background: t.protocol === 'ngrok' ? 'hsla(160, 84%, 39%, 0.08)'
                        : t.protocol === 'cloudflare' ? 'hsla(217, 91%, 60%, 0.08)'
                        : 'rgba(255,255,255,0.03)',
                      color: t.protocol === 'ngrok' ? 'var(--accent)'
                        : t.protocol === 'cloudflare' ? 'var(--blue)' : 'var(--text-muted)',
                      border: '1px solid var(--glass-border)',
                    }}
                  >
                    {t.protocol}
                  </span>
                </div>
                <div className="text-xs space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-ghost)' }}>Local</span>
                    <span className="font-mono">:{t.localPort}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-ghost)' }}>Remote</span>
                    <span className="font-mono truncate max-w-[180px]" data-tooltip={t.remoteUrl}>{t.remoteUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-ghost)' }}>Latency</span>
                    <span>{t.latency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-ghost)' }}>Started</span>
                    <span>{t.startedAt}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
                  {t.status === 'active' ? (
                    <button
                      className="text-xs px-2.5 py-1 rounded font-medium cursor-pointer transition-all hover:opacity-80"
                      style={{
                        background: 'hsla(0, 72%, 51%, 0.08)', color: 'var(--rose)',
                        border: '1px solid hsla(0, 72%, 51%, 0.12)',
                      }}
                      onClick={() => setTunnels(prev => prev.map(x => x.id === t.id ? { ...x, status: 'closed' as const } : x))}
                    >
                      Close
                    </button>
                  ) : (
                    <button
                      className="text-xs px-2.5 py-1 rounded font-medium cursor-pointer transition-all hover:opacity-80"
                      style={{
                        background: 'hsla(160, 84%, 39%, 0.08)', color: 'var(--accent)',
                        border: '1px solid hsla(160, 84%, 39%, 0.12)',
                      }}
                      onClick={() => setTunnels(prev => prev.map(x => x.id === t.id ? { ...x, status: 'active' as const, latency: `${Math.floor(Math.random() * 80) + 10}ms` } : x))}
                    >
                      Restart
                    </button>
                  )}
                  <button
                    className="text-xs px-2.5 py-1 rounded font-medium cursor-pointer transition-all hover:opacity-80 ml-auto"
                    style={{
                      background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)',
                      border: '1px solid var(--glass-border)',
                    }}
                    onClick={() => setTunnels(prev => prev.filter(x => x.id !== t.id))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ──────────────────────────────────────────────
           Logs Overlay Drawer (#15)
           ────────────────────────────────────────────── */}
      {logServer && selectedServer && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setLogServer(null)}
          />
          <div
            className="fixed top-0 right-0 h-full w-[480px] z-50 overflow-y-auto shadow-2xl animate-fade-up"
            style={{
              background: 'var(--bg-deep)',
              borderLeft: '1px solid var(--glass-border)',
            }}
          >
            {/* Drawer header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5"
              style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--glass-border)' }}
            >
              <div className="flex items-center gap-3">
                <span className={`mcp-dot ${selectedServer.status === 'active' ? 'mcp-dot-active' : 'mcp-dot-idle'}`} />
                <div>
                  <h3 className="text-base font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{selectedServer.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedServer.logs.length} log entries</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="text-xs px-2.5 py-1 rounded font-medium cursor-pointer transition-all hover:opacity-80"
                  style={{
                    background: 'hsla(217, 91%, 60%, 0.08)', color: 'var(--blue)',
                    border: '1px solid hsla(217, 91%, 60%, 0.12)',
                  }}
                  onClick={() => addMockLogLine(selectedServer.name)}
                >
                  Simulate
                </button>
                <button
                  className="p-1.5 rounded-md cursor-pointer hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => setLogServer(null)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Log entries */}
            <div className="p-4 space-y-1">
              {selectedServer.logs.map((entry, i) => {
                const levelColor = entry.level === 'ERROR' ? 'var(--rose)'
                  : entry.level === 'WARN' ? 'var(--amber)'
                  : entry.level === 'DEBUG' ? 'var(--violet)'
                  : 'var(--accent)'
                return (
                  <div key={i} className="flex gap-3 py-1.5 px-3 rounded text-xs font-mono hover:bg-white/[0.02] transition-colors">
                    <span className="tabular-nums flex-shrink-0" style={{ color: 'var(--text-ghost)', width: 64 }}>{entry.time}</span>
                    <span className="flex-shrink-0 font-semibold" style={{ color: levelColor, width: 48 }}>{entry.level}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{entry.message}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ──────────────────────────────────────────────
           Server Creator Modal (#16)
           ────────────────────────────────────────────── */}
      {showCreator && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowCreator(false)}
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreator(false)}
          >
            <div
              className="w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-fade-up"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Add MCP Server</h2>
                <button
                  className="p-1 rounded cursor-pointer hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => setShowCreator(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Mode tabs */}
              <div className="flex px-5 pt-4 gap-1">
                {(['quick', 'full', 'paste'] as const).map(mode => (
                  <button
                    key={mode}
                    className="text-sm px-4 py-2 rounded-t-md font-medium cursor-pointer transition-all"
                    style={creatorMode === mode ? {
                      background: 'var(--bg-elevated)', color: 'var(--accent)',
                      border: '1px solid var(--glass-border)', borderBottom: '1px solid var(--bg-elevated)',
                      marginBottom: '-1px',
                    } : {
                      color: 'var(--text-muted)',
                    }}
                    onClick={() => setCreatorMode(mode)}
                  >
                    {mode === 'quick' ? 'Quick Add' : mode === 'full' ? 'Full Config' : 'Paste JSON'}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {/* Quick Add */}
                {creatorMode === 'quick' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Server Name</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                        style={{
                          background: 'var(--bg-deep)', color: 'var(--text-primary)',
                          border: '1px solid var(--glass-border)',
                        }}
                        placeholder="my-custom-mcp"
                        value={quickForm.name}
                        onChange={e => setQuickForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Type</label>
                      <select
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
                        style={{
                          background: 'var(--bg-deep)', color: 'var(--text-primary)',
                          border: '1px solid var(--glass-border)',
                        }}
                        value={quickForm.type}
                        onChange={e => setQuickForm(prev => ({ ...prev, type: e.target.value as Server['type'] }))}
                      >
                        <option value="core">Core</option>
                        <option value="on-demand">On-Demand</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Command / URL</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                        style={{
                          background: 'var(--bg-deep)', color: 'var(--text-primary)',
                          border: '1px solid var(--glass-border)',
                        }}
                        placeholder="npx -y @modelcontextprotocol/server-filesystem"
                        value={quickForm.command}
                        onChange={e => setQuickForm(prev => ({ ...prev, command: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Port (optional)</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none transition-all"
                        style={{
                          background: 'var(--bg-deep)', color: 'var(--text-primary)',
                          border: '1px solid var(--glass-border)',
                        }}
                        placeholder="3000"
                        value={quickForm.port}
                        onChange={e => setQuickForm(prev => ({ ...prev, port: e.target.value }))}
                      />
                    </div>
                    <button
                      className="w-full text-sm px-4 py-2.5 rounded-lg font-medium cursor-pointer transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: 'var(--accent)', color: 'white',
                      }}
                      disabled={!quickForm.name.trim()}
                      onClick={handleQuickAdd}
                    >
                      Add Server
                    </button>
                  </div>
                )}

                {/* Full Config JSON editor */}
                {creatorMode === 'full' && (
                  <div className="space-y-4">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Edit the full server configuration as JSON.
                    </p>
                    <textarea
                      className="w-full h-[240px] px-3 py-3 rounded-lg text-xs font-mono leading-relaxed outline-none resize-none transition-all"
                      style={{
                        background: 'var(--bg-deep)', color: 'var(--text-primary)',
                        border: '1px solid var(--glass-border)',
                      }}
                      value={fullConfigJson}
                      onChange={e => setFullConfigJson(e.target.value)}
                    />
                    <button
                      className="w-full text-sm px-4 py-2.5 rounded-lg font-medium cursor-pointer transition-all hover:opacity-90"
                      style={{ background: 'var(--accent)', color: 'white' }}
                      onClick={handleFullConfig}
                    >
                      Parse & Add
                    </button>
                  </div>
                )}

                {/* Paste JSON installer */}
                {creatorMode === 'paste' && (
                  <div className="space-y-4">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Paste an MCP server config JSON snippet from any client config.
                    </p>
                    <textarea
                      className="w-full h-[200px] px-3 py-3 rounded-lg text-xs font-mono leading-relaxed outline-none resize-none transition-all"
                      style={{
                        background: 'var(--bg-deep)', color: 'var(--text-primary)',
                        border: '1px solid var(--glass-border)',
                      }}
                      placeholder='{"name": "my-server", "type": "core", "command": "npx foo", "port": 3000}'
                      value={pasteJson}
                      onChange={e => setPasteJson(e.target.value)}
                    />
                    <button
                      className="w-full text-sm px-4 py-2.5 rounded-lg font-medium cursor-pointer transition-all hover:opacity-90"
                      style={{ background: 'var(--accent)', color: 'white' }}
                      onClick={handlePasteJson}
                    >
                      Parse & Install
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

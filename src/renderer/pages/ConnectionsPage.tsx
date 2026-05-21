import { useState } from 'react'

interface SavedConnection {
  id: string
  type: 'sse' | 'streamable-http' | 'stdio' | 'api'
  name: string
  status: 'connected' | 'disconnected' | 'error'
  url?: string
  command?: string
  args?: string
  apiUrl?: string
  apiKey?: string
  username?: string
  password?: string
}

interface FormState {
  url: string
  headers: string
  command: string
  args: string
  cwd: string
  apiUrl: string
  apiKey: string
  username: string
  password: string
}

const emptyForm: FormState = {
  url: '',
  headers: '',
  command: 'npx',
  args: '-y @modelcontextprotocol/server-filesystem',
  cwd: '',
  apiUrl: '',
  apiKey: '',
  username: '',
  password: '',
}

const TRANSPORT_DEFS = [
  {
    id: 'sse' as const,
    name: 'SSE (Server-Sent Events)',
    icon: '🌐',
    desc: 'HTTP streaming transport — the MCP server sends events over a long-lived SSE connection. Ideal for web-deployed MCP servers.',
  },
  {
    id: 'streamable-http' as const,
    name: 'Streamable HTTP',
    icon: '⚡',
    desc: 'OpenAI-compatible REST-style transport. Supports streaming responses and token-level progress. Great for cloud-hosted AI services.',
  },
  {
    id: 'stdio' as const,
    name: 'STDIO (stdin/stdout)',
    icon: '💻',
    desc: 'Local process spawning via stdin/stdout pipes. Fastest option — the MCP server runs as a child process with zero network overhead.',
  },
  {
    id: 'api' as const,
    name: 'API Key / Basic Auth',
    icon: '🔑',
    desc: 'Connect to any REST API with authentication. Supports API keys, Bearer tokens, and Basic Auth (username + password).',
  },
]

const STATUS_LABELS: Record<string, string> = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  error: 'Error',
}

export function ConnectionsPage() {
  const [connections, setConnections] = useState<SavedConnection[]>([
    {
      id: 'simple-todo-mcp',
      type: 'stdio',
      name: 'simple-todo-mcp',
      status: 'disconnected',
      command: 'npx',
      args: '-y simple-todo-mcp',
    },
  ])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [forms, setForms] = useState<Record<string, FormState>>({})

  const getForm = (id: string): FormState => forms[id] || { ...emptyForm }

  const updateForm = (id: string, patch: Partial<FormState>) => {
    setForms(prev => ({ ...prev, [id]: { ...getForm(id), ...patch } }))
  }

  const getDefaultName = (type: string): string => {
    const labels: Record<string, string> = {
      sse: 'My SSE Server',
      'streamable-http': 'My Streamable HTTP',
      stdio: 'My STDIO Server',
      api: 'My API Endpoint',
    }
    return labels[type] || 'My Connection'
  }

  const handleSave = (type: SavedConnection['type']) => {
    const f = getForm(type)
    const base: SavedConnection = {
      id: `${type}-${Date.now()}`,
      type,
      name: getDefaultName(type),
      status: 'disconnected',
    }

    let conn: SavedConnection
    if (type === 'sse') {
      conn = { ...base, url: f.url }
    } else if (type === 'streamable-http') {
      conn = { ...base, url: f.url }
    } else if (type === 'stdio') {
      conn = { ...base, command: f.command, args: f.args }
    } else {
      conn = { ...base, apiUrl: f.apiUrl, apiKey: f.apiKey, username: f.username, password: f.password }
    }

    setConnections(prev => [...prev, conn])
    setForms(prev => ({ ...prev, [type]: { ...emptyForm } }))
    setExpanded(null)
  }

  const handleDelete = (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id))
  }

  const toggleConnection = (id: string) => {
    setConnections(prev => prev.map(c =>
      c.id === id
        ? { ...c, status: c.status === 'connected' ? 'disconnected' : 'connected' as const }
        : c
    ))
  }

  const totalConnected = connections.filter(c => c.status === 'connected').length

  const renderConfigForm = (type: SavedConnection['type']) => {
    const f = getForm(type)

    if (type === 'sse' || type === 'streamable-http') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 text-gray-400">Endpoint URL</label>
            <input
              type="text"
              value={f.url}
              onChange={e => updateForm(type, { url: e.target.value })}
              placeholder={type === 'sse' ? 'http://localhost:47900/sse' : 'http://localhost:8080/v1/chat'}
              className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/20 text-white placeholder:text-white/30 font-mono"
            />
          </div>
          {type === 'streamable-http' && (
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 text-gray-400">Headers (JSON)</label>
              <input
                type="text"
                value={f.headers}
                onChange={e => updateForm(type, { headers: e.target.value })}
                placeholder='{"Authorization": "Bearer sk-..."}'
                className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/20 text-white placeholder:text-white/30 font-mono"
              />
            </div>
          )}
        </div>
      )
    }

    if (type === 'stdio') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 text-gray-400">Command</label>
            <input
              type="text"
              value={f.command}
              onChange={e => updateForm(type, { command: e.target.value })}
              placeholder="npx"
              className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/20 text-white placeholder:text-white/30 font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 text-gray-400">Arguments</label>
            <input
              type="text"
              value={f.args}
              onChange={e => updateForm(type, { args: e.target.value })}
              placeholder="-y @modelcontextprotocol/server-filesystem"
              className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/20 text-white placeholder:text-white/30 font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 text-gray-400">Working Directory</label>
            <input
              type="text"
              value={f.cwd}
              onChange={e => updateForm(type, { cwd: e.target.value })}
              placeholder="C:\Users\David\AI\smart-hub\001"
              className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/20 text-white placeholder:text-white/30 font-mono"
            />
          </div>
        </div>
      )
    }

    if (type === 'api') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 text-gray-400">API URL</label>
            <input
              type="text"
              value={f.apiUrl}
              onChange={e => updateForm(type, { apiUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/20 text-white placeholder:text-white/30 font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 text-gray-400">API Key / Bearer Token</label>
            <input
              type="password"
              value={f.apiKey}
              onChange={e => updateForm(type, { apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/20 text-white placeholder:text-white/30 font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 text-gray-400">Username</label>
              <input
                type="text"
                value={f.username}
                onChange={e => updateForm(type, { username: e.target.value })}
                placeholder="admin"
                className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/20 text-white placeholder:text-white/30 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 text-gray-400">Password</label>
              <input
                type="password"
                value={f.password}
                onChange={e => updateForm(type, { password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/20 text-white placeholder:text-white/30 font-mono"
              />
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  const renderSnippet = (type: SavedConnection['type']) => {
    const f = getForm(type)

    if (type === 'sse') {
      return `{
  "mcpServers": {
    "smart-hub": {
      "url": "${f.url || 'http://localhost:47900/sse'}",
      "transport": "sse"
    }
  }
}`
    }
    if (type === 'streamable-http') {
      return `{
  "mcpServers": {
    "smart-hub": {
      "url": "${f.url || 'http://localhost:8080/v1/chat'}",
      "transport": "streamable-http"
    }
  }
}`
    }
    if (type === 'stdio') {
      return `{
  "mcpServers": {
    "smart-hub": {
      "command": "${f.command || 'npx'}",
      "args": [${(f.args || '-y @modelcontextprotocol/server-filesystem').split(' ').map(a => `"${a}"`).join(', ')}]
    }
  }
}`
    }
    if (type === 'api') {
      return `{
  "mcpServers": {
    "smart-hub": {
      "url": "${f.apiUrl || 'https://api.openai.com/v1'}",
      "headers": {
        "Authorization": "Bearer ${f.apiKey ? 'sk-...' : '<your-key>'}",
        "X-API-Key": "${f.apiKey || '<your-key>'}"
      }
    }
  }
}`
    }
    return ''
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Connections</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Configure transport protocols, remote access, and API authentication
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
            {totalConnected} / {connections.length} active
          </span>
        </div>
      </div>

      {/* Saved Connections List */}
      {connections.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Saved Connections
          </h2>
          {connections.map(conn => (
            <div
              key={conn.id}
              className="glass-card p-4 animate-fade-up flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`mcp-dot ${conn.status === 'connected' ? 'mcp-dot-active' : conn.status === 'error' ? 'mcp-dot-error' : ''}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">{conn.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase" style={{
                      background: conn.status === 'connected' ? 'var(--accent-subtle)' : conn.status === 'error' ? 'hsla(350, 89%, 60%, 0.1)' : 'rgba(255,255,255,0.05)',
                      color: conn.status === 'connected' ? 'var(--accent)' : conn.status === 'error' ? 'var(--rose)' : 'var(--text-muted)'
                    }}>
                      {STATUS_LABELS[conn.status]}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono truncate mt-0.5" style={{ color: 'var(--text-ghost)' }}>
                    {conn.url || conn.command || conn.apiUrl || conn.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                    conn.status === 'connected'
                      ? 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30'
                      : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                  }`}
                  onClick={() => toggleConnection(conn.id)}
                >
                  {conn.status === 'connected' ? 'Disconnect' : 'Connect'}
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                  onClick={() => handleDelete(conn.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transport Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
        {TRANSPORT_DEFS.map(t => {
          const isOpen = expanded === t.id
          const savedCount = connections.filter(c => c.type === t.id).length

          return (
            <div
              key={t.id}
              className="glass-card p-5 animate-fade-up"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl">{t.icon}</span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{t.name}</h3>
                    <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {t.desc}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full whitespace-nowrap" style={{
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  border: '1px solid hsla(160, 84%, 39%, 0.15)'
                }}>
                  {savedCount} saved
                </span>
              </div>

              {/* Expand/Collapse toggle */}
              <button
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold cursor-pointer mt-2"
                style={{
                  background: isOpen ? 'var(--accent-subtle)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isOpen ? 'hsla(160, 84%, 39%, 0.2)' : 'var(--glass-border)'}`,
                  color: isOpen ? 'var(--accent)' : 'var(--text-muted)'
                }}
                onClick={() => setExpanded(isOpen ? null : t.id)}
              >
                <span>{isOpen ? '▼' : '▶'} {isOpen ? 'Hide Config' : 'Configure New Connection'}</span>
                <span className="text-[10px] font-mono opacity-50">{t.id.toUpperCase()}</span>
              </button>

              {/* Config Form */}
              {isOpen && (
                <div className="mt-4 space-y-4 animate-fade-up">
                  {renderConfigForm(t.id)}

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-600/30 cursor-pointer"
                      onClick={() => handleSave(t.id)}
                    >
                      ➕ Save Connection
                    </button>
                    <button
                      className="px-3 py-2 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 cursor-pointer"
                      onClick={() => { setExpanded(null); setForms(prev => ({ ...prev, [t.id]: { ...emptyForm } })) }}
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Quick-config snippet */}
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)' }}>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider mb-1.5 text-gray-500">Client Config Snippet</p>
                    <pre className="text-[10px] font-mono overflow-x-auto whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>
                      {renderSnippet(t.id)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Connect - default SSE snippet */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Quick Connect</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Paste this default snippet into your client's MCP configuration to connect to Smart Hub's built-in SSE transport:
        </p>
        <pre className="p-4 rounded-lg text-sm font-mono overflow-x-auto" style={{
          background: 'rgba(0,0,0,0.3)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)'
        }}>{`{
  "mcpServers": {
    "smart-hub": {
      "url": "http://localhost:47900/sse",
      "transport": "sse"
    }
  }
}`}</pre>
      </div>
    </div>
  )
}

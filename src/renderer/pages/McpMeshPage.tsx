// src/renderer/pages/McpMeshPage.tsx
// Smart Hub | MCP Mesh View
// Phase 0.3: Tool Server Orchestration

import { useState } from 'react'

const ALL_SERVERS = [
  { name: 'smart-terminal-mcp', status: 'active', tools: 12, type: 'core', port: null },
  { name: 'simple-todo-mcp', status: 'active', tools: 4, type: 'core', port: 52981 },
  { name: 'filesystem', status: 'active', tools: 8, type: 'core', port: null },
  { name: 'docker-mcp', status: 'active', tools: 6, type: 'core', port: null },
  { name: 'codriver', status: 'idle', tools: 3, type: 'on-demand', port: null },
  { name: 'searxng', status: 'active', tools: 2, type: 'on-demand', port: null },
  { name: 'context7', status: 'active', tools: 1, type: 'on-demand', port: 29700 },
  { name: 'playwright', status: 'idle', tools: 4, type: 'on-demand', port: null },
]

export function McpMeshPage() {
  const [activeFilter, setActiveFilter] = useState('All')

  const filteredServers = ALL_SERVERS.filter((srv) => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Core') return srv.type === 'core'
    if (activeFilter === 'On-Demand') return srv.type === 'on-demand'
    if (activeFilter === 'Active') return srv.status === 'active'
    if (activeFilter === 'Idle') return srv.status === 'idle'
    return true
  })

  const totalTools = ALL_SERVERS.reduce((s, srv) => s + srv.tools, 0)
  const activeCount = ALL_SERVERS.filter(s => s.status === 'active').length

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>MCP Mesh</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage connected tool servers and their capabilities</p>
        </div>
        <div className="flex gap-3">
          <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{
            background: 'var(--accent-subtle)', color: 'var(--accent)',
            border: '1px solid hsla(160, 84%, 39%, 0.15)'
          }}>
            {activeCount}/{ALL_SERVERS.length} active
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
                background: 'var(--accent-subtle)', 
                color: 'var(--accent)',
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
          <div key={srv.name} className="glass-card p-5 animate-fade-up cursor-pointer">
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
          </div>
        ))}
        {filteredServers.length === 0 && (
          <div className="col-span-2 text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            No connected servers match the active filter.
          </div>
        )}
      </div>
    </div>
  )
}


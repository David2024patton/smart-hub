// src/renderer/pages/MarketplacePage.tsx
// Smart Hub | Asset Marketplace
// Phase 0.4: Community Personas, MCPs, and Skills

import { useState } from 'react'

const ALL_ASSETS = [
  { id: 'code-reviewer', name: 'Code Reviewer', type: 'Persona', author: 'Anthropic', stars: 342, desc: 'Multi-agent code review for security, quality, and architecture' },
  { id: 'web-scraper', name: 'Web Scraper Pro', type: 'MCP Server', author: 'nickthecook', stars: 189, desc: 'Advanced web scraping with Cloudflare bypass and proxy rotation' },
  { id: 'frontend-design', name: 'Frontend Design', type: 'Skill', author: 'agent-zero', stars: 256, desc: '5-phase methodology for production-grade web interfaces' },
  { id: 'docker-ops', name: 'Docker Ops', type: 'Skill', author: 'david', stars: 124, desc: 'Container management, compose operations, and health checks' },
  { id: 'youtube-transcriber', name: 'YouTube Transcriber', type: 'MCP Server', author: 'community', stars: 97, desc: 'Extract transcripts from YouTube videos via yt-dlp' },
  { id: 'mojo-expert', name: 'Mojo Expert', type: 'Persona', author: 'modular', stars: 215, desc: 'Systems-level AI programming with MLIR and GPU kernels' },
]

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Persona': { bg: 'hsla(262, 83%, 58%, 0.08)', color: 'var(--violet)', border: 'hsla(262, 83%, 58%, 0.15)' },
  'MCP Server': { bg: 'hsla(217, 91%, 60%, 0.08)', color: 'var(--blue)', border: 'hsla(217, 91%, 60%, 0.15)' },
  'Skill': { bg: 'var(--accent-subtle)', color: 'var(--accent)', border: 'hsla(160, 84%, 39%, 0.15)' },
}

export function MarketplacePage() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [assetStates, setAssetStates] = useState<Record<string, 'idle' | 'installing' | 'installed'>>({})

  const filteredAssets = ALL_ASSETS.filter((asset) => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Personas') return asset.type === 'Persona'
    if (activeFilter === 'MCP Servers') return asset.type === 'MCP Server'
    if (activeFilter === 'Skills') return asset.type === 'Skill'
    return true
  })

  const handleInstall = (id: string) => {
    if (assetStates[id] === 'installed' || assetStates[id] === 'installing') return

    setAssetStates(prev => ({ ...prev, [id]: 'installing' }))

    // Simulate complete installation after 1.5 seconds
    setTimeout(() => {
      setAssetStates(prev => ({ ...prev, [id]: 'installed' }))
    }, 1500)
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Marketplace</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Discover and install community personas, MCP servers, and skills</p>
        </div>
        <button 
          className="action-chip action-chip-primary cursor-pointer"
          onClick={() => {
            const name = prompt('Enter asset name:')
            if (name) alert(`Asset "${name}" submitted successfully for peer review!`)
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Submit Asset
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {['All', 'Personas', 'MCP Servers', 'Skills'].map((filter) => {
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

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {filteredAssets.map((a) => {
          const tc = TYPE_COLORS[a.type] || TYPE_COLORS['Skill']
          const state = assetStates[a.id] || 'idle'

          let buttonText = 'Install'
          let buttonStyle = {}

          if (state === 'installing') {
            buttonText = 'Installing...'
            buttonStyle = { background: 'var(--accent-subtle)', color: 'var(--accent)', opacity: 0.7 }
          } else if (state === 'installed') {
            buttonText = 'Installed'
            buttonStyle = { background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent)' }
          }

          return (
            <div key={a.name} className="glass-card p-5 animate-fade-up flex flex-col justify-between cursor-pointer">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded uppercase font-medium tracking-wider"
                    style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                    {a.type}
                  </span>
                </div>
                <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{a.name}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{a.desc}</p>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-ghost)' }}>by {a.author}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'inline', verticalAlign: '-1px', marginRight: '3px' }}>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    {a.stars}
                  </span>
                  <button 
                    className="action-chip text-xs cursor-pointer" 
                    style={{ padding: '0.375rem 0.75rem', ...buttonStyle }}
                    onClick={() => handleInstall(a.id)}
                    disabled={state !== 'idle'}
                  >
                    {buttonText}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


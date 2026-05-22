import { useRef, useEffect } from 'react'
import { useDesktop, type DesktopWindow } from '../contexts/DesktopContext'

function isLight() {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('light-theme')
}

interface StartItem {
  id: string
  label: string
  emoji: string
  group: string
}

const START_ITEMS: StartItem[] = [
  { id: 'dashboard', label: 'Dashboard', emoji: '🚀', group: 'General' },
  { id: 'terminal', label: 'Terminal', emoji: '💻', group: 'System' },
  { id: 'mcp-grid', label: 'MCP Mesh', emoji: '🕸️', group: 'System' },
  { id: 'projects', label: 'Projects', emoji: '📁', group: 'Development' },
  { id: 'kanban', label: 'Kanban', emoji: '📋', group: 'Development' },
  { id: 'rag-lab', label: 'RAG Lab', emoji: '🧠', group: 'AI Tools' },
  { id: 'marketplace', label: 'Marketplace', emoji: '🛒', group: 'AI Tools' },
  { id: 'connections', label: 'Connections', emoji: '🔗', group: 'System' },
  { id: 'security', label: 'Sovereign Shield', emoji: '🛡️', group: 'System' },
  { id: 'lint', label: 'Lint Engine', emoji: '🧹', group: 'Development' },
  { id: 'code', label: 'Code Editor', emoji: '📝', group: 'Development' },
  { id: 'file-explorer', label: 'File Explorer', emoji: '📂', group: 'System' },
  { id: 'browser', label: 'Web Browser', emoji: '🌐', group: 'System' },
  { id: 'search', label: 'Web Search', emoji: '🔎', group: 'System' },
  { id: 'preview', label: 'Project Preview', emoji: '🔍', group: 'Development' },
  { id: 'settings', label: 'Settings', emoji: '⚙️', group: 'System' },
]

const GROUPS = ['General', 'Development', 'AI Tools', 'System']

export function StartMenu() {
  const { setStartMenu, openWindow, windows } = useDesktop()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setStartMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [setStartMenu])

  const handleClick = (pageId: string) => {
    openWindow(pageId)
    setStartMenu(false)
  }

  const isOpen = (id: string) => windows.some((w: DesktopWindow) => w.pageId === id)

  return (
    <div
      ref={menuRef}
      className="fixed bottom-[44px] left-2 z-[99999] w-[320px] rounded-xl shadow-2xl animate-fade-up overflow-hidden"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--glass-border)',
        maxHeight: '60vh',
        boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3" style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--glass-border)' }}>
        <p className="text-xs font-semibold" style={{ color: isLight() ? '#111' : '#eee' }}>Smart Hub</p>
        <p className="text-[10px] font-mono" style={{ color: isLight() ? '#555' : '#888' }}>v0.1.0-alpha</p>
      </div>

      {/* Items */}
      <div className="overflow-y-auto p-2 space-y-1">
        {GROUPS.map(group => {
          const items = START_ITEMS.filter(i => i.group === group)
          if (items.length === 0) return null
          return (
            <div key={group}>
              <p className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1.5"
                style={{ color: isLight() ? '#555' : '#999' }}>
                {group}
              </p>
              {items.map(item => (
                <button
                  key={item.id}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors"
                  style={{
                    color: isOpen(item.id) ? 'var(--accent)' : (isLight() ? '#111' : '#eee'),
                    background: isOpen(item.id) ? 'var(--accent-subtle)' : (isLight() ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.02)'),
                  }}
                  onMouseEnter={(e) => { if (!isOpen(item.id)) (e.currentTarget as HTMLElement).style.background = isLight() ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={(e) => { if (!isOpen(item.id)) (e.currentTarget as HTMLElement).style.background = isLight() ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.02)' }}
                  onClick={() => handleClick(item.id)}
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {isOpen(item.id) && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'hsla(160, 84%, 39%, 0.1)', color: 'var(--accent)' }}>
                      open
                    </span>
                  )}
                </button>
              ))}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-2" style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--glass-border)' }}>
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/5 transition-colors"
          style={{ color: isLight() ? '#333' : '#999' }}
          onClick={() => { openWindow('settings'); setStartMenu(false) }}
          data-tooltip="Open settings">
          ⚙️ Settings
        </button>
      </div>
    </div>
  )
}

import { useDesktop, type DesktopWindow } from '../contexts/DesktopContext'

const PAGE_EMOJIS: Record<string, string> = {
  dashboard: '🚀', terminal: '💻', 'mcp-grid': '🕸️', projects: '📁',
  kanban: '📋', marketplace: '🛒', 'rag-lab': '🧠', connections: '🔗',
  security: '🛡️', lint: '🧹', settings: '⚙️', browser: '🌐', preview: '🔍',
}

export function TabBar() {
  const { windows, activeWindowId, focusWindow, closeWindow } = useDesktop()

  return (
    <div className="flex items-center h-[40px] px-2 gap-0.5 select-none shrink-0 overflow-x-auto"
      style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--glass-border)' }}
    >
      {windows.length === 0 && (
        <span className="text-xs px-2" style={{ color: 'var(--text-ghost)' }}>
          No open windows
        </span>
      )}
      {windows.map((win: DesktopWindow) => (
        <div
          key={win.id}
          className={`flex items-center gap-1.5 px-2.5 h-[30px] rounded-t-md text-xs cursor-pointer group transition-colors shrink-0 max-w-[180px] ${
            win.minimized ? 'opacity-50' : ''
          }`}
          style={{
            background: win.id === activeWindowId ? 'var(--bg-elevated)' : 'rgba(255,255,255,0.02)',
            color: win.id === activeWindowId ? 'var(--text-primary)' : 'var(--text-muted)',
            border: win.id === activeWindowId ? '1px solid var(--glass-border)' : '1px solid transparent',
            borderBottom: win.id === activeWindowId ? '1px solid var(--bg-elevated)' : 'none',
            marginBottom: win.id === activeWindowId ? '-1px' : '0',
          }}
          onClick={() => win.minimized ? focusWindow(win.id) : focusWindow(win.id)}
          data-tooltip={win.title}
        >
          <span className="text-sm">{PAGE_EMOJIS[win.pageId] || '📄'}</span>
          <span className="truncate max-w-[100px]">{win.title}</span>
          <button
            className="ml-0.5 w-4 h-4 flex items-center justify-center rounded text-[8px] opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-opacity cursor-pointer"
            style={{ color: 'var(--text-ghost)' }}
            onClick={(e) => { e.stopPropagation(); closeWindow(win.id) }}
            data-tooltip="Close tab"
          >✕</button>
        </div>
      ))}
    </div>
  )
}

// src/renderer/components/Sidebar.tsx
// Smart Hub | Collapsible Navigation Sidebar
// Phase 0.1: Design System & Layout Scaffolding

import type React from 'react'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  activePage: string
  onNavigate: (pageId: string) => void
}

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  phase?: number
  comingSoon?: boolean
}

/* SVG icons are inlined directly in NAV_ITEMS for zero-dependency rendering */

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard', label: 'Dashboard',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  },
  {
    id: 'projects', label: 'Projects',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  },
  {
    id: 'kanban', label: 'Kanban',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
    </svg>
  },
  {
    id: 'mcp-grid', label: 'MCP Mesh',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/>
      <circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/>
      <line x1="9.5" y1="10" x2="5.5" y2="7.5"/><line x1="14.5" y1="10" x2="18.5" y2="7.5"/>
      <line x1="9.5" y1="14" x2="5.5" y2="16.5"/><line x1="14.5" y1="14" x2="18.5" y2="16.5"/>
    </svg>
  },
  {
    id: 'marketplace', label: 'Marketplace',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  },
  {
    id: 'rag-lab', label: 'RAG Lab',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  },
  {
    id: 'connections', label: 'Connections',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  },
  {
    id: 'security', label: 'Sovereign Shield',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  },
  {
    id: 'terminal', label: 'Terminal',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
    </svg>
  },
  {
    id: 'code', label: 'Code Editor',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  },
  {
    id: 'browser', label: 'Web Browser',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  },
  {
    id: 'search', label: 'Web Search',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  },
  {
    id: 'file-explorer', label: 'File Explorer',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  },
  {
    id: 'lint', label: 'Lint Engine',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  },
  {
    id: 'settings', label: 'Settings',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  },
]

export function Sidebar({ collapsed, onToggleCollapse, activePage, onNavigate }: SidebarProps) {
  return (
    <aside
      className={`sidebar flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[60px]' : 'w-[240px]'
      }`}
      aria-label="Main Navigation"
    >
      {/* Sidebar Header */}
      <div className="sidebar-header p-4 flex items-center justify-between border-b border-white/5 h-[56px]">
        {!collapsed && (
          <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--accent)' }}>
            Smart Hub
          </h2>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          data-tooltip={collapsed ? 'Expand' : 'Collapse'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: 'var(--text-muted)', transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="nav-items flex-1 overflow-y-auto p-2" role="menubar" aria-label="Main navigation"
        onKeyDown={(e) => {
          const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
          const currentIdx = items.findIndex(el => el.tabIndex === 0)
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            const next = (currentIdx + 1) % items.length
            items[currentIdx]?.setAttribute('tabindex', '-1')
            items[next]?.setAttribute('tabindex', '0')
            items[next]?.focus()
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            const prev = (currentIdx - 1 + items.length) % items.length
            items[currentIdx]?.setAttribute('tabindex', '-1')
            items[prev]?.setAttribute('tabindex', '0')
            items[prev]?.focus()
          }
        }}>
        <ul className="space-y-0.5" role="none">
          {NAV_ITEMS.map((item) => (
            <NavItemRow
              key={item.id}
              item={item}
              collapsed={collapsed}
              isActive={item.id === activePage}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full animate-glow-pulse"
              style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-glow)' }}
            />
            <span className="text-xs font-mono" style={{ color: 'var(--text-ghost)' }}>
              v0.1.0-alpha
            </span>
          </div>
        </div>
      )}
    </aside>
  )
}

interface NavItemRowProps {
  item: NavItem
  collapsed: boolean
  isActive: boolean
  onNavigate: (pageId: string) => void
}

function NavItemRow({ item, collapsed, isActive, onNavigate }: NavItemRowProps) {

  return (
    <li role="none">
      <button
        role="menuitem"
        className={`
          nav-item w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md
          transition-all duration-200 text-left relative
          ${isActive
            ? ''
            : 'hover:bg-white/[0.03]'
          }
          cursor-pointer
          ${collapsed ? 'justify-center px-2' : ''}
        `}
        style={isActive ? {
          background: 'var(--accent-subtle)',
          color: 'var(--accent)',
          border: '1px solid hsla(160, 84%, 39%, 0.12)',
        } : {
          color: 'var(--text-secondary)',
          border: '1px solid transparent',
        }}
        onClick={() => onNavigate(item.id)}
        aria-current={isActive ? 'page' : undefined}
        data-tooltip={item.label}
        tabIndex={isActive ? 0 : -1}
      >
        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5" aria-hidden="true"
          style={isActive ? { color: 'var(--accent)' } : { color: 'var(--text-muted)' }}>
          {item.icon}
        </span>
        {!collapsed && (
          <span className="flex-1 truncate text-sm">
            {item.label}
          </span>
        )}
      </button>
    </li>
  )
}

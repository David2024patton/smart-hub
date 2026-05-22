import { useDesktop, type DesktopWindow } from '../contexts/DesktopContext'
import { Window } from './Window'
import { ProjectsPage } from '../pages/ProjectsPage'
import { McpMeshPage } from '../pages/McpMeshPage'
import { MarketplacePage } from '../pages/MarketplacePage'
import { RagLabPage } from '../pages/RagLabPage'
import { ConnectionsPage } from '../pages/ConnectionsPage'
import { SecurityPage } from '../pages/SecurityPage'
import { TerminalPage } from '../pages/TerminalPage'
import { KanbanPage } from '../pages/KanbanPage'
import { LintPage } from '../pages/LintPage'
import { SettingsPage } from '../pages/SettingsPage'
import { BrowserPage } from './BrowserPage'
import { PreviewPage } from './PreviewPage'
import { DashboardContent } from './DashboardContent'
import { FileExplorerPage } from './FileExplorerPage'

export function Desktop() {
  const { windows } = useDesktop()

  const renderContent = (pageId: string) => {
    switch (pageId) {
      case 'dashboard': return <DashboardContent />
      case 'projects': return <ProjectsPage />
      case 'mcp-grid': return <McpMeshPage />
      case 'marketplace': return <MarketplacePage />
      case 'rag-lab': return <RagLabPage />
      case 'connections': return <ConnectionsPage />
      case 'security': return <SecurityPage />
      case 'terminal': return <TerminalPage />
      case 'kanban': return <KanbanPage />
      case 'lint': return <LintPage />
      case 'settings': return <SettingsPage />
      case 'browser': return <BrowserPage />
      case 'preview': return <PreviewPage />
      case 'file-explorer': return <FileExplorerPage />
      default: return <div className="p-4 text-sm" style={{ color: 'var(--text-muted)' }}>Page not found</div>
    }
  }

  return (
    <div data-desktop className="relative flex-1 overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      {/* Desktop background glow */}
      <div className="ambient-glow ambient-glow-tl" />
      <div className="ambient-glow ambient-glow-br" />

      {/* Snap indicator overlays */}
      <SnapIndicators />

      {/* Windows */}
      {windows.map((win: DesktopWindow) => (
        <Window key={win.id} win={win}>
          {renderContent(win.pageId)}
        </Window>
      ))}

      {windows.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-4xl opacity-30">🪟</p>
            <p className="text-sm" style={{ color: 'var(--text-ghost)' }}>
              No windows open. Click <strong>Start</strong> or use the sidebar to open something.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function SnapIndicators() {
  const { snapIndicator } = useDesktop()
  if (!snapIndicator) return null

  const desktopEl = document.querySelector('[data-desktop]')
  const dw = desktopEl ? desktopEl.clientWidth : window.innerWidth
  const dh = desktopEl ? desktopEl.clientHeight : window.innerHeight
  const P = 14
  const iw = dw - P * 2
  const ih = dh - P * 2
  const zones: Record<string, { top: number; left: number; width: number; height: number }> = {
    'left': { top: P, left: P, width: Math.floor(iw / 2), height: ih },
    'right': { top: P, left: P + Math.ceil(iw / 2), width: Math.floor(iw / 2), height: ih },
    'top-left': { top: P, left: P, width: Math.floor(iw / 2), height: Math.floor(ih / 2) },
    'top-right': { top: P, left: P + Math.ceil(iw / 2), width: Math.floor(iw / 2), height: Math.floor(ih / 2) },
    'bottom-left': { top: P + Math.ceil(ih / 2), left: P, width: Math.floor(iw / 2), height: Math.floor(ih / 2) },
    'bottom-right': { top: P + Math.ceil(ih / 2), left: P + Math.ceil(iw / 2), width: Math.floor(iw / 2), height: Math.floor(ih / 2) },
    'full': { top: 0, left: 0, width: dw, height: dh },
  }

  const z = zones[snapIndicator]
  return (
    <div className="absolute pointer-events-none z-[9999] transition-all duration-75"
      style={{
        top: z.top, left: z.left,
        width: z.width, height: z.height,
        background: 'hsla(160, 84%, 39%, 0.05)',
        border: '2px solid hsla(160, 84%, 39%, 0.2)',
        borderRadius: '8px',
      }}
    />
  )
}

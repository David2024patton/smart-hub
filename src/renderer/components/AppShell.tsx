import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TitleBar } from './TitleBar'

import { Desktop } from './Desktop'
import { TaskBar } from './TaskBar'
import { DebugOverlay } from './DebugOverlay'
import { Mascot } from './Mascot'
import { FullscreenHint } from './FullscreenHint'
import { useCompanion } from '../contexts/CompanionContext'
import { useDesktop } from '../contexts/DesktopContext'

interface AppShellProps {
  children?: ReactNode
  collapsed: boolean
  onToggleCollapse: () => void
  activePage: string
  onNavigate: (pageId: string) => void
}

export function AppShell({ collapsed, onToggleCollapse, activePage, onNavigate }: AppShellProps) {
  const { config: companion } = useCompanion()
  const desktop = useDesktop()

  const handleNavigate = (pageId: string) => {
    desktop.openWindow(pageId)
    onNavigate(pageId)
  }

  return (
    <div className="app-shell flex h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
        style={{ background: 'var(--accent)', color: 'white' }}>
        Skip to main content
      </a>

      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        activePage={activePage}
        onNavigate={handleNavigate}
      />

      <div className="main-area flex-1 flex flex-col min-w-0">
        <FullscreenHint />
        <TitleBar />
        <Desktop />
        <TaskBar />
      </div>

      <DebugOverlay activePage={activePage} />
      <Mascot activePage={activePage} companion={companion} collapsed={collapsed} />
    </div>
  )
}

// src/renderer/components/AppShell.tsx
// Smart Hub | Responsive AppShell with Collapsible Sidebar
// Phase 0.1: Design System & Layout Scaffolding

import React, { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface AppShellProps {
  children: ReactNode
  collapsed: boolean
  onToggleCollapse: () => void
  activePage: string
  onNavigate: (pageId: string) => void
}

export function AppShell({ children, collapsed, onToggleCollapse, activePage, onNavigate }: AppShellProps) {
  return (
    <div className="app-shell flex h-screen">
      {/* Collapsible Navigation Sidebar */}
      <Sidebar 
        collapsed={collapsed} 
        onToggleCollapse={onToggleCollapse}
        activePage={activePage}
        onNavigate={onNavigate}
      />
      
      {/* Main Content Area */}
      <div className="main-area flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <TopBar />
        
        {/* Page Content */}
        <div className="content-wrapper flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

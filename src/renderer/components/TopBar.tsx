// src/renderer/components/TopBar.tsx
// Smart Hub | Top Navigation Bar
// Phase 0.1: Design System & Layout Scaffolding

import React from 'react'
import { ThemeToggle } from './ThemeToggle'

export function TopBar() {
  return (
    <header className="top-bar flex items-center justify-between px-6 py-3 h-[56px]">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm">
            <li>
              <a href="#" className="transition-colors" style={{ color: 'var(--text-muted)' }}>
                Home
              </a>
            </li>
            <li style={{ color: 'var(--text-ghost)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </li>
            <li className="font-medium" style={{ color: 'var(--text-primary)' }}>Dashboard</li>
          </ol>
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Health status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: 'var(--accent-subtle)',
            color: 'var(--accent)',
            border: '1px solid hsla(160, 84%, 39%, 0.12)'
          }}>
          <span className="w-[6px] h-[6px] rounded-full animate-glow-pulse"
            style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-glow)' }} />
          HEALTHY
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User avatar */}
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}
          aria-label="User menu"
          title="Profile"
        >
          <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>D</span>
        </button>
      </div>
    </header>
  )
}

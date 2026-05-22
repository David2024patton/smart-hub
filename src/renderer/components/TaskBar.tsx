import { useState, useEffect } from 'react'
import { useDesktop, type DesktopWindow } from '../contexts/DesktopContext'
import { StartMenu } from './StartMenu'
import { ThemeToggle } from './ThemeToggle'
import { useUser } from '../contexts/UserContext'
import { fetchWeather, weatherEmoji } from '../lib/weather'
import type { WeatherData } from '../lib/weather'

const PAGE_EMOJIS: Record<string, string> = {
  dashboard: '🚀', terminal: '💻', 'mcp-grid': '🕸️', projects: '📁',
  kanban: '📋', marketplace: '🛒', 'rag-lab': '🧠', connections: '🔗',
  security: '🛡️', lint: '🧹', settings: '⚙️', browser: '🌐', preview: '🔍',
}

export function TaskBar() {
  const { windows, activeWindowId, startMenuOpen, setStartMenu, focusWindow, restoreWindow, minimizeWindow } = useDesktop()
  const { user } = useUser()
  const [clock, setClock] = useState(new Date())
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!user.location) return
    let cancelled = false
    fetchWeather(user.location).then((data: WeatherData | null) => {
      if (!cancelled && data) setWeather(data)
    })
    return () => { cancelled = true }
  }, [user.location])

  const timeStr = clock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const dateStr = clock.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const initial = user.name ? user.name.charAt(0).toUpperCase() : '?'

  const handleAppClick = (winId: string) => {
    const win = windows.find((w: DesktopWindow) => w.id === winId)
    if (!win) return
    if (win.minimized) {
      restoreWindow(winId)
    } else if (win.id === activeWindowId) {
      minimizeWindow(winId)
    } else {
      focusWindow(winId)
    }
  }

  return (
    <>
      {startMenuOpen && <StartMenu />}

      <div className="flex items-center h-[44px] px-2 shrink-0 select-none"
        style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--glass-border)' }}
      >
        {/* Start button */}
        <button
          className="flex items-center gap-1.5 px-3 h-9 rounded-lg font-semibold text-sm cursor-pointer transition-colors hover:bg-white/5"
          style={{
            color: startMenuOpen ? 'var(--accent)' : 'var(--text-secondary)',
            background: startMenuOpen ? 'var(--accent-subtle)' : 'transparent',
          }}
          onClick={() => setStartMenu(!startMenuOpen)}
          data-tooltip="Start menu"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zM13 3h8v8h-8V3zm0 10h8v8h-8v-8z"/></svg>
          Menu
        </button>

        <div className="w-px h-6 mx-1.5" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Running apps */}
        <div className="flex-1 flex items-center gap-0.5 overflow-x-auto">
          {windows.map((win: DesktopWindow) => (
            <button
              key={win.id}
              className={`flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs cursor-pointer transition-colors shrink-0 max-w-[140px] ${
                win.minimized ? 'opacity-55' : ''
              }`}
              style={{
                background: win.id === activeWindowId && !win.minimized
                  ? 'var(--accent-subtle)'
                  : 'rgba(255,255,255,0.02)',
                color: win.id === activeWindowId ? 'var(--accent)' : 'var(--text-muted)',
                border: win.id === activeWindowId && !win.minimized
                  ? '1px solid hsla(160, 84%, 39%, 0.12)'
                  : '1px solid transparent',
              }}
              onClick={() => handleAppClick(win.id)}
              data-tooltip={`${win.title}${win.minimized ? ' (minimized)' : ''}`}
            >
              <span className="text-sm">{PAGE_EMOJIS[win.pageId] || '📄'}</span>
              <span className="truncate max-w-[90px]">{win.title}</span>
            </button>
          ))}
        </div>

        {/* System tray */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {weather && (
            <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }} data-tooltip={`${weather.temp}°F, ${weather.condition || ''}`.trim()}>
              <span>{weatherEmoji(weather.code)}</span>
              <span className="font-mono">{weather.temp}°F</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }} data-tooltip={dateStr}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {timeStr}
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
            data-tooltip="All systems operational">
            <span className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--accent-glow)' }} />
            OK
          </div>

          <ThemeToggle />

          <div className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}
            data-tooltip={user.name || 'Profile'}>
            <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{initial}</span>
          </div>
        </div>
      </div>
    </>
  )
}

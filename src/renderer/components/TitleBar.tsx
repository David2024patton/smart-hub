import { useState, useEffect } from 'react'
import { useUser } from '../contexts/UserContext'
import { fetchWeather, weatherEmoji } from '../lib/weather'
import { WeatherPopover } from './WeatherPopover'
import { ThemeToggle } from './ThemeToggle'
import type { WeatherData } from '../lib/weather'

export function TitleBar() {
  const { user } = useUser()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [showForecast, setShowForecast] = useState(false)

  const initial = user.name ? user.name.charAt(0).toUpperCase() : '?'

  useEffect(() => {
    if (!user.location) return
    let cancelled = false
    fetchWeather(user.location).then((data: WeatherData | null) => {
      if (!cancelled && data) setWeather(data)
    })
    return () => { cancelled = true }
  }, [user.location])

  return (
    <div
      className="flex items-center justify-between h-[32px] px-3 select-none"
      data-tauri-drag-region
      style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--glass-border)' }}
    >
      <div className="flex items-center gap-2 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
        Smart Hub
      </div>

      <div className="flex items-center gap-2">
        {/* Weather */}
        {weather ? (
          <button
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'white' }}
            onClick={() => setShowForecast(v => !v)}
            data-tooltip="View weather forecast"
          >
            <span>{weatherEmoji(weather.code)}</span>
            <span>{weather.temp}°F</span>
          </button>
        ) : user.location ? (
          <div className="text-[10px] px-2 py-0.5 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}>
            Weather...
          </div>
        ) : null}

        {showForecast && weather && (
          <WeatherPopover weather={weather} onClose={() => setShowForecast(false)} />
        )}

        {/* Health status */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
          data-tooltip="System status — all services operational"
          style={{
            background: 'var(--accent-subtle)',
            color: 'var(--accent)',
            border: '1px solid hsla(160, 84%, 39%, 0.12)'
          }}>
          <span className="w-[5px] h-[5px] rounded-full animate-glow-pulse"
            style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--accent-glow)' }} />
          HEALTHY
        </div>

        <ThemeToggle />

        <button
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}
          aria-label="User menu"
          data-tooltip={user.name || 'Profile'}
        >
          <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{initial}</span>
        </button>
      </div>
    </div>
  )
}

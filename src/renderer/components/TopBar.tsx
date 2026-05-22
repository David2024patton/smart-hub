import { useState, useEffect } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { useUser } from '../contexts/UserContext'
import { fetchWeather, weatherEmoji } from '../lib/weather'
import { WeatherPopover } from './WeatherPopover'
import type { WeatherData } from '../lib/weather'

export function TopBar() {
  const { user } = useUser()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [showForecast, setShowForecast] = useState(false)
  const [clock, setClock] = useState(new Date())

  const initial = user.name ? user.name.charAt(0).toUpperCase() : '?'

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

  const dateStr = clock.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const timeStr = clock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  return (
    <header className="top-bar flex items-center justify-between px-6 py-3 h-[56px]">
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
          {timeStr}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {dateStr}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Weather */}
        {weather ? (
          <button
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'white' }}
            onClick={() => setShowForecast(v => !v)}
            data-tooltip="View weather forecast"
          >
            <span>{weatherEmoji(weather.code)}</span>
            <span>{weather.temp}°F</span>
          </button>
        ) : user.location ? (
          <div className="text-xs px-2.5 py-1 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}>
            Loading weather...
          </div>
        ) : null}

        {showForecast && weather && (
          <WeatherPopover weather={weather} onClose={() => setShowForecast(false)} />
        )}

        {/* Health status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          data-tooltip="System status — all services operational"
          style={{
            background: 'var(--accent-subtle)',
            color: 'var(--accent)',
            border: '1px solid hsla(160, 84%, 39%, 0.12)'
          }}>
          <span className="w-[6px] h-[6px] rounded-full animate-glow-pulse"
            style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-glow)' }} />
          HEALTHY
        </div>

        <ThemeToggle />

        <button
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}
          aria-label="User menu"
          data-tooltip={user.name || 'Profile'}
        >
          <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{initial}</span>
        </button>
      </div>
    </header>
  )
}

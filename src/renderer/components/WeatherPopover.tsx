import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { weatherEmoji, weatherLabel, dayLabel, windLabel, type ForecastDay, type WeatherData } from '../lib/weather'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>{label}</span>
      <span className="text-xs font-mono font-semibold" style={{ color: 'white' }}>{value}</span>
    </div>
  )
}

export function WeatherPopover({ weather, onClose }: { weather: WeatherData; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999]" onClick={onClose} data-tooltip="Click to close forecast" />
      <div
        ref={panelRef}
        className="fixed top-[72px] right-6 z-[9999] w-[380px] rounded-xl shadow-2xl animate-fade-up overflow-hidden"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--glass-border)',
        }}
      >
        {/* Current conditions hero */}
        <div className="p-5 text-center" style={{ background: 'var(--bg-deep)' }}>
          <div className="text-5xl mb-2">{weatherEmoji(weather.code)}</div>
          <div className="text-4xl font-bold font-mono" style={{ color: 'white' }}>
            {weather.temp}°F
          </div>
          <div className="text-xs mt-0.5 font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Feels like {weather.feelsLike}°F
          </div>
          <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {weatherLabel(weather.code)}
          </div>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 px-5 py-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
          <DetailRow label="💧 Humidity" value={`${weather.humidity}%`} />
          <DetailRow label="🌬️ Wind" value={`${weather.windSpeed} mph ${windLabel(weather.windDir)}`} />
          <DetailRow label="🔽 Pressure" value={`${weather.pressure} hPa`} />
          <DetailRow label="☀️ UV Index" value={`${weather.uvIndex}`} />
        </div>

        {/* 7-day forecast */}
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>7-Day Forecast</p>
          <div className="space-y-1">
            {weather.daily.map((day: ForecastDay) => {
              const isToday = dayLabel(day.date) === 'Today'
              return (
                <div key={day.date} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <span className="w-20 text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{dayLabel(day.date)}</span>
                  <span className="text-sm w-6 text-center">{weatherEmoji(day.code)}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min(100, ((day.max - 20) / 60) * 100)}%`,
                        background: 'linear-gradient(90deg, var(--accent), hsl(40, 90%, 55%))',
                      }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono w-16 justify-end">
                    <span style={{ color: 'white' }}>{day.max}°</span>
                    <span style={{ color: isToday ? '#60a5fa' : 'rgba(255,255,255,0.5)' }}>{day.min}°</span>
                  </div>
                  {day.precipProb > 0 && (
                    <span className="text-[10px] font-mono w-8 text-right" style={{ color: day.precipProb > 50 ? '#60a5fa' : 'rgba(255,255,255,0.4)' }}>
                      {day.precipProb}%
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Sunrise/Sunset footer */}
        <div className="flex justify-between px-5 py-2.5 text-xs" style={{ borderTop: '1px solid var(--glass-border)', color: 'rgba(255,255,255,0.55)' }}>
          <span>🌅 {weather.daily[0]?.sunrise}</span>
          <span>🌇 {weather.daily[0]?.sunset}</span>
        </div>
      </div>
    </>,
    document.body
  )
}
import { useState, useEffect } from 'react'

interface DebugInfo {
  activePage: string
  renderer: string
  memory: string
  uptime: string
  tauri: string
  fps: number
  lastRender: string
}

export function DebugOverlay({ activePage }: { activePage: string }) {
  const [visible, setVisible] = useState(false)
  const [info, setInfo] = useState<DebugInfo>({
    activePage, renderer: '—', memory: '—', uptime: '—', tauri: '—', fps: 0, lastRender: new Date().toLocaleTimeString(),
  })
  const [frameCount, setFrameCount] = useState(0)
  const startTime = Date.now()

  // Toggle with Ctrl+Shift+D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        setVisible(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Update metrics
  useEffect(() => {
    if (!visible) return
    const tauri = (window as any).__TAURI__
    setInfo({
      activePage,
      renderer: 'Canvas 2D',
      memory: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : '—',
      uptime: `${Math.floor((Date.now() - startTime) / 1000)}s`,
      tauri: tauri ? `v${tauri.metadata?.version ?? '1.x'}` : 'browser',
      fps: frameCount,
      lastRender: new Date().toLocaleTimeString(),
    })
    const raf = requestAnimationFrame(() => setFrameCount(c => c + 1))
    return () => cancelAnimationFrame(raf)
  }, [visible, activePage, frameCount, startTime])

  if (!visible) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[999] w-[280px] rounded-xl p-4 shadow-2xl text-xs font-mono space-y-2"
      style={{
        background: 'rgba(0,0,0,0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span style={{ color: 'var(--accent)' }}>Debug Info</span>
        <button
          className="cursor-pointer hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
          onClick={() => setVisible(false)}
          data-tooltip="Close debug overlay"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      {Object.entries(info).map(([key, val]) => (
        <div key={key} className="flex justify-between">
          <span style={{ color: 'var(--text-ghost)' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{String(val)}</span>
        </div>
      ))}
      <div className="pt-2 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          className="text-[10px] px-2 py-1 rounded cursor-pointer hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
          onClick={() => console.log('Smart Hub debug snapshot:', { ...info, href: window.location.href })}
          data-tooltip="Log debug snapshot to console"
        >
          Dump to Console
        </button>
      </div>
    </div>
  )
}

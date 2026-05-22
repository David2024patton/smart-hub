import { useState, useEffect } from 'react'

const STORAGE_KEY = 'smart-hub:fullscreen-hint-dismissed'

function getKeyText(): string {
  if (typeof navigator === 'undefined') return 'F11'
  const p = navigator.platform.toLowerCase()
  if (p.includes('mac')) return '⌘+Ctrl+F'
  if (p.includes('win')) return 'F11'
  if (p.includes('linux')) return 'F11'
  return 'F11'
}

export function FullscreenHint() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (dismissed) return
    const timer = setTimeout(() => setVisible(true), 1500)
    const autoHide = setTimeout(() => {
      setVisible(false)
      localStorage.setItem(STORAGE_KEY, 'true')
    }, 10000)
    return () => { clearTimeout(timer); clearTimeout(autoHide) }
  }, [dismissed])

  if (!visible || dismissed) return null

  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-1.5 text-[11px] cursor-pointer select-none animate-fade-in"
      style={{ background: 'hsla(160, 60%, 30%, 0.2)', color: 'var(--accent)', borderBottom: '1px solid hsla(160, 60%, 40%, 0.2)' }}
      onClick={() => { setVisible(false); setDismissed(true); localStorage.setItem(STORAGE_KEY, 'true') }}
      data-tooltip="Click to dismiss"
    >
      <span className="opacity-70">💡</span>
      <span>Press <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'hsla(0,0%,0%,0.3)', border: '1px solid hsla(160, 60%, 40%, 0.3)' }}>{getKeyText()}</kbd> to enter fullscreen for the best experience</span>
      <span className="ml-2 opacity-50 text-[10px]">✕</span>
    </div>
  )
}

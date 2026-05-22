import { useRef, useCallback, useState, type ReactNode } from 'react'
import { useDesktop } from '../contexts/DesktopContext'
import type { DesktopWindow } from '../contexts/DesktopContext'

const PADDING = 14
const SNAP_WINDOW_THRESHOLD = 15

interface WindowProps {
  win: DesktopWindow
  children: ReactNode
}

export function Window({ win, children }: WindowProps) {
  const { focusWindow, moveWindow, closeWindow, minimizeWindow, snapWindow, unmaximizeWindow, setSnapIndicator, detectSnap, windows } = useDesktop()
  const dragRef = useRef<{ startX: number; startY: number; winX: number; winY: number } | null>(null)
  const windowsRef = useRef(windows)
  windowsRef.current = windows
  const sizeRef = useRef(win.size)
  sizeRef.current = win.size
  const [dragging, setDragging] = useState(false)
  const [snapPreview, setSnapPreview] = useState<string | null>(null)

  const desktopEl = typeof document !== 'undefined' ? document.querySelector('[data-desktop]') : null
  const dw = desktopEl ? desktopEl.clientWidth : window.innerWidth
  const dh = desktopEl ? desktopEl.clientHeight : window.innerHeight
  const isFull = win.position.x === 0 && win.position.y === 0 &&
    win.size.width === dw && win.size.height === dh

  const onTitleBarDoubleClick = useCallback(() => {
    if (isFull && win.restoreBounds) {
      unmaximizeWindow(win.id)
    } else {
      snapWindow(win.id, 'full')
    }
  }, [isFull, win.restoreBounds, win.id, unmaximizeWindow, snapWindow])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-window-control]')) return
    if (!(e.target as HTMLElement).closest('[data-titlebar]')) return
    focusWindow(win.id)

    if (isFull && win.restoreBounds) {
      const rb = win.restoreBounds
      sizeRef.current = rb.size
      dragRef.current = { startX: e.clientX, startY: e.clientY, winX: rb.position.x, winY: rb.position.y }
      unmaximizeWindow(win.id)
    } else {
      dragRef.current = { startX: e.clientX, startY: e.clientY, winX: win.position.x, winY: win.position.y }
    }

    setDragging(true)

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      const sw = sizeRef.current.width
      const sh = sizeRef.current.height

      const desktopEl = document.querySelector('[data-desktop]')
      const dw = desktopEl ? desktopEl.clientWidth : window.innerWidth
      const dh = desktopEl ? desktopEl.clientHeight : window.innerHeight
      let finalX = Math.max(PADDING, Math.min(dragRef.current.winX + dx, dw - sw - PADDING))
      let finalY = Math.max(PADDING, Math.min(dragRef.current.winY + dy, dh - sh - PADDING))

      const others = windowsRef.current.filter(w => w.id !== win.id && !w.minimized)
      const cL = finalX, cR = finalX + sw
      const cT = finalY, cB = finalY + sh

      let snapX: number | null = null
      let snapY: number | null = null
      let snapDistX = SNAP_WINDOW_THRESHOLD
      let snapDistY = SNAP_WINDOW_THRESHOLD

      for (const other of others) {
        const oL = other.position.x, oR = other.position.x + other.size.width
        const oT = other.position.y, oB = other.position.y + other.size.height

        if (cT < oB && cB > oT) {
          const dLR = Math.abs(cL - oR); if (dLR < snapDistX) { snapX = oR; snapDistX = dLR }
          const dRL = Math.abs(cR - oL); if (dRL < snapDistX) { snapX = oL - sw; snapDistX = dRL }
          const dLL = Math.abs(cL - oL); if (dLL < snapDistX) { snapX = oL; snapDistX = dLL }
          const dRR = Math.abs(cR - oR); if (dRR < snapDistX) { snapX = oR - sw; snapDistX = dRR }
        }
        if (cL < oR && cR > oL) {
          const dTB = Math.abs(cT - oB); if (dTB < snapDistY) { snapY = oB; snapDistY = dTB }
          const dBT = Math.abs(cB - oT); if (dBT < snapDistY) { snapY = oT - sh; snapDistY = dBT }
          const dTT = Math.abs(cT - oT); if (dTT < snapDistY) { snapY = oT; snapDistY = dTT }
          const dBB = Math.abs(cB - oB); if (dBB < snapDistY) { snapY = oB - sh; snapDistY = dBB }
        }
      }

      if (snapX !== null) finalX = snapX
      if (snapY !== null) finalY = snapY

      moveWindow(win.id, finalX, finalY)

      const zone = detectSnap(ev.clientX, ev.clientY)
      setSnapPreview(zone)
      setSnapIndicator(zone)
    }

    const onMouseUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      setDragging(false)

      const zone = detectSnap(ev.clientX, ev.clientY)
      if (zone) {
        snapWindow(win.id, zone)
      }
      setSnapPreview(null)
      setSnapIndicator(null)
      dragRef.current = null
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [win.id, win.position, win.size, win.restoreBounds, isFull, focusWindow, moveWindow, snapWindow, unmaximizeWindow, setSnapIndicator, detectSnap])

  const titleEmoji: Record<string, string> = {
    dashboard: '🚀', terminal: '💻', 'mcp-grid': '🕸️', projects: '📁',
    kanban: '📋', marketplace: '🛒', 'rag-lab': '🧠', connections: '🔗',
    security: '🛡️', lint: '🧹', settings: '⚙️', browser: '🌐', preview: '🔍',
    'file-explorer': '📂', code: '📝', search: '🔎',
  }

  if (win.minimized) return null

  return (
    <div
      className="absolute rounded-xl shadow-2xl flex flex-col overflow-hidden"
      style={{
        left: win.position.x,
        top: win.position.y,
        width: win.size.width,
        height: win.size.height,
        zIndex: win.zIndex,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--glass-border)',
        boxShadow: dragging
          ? '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px var(--accent-subtle)'
          : undefined,
        transition: dragging ? 'box-shadow 0.1s' : 'none',
        resize: isFull ? 'none' : 'both',
        overflow: 'hidden',
      }}
      onMouseDown={onMouseDown}
    >
      {/* Title bar */}
      <div data-titlebar
        className="flex items-center gap-2 px-3 h-[36px] select-none cursor-grab active:cursor-grabbing shrink-0"
        style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--glass-border)' }}
        onDoubleClick={onTitleBarDoubleClick}
      >
        <span className="text-sm">{titleEmoji[win.pageId] || '📄'}</span>
        <span className="text-xs font-medium flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
          {win.title}
        </span>

        <button data-window-control
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/5 cursor-pointer text-xs"
          style={{ color: 'var(--text-ghost)' }}
          onClick={() => minimizeWindow(win.id)}
          data-tooltip="Minimize"
        >─</button>
        <button data-window-control
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/5 cursor-pointer text-xs"
          style={{ color: 'var(--text-ghost)' }}
          data-tooltip={isFull ? 'Restore' : 'Maximize'}
          onClick={() => isFull && win.restoreBounds ? unmaximizeWindow(win.id) : snapWindow(win.id, 'full')}
        >{isFull ? '❐' : '□'}</button>
        {!win.pinned && <button data-window-control
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20 hover:text-red-400 cursor-pointer text-xs"
          style={{ color: 'var(--text-ghost)' }}
          onClick={() => closeWindow(win.id)}
          data-tooltip="Close"
        >✕</button>}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0 p-3">
        {children}
      </div>

      {/* Snap preview overlay */}
      {snapPreview && (
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'hsla(160, 84%, 39%, 0.06)',
            border: '2px solid hsla(160, 84%, 39%, 0.25)',
            borderRadius: '12px',
          }}
        />
      )}
    </div>
  )
}

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface TooltipState {
  text: string
  top: number
  left: number
}

export function TooltipManager() {
  const [tip, setTip] = useState<TooltipState | null>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const position = useCallback((target: HTMLElement) => {
    const rect = target.getBoundingClientRect()
    const top = rect.top - 8
    const left = rect.left + rect.width / 2
    setTip({ text: target.getAttribute('data-tooltip') || '', top, left })
    requestAnimationFrame(() => {
      if (!tipRef.current) return
      const tr = tipRef.current.getBoundingClientRect()
      let adjustedLeft = left
      if (tr.left < 8) adjustedLeft += 8 - tr.left
      if (tr.right > window.innerWidth - 8) adjustedLeft -= tr.right - window.innerWidth + 8
      if (tr.top < 8) setTip(prev => prev ? { ...prev, top: rect.bottom + 8 } : null)
      setTip(prev => prev ? { ...prev, left: adjustedLeft } : null)
    })
  }, [])

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-tooltip]') as HTMLElement | null
      if (!target) { setTip(null); return }
      const text = target.getAttribute('data-tooltip')
      if (!text) { setTip(null); return }
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => position(target), 400)
    }
    const handleMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null
      if (related?.closest('[data-tooltip]')) return
      clearTimeout(timerRef.current)
      setTip(null)
    }
    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)
    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
      clearTimeout(timerRef.current)
    }
  }, [position])

  return createPortal(
    <div
      ref={tipRef}
      className="pointer-events-none fixed z-[99999] px-2.5 py-1.5 rounded-lg text-[11px] font-medium leading-tight shadow-xl"
      style={{
        top: tip ? tip.top - 28 : -9999,
        left: tip ? tip.left : -9999,
        transform: 'translateX(-50%)',
        opacity: tip ? 1 : 0,
        transition: 'opacity 0.12s ease',
        background: 'hsl(220, 20%, 12%)',
        color: 'hsl(220, 10%, 92%)',
        border: '1px solid hsl(220, 20%, 22%)',
        whiteSpace: 'nowrap',
        maxWidth: '320px',
      }}
    >
      {tip?.text}
    </div>,
    document.body
  )
}

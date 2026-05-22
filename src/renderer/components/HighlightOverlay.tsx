import { useState, useEffect, useCallback, useRef } from 'react'

interface Highlight {
  id: string
  selector: string
  text?: string
  color?: string
  pulse?: boolean
}

interface TutorialStep {
  title: string
  text: string
  selector: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function HighlightOverlay() {
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [tutorial, setTutorial] = useState<{ steps: TutorialStep[]; current: number } | null>(null)
  const [positions, setPositions] = useState<Record<string, DOMRect>>({})
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  // Listen for highlight commands via custom events
  useEffect(() => {
    const handler = (e: CustomEvent<{ type: string; data: any }>) => {
      const { type, data } = e.detail
      if (type === 'highlight') {
        setHighlights(prev => [...prev, {
          id: data.id || `hl-${Date.now()}`,
          selector: data.selector,
          text: data.text,
          color: data.color || '#4ec9b0',
          pulse: data.pulse !== false,
        }])
      }
      if (type === 'highlight-clear') {
        setHighlights([])
        setTutorial(null)
      }
      if (type === 'tutorial') {
        setTutorial({ steps: data.steps || [], current: 0 })
      }
      if (type === 'tutorial-next') {
        setTutorial(prev => prev ? { ...prev, current: Math.min(prev.current + 1, prev.steps.length - 1) } : null)
      }
      if (type === 'tutorial-prev') {
        setTutorial(prev => prev ? { ...prev, current: Math.max(prev.current - 1, 0) } : null)
      }
    }
    window.addEventListener('hub-highlight', handler as EventListener)
    return () => window.removeEventListener('hub-highlight', handler as EventListener)
  }, [])

  // Update positions periodically for animations
  useEffect(() => {
    const update = () => {
      const allSelectors = [...highlights.map(h => h.selector)]
      if (tutorial) {
        const step = tutorial.steps[tutorial.current]
        if (step) allSelectors.push(step.selector)
      }
      const newPositions: Record<string, DOMRect> = {}
      for (const sel of allSelectors) {
        try {
          const el = document.querySelector(sel)
          if (el) newPositions[sel] = el.getBoundingClientRect()
        } catch {}
      }
      setPositions(newPositions)
    }
    update()
    timerRef.current = setInterval(update, 500)
    return () => clearInterval(timerRef.current)
  }, [highlights, tutorial])

  const currentStep = tutorial ? tutorial.steps[tutorial.current] : null

  return (
    <>
      {/* Highlight boxes */}
      {highlights.map(h => {
        const rect = positions[h.selector]
        if (!rect) return null
        return (
          <div key={h.id}
            className="fixed pointer-events-none z-[99998]"
            style={{
              left: rect.left - 4,
              top: rect.top - 4,
              width: rect.width + 8,
              height: rect.height + 8,
              borderRadius: 4,
              border: `2px solid ${h.color}`,
              boxShadow: `0 0 ${h.pulse ? '12' : '6'}px ${h.color}`,
              animation: h.pulse ? 'hl-pulse 1.5s ease-in-out infinite' : 'none',
              transition: 'all 0.3s ease',
            }}>
            {h.text && (
              <div className="absolute" style={{
                bottom: '100%', left: 0, marginBottom: 6,
                padding: '4px 8px', borderRadius: 4, fontSize: 11, whiteSpace: 'nowrap',
                background: h.color, color: '#1e1e1e', fontWeight: 500,
              }}>
                {h.text}
              </div>
            )}
          </div>
        )
      })}

      {/* Tutorial overlay */}
      {currentStep && (() => {
        const rect = positions[currentStep.selector]
        if (!rect) return null
        return (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.3)' }}>
            {/* Cutout box around target element */}
            <div className="absolute pointer-events-auto" style={{
              left: rect.left - 8, top: rect.top - 8,
              width: rect.width + 16, height: rect.height + 16,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.3), 0 0 20px rgba(78,201,176,0.5)',
              borderRadius: 6,
              border: '2px solid #4ec9b0',
            }} />

            {/* Tooltip card */}
            <div className="absolute pointer-events-auto" style={{
              bottom: window.innerHeight - rect.top + 16,
              left: Math.max(16, rect.left),
              maxWidth: 320,
              background: '#2d2d2d', borderRadius: 8, padding: 16,
              border: '1px solid #444', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#4ec9b0' }}>
                Step {tutorial!.current + 1}/{tutorial!.steps.length}: {currentStep.title}
              </p>
              <p className="text-xs" style={{ color: '#ccc', lineHeight: 1.5 }}>{currentStep.text}</p>
              <div className="flex items-center gap-2 mt-3">
                {tutorial!.current > 0 && (
                  <button onClick={() => window.dispatchEvent(new CustomEvent('hub-highlight', { detail: { type: 'tutorial-prev', data: {} } }))}
                    className="text-xs px-3 py-1 rounded cursor-pointer"
                    style={{ background: '#444', color: '#ccc' }}>
                    ← Back
                  </button>
                )}
                <div className="flex-1" />
                {tutorial!.current < tutorial!.steps.length - 1 ? (
                  <button onClick={() => window.dispatchEvent(new CustomEvent('hub-highlight', { detail: { type: 'tutorial-next', data: {} } }))}
                    className="text-xs px-3 py-1 rounded cursor-pointer"
                    style={{ background: '#4ec9b0', color: '#1e1e1e', fontWeight: 600 }}>
                    Next →
                  </button>
                ) : (
                  <button onClick={() => window.dispatchEvent(new CustomEvent('hub-highlight', { detail: { type: 'highlight-clear', data: {} } }))}
                    className="text-xs px-3 py-1 rounded cursor-pointer"
                    style={{ background: '#4ec9b0', color: '#1e1e1e', fontWeight: 600 }}>
                    Done ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      <style>{`
        @keyframes hl-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  )
}

// API for programs to trigger highlights
export const Highlighter = {
  highlight(selector: string, text?: string, color?: string) {
    window.dispatchEvent(new CustomEvent('hub-highlight', {
      detail: { type: 'highlight', data: { selector, text, color, id: `hl-${Date.now()}` } },
    }))
  },
  clear() {
    window.dispatchEvent(new CustomEvent('hub-highlight', { detail: { type: 'highlight-clear', data: {} } }))
  },
  startTutorial(steps: TutorialStep[]) {
    window.dispatchEvent(new CustomEvent('hub-highlight', {
      detail: { type: 'tutorial', data: { steps } },
    }))
  },
  nextStep() {
    window.dispatchEvent(new CustomEvent('hub-highlight', { detail: { type: 'tutorial-next', data: {} } }))
  },
  prevStep() {
    window.dispatchEvent(new CustomEvent('hub-highlight', { detail: { type: 'tutorial-prev', data: {} } }))
  },
}

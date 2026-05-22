import { useState, useRef, useCallback } from 'react'

export function BrowserPage() {
  const [url, setUrl] = useState('https://google.com')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const navigate = useCallback((targetUrl?: string) => {
    let target = (targetUrl || url).trim()
    if (!target) return
    if (!/^https?:\/\//i.test(target) && !/^[a-zA-Z][a-zA-Z0-9]*:\/\//.test(target)) {
      if (/^\w+\.\w+/.test(target) && !target.includes(' ')) {
        target = 'https://' + target
      } else {
        target = `https://html.duckduckgo.com/html?q=${encodeURIComponent(target)}`
      }
    }
    setHistory(prev => {
      const next = prev.slice(0, historyIdx + 1)
      next.push(target)
      return next
    })
    setHistoryIdx(prev => prev + 1)
    if (!targetUrl) setUrl(target)
  }, [url, historyIdx])

  const goBack = () => {
    if (historyIdx <= 0) return
    const newIdx = historyIdx - 1
    iframeRef.current?.contentWindow?.location.assign(history[newIdx])
    setHistoryIdx(newIdx)
    setUrl(history[newIdx])
  }

  const goForward = () => {
    if (historyIdx >= history.length - 1) return
    const newIdx = historyIdx + 1
    iframeRef.current?.contentWindow?.location.assign(history[newIdx])
    setHistoryIdx(newIdx)
    setUrl(history[newIdx])
  }

  const refresh = () => {
    if (history[historyIdx]) iframeRef.current?.contentWindow?.location.reload()
  }

  const openExternal = () => {
    if (history[historyIdx]) window.open(history[historyIdx], '_blank')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') navigate()
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#1e1e1e' }}>
      {/* Navigation bar */}
      <div className="flex items-center gap-1 px-2 py-1 shrink-0" style={{ background: '#2d2d2d', borderBottom: '1px solid #444', minHeight: 36 }}>
        <button onClick={goBack} disabled={historyIdx <= 0} className="nav-btn" title="Back">◀</button>
        <button onClick={goForward} disabled={historyIdx >= history.length - 1} className="nav-btn" title="Forward">▶</button>
        <button onClick={refresh} className="nav-btn" title="Refresh">↻</button>
        <input value={url} onChange={e => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-3 py-1 rounded text-xs font-mono outline-none mx-1"
          style={{ background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #555' }}
          placeholder="Enter URL or search..." />
        <button onClick={() => navigate()} className="px-2.5 py-1 rounded text-xs font-medium cursor-pointer"
          style={{ background: '#4ec9b0', color: '#1e1e1e' }}>Go</button>
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-2 px-3 py-1 shrink-0 text-[11px]" style={{ background: '#252526', borderBottom: '1px solid #444', color: '#888' }}>
        <span>Type a URL or search query in the address bar</span>
        <span className="flex-1" />
        <button onClick={openExternal} className="text-[11px] px-2 py-0.5 rounded cursor-pointer"
          style={{ color: '#4ec9b0', background: 'rgba(78,201,176,0.1)' }}>
          Open in external browser ↗
        </button>
      </div>

      {/* Iframe */}
      <div className="flex-1 relative min-h-0">
        {history[historyIdx] ? (
          <iframe ref={iframeRef} src={history[historyIdx]} className="w-full h-full border-0"
            style={{ background: 'white' }}
            title="Browser" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: '#666' }}>
            Enter a URL to start browsing
          </div>
        )}
      </div>

      <style>{`
        .nav-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          color: #999;
          background: transparent;
          border: none;
          transition: background 0.15s;
        }
        .nav-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #d4d4d4; }
        .nav-btn:disabled { opacity: 0.3; cursor: default; }
      `}</style>
    </div>
  )
}

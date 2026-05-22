import { useState, useRef, useEffect, useCallback } from 'react'
import { pushConsole, pushNetwork } from '../lib/browser-state'

interface ConsoleEntry {
  id: number
  level: string
  args: string[]
  time: number
}

interface NetworkEntry {
  id: number
  url: string
  method: string
  status: number
  statusText: string
  duration: number
  time: number
}

let logId = 0

export function BrowserPage() {
  const [url, setUrl] = useState('https://google.com')
  const [loadedUrl, setLoadedUrl] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [consoleLogs, setConsoleLogs] = useState<ConsoleEntry[]>([])
  const [networkLogs, setNetworkLogs] = useState<NetworkEntry[]>([])
  const [devToolsTab, setDevToolsTab] = useState<'console' | 'network'>('console')
  const [devToolsHeight, setDevToolsHeight] = useState(200)
  const [showDevTools, setShowDevTools] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [browserId] = useState(() => Math.random().toString(36).slice(2))
  const [badgeCount, setBadgeCount] = useState(0)

  // Listen for postMessage from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== '__br__' || e.data?.id !== browserId) return
      const { sub, data } = e.data

      if (sub === 'ready') {
        setConsoleLogs(prev => [...prev, { id: ++logId, level: 'info', args: ['Browser agent connected'], time: Date.now() }])
        pushConsole({ level: 'info', args: ['Browser agent connected'], time: Date.now() })
        setBadgeCount(b => b + 1)
      }

      if (sub === 'console') {
        const entry = { level: data.level, args: data.args, time: e.data.time }
        setConsoleLogs(prev => [...prev, { id: ++logId, ...entry }])
        pushConsole(entry)
        if (data.level === 'error' || data.level === 'warn') setBadgeCount(b => b + 1)
      }

      if (sub === 'error') {
        const entry = { level: 'error', args: [data.message], time: e.data.time }
        setConsoleLogs(prev => [...prev, { id: ++logId, ...entry }])
        pushConsole(entry)
        setBadgeCount(b => b + 1)
      }

      if (sub === 'network') {
        const entry = { url: data.url, method: data.method, status: data.status, statusText: data.statusText, duration: data.duration, time: e.data.time }
        setNetworkLogs(prev => [...prev, { id: ++logId, ...entry }])
        pushNetwork(entry)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [browserId])

  const navigate = useCallback((targetUrl?: string) => {
    let target = (targetUrl || url).trim()
    if (!target) return
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target
    const proxyUrl = `/api/proxy/fetch?url=${encodeURIComponent(target)}`
    setLoadedUrl(proxyUrl)
    setHistory(prev => {
      const next = prev.slice(0, historyIdx + 1)
      next.push(target)
      return next
    })
    setHistoryIdx(prev => prev + 1)
    if (!targetUrl) setUrl(target)
    setShowDevTools(true)
  }, [url, historyIdx])

  const goBack = () => {
    if (historyIdx <= 0) return
    const newIdx = historyIdx - 1
    const target = history[newIdx]
    const proxyUrl = `/api/proxy/fetch?url=${encodeURIComponent(target)}`
    setLoadedUrl(proxyUrl)
    setHistoryIdx(newIdx)
    setUrl(target)
  }

  const goForward = () => {
    if (historyIdx >= history.length - 1) return
    const newIdx = historyIdx + 1
    const target = history[newIdx]
    const proxyUrl = `/api/proxy/fetch?url=${encodeURIComponent(target)}`
    setLoadedUrl(proxyUrl)
    setHistoryIdx(newIdx)
    setUrl(target)
  }

  const refresh = () => {
    if (history[historyIdx]) {
      const proxyUrl = `/api/proxy/fetch?url=${encodeURIComponent(history[historyIdx])}`
      setLoadedUrl(proxyUrl)
    }
  }

  const clearLogs = () => { setConsoleLogs([]); setNetworkLogs([]); setBadgeCount(0) }

  const formatTime = (t: number) => new Date(t).toLocaleTimeString()

  const logColors: Record<string, string> = { error: '#f44747', warn: '#dcdcaa', info: '#4ec9b0', log: '#d4d4d4', debug: '#888' }

  return (
    <div className="flex flex-col h-full" style={{ background: '#1e1e1e' }}>
      {/* Navigation bar */}
      <div className="flex items-center gap-1 px-2 py-1 shrink-0" style={{ background: '#2d2d2d', borderBottom: '1px solid #444', minHeight: 36 }}>
        <button onClick={goBack} disabled={historyIdx <= 0} className="nav-btn" data-tooltip="Back">◀</button>
        <button onClick={goForward} disabled={historyIdx >= history.length - 1} className="nav-btn" data-tooltip="Forward">▶</button>
        <button onClick={refresh} className="nav-btn" data-tooltip="Refresh">↻</button>
        <input value={url} onChange={e => setUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') navigate() }}
          className="flex-1 px-3 py-1 rounded text-xs font-mono outline-none mx-1"
          style={{ background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #555' }}
          placeholder="Enter URL..." />
        <button onClick={() => navigate()} className="px-2.5 py-1 rounded text-xs font-medium cursor-pointer"
          style={{ background: '#4ec9b0', color: '#1e1e1e' }} data-tooltip="Go">Go</button>
      </div>

      {/* Browser + DevTools split */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Iframe */}
        <div className="flex-1 relative min-h-0">
          {loadedUrl ? (
            <iframe ref={iframeRef} src={loadedUrl} className="w-full h-full border-0"
              style={{ background: 'white' }}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
              title="Browser" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: '#666' }}>
              Enter a URL to start browsing
            </div>
          )}
        </div>

        {/* DevTools toggle bar */}
        <div className="flex items-center shrink-0 px-2 cursor-pointer select-none"
          style={{ background: '#252526', borderTop: '1px solid #444', height: 28 }}
          onClick={() => setShowDevTools(v => !v)}>
          <span className="text-[11px] font-medium" style={{ color: '#888' }}>▽ DevTools</span>
          {badgeCount > 0 && !showDevTools && (
            <span className="ml-2 px-1.5 rounded text-[9px] font-medium" style={{ background: '#f44747', color: 'white' }}>
              {badgeCount}
            </span>
          )}
          <div className="flex-1" />
          <button onClick={(e) => { e.stopPropagation(); clearLogs() }} className="text-[10px] px-1.5 py-0.5 rounded cursor-pointer hover:bg-white/10"
            style={{ color: '#666' }}>Clear</button>
        </div>

        {/* DevTools panel */}
        {showDevTools && (
          <div className="shrink-0 flex flex-col" style={{ height: devToolsHeight, background: '#1e1e1e', borderTop: '1px solid #444' }}>
            {/* Tabs */}
            <div className="flex items-center shrink-0" style={{ background: '#252526', borderBottom: '1px solid #444' }}>
              <button onClick={() => setDevToolsTab('console')}
                className="text-[11px] px-3 py-1 cursor-pointer"
                style={{ background: devToolsTab === 'console' ? '#1e1e1e' : 'transparent', color: devToolsTab === 'console' ? '#d4d4d4' : '#888', borderBottom: devToolsTab === 'console' ? '1px solid #4ec9b0' : '1px solid transparent' }}>
                Console ({consoleLogs.length})
              </button>
              <button onClick={() => setDevToolsTab('network')}
                className="text-[11px] px-3 py-1 cursor-pointer"
                style={{ background: devToolsTab === 'network' ? '#1e1e1e' : 'transparent', color: devToolsTab === 'network' ? '#d4d4d4' : '#888', borderBottom: devToolsTab === 'network' ? '1px solid #4ec9b0' : '1px solid transparent' }}>
                Network ({networkLogs.length})
              </button>
              <div className="flex-1" />
              <div className="flex items-center gap-2 px-2">
                <button onClick={() => setDevToolsHeight(h => Math.max(100, h - 50))} className="text-[10px] cursor-pointer" style={{ color: '#666' }} data-tooltip="Collapse">─</button>
                <button onClick={() => setDevToolsHeight(h => Math.min(600, h + 50))} className="text-[10px] cursor-pointer" style={{ color: '#666' }} data-tooltip="Expand">+</button>
              </div>
            </div>

            {/* Console tab */}
            {devToolsTab === 'console' && (
              <div className="flex-1 overflow-y-auto font-mono text-[11px] p-1" style={{ background: '#1e1e1e' }}>
                {consoleLogs.length === 0 && <div className="text-center py-4" style={{ color: '#666' }}>No console output</div>}
                {consoleLogs.map(entry => (
                  <div key={entry.id} className="flex gap-2 py-0.5 px-1 hover:bg-white/[0.02]">
                    <span className="shrink-0" style={{ color: '#555', width: 70 }}>{formatTime(entry.time)}</span>
                    <span className="shrink-0 text-[10px] uppercase" style={{ color: logColors[entry.level] || '#888', width: 44 }}>{entry.level}</span>
                    <span style={{ color: entry.level === 'error' ? '#f44747' : entry.level === 'warn' ? '#dcdcaa' : '#d4d4d4', wordBreak: 'break-all' }}>
                      {entry.args.join(' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Network tab */}
            {devToolsTab === 'network' && (
              <div className="flex-1 overflow-y-auto font-mono text-[11px]" style={{ background: '#1e1e1e' }}>
                {networkLogs.length === 0 && <div className="text-center py-4" style={{ color: '#666' }}>No network requests</div>}
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#252526', position: 'sticky', top: 0 }}>
                      <th className="text-left px-2 py-1 text-[10px]" style={{ color: '#888', borderBottom: '1px solid #444' }}>Method</th>
                      <th className="text-left px-2 py-1 text-[10px]" style={{ color: '#888', borderBottom: '1px solid #444' }}>URL</th>
                      <th className="text-right px-2 py-1 text-[10px]" style={{ color: '#888', borderBottom: '1px solid #444' }}>Status</th>
                      <th className="text-right px-2 py-1 text-[10px]" style={{ color: '#888', borderBottom: '1px solid #444' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {networkLogs.map(entry => (
                      <tr key={entry.id} className="hover:bg-white/[0.02]">
                        <td className="px-2 py-0.5" style={{ color: '#569cd6' }}>{entry.method}</td>
                        <td className="px-2 py-0.5 truncate max-w-[300px]" style={{ color: '#d4d4d4' }} title={entry.url}>{entry.url}</td>
                        <td className="px-2 py-0.5 text-right" style={{ color: entry.status >= 400 ? '#f44747' : entry.status >= 300 ? '#dcdcaa' : '#4ec9b0' }}>
                          {entry.status || 'ERR'}
                        </td>
                        <td className="px-2 py-0.5 text-right" style={{ color: '#888' }}>{entry.duration}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

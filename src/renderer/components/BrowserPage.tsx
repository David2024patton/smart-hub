import { useState, useRef } from 'react'

export function BrowserPage() {
  const [url, setUrl] = useState('https://google.com')
  const [loadedUrl, setLoadedUrl] = useState('https://google.com')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const navigate = () => {
    let target = url.trim()
    if (!target) return
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target
    setLoadedUrl(target)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navigation bar */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 shrink-0" style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--glass-border)' }}>
        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 cursor-pointer text-xs"
          style={{ color: 'var(--text-ghost)' }}
          onClick={() => iframeRef.current?.contentWindow?.history.back()}
          data-tooltip="Back">
          ◀
        </button>
        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 cursor-pointer text-xs"
          style={{ color: 'var(--text-ghost)' }}
          onClick={() => iframeRef.current?.contentWindow?.history.forward()}
          data-tooltip="Forward">
          ▶
        </button>
        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 cursor-pointer text-xs"
          style={{ color: 'var(--text-ghost)' }}
          onClick={() => iframeRef.current?.contentWindow?.location.reload()}
          data-tooltip="Refresh">
          ↻
        </button>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && navigate()}
          className="flex-1 px-3 py-1 rounded-md text-xs font-mono outline-none mx-1"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}
          placeholder="Enter URL..."
        />
        <button className="px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer hover:opacity-80"
          style={{ background: 'var(--accent)', color: 'white' }}
          onClick={navigate}
          data-tooltip="Go">
          Go
        </button>
      </div>

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={loadedUrl}
        className="flex-1 w-full border-0"
        style={{ background: 'white' }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        title="Web Browser"
      />
    </div>
  )
}

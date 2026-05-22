import { useState, useRef } from 'react'

export function PreviewPage() {
  const [url, setUrl] = useState('http://localhost:5173')
  const [loadedUrl, setLoadedUrl] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const navigate = () => {
    let target = url.trim()
    if (!target) return
    if (!/^https?:\/\//i.test(target)) target = 'http://' + target
    setLoadedUrl(target)
  }

  return (
    <div className="flex flex-col h-full">
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
          placeholder="Local dev server URL..."
        />
        <button className="px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer hover:opacity-80"
          style={{ background: 'var(--accent)', color: 'white' }}
          onClick={navigate}
          data-tooltip="Load preview">
          Load
        </button>
      </div>

      {!loadedUrl ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-3xl">🔍</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Enter a local dev server URL to preview your project
            </p>
            <p className="text-xs font-mono" style={{ color: 'var(--text-ghost)' }}>
              e.g. http://localhost:5173 or http://localhost:3000
            </p>
          </div>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          src={loadedUrl}
          className="flex-1 w-full border-0"
          style={{ background: 'white' }}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          title="Project Preview"
        />
      )}
    </div>
  )
}

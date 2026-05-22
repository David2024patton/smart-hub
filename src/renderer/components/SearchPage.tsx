import { useState, useRef, useEffect } from 'react'

const SEARCH_ENGINES = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=', icon: '🔍' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: '🦆' },
  searxng: { name: 'SearXNG', url: '/api/proxy/fetch?url=', icon: '🔎' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=', icon: '🟦' },
  brave: { name: 'Brave', url: 'https://search.brave.com/search?q=', icon: '🦁' },
}

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [engine, setEngine] = useState('duckduckgo')
  const [loadedUrl, setLoadedUrl] = useState('')
  const [recent, setRecent] = useState<string[]>([])
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('smart-hub:search-recent')
      if (saved) setRecent(JSON.parse(saved))
    } catch {}
  }, [])

  const search = (q?: string) => {
    const term = (q || query).trim()
    if (!term) return
    const eng = SEARCH_ENGINES[engine as keyof typeof SEARCH_ENGINES]
    const url = eng.url + encodeURIComponent(term)
    setLoadedUrl(url)
    setQuery(term)
    const updated = [term, ...recent.filter(r => r !== term)].slice(0, 10)
    setRecent(updated)
    try { localStorage.setItem('smart-hub:search-recent', JSON.stringify(updated)) } catch {}
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-deep)' }}>
      {/* Search bar */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--glass-border)' }}>
        <select value={engine} onChange={e => setEngine(e.target.value)}
          className="text-xs px-2 py-1.5 rounded outline-none cursor-pointer"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>
          {Object.entries(SEARCH_ENGINES).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.name}</option>
          ))}
        </select>
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') search() }}
          className="flex-1 px-3 py-1.5 rounded text-xs outline-none"
          placeholder="Search the web privately..."
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
          autoFocus />
        <button onClick={() => search()}
          className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer"
          style={{ background: 'var(--accent)', color: 'white' }}>
          Search
        </button>
      </div>

      {/* Results area */}
      {loadedUrl ? (
        <iframe ref={iframeRef} src={loadedUrl} className="flex-1 w-full border-0" style={{ background: 'white' }}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms" title="Search results" />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-5xl mb-4 opacity-50">🔎</div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Private search powered by {SEARCH_ENGINES[engine as keyof typeof SEARCH_ENGINES].name}</p>
          {recent.length > 0 && (
            <div className="w-full max-w-md">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-ghost)' }}>Recent searches</p>
              <div className="flex flex-wrap gap-1.5">
                {recent.map(r => (
                  <button key={r} onClick={() => search(r)}
                    className="text-xs px-2.5 py-1 rounded-full cursor-pointer hover:bg-white/[0.05]"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

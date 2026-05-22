import { useState, useEffect, useCallback } from 'react'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import * as fsService from '../lib/fs-service'
import type { FileEntry, DriveEntry, SystemInfo, DiskUsage } from '../lib/fs-service'

type ViewMode = 'drives' | 'files' | 'preview'
type SortField = 'name' | 'size' | 'modified'
type SortDir = 'asc' | 'desc'
type PreviewType = 'text' | 'image' | 'pdf' | 'video' | 'audio' | 'markdown' | 'code'

const CODE_EXTENSIONS = new Set(['js', 'ts', 'tsx', 'py', 'rs', 'go', 'java', 'cpp', 'c', 'h', 'hpp', 'rb', 'sh', 'bat', 'ps1', 'sql', 'vue', 'svelte', 'astro', 'css', 'html', 'xml', 'json', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'env', 'gitignore', 'log', 'php', 'r', 'swift', 'kt', 'scala', 'lua', 'dart', 'coffee'])
const TEXT_EXTENSIONS = new Set(['txt', 'csv'])
const MARKDOWN_EXTENSIONS = new Set(['md', 'markdown'])
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'bmp', 'ico', 'webp'])
const PDF_EXTENSIONS = new Set(['pdf'])
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'avi', 'mkv'])
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'flac', 'aac', 'ogg'])

function formatSize(bytes: number): string {
  const UNITS = ['B', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 B'
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1)
  return (bytes / Math.pow(1024, exp)).toFixed(1) + ' ' + UNITS[exp]
}

function diskUsagePercent(total_gb: number, available_gb: number): number {
  if (total_gb === 0) return 0
  return Math.round(((total_gb - available_gb) / total_gb) * 100)
}

function renderMarkdown(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const lines = escaped.split('\n')
  let html = ''
  let inCode = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('```')) {
      if (inCode) { html += '</code></pre>'; inCode = false }
      else { html += '<pre><code>'; inCode = true }
      continue
    }
    if (inCode) { html += line + '\n'; continue }
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^#+/)![0].length
      html += `<h${level} style="margin:1em 0 0.5em;font-weight:600;color:var(--text-primary)">${line.slice(level + 1)}</h${level}>`
    } else if (/^- /.test(line)) {
      html += `<li style="color:var(--text-secondary);margin:0.15em 0 0.15em 1.2em">${line.slice(2)}</li>`
    } else if (/^\d+\. /.test(line)) {
      html += `<li style="color:var(--text-secondary);margin:0.15em 0 0.15em 1.2em">${line.replace(/^\d+\. /, '')}</li>`
    } else if (line === '') {
      html += '<br/>'
    } else {
      const formatted = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code style="background:var(--bg-canvas);padding:1px 4px;border-radius:3px;font-size:0.9em">$1</code>')
      html += `<p style="color:var(--text-secondary);margin:0.3em 0">${formatted}</p>`
    }
  }
  if (inCode) html += '</code></pre>'
  return html
}

function FileIcon({ ext, isDir }: { ext: string; isDir: boolean }) {
  const e = ext.toLowerCase()
  if (isDir) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e2b714" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    )
  }
  if (IMAGE_EXTENSIONS.has(e)) {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
  }
  if (PDF_EXTENSIONS.has(e)) {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
  }
  if (VIDEO_EXTENSIONS.has(e)) {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
  }
  if (AUDIO_EXTENSIONS.has(e)) {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
  }
  if (CODE_EXTENSIONS.has(e)) {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
  }
  if (MARKDOWN_EXTENSIONS.has(e)) {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e2b714" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 15v-4l2 2 2-2v4"/></svg>
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
  }
  if (['exe', 'msi', 'app', 'dmg', 'deb', 'rpm'].includes(e)) {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )
}

function DriveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  )
}

export function FileExplorerPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('drives')
  const [drives, setDrives] = useState<DriveEntry[]>([])
  const [disks, setDisks] = useState<DiskUsage[]>([])
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null)
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [currentPath, setCurrentPath] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewPath, setPreviewPath] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<PreviewType | null>(null)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fsService.getDrives().then(setDrives).catch(() => {})
    fsService.getDiskUsage().then(setDisks).catch(() => {})
    fsService.getSystemInfo().then(setSysInfo).catch(() => {})
  }, [refreshKey])

  const loadDir = useCallback(async (path: string) => {
    setLoading(true)
    setError(null)
    setPreviewContent(null)
    setPreviewPath(null)
    setPreviewType(null)
    try {
      const result = await fsService.listDirectory(path)
      setEntries(result)
      setCurrentPath(path)
      setViewMode('files')
    } catch (err) {
      setError(String(err))
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  const navigateTo = useCallback((path: string) => {
    setHistory(prev => currentPath ? [...prev, currentPath] : prev)
    loadDir(path)
  }, [currentPath, loadDir])

  const goBack = useCallback(() => {
    if (history.length === 0) {
      setViewMode('drives')
      setCurrentPath('')
      setEntries([])
      setError(null)
      return
    }
    const prev = history[history.length - 1]
    setHistory(prev => prev.slice(0, -1))
    loadDir(prev)
  }, [history, loadDir])

  const handleDoubleClick = useCallback(async (entry: FileEntry) => {
    if (entry.is_dir) { navigateTo(entry.path); return }
    const ext = entry.extension.toLowerCase()

    if (PDF_EXTENSIONS.has(ext)) {
      const url = await fsService.getServeUrl(entry.path)
      if (url) { setPreviewContent(url); setPreviewPath(entry.path); setPreviewType('pdf'); setViewMode('preview') }
      else setError(`Cannot preview ${entry.name}`)
      return
    }

    if (VIDEO_EXTENSIONS.has(ext)) {
      const url = await fsService.getServeUrl(entry.path)
      if (url) { setPreviewContent(url); setPreviewPath(entry.path); setPreviewType('video'); setViewMode('preview') }
      else setError(`Cannot preview ${entry.name}`)
      return
    }

    if (AUDIO_EXTENSIONS.has(ext)) {
      const url = await fsService.getServeUrl(entry.path)
      if (url) { setPreviewContent(url); setPreviewPath(entry.path); setPreviewType('audio'); setViewMode('preview') }
      else setError(`Cannot preview ${entry.name}`)
      return
    }

    if (MARKDOWN_EXTENSIONS.has(ext)) {
      try {
        const content = await fsService.readTextFile(entry.path)
        setPreviewContent(renderMarkdown(content))
        setPreviewPath(entry.path)
        setPreviewType('markdown')
        setViewMode('preview')
      } catch { setError(`Cannot read ${entry.name}`) }
      return
    }

    if (CODE_EXTENSIONS.has(ext)) {
      try {
        const content = await fsService.readTextFile(entry.path)
        const lang = ext === 'tsx' || ext === 'ts' ? 'typescript' : ext === 'js' ? 'javascript' : ext === 'py' ? 'python' : ext === 'rs' ? 'rust' : ext === 'sh' ? 'bash' : ext === 'bat' || ext === 'ps1' ? 'powershell' : ext === 'yml' || ext === 'yaml' ? 'yaml' : ext
        let highlighted = ''
        try { highlighted = hljs.highlight(content, { language: lang }).value }
        catch { highlighted = hljs.highlightAuto(content).value }
        setPreviewContent(`<pre style="background:transparent!important"><code class="hljs">${highlighted}</code></pre>`)
        setPreviewPath(entry.path)
        setPreviewType('code')
        setViewMode('preview')
      } catch { setError(`Cannot read ${entry.name}`) }
      return
    }

    if (IMAGE_EXTENSIONS.has(ext)) {
      try {
        const base64 = await fsService.readBinaryFile(entry.path)
        if (base64) {
          setPreviewContent(`data:image/${ext === 'svg' ? 'svg+xml' : ext};base64,${base64}`)
          setPreviewPath(entry.path); setPreviewType('image'); setViewMode('preview')
        }
      } catch { setError(`Cannot preview ${entry.name}`) }
      return
    }

    if (TEXT_EXTENSIONS.has(ext)) {
      try {
        const content = await fsService.readTextFile(entry.path)
        setPreviewContent(content); setPreviewPath(entry.path); setPreviewType('text'); setViewMode('preview')
      } catch {
        try { await fsService.openFile(entry.path) } catch { setError(`Cannot open ${entry.name}`) }
      }
      return
    }

    try { await fsService.openFile(entry.path) } catch { setError(`Cannot open ${entry.name}`) }
  }, [navigateTo])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1
    let cmp = 0
    if (sortField === 'name') cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    else if (sortField === 'size') cmp = a.size - b.size
    else if (sortField === 'modified') cmp = a.modified.localeCompare(b.modified)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const parentPath = (() => {
    if (!currentPath) return ''
    const parts = currentPath.replace(/\\/g, '/').replace(/\/$/, '').split('/')
    return parts.slice(0, -1).join('/') || (currentPath.includes('\\') ? currentPath.slice(0, 2) + '\\' : '/')
  })()

  const pageTitle = currentPath || 'This PC'

  const sortArrow = (field: SortField) => {
    if (sortField !== field) return null
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2, opacity: 0.5 }}>
        {sortDir === 'asc'
          ? <path d="M12 5l-7 7h14z"/>
          : <path d="M12 19l-7-7h14z"/>}
      </svg>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-canvas)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 shrink-0" style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--glass-border)' }}>
        <button onClick={goBack} disabled={viewMode === 'drives'}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 disabled:opacity-25 cursor-pointer disabled:cursor-default"
          data-tooltip="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button onClick={() => { setViewMode('drives'); setCurrentPath(''); setEntries([]); setHistory([]); setError(null); setPreviewContent(null); setPreviewPath(null); setPreviewType(null) }}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 cursor-pointer"
          data-tooltip="This PC">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
        <button onClick={() => setRefreshKey(k => k + 1)}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 cursor-pointer"
          data-tooltip="Refresh">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
        <div className="flex-1 truncate px-2 py-0.5 rounded text-[11px] font-mono" style={{ background: 'var(--bg-canvas)', color: 'var(--text-muted)', margin: '0 4px' }}>
          {pageTitle}
        </div>
        <button onClick={() => setSidebarCollapsed(c => !c)}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 cursor-pointer"
          data-tooltip={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <div className="w-[180px] shrink-0 overflow-y-auto" style={{ borderRight: '1px solid var(--glass-border)', background: 'var(--bg-elevated)' }}>
            {/* System info */}
            {sysInfo && (
              <div className="px-3 py-2.5 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                <p className="text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-ghost)' }}>System</p>
                <div className="space-y-0.5 text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  <p><span className="opacity-40">OS</span> {sysInfo.os_name}</p>
                  <p><span className="opacity-40">CPU</span> {sysInfo.cpu_cores}c</p>
                  <p><span className="opacity-40">RAM</span> {(sysInfo.memory_used_gb).toFixed(1)}/{sysInfo.memory_total_gb.toFixed(1)}GB</p>
                  <p><span className="opacity-40">Host</span> {sysInfo.hostname}</p>
                </div>
              </div>
            )}

            {/* Drives */}
            <div className="px-3 pt-2.5 pb-1">
              <p className="text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-ghost)' }}>Drives</p>
              <div className="space-y-0.5">
                {drives.map(drive => (
                  <button key={drive.mount_point}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] cursor-pointer hover:bg-white/5 transition-colors text-left"
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={() => navigateTo(drive.mount_point)}
                    data-tooltip={`${drive.name} (${drive.drive_type})`}>
                    <DriveIcon />
                    <span>{drive.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick access */}
            <div className="px-3 pt-2">
              <p className="text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-ghost)' }}>Quick Access</p>
              <div className="space-y-0.5">
                <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] cursor-pointer hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => navigateTo(drives.length > 0 ? drives[0].mount_point : 'C:\\')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e2b714" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>This PC</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {error && (
            <div className="mx-2 mt-1.5 px-2.5 py-1.5 rounded text-[11px] shrink-0" style={{ background: 'rgba(255,80,80,0.1)', color: '#ff6060', border: '1px solid rgba(255,80,80,0.2)' }}>
              {error}
            </div>
          )}

          {/* Drives view */}
          {viewMode === 'drives' && (
            <div className="flex-1 overflow-y-auto">
              {drives.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--text-ghost)' }}>
                  <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                </div>
              ) : (
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <DriveIcon />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>This PC</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {drives.map(entry => {
                      const disk = disks.find(d => d.mount_point === entry.mount_point || d.mount_point.replace(/\\$/, '') === entry.mount_point.replace(/\\$/, ''))
                      const usedPct = disk ? diskUsagePercent(disk.total_gb, disk.available_gb) : 50
                      return (
                        <button key={entry.mount_point}
                          className="flex items-center gap-3 p-3 rounded-lg text-left cursor-pointer hover:bg-white/[0.03] transition-colors"
                          style={{ border: '1px solid var(--glass-border)', background: 'var(--bg-elevated)' }}
                          onClick={() => navigateTo(entry.mount_point)}>
                          <DriveIcon />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{entry.name}</span>
                              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{entry.drive_type}</span>
                            </div>
                            {disk && (
                              <div className="mt-1.5">
                                <div className="flex justify-between text-[9px] mb-0.5" style={{ color: 'var(--text-ghost)' }}>
                                  <span>{formatSize(entry.total_space)}</span>
                                  <span>{usedPct}% used</span>
                                </div>
                                <div className="w-full h-1 rounded-sm overflow-hidden" style={{ background: 'var(--bg-canvas)' }}>
                                  <div className="h-full rounded-sm" style={{ width: `${usedPct}%`, background: usedPct > 85 ? '#ef4444' : 'var(--accent)' }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Files view */}
          {viewMode === 'files' && (
            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center h-full">
                  <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                </div>
              )}
              {!loading && !error && (
                <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className="sticky top-0" style={{ background: 'var(--bg-elevated)' }}>
                      <th className="text-left px-2 py-1.5 font-medium cursor-pointer hover:opacity-80 select-none text-[10px] uppercase tracking-wider"
                        style={{ color: 'var(--text-ghost)', borderBottom: '1px solid var(--glass-border)' }}
                        onClick={() => toggleSort('name')}>
                        <span className="flex items-center gap-1">Name{sortArrow('name')}</span>
                      </th>
                      <th className="text-right px-2 py-1.5 font-medium cursor-pointer hover:opacity-80 select-none text-[10px] uppercase tracking-wider w-[80px]"
                        style={{ color: 'var(--text-ghost)', borderBottom: '1px solid var(--glass-border)' }}
                        onClick={() => toggleSort('size')}>
                        <span className="flex items-center justify-end gap-1">Size{sortArrow('size')}</span>
                      </th>
                      <th className="text-right px-2 py-1.5 font-medium cursor-pointer hover:opacity-80 select-none text-[10px] uppercase tracking-wider w-[140px]"
                        style={{ color: 'var(--text-ghost)', borderBottom: '1px solid var(--glass-border)' }}
                        onClick={() => toggleSort('modified')}>
                        <span className="flex items-center justify-end gap-1">Date modified{sortArrow('modified')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parentPath && currentPath && (
                      <tr className="cursor-pointer hover:bg-white/[0.02]" onClick={() => navigateTo(parentPath)}>
                        <td className="px-2 py-1.5 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                          <FileIcon ext="" isDir={true} />
                          <span>..</span>
                        </td>
                        <td />
                        <td />
                      </tr>
                    )}
                    {sorted.map(entry => (
                      <tr key={entry.path}
                        className="cursor-pointer hover:bg-white/[0.02]"
                        onDoubleClick={() => handleDoubleClick(entry)}>
                        <td className="px-2 py-1.5 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                          <FileIcon ext={entry.extension} isDir={entry.is_dir} />
                          <span className="truncate">{entry.name}</span>
                        </td>
                        <td className="px-2 py-1.5 text-right whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                          {entry.is_dir ? '' : formatSize(entry.size)}
                        </td>
                        <td className="px-2 py-1.5 text-right whitespace-nowrap font-mono" style={{ color: 'var(--text-muted)' }}>
                          {entry.modified}
                        </td>
                      </tr>
                    ))}
                    {sorted.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-12 text-xs" style={{ color: 'var(--text-ghost)' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-2 opacity-30">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                          </svg>
                          This folder is empty
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Preview view */}
          {viewMode === 'preview' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center gap-2 px-2 py-1 shrink-0" style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--glass-border)' }}>
                <button onClick={() => { setViewMode('files'); setPreviewContent(null); setPreviewPath(null); setPreviewType(null) }}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 cursor-pointer"
                  data-tooltip="Back">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <span className="text-[11px] truncate flex-1 font-mono" style={{ color: 'var(--text-muted)' }}>{previewPath}</span>
                {(previewType === 'text' || previewType === 'code' || previewType === 'markdown') && (
                  <button onClick={() => {
                    const el = document.getElementById('preview-content')
                    if (el) navigator.clipboard.writeText(el.textContent || '')
                  }}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 cursor-pointer"
                    data-tooltip="Copy">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-auto">
                {previewType === 'text' && (
                  <pre className="text-xs p-4 font-mono leading-relaxed whitespace-pre-wrap break-all"
                    style={{ color: 'var(--text-secondary)' }}>
                    {previewContent}
                  </pre>
                )}
                {previewType === 'code' && previewContent && (
                  <div id="preview-content" className="text-xs" style={{ background: 'var(--bg-canvas)' }}
                    dangerouslySetInnerHTML={{ __html: previewContent }} />
                )}
                {previewType === 'markdown' && previewContent && (
                  <div id="preview-content" className="text-sm p-6 leading-relaxed max-w-[800px]"
                    style={{ color: 'var(--text-secondary)' }}
                    dangerouslySetInnerHTML={{ __html: previewContent }} />
                )}
                {previewType === 'image' && previewContent && (
                  <div className="flex items-center justify-center h-full p-4">
                    <img src={previewContent} alt="Preview" className="max-w-full max-h-full object-contain rounded" />
                  </div>
                )}
                {previewType === 'pdf' && previewContent && (
                  <iframe src={previewContent} className="w-full h-full border-0" title="PDF Preview" />
                )}
                {previewType === 'video' && previewContent && (
                  <div className="flex items-center justify-center h-full p-4">
                    <video src={previewContent} controls className="max-w-full max-h-full rounded" />
                  </div>
                )}
                {previewType === 'audio' && previewContent && (
                  <div className="flex items-center justify-center h-full p-4">
                    <audio src={previewContent} controls className="w-full max-w-[500px]" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

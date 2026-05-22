import { useState, useEffect, useCallback, useRef } from 'react'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import * as fsService from '../lib/fs-service'
import type { FileEntry, VolumeEntry, SystemInfo, DiskUsage } from '../lib/fs-service'

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

const FOLDER_ICONS: Record<string, string> = {
  desktop: '🖥️', downloads: '⬇️', documents: '📄', pictures: '🖼️', music: '🎵', videos: '🎬',
}

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

const SVG_FILES = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
const SVG_FOLDER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`
const SVG_IMAGE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`
const SVG_MUSIC = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`
const SVG_VIDEO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`
const SVG_CODE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`
const SVG_PDF = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" y2="13"/><line x1="8" y1="13" y2="13"/><line x1="16" y1="17" y2="17"/><line x1="8" y1="17" y2="17"/></svg>`

function fileIcon(ext: string, isDir: boolean): string {
  if (isDir) return SVG_FOLDER
  if (IMAGE_EXTENSIONS.has(ext) || PDF_EXTENSIONS.has(ext)) return SVG_IMAGE
  if (AUDIO_EXTENSIONS.has(ext)) return SVG_MUSIC
  if (VIDEO_EXTENSIONS.has(ext)) return SVG_VIDEO
  if (CODE_EXTENSIONS.has(ext)) return SVG_CODE
  return SVG_FILES
}

export function FileExplorerPage() {
  const [volumes, setVolumes] = useState<VolumeEntry[]>([])
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [currentPath, setCurrentPath] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('drives')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [error, setError] = useState('')
  const [previewContent, setPreviewContent] = useState('')
  const [previewType, setPreviewType] = useState<PreviewType>('text')
  const [previewPath, setPreviewPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Load volumes on mount
  useEffect(() => { fsService.getVolumes().then(setVolumes).catch(() => {}) }, [])

  const loadDir = useCallback(async (dirPath: string) => {
    setLoading(true)
    setError('')
    setViewMode('files')
    setCurrentPath(dirPath)
    try {
      const list = await fsService.listDirectory(dirPath)
      setEntries(list)
    } catch (err: any) {
      setError(err.message)
      setEntries([])
    }
    setLoading(false)
  }, [])

  const navigateTo = useCallback((target: string) => {
    setPreviewPath('')
    if (target === '' || target === '\\' || target === '/') { setViewMode('drives'); setEntries([]); return }
    loadDir(target)
  }, [loadDir])

  const openPreview = async (entry: FileEntry) => {
    if (entry.is_dir) { navigateTo(entry.path); return }
    setPreviewPath(entry.path)
    setViewMode('preview')
    const ext = entry.extension.toLowerCase()
    const serveUrl = await fsService.getServeUrl(entry.path)
    if (IMAGE_EXTENSIONS.has(ext) && serveUrl) { setPreviewType('image'); setPreviewContent(serveUrl); return }
    if (PDF_EXTENSIONS.has(ext) && serveUrl) { setPreviewType('pdf'); setPreviewContent(serveUrl); return }
    if (VIDEO_EXTENSIONS.has(ext) && serveUrl) { setPreviewType('video'); setPreviewContent(serveUrl); return }
    if (AUDIO_EXTENSIONS.has(ext) && serveUrl) { setPreviewType('audio'); setPreviewContent(serveUrl); return }
    if (MARKDOWN_EXTENSIONS.has(ext)) {
      try { const text = await fsService.readTextFile(entry.path); setPreviewType('markdown'); setPreviewContent(text); return } catch {}
    }
    if (CODE_EXTENSIONS.has(ext) || TEXT_EXTENSIONS.has(ext)) {
      try {
        const text = await fsService.readTextFile(entry.path)
        setPreviewType('code')
        setPreviewContent(hljs.highlightAuto(text).value)
        return
      } catch {}
    }
    setPreviewType('text')
    try { setPreviewContent(await fsService.readTextFile(entry.path)) } catch { setPreviewContent('Cannot preview this file') }
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1
    let cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    if (sortField === 'size') cmp = a.size - b.size
    if (sortField === 'modified') cmp = a.modified.localeCompare(b.modified)
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="flex h-full" style={{ background: '#0d1117' }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="flex flex-col shrink-0 overflow-y-auto" style={{ width: 220, background: '#0d1117', borderRight: '1px solid #21262d' }}>
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8b949e' }}>Quick Access</div>
          {volumes.filter(v => v.type === 'folder').map(v => (
            <button key={v.name} onClick={() => navigateTo(v.path || '')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-white/[0.03] transition-colors text-left"
              style={{ color: '#c9d1d9' }}>
              <span>{FOLDER_ICONS[v.name.toLowerCase()] || '📁'}</span>
              <span className="truncate">{v.name}</span>
            </button>
          ))}
          <div className="px-3 py-2 mt-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8b949e' }}>Drives</div>
          {volumes.filter(v => v.type === 'drive').map(v => (
            <button key={v.name} onClick={() => navigateTo(v.mount_point || v.name + '\\')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-white/[0.03] transition-colors text-left"
              style={{ color: '#c9d1d9' }}>
              <span>💾</span>
              <div className="flex-1 min-w-0">
                <div className="truncate">{v.label || v.name}</div>
                {v.total_gb ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="h-1 flex-1 rounded-full" style={{ background: '#21262d' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${diskUsagePercent(v.total_gb, v.available_gb || 0)}%`,
                        background: (v.available_gb || 0) < v.total_gb * 0.1 ? '#f85149' : '#238636',
                      }} />
                    </div>
                    <span className="text-[10px]" style={{ color: '#8b949e' }}>{v.total_gb} GB</span>
                  </div>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-1.5 shrink-0" style={{ background: '#161b22', borderBottom: '1px solid #21262d', minHeight: 36 }}>
          <button onClick={() => setSidebarOpen(v => !v)} className="px-1.5 py-0.5 rounded text-xs cursor-pointer hover:bg-white/10" style={{ color: '#8b949e' }} data-tooltip="Toggle sidebar">☰</button>
          <button onClick={() => navigateTo('')} className="px-1.5 py-0.5 rounded text-xs cursor-pointer hover:bg-white/10" style={{ color: '#8b949e' }} data-tooltip="Show drives">🏠</button>
          {currentPath && (
            <>
              <button onClick={() => navigateTo(currentPath.split('\\').slice(0, -1).join('\\') || currentPath.slice(0, 2) + '\\')} className="px-1.5 py-0.5 rounded text-xs cursor-pointer hover:bg-white/10" style={{ color: '#8b949e' }} data-tooltip="Go up">▲</button>
              <span className="text-xs font-mono truncate max-w-[400px]" style={{ color: '#8b949e' }}>{currentPath}</span>
            </>
          )}
          <div className="flex-1" />
          {viewMode === 'files' && (
            <div className="flex items-center gap-1 text-[10px]" style={{ color: '#8b949e' }}>
              <button onClick={() => { setSortField('name'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }} className="px-1.5 py-0.5 rounded cursor-pointer hover:bg-white/10" data-tooltip="Sort by name">Name {sortField === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</button>
              <button onClick={() => { setSortField('size'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }} className="px-1.5 py-0.5 rounded cursor-pointer hover:bg-white/10" data-tooltip="Sort by size">Size {sortField === 'size' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</button>
              <button onClick={() => { setSortField('modified'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }} className="px-1.5 py-0.5 rounded cursor-pointer hover:bg-white/10" data-tooltip="Sort by date">Date {sortField === 'modified' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</button>
            </div>
          )}
        </div>

        {/* Content area */}
        {loading && <div className="flex-1 flex items-center justify-center text-xs" style={{ color: '#8b949e' }}>Loading...</div>}

        {error && <div className="p-3 text-xs" style={{ color: '#f85149', background: '#161b22', borderBottom: '1px solid #21262d' }}>⚠ {error}</div>}

        {viewMode === 'drives' && !loading && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-sm font-semibold mb-3" style={{ color: '#c9d1d9' }}>This PC</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {volumes.filter(v => v.type === 'drive').map(v => (
                <button key={v.name} onClick={() => navigateTo(v.mount_point || v.name + '\\')}
                  className="flex items-center gap-3 p-3 rounded-lg text-left cursor-pointer transition-all hover:bg-white/[0.03]"
                  style={{ background: '#161b22', border: '1px solid #21262d' }}>
                  <span className="text-2xl">💾</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: '#c9d1d9' }}>{v.label || v.name}</div>
                    <div className="text-[11px]" style={{ color: '#8b949e' }}>{v.name} — {v.total_gb ? `${v.total_gb} GB` : ''}</div>
                    {v.total_gb ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 rounded-full" style={{ background: '#21262d' }}>
                          <div className="h-full rounded-full" style={{
                            width: `${diskUsagePercent(v.total_gb, v.available_gb || 0)}%`,
                            background: (v.available_gb || 0) < v.total_gb * 0.1 ? '#f85149' : '#238636',
                          }} />
                        </div>
                        <span className="text-[10px] whitespace-nowrap" style={{ color: '#8b949e' }}>
                          {v.available_gb} GB free of {v.total_gb} GB
                        </span>
                      </div>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'files' && !loading && (
          <div className="flex-1 overflow-y-auto" style={{ background: '#0d1117' }}>
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#161b22', position: 'sticky', top: 0 }}>
                  <th className="text-left px-3 py-1.5 text-[11px] font-medium" style={{ color: '#8b949e', borderBottom: '1px solid #21262d', width: 28 }}></th>
                  <th className="text-left px-1 py-1.5 text-[11px] font-medium cursor-pointer hover:bg-white/[0.02]" style={{ color: '#8b949e', borderBottom: '1px solid #21262d' }} onClick={() => { setSortField('name'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}>
                    Name {sortField === 'name' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                  <th className="text-right px-3 py-1.5 text-[11px] font-medium cursor-pointer hover:bg-white/[0.02]" style={{ color: '#8b949e', borderBottom: '1px solid #21262d', width: 80 }} onClick={() => { setSortField('size'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}>
                    Size {sortField === 'size' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="text-right px-3 py-1.5 text-[11px] font-medium cursor-pointer hover:bg-white/[0.02]" style={{ color: '#8b949e', borderBottom: '1px solid #21262d', width: 160 }} onClick={() => { setSortField('modified'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}>
                    Date modified {sortField === 'modified' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(entry => (
                  <tr key={entry.path} className="hover:bg-white/[0.02] cursor-pointer" onClick={() => openPreview(entry)} onDoubleClick={() => { if (entry.is_dir) navigateTo(entry.path) }}>
                    <td className="px-3 py-0.5 text-center" style={{ borderBottom: '1px solid #21262d' }}>
                      <span className="inline-flex items-center justify-center w-4 h-4" dangerouslySetInnerHTML={{ __html: fileIcon(entry.extension, entry.is_dir) }} style={{ color: entry.is_dir ? '#58a6ff' : '#8b949e' }} />
                    </td>
                    <td className="px-1 py-0.5 text-xs truncate max-w-[300px]" style={{ color: entry.is_dir ? '#58a6ff' : '#c9d1d9', borderBottom: '1px solid #21262d' }}>{entry.name}</td>
                    <td className="px-3 py-0.5 text-xs text-right font-mono" style={{ color: '#8b949e', borderBottom: '1px solid #21262d' }}>{entry.is_dir ? '—' : formatSize(entry.size)}</td>
                    <td className="px-3 py-0.5 text-xs text-right font-mono" style={{ color: '#8b949e', borderBottom: '1px solid #21262d' }}>{entry.modified}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sorted.length === 0 && <div className="text-center py-8 text-xs" style={{ color: '#8b949e' }}>Empty folder</div>}
          </div>
        )}

        {viewMode === 'preview' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 px-3 py-1 shrink-0" style={{ background: '#161b22', borderBottom: '1px solid #21262d' }}>
              <button onClick={() => setViewMode('files')} className="text-xs px-2 py-0.5 rounded cursor-pointer hover:bg-white/10" style={{ color: '#8b949e' }}>← Back</button>
              <span className="text-xs font-mono truncate" style={{ color: '#c9d1d9' }}>{previewPath.split('\\').pop()}</span>
            </div>
            <div className="flex-1 overflow-auto">
              {previewType === 'image' && <img src={previewContent} alt="preview" className="max-w-full object-contain p-2" />}
              {previewType === 'pdf' && <iframe ref={iframeRef} src={previewContent} className="w-full h-full border-0" />}
              {previewType === 'video' && <video controls autoPlay className="max-w-full max-h-full p-2" src={previewContent} />}
              {previewType === 'audio' && <div className="flex items-center justify-center h-full"><audio controls autoPlay src={previewContent} /></div>}
              {previewType === 'markdown' && <div className="p-4 text-sm leading-relaxed" style={{ color: '#c9d1d9' }}>{renderMarkdown(previewContent)}</div>}
              {previewType === 'code' && <pre className="p-4 text-sm" style={{ background: '#0d1117' }}><code dangerouslySetInnerHTML={{ __html: previewContent }} /></pre>}
              {previewType === 'text' && <pre className="p-4 text-sm font-mono whitespace-pre-wrap" style={{ color: '#c9d1d9', background: '#0d1117' }}>{previewContent}</pre>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function renderMarkdown(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const lines = escaped.split('\n')
  let html = ''
  let inCode = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('```')) {
      if (inCode) { html += '</code></pre>'; inCode = false } else { html += '<pre><code>'; inCode = true }
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
    } else if (/^> /.test(line)) {
      html += `<blockquote style="border-left:3px solid var(--accent);padding:0.5em 1em;margin:0.5em 0;color:var(--text-muted);background:rgba(255,255,255,0.02)">${line.slice(2)}</blockquote>`
    } else if (/^```/.test(line)) {
      html += '<pre><code>'; inCode = true
    } else if (/^---/.test(line)) {
      html += '<hr style="border:none;border-top:1px solid var(--glass-border);margin:1.5em 0">'
    } else if (line.trim() === '') {
      html += '<br>'
    } else {
      html += `<p style="margin:0.3em 0;color:var(--text-secondary)">${line}</p>`
    }
  }
  return html
}

import { useState } from 'react'
import Editor from '@monaco-editor/react'
import * as fsService from '../lib/fs-service'

const EXT_LANG_MAP: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  py: 'python', rs: 'rust', go: 'go', java: 'java', cpp: 'cpp', c: 'c',
  cs: 'csharp', rb: 'ruby', php: 'php', swift: 'swift', kt: 'kotlin',
  html: 'html', css: 'css', scss: 'scss', json: 'json', xml: 'xml',
  yaml: 'yaml', yml: 'yaml', md: 'markdown', sql: 'sql', sh: 'shell',
  bat: 'bat', ps1: 'powershell', vue: 'html', svelte: 'html',
}

export function CodeEditor() {
  const [filePath, setFilePath] = useState('')
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [language, setLanguage] = useState('plaintext')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const openFile = async (path: string) => {
    setError('')
    const ext = path.split('.').pop()?.toLowerCase() || ''
    const lang = EXT_LANG_MAP[ext] || 'plaintext'
    setLanguage(lang)
    setFilePath(path)
    try {
      const text = await fsService.readTextFile(path)
      setContent(text)
      setOriginalContent(text)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const saveFile = async () => {
    if (!filePath || content === originalContent) return
    setSaving(true)
    try {
      // Use the Vite API to write the file
      const res = await fetch(`/api/fs/write?path=${encodeURIComponent(filePath)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error('Save failed')
      setOriginalContent(content)
    } catch (err: any) {
      setError(err.message)
    }
    setSaving(false)
  }

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    for (const f of files) {
      const path = (f as any).path || f.name
      await openFile(path)
      break
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#1e1e1e' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1 shrink-0" style={{ background: '#252526', borderBottom: '1px solid #333', minHeight: 32 }}>
        {filePath ? (
          <>
            <span className="text-xs font-mono truncate max-w-[300px]" style={{ color: '#ccc' }}>{filePath}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#333', color: '#888' }}>{language}</span>
            <div className="flex-1" />
            {content !== originalContent && (
              <span className="text-[10px]" style={{ color: '#e2b714' }}>● unsaved</span>
            )}
            <button onClick={saveFile} disabled={saving || content === originalContent}
              className="text-xs px-2 py-0.5 rounded cursor-pointer disabled:opacity-40"
              style={{ background: content !== originalContent ? '#4ec9b0' : '#333', color: content !== originalContent ? '#1e1e1e' : '#666' }}
              data-tooltip="Save file">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        ) : (
          <span className="text-xs" style={{ color: '#666' }}>Drop a file here or use the File Explorer to open one</span>
        )}
        {error && <span className="text-xs ml-auto" style={{ color: '#f44747' }}>{error}</span>}
      </div>

      {/* Editor */}
      <div className="flex-1" onDragOver={e => e.preventDefault()} onDrop={handleFileDrop}>
        {filePath ? (
          <Editor
            language={language}
            value={content}
            onChange={(val) => setContent(val || '')}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: 'Cascadia Code, Fira Code, Consolas, monospace',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              tabSize: 2,
              automaticLayout: true,
              wordWrap: 'on',
              padding: { top: 8 },
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-xs" style={{ color: '#555' }}>
            <div className="text-center space-y-2">
              <p className="text-4xl">📝</p>
              <p>Open a file from the File Explorer</p>
              <p className="text-[10px]" style={{ color: '#444' }}>Or drag & drop a file here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

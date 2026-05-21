// src/renderer/pages/RagLabPage.tsx
// Smart Hub | RAG Lab & Scraper Studio
// Phase 0.5: Knowledge ingestion and semantic search

import { useState } from 'react'

interface Notebook {
  id: string
  name: string
  sources: number
  chunks: number
  lastUpdated: string
}

export function RagLabPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([
    { id: '1', name: 'iTaK Architecture', sources: 14, chunks: 2340, lastUpdated: '2 hrs ago' },
    { id: '2', name: 'Mojo Patterns', sources: 8, chunks: 1280, lastUpdated: '1 day ago' },
    { id: '3', name: 'PPC Business Docs', sources: 22, chunks: 4100, lastUpdated: '4 hrs ago' },
  ])

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleCreateNotebook = () => {
    const name = prompt('Enter a name for your new RAG Notebook:')
    if (!name) return

    const newNotebook: Notebook = {
      id: Math.random().toString(36).substring(7),
      name,
      sources: 0,
      chunks: 0,
      lastUpdated: 'Just now'
    }

    setNotebooks(prev => [...prev, newNotebook])
  }

  const handleIngestSimulate = () => {
    if (isUploading) return
    setIsUploading(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsUploading(false)
            // Add a source to the first notebook as a simulation
            setNotebooks(prevNbs => {
              const copy = [...prevNbs]
              if (copy.length > 0) {
                copy[0] = {
                  ...copy[0],
                  sources: copy[0].sources + 1,
                  chunks: copy[0].chunks + Math.floor(Math.random() * 150) + 50,
                  lastUpdated: 'Just now'
                }
              }
              return copy
            })
            alert('File uploaded, parsed, and successfully indexed into "iTaK Architecture" RAG Notebook!')
          }, 400)
          return 100
        }
        return prev + 10
      })
    }, 150)
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>RAG Lab</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Ingest documents, build knowledge bases, and search semantically</p>
        </div>
        <button 
          className="action-chip action-chip-primary cursor-pointer"
          onClick={handleCreateNotebook}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Notebook
        </button>
      </div>

      {/* Notebook Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        {notebooks.map((nb) => (
          <div key={nb.id} className="glass-card p-5 animate-fade-up cursor-pointer hover:border-[var(--accent)] transition-all">
            <div className="flex items-center gap-2 mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--blue)' }}>
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{nb.name}</h3>
            </div>
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex justify-between">
                <span>Sources</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{nb.sources}</span>
              </div>
              <div className="flex justify-between">
                <span>Chunks</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{nb.chunks.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-[11px] mt-3 font-mono" style={{ color: 'var(--text-ghost)' }}>Updated {nb.lastUpdated}</p>
          </div>
        ))}

        {/* Add new notebook card */}
        <div 
          className="glass-card p-5 animate-fade-up cursor-pointer flex items-center justify-center min-h-[160px]"
          style={{ borderStyle: 'dashed', borderColor: 'var(--glass-border-hover)' }}
          onClick={handleCreateNotebook}
        >
          <div className="text-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Create Notebook</p>
          </div>
        </div>
      </div>

      {/* Drag-and-drop zone */}
      <div 
        className="glass-card p-8 text-center cursor-pointer hover:border-[var(--accent)] transition-all" 
        style={{ borderStyle: 'dashed' }}
        onClick={handleIngestSimulate}
      >
        {isUploading ? (
          <div className="space-y-3">
            <div className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Ingesting & parsing documents ({uploadProgress}%)</div>
            <div className="w-full max-w-md mx-auto bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-[var(--accent)] h-1.5 transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        ) : (
          <>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-base font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Drop files here or click to ingest</p>
            <p className="text-xs" style={{ color: 'var(--text-ghost)' }}>Supports PDF, DOCX, TXT, MD, HTML, and URLs</p>
          </>
        )}
      </div>
    </div>
  )
}


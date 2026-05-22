import { useState, useRef, useEffect } from 'react'

interface GraphNode {
  id: string; label: string; type: 'source' | 'chunk'; chunks: number; connections: number
  x: number; y: number; vx: number; vy: number; radius: number; color: string; highlighted: boolean
}

interface Edge {
  from: string; to: string; highlighted: boolean
}

const GRAPH_NODES: GraphNode[] = [
  { id: 'n1', label: 'engine/mamba2.mojo', type: 'source', chunks: 340, connections: 4, x: 100, y: 80, vx: 0, vy: 0, radius: 18, color: 'var(--accent)', highlighted: false },
  { id: 'n2', label: 'engine/attention.mojo', type: 'source', chunks: 280, connections: 3, x: 500, y: 60, vx: 0, vy: 0, radius: 16, color: 'var(--accent)', highlighted: false },
  { id: 'n3', label: 'docs/ssm-theory.md', type: 'source', chunks: 210, connections: 3, x: 300, y: 260, vx: 0, vy: 0, radius: 14, color: 'var(--accent)', highlighted: false },
  { id: 'n4', label: 'docs/hybrid-arch.md', type: 'source', chunks: 190, connections: 2, x: 120, y: 220, vx: 0, vy: 0, radius: 13, color: 'var(--accent)', highlighted: false },
  { id: 'n5', label: 'SSM State Equations', type: 'chunk', chunks: 45, connections: 2, x: 220, y: 120, vx: 0, vy: 0, radius: 10, color: 'var(--blue)', highlighted: false },
  { id: 'n6', label: 'Attention Masking', type: 'chunk', chunks: 38, connections: 2, x: 420, y: 140, vx: 0, vy: 0, radius: 9, color: 'var(--blue)', highlighted: false },
  { id: 'n7', label: 'KV Cache Layout', type: 'chunk', chunks: 52, connections: 2, x: 380, y: 270, vx: 0, vy: 0, radius: 10, color: 'var(--blue)', highlighted: false },
  { id: 'n8', label: 'Selective SSM Scan', type: 'chunk', chunks: 67, connections: 2, x: 180, y: 180, vx: 0, vy: 0, radius: 11, color: 'var(--blue)', highlighted: false },
  { id: 'n9', label: 'benchmarks/latency.csv', type: 'source', chunks: 95, connections: 1, x: 550, y: 180, vx: 0, vy: 0, radius: 10, color: 'var(--accent)', highlighted: false },
]

const GRAPH_EDGES: Edge[] = [
  { from: 'n1', to: 'n5', highlighted: false }, { from: 'n1', to: 'n8', highlighted: false },
  { from: 'n2', to: 'n6', highlighted: false }, { from: 'n2', to: 'n7', highlighted: false },
  { from: 'n3', to: 'n5', highlighted: false }, { from: 'n3', to: 'n7', highlighted: false },
  { from: 'n4', to: 'n8', highlighted: false }, { from: 'n4', to: 'n6', highlighted: false },
  { from: 'n5', to: 'n8', highlighted: false }, { from: 'n6', to: 'n7', highlighted: false },
  { from: 'n9', to: 'n2', highlighted: false },
]

interface SourceFragment {
  id: string
  name: string
  type: string
  selected: boolean
}

interface Notebook {
  id: string
  name: string
  sources: number
  chunks: number
  lastUpdated: string
  fragments: SourceFragment[]
}

const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: '1', name: 'iTaK Architecture', sources: 14, chunks: 2340, lastUpdated: '2 hrs ago',
    fragments: [
      { id: 'f1', name: 'engine/mamba2.mojo', type: 'mojo', selected: true },
      { id: 'f2', name: 'engine/attention.mojo', type: 'mojo', selected: true },
      { id: 'f3', name: 'docs/ssm-theory.md', type: 'markdown', selected: true },
      { id: 'f4', name: 'docs/hybrid-architecture.md', type: 'markdown', selected: false },
      { id: 'f5', name: 'src/gguf_loader.mojo', type: 'mojo', selected: false },
      { id: 'f6', name: 'benchmarks/latency.csv', type: 'csv', selected: true },
    ],
  },
  {
    id: '2', name: 'Mojo Patterns', sources: 8, chunks: 1280, lastUpdated: '1 day ago',
    fragments: [
      { id: 'f7', name: 'patterns/simd.mojo', type: 'mojo', selected: true },
      { id: 'f8', name: 'patterns/gpu.mojo', type: 'mojo', selected: true },
      { id: 'f9', name: 'docs/best-practices.md', type: 'markdown', selected: false },
      { id: 'f10', name: 'examples/ffi.mojo', type: 'mojo', selected: false },
    ],
  },
  {
    id: '3', name: 'PPC Business Docs', sources: 22, chunks: 4100, lastUpdated: '4 hrs ago',
    fragments: [
      { id: 'f11', name: 'contracts/Q4-review.pdf', type: 'pdf', selected: true },
      { id: 'f12', name: 'reports/analytics-2026.xlsx', type: 'xlsx', selected: true },
      { id: 'f13', name: 'emails/client-feedback.txt', type: 'text', selected: true },
      { id: 'f14', name: 'slides/pitch-deck.pptx', type: 'pptx', selected: false },
    ],
  },
]

const TYPE_ICONS: Record<string, string> = {
  mojo: '⟐', markdown: '📝', csv: '📊', pdf: '📄', xlsx: '📈', text: '📃', pptx: '📽️',
}

export function RagLabPage() {
  const [notebooks, setNotebooks] = useState(INITIAL_NOTEBOOKS)
  const [selectedNb, setSelectedNb] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingTx, setProcessingTx] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const graphRef = useRef<{ nodes: GraphNode[]; edges: Edge[]; animId: number } | null>(null)

  const activeNotebook = notebooks.find(n => n.id === selectedNb)

  function toggleFragment(nbId: string, fragId: string) {
    setNotebooks(prev => prev.map(nb => nb.id !== nbId ? nb : {
      ...nb,
      fragments: nb.fragments.map(f => f.id === fragId ? { ...f, selected: !f.selected } : f),
    }))
  }

  function selectAllFragments(nbId: string, selected: boolean) {
    setNotebooks(prev => prev.map(nb => nb.id !== nbId ? nb : {
      ...nb,
      fragments: nb.fragments.map(f => ({ ...f, selected })),
    }))
  }

  const handleCreateNotebook = () => {
    const name = prompt('Enter a name for your new RAG Notebook:')
    if (!name) return
    setNotebooks(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      name, sources: 0, chunks: 0, lastUpdated: 'Just now',
      fragments: [],
    }])
  }

  // Force-directed graph animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const q = query.trim().toLowerCase()
    const nodes = GRAPH_NODES.map(n => ({ ...n, highlighted: q.length > 0 && (n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)) }))
    const edges = GRAPH_EDGES.map(e => {
      const fromMatch = nodes.find(n => n.id === e.from)?.highlighted
      const toMatch = nodes.find(n => n.id === e.to)?.highlighted
      return { ...e, highlighted: !!(fromMatch && toMatch) }
    })
    let animId: number

    const cvs = canvas!
    const c = ctx!
    function simulate() {
      const centerX = cvs.width / 2
      const centerY = cvs.height / 2

      // Repulsion between all nodes (simple n-body)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x
          const dy = nodes[j].y - nodes[i].y
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
          const force = 300 / (dist * dist)
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          nodes[i].vx -= fx; nodes[i].vy -= fy
          nodes[j].vx += fx; nodes[j].vy += fy
        }
      }

      // Spring attraction along edges
      for (const edge of edges) {
        const a = nodes.find(n => n.id === edge.from)
        const b = nodes.find(n => n.id === edge.to)
        if (!a || !b) continue
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const force = (dist - 80) * 0.005
        const fx = (dx / Math.max(dist, 1)) * force
        const fy = (dy / Math.max(dist, 1)) * force
        a.vx += fx; a.vy += fy
        b.vx -= fx; b.vy -= fy
      }

      // Center gravity
      for (const n of nodes) {
        n.vx += (centerX - n.x) * 0.001
        n.vy += (centerY - n.y) * 0.001
        n.vx *= 0.85; n.vy *= 0.85
        n.x += n.vx; n.y += n.vy
        n.x = Math.max(20, Math.min(cvs.width - 20, n.x))
        n.y = Math.max(20, Math.min(cvs.height - 20, n.y))
      }

      // Store positions for hover lookup
      graphRef.current = { nodes, edges, animId: 0 }

      // Render
      c.clearRect(0, 0, cvs.width, cvs.height)

      // Edges
      for (const edge of edges) {
        const a = nodes.find(n => n.id === edge.from)
        const b = nodes.find(n => n.id === edge.to)
        if (!a || !b) continue
        c.beginPath()
        c.moveTo(a.x, a.y)
        c.lineTo(b.x, b.y)
        c.strokeStyle = edge.highlighted ? 'rgba(255, 183, 77, 0.6)' : 'rgba(255,255,255,0.08)'
        c.lineWidth = edge.highlighted ? 2 : 1
        c.stroke()
      }

      // Nodes
      for (const n of nodes) {
        c.beginPath()
        c.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
        const isAccent = n.color === 'var(--accent)'
        const baseColor = isAccent ? 'rgba(52, 211, 153, ' : 'rgba(96, 165, 250, '
        c.fillStyle = n.highlighted ? 'rgba(255, 183, 77, 0.9)' : baseColor + '0.8)'
        c.fill()
        if (n.highlighted) {
          c.strokeStyle = 'rgba(255, 183, 77, 0.8)'
          c.lineWidth = 2
          c.stroke()
        }

        c.fillStyle = n.highlighted ? '#fff' : 'rgba(255,255,255,0.7)'
        c.font = '9px monospace'
        c.textAlign = 'center'
        c.fillText(n.label.length > 18 ? n.label.slice(0, 17) + '...' : n.label, n.x, n.y + n.radius + 11)
      }

      animId = requestAnimationFrame(simulate)
    }

    simulate()
    return () => cancelAnimationFrame(animId)
  }, [query])

  // Canvas hover handler
  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const current = graphRef.current
    if (!current) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    const found = current.nodes.find(n => {
      const dx = mx - n.x; const dy = my - n.y
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4
    })
    setHoveredNode(found ?? null)
    canvas.style.cursor = found ? 'pointer' : 'default'
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
            setNotebooks(prevNbs => {
              const copy = [...prevNbs]
              if (copy.length > 0) {
                copy[0] = {
                  ...copy[0],
                  sources: copy[0].sources + 1,
                  chunks: copy[0].chunks + Math.floor(Math.random() * 150) + 50,
                  lastUpdated: 'Just now',
                  fragments: [...copy[0].fragments, { id: `f${Date.now()}`, name: `ingested-${Date.now()}.md`, type: 'markdown', selected: true }],
                }
              }
              return copy
            })
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

      {/* Notebook Grid + Fragment sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Notebook cards (3 cols out of 5 when sidebar open, full otherwise) */}
        <div className={`${selectedNb ? 'lg:col-span-3' : 'lg:col-span-5'} grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children`}>
          {notebooks.map((nb) => {
            const selectedCount = nb.fragments.filter(f => f.selected).length
            return (
              <div
                key={nb.id}
                className="glass-card p-5 animate-fade-up cursor-pointer transition-all"
                style={{
                  borderColor: selectedNb === nb.id ? 'var(--accent)' : 'var(--glass-border)',
                }}
                onClick={() => setSelectedNb(selectedNb === nb.id ? null : nb.id)}
              >
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
                  {nb.fragments.length > 0 && (
                    <div className="flex justify-between">
                      <span>Active fragments</span>
                      <span className="font-mono" style={{ color: 'var(--accent)' }}>{selectedCount}/{nb.fragments.length}</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] mt-3 font-mono" style={{ color: 'var(--text-ghost)' }}>Updated {nb.lastUpdated}</p>
              </div>
            )
          })}

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

        {/* Fragment Selection Sidebar (#23) */}
        {activeNotebook && (
          <div className="lg:col-span-2 glass-card p-5 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {activeNotebook.name}
              </h3>
              <button
                className="p-1 rounded cursor-pointer hover:bg-white/5 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setSelectedNb(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Select source fragments to include in queries.
            </p>

            <div className="flex gap-2 mb-4">
              <button
                className="text-[10px] px-2.5 py-1 rounded font-medium cursor-pointer transition-all hover:opacity-80"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid hsla(160, 84%, 39%, 0.15)' }}
                onClick={() => selectAllFragments(activeNotebook.id, true)}
              >
                Select All
              </button>
              <button
                className="text-[10px] px-2.5 py-1 rounded font-medium cursor-pointer transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}
                onClick={() => selectAllFragments(activeNotebook.id, false)}
              >
                Clear All
              </button>
            </div>

            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {activeNotebook.fragments.map(f => (
                <label
                  key={f.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/[0.02]"
                  style={{
                    background: f.selected ? 'hsla(160, 84%, 39%, 0.04)' : 'transparent',
                    border: `1px solid ${f.selected ? 'hsla(160, 84%, 39%, 0.1)' : 'transparent'}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={f.selected}
                    onChange={() => toggleFragment(activeNotebook.id, f.id)}
                    className="rounded cursor-pointer accent-[var(--accent)]"
                  />
                  <span className="text-xs" style={{ color: 'var(--text-ghost)', width: 20, textAlign: 'center' }}>
                    {TYPE_ICONS[f.type] || '📄'}
                  </span>
                  <span className="flex-1 text-xs font-mono truncate" style={{
                    color: f.selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}>
                    {f.name}
                  </span>
                  <span className="text-[10px] uppercase font-medium" style={{ color: 'var(--text-ghost)' }}>{f.type}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 pt-4 text-xs" style={{ borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
              {activeNotebook.fragments.filter(f => f.selected).length} of {activeNotebook.fragments.length} fragments active for query
            </div>
          </div>
        )}
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

      {/* Studio Tab: Transformation Grid (#24) */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Studio</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Transform your active source fragments into structured formats with one click.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
          {TRANSFORMATIONS.map(tx => {
            const isProcessing = processingTx === tx.id
            return (
              <button
                key={tx.id}
                className="glass-card p-4 text-center cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed animate-fade-up"
                disabled={isProcessing}
                onClick={() => {
                  setProcessingTx(tx.id)
                  setTimeout(() => {
                    setProcessingTx(null)
                    setLastResult(`${tx.label} generated from ${activeNotebook ? activeNotebook.fragments.filter(f => f.selected).length : 0} active fragments.`)
                  }, tx.duration)
                }}
              >
                <div className="text-2xl mb-2">{tx.icon}</div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tx.label}</p>
                <p className="text-[10px] mt-1 leading-tight" style={{ color: 'var(--text-ghost)' }}>{tx.desc}</p>
                {isProcessing && (
                  <div className="mt-3 w-full bg-gray-800 rounded-full h-1 overflow-hidden">
                    <div className="bg-[var(--accent)] h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
        {lastResult && (
          <div className="mt-4 p-3 rounded-lg text-xs" style={{
            background: 'hsla(160, 84%, 39%, 0.06)',
            border: '1px solid hsla(160, 84%, 39%, 0.12)',
            color: 'var(--accent)',
          }}>
            {lastResult}
          </div>
        )}
      </div>

      {/* Ask Playroom & Force-Directed Graph (#25) */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Ask Playroom</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Semantic query sandbox with conceptual graph view</p>
          </div>
        </div>

        {/* Query input */}
        <div className="flex gap-2 mb-5">
          <input
            className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
            style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
            placeholder="Ask a semantic question about your sources..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && query.trim()) {
                setQueryResult(`Simulated semantic search for "${query.trim()}": Found 3 relevant passages across 2 source fragments.`)
              }
            }}
          />
          <button
            className="text-sm px-4 py-2 rounded-lg font-medium cursor-pointer transition-all hover:opacity-90"
            style={{ background: 'var(--accent)', color: 'white' }}
            onClick={() => {
              if (query.trim()) {
                setQueryResult(`Simulated semantic search for "${query.trim()}": Found 3 relevant passages across 2 source fragments.`)
              }
            }}
          >
            Ask
          </button>
        </div>

        {/* Force-directed graph + results */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Canvas graph (3 cols) */}
          <div className="lg:col-span-3 rounded-lg overflow-hidden" style={{ background: 'var(--bg-deep)', border: '1px solid var(--glass-border)', minHeight: 320 }}>
            <canvas
              ref={canvasRef}
              width={600}
              height={320}
              className="w-full h-full"
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => setHoveredNode(null)}
            />
          </div>

          {/* Result panel (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            {/* Graph legend */}
            <div className="text-xs space-y-1.5" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} /> Source document</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--blue)' }} /> Knowledge chunk</div>
              <div className="flex items-center gap-2"><span className="w-6 h-0.5 rounded" style={{ background: 'rgba(255,255,255,0.1)' }} /> Semantic link</div>
              <div className="flex items-center gap-2"><span className="w-6 h-0.5 rounded" style={{ background: 'var(--amber)' }} /> Query match</div>
            </div>

            {/* Query result */}
            {queryResult && (
              <div className="p-3 rounded-lg text-xs leading-relaxed" style={{
                background: 'hsla(160, 84%, 39%, 0.06)',
                border: '1px solid hsla(160, 84%, 39%, 0.12)',
                color: 'var(--text-secondary)',
              }}>
                {queryResult}
              </div>
            )}

            {/* Node info on hover */}
            {hoveredNode && (
              <div className="p-3 rounded-lg text-xs space-y-1" style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
              }}>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{hoveredNode.label}</p>
                <p style={{ color: 'var(--text-muted)' }}>{hoveredNode.type === 'source' ? 'Source document' : 'Knowledge chunk'} &middot; {hoveredNode.chunks} chunks</p>
                <p style={{ color: 'var(--text-muted)' }}>Connected to {hoveredNode.connections} other nodes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const TRANSFORMATIONS = [
  { id: 'mindmap', icon: '🌐', label: 'Mind Map', desc: 'Conceptual graph of topics and relations', duration: 1200 },
  { id: 'outline', icon: '📋', label: 'Outline', desc: 'Hierarchical structured outline', duration: 800 },
  { id: 'flashcards', icon: '🃏', label: 'Flashcards', desc: 'Q&A cards for active recall', duration: 1000 },
  { id: 'compare', icon: '📊', label: 'Comparison', desc: 'Side-by-side comparison table', duration: 900 },
  { id: 'summary', icon: '📝', label: 'Summary', desc: 'Concise extractive summary', duration: 700 },
  { id: 'quiz', icon: '🎯', label: 'Quiz', desc: 'Auto-generated practice questions', duration: 1100 },
]

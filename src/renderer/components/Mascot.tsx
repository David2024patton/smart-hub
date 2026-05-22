import { useState, useEffect, useCallback } from 'react'

interface CompanionConfig {
  enabled: boolean
  petStyle: string
  speechEnabled: boolean
}

const PAGE_EMOJIS: Record<string, string> = {
  dashboard: '🤖',
  projects: '👨‍💻',
  kanban: '📋',
  'mcp-grid': '🕸️',
  marketplace: '🛒',
  'rag-lab': '🧠',
  connections: '🔗',
  security: '🛡️',
  terminal: '💻',
  lint: '🧹',
  settings: '⚙️',
}

const QUIPS: Record<string, string[]> = {
  dashboard: ['Ready to orchestrate, boss.', 'All systems nominal.'],
  projects: ['Projects loaded. Let\'s build.'],
  'mcp-grid': ['Servers are talking back.', 'Mesh is healthy.', 'All MCP servers accounted for.'],
  marketplace: ['Shopping for tools, eh?', 'Lots of goodies to install.', 'Found something useful?'],
  'rag-lab': ['Brain food incoming.', 'Knowledge is power.'],
  security: ['Shields up.', 'No threats detected.'],
  terminal: ['Shell access granted.', 'Type away.'],
  settings: ['Tweaking the machine.'],
  kanban: ['Tasks, tasks, tasks.', 'Stay organized.'],
  connections: ['Linking worlds together.'],
  lint: ['Cleaning up your code.', 'Let me check that syntax.'],
}

export function Mascot({ activePage, companion, collapsed }: { activePage: string; companion: CompanionConfig; collapsed?: boolean }) {
  const [minimized, setMinimized] = useState(false)
  const [speech, setSpeech] = useState<string | null>(null)

  const emoji = companion.petStyle

  const say = useCallback((msg: string) => {
    if (!companion.speechEnabled) return
    setSpeech(msg)
    setTimeout(() => setSpeech(null), 10000)
  }, [companion.speechEnabled])

  useEffect(() => {
    const quips = QUIPS[activePage]
    if (quips) say(quips[Math.floor(Math.random() * quips.length)])
  }, [activePage, say])

  if (!companion.enabled) return null

  const leftClass = collapsed ? 'left-1.5' : 'left-3'

  if (minimized) {
    return (
      <button
        className={`fixed bottom-16 ${leftClass} z-40 w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform`}
        style={{
          background: 'linear-gradient(135deg, var(--accent), hsl(160, 84%, 45%))',
          boxShadow: '0 2px 12px var(--accent-glow)',
        }}
        onClick={() => setMinimized(false)}
          aria-label="Show mascot"
          data-tooltip="Show mascot"
      >
        <span className="text-base" role="img" aria-hidden="true">{emoji}</span>
      </button>
    )
  }

  return (
    <div
      className={`fixed bottom-16 ${leftClass} z-40 flex flex-col items-start gap-2 select-none`}
      style={{ pointerEvents: 'auto' }}
    >
      {speech && (
        <div
          className="relative px-4 py-2.5 rounded-xl text-xs max-w-[200px] animate-fade-in shadow-lg"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)',
            transformOrigin: 'bottom left',
          }}
        >
          <p>{speech}</p>
          <div
            className="absolute -bottom-[6px] left-6 w-3 h-3 rotate-45"
            style={{
              background: 'var(--bg-elevated)',
              borderRight: '1px solid var(--glass-border)',
              borderBottom: '1px solid var(--glass-border)',
            }}
          />
        </div>
      )}

      <div className="relative inline-flex">
        <button
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, var(--accent), hsl(160, 84%, 45%))',
            boxShadow: '0 4px 20px var(--accent-glow)',
          }}
          onClick={() => say('Hey there!')}
           aria-label="Assistant mascot"
        >
          <span className="text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] brightness-125" role="img" aria-hidden="true">{emoji}</span>
        </button>
        <button
          className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[6px] cursor-pointer hover:opacity-80 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.55)', color: 'var(--text-ghost)' }}
          onClick={() => setMinimized(true)}
          aria-label="Minimize mascot"
          data-tooltip="Minimize buddy"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

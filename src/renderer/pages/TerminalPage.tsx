import { useEffect, useRef, useState, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface TermTab {
  id: string
  shell: string
  terminal: Terminal
  fitAddon: FitAddon
  ws: WebSocket | null
}

let tabCounter = 0

function createTerminal(shell: string): { terminal: Terminal; fitAddon: FitAddon } {
  const terminal = new Terminal({
    cursorBlink: true,
    cursorStyle: 'bar',
    fontSize: 13,
    fontFamily: 'Cascadia Code, Fira Code, Consolas, monospace',
    theme: {
      background: '#0c0c0c', foreground: '#d4d4d4', cursor: '#d4d4d4',
      selectionBackground: '#264f78',
      black: '#0c0c0c', red: '#f44747', green: '#4ec9b0', yellow: '#dcdcaa',
      blue: '#569cd6', magenta: '#c586c0', cyan: '#9cdcfe', white: '#d4d4d4',
      brightBlack: '#666', brightRed: '#f44747', brightGreen: '#4ec9b0',
      brightYellow: '#dcdcaa', brightBlue: '#569cd6', brightMagenta: '#c586c0',
      brightCyan: '#9cdcfe', brightWhite: '#d4d4d4',
    },
    allowProposedApi: true,
    cols: 80, rows: 24,
  })
  const fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  return { terminal, fitAddon }
}

function connectTerminal(tab: TermTab, onDisconnect: (id: string) => void): TermTab {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const ws = new WebSocket(`${protocol}//${location.host}/ws/terminal?shell=${encodeURIComponent(tab.shell)}`)
  ws.onopen = () => { tab.terminal.clear(); tab.terminal.focus() }
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'output' && msg.data) tab.terminal.write(atob(msg.data))
      if (msg.type === 'exit') tab.terminal.write(`\r\n\x1b[31m[exit ${msg.code}]\x1b[0m\r\n`)
    } catch {}
  }
  ws.onclose = () => {
    tab.terminal.write('\r\n\x1b[33m[Connection closed]\x1b[0m\r\n')
    onDisconnect(tab.id)
  }
  tab.terminal.onData((data: string) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'stdin', data: btoa(data) }))
  })
  tab.ws = ws
  return tab
}

const SHELL_OPTIONS = ['cmd.exe', 'powershell.exe', 'bash', 'sh', 'pwsh.exe']

export function TerminalPage() {
  const [tabs, setTabs] = useState<TermTab[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [selectedShell, setSelectedShell] = useState('cmd.exe')
  const termRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const addTab = useCallback((shell: string) => {
    const { terminal, fitAddon } = createTerminal(shell)
    const tab: TermTab = { id: `tab-${++tabCounter}`, shell, terminal, fitAddon, ws: null }
    const connected = connectTerminal(tab, (id) => {
      setTabs(prev => prev.filter(t => t.id !== id))
    })
    setTabs(prev => [...prev, connected])
    setActiveTab(connected.id)
  }, [])

  const closeTab = useCallback((id: string) => {
    const tab = tabs.find(t => t.id === id)
    if (tab) { tab.ws?.close(); tab.terminal.dispose() }
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== id)
      if (activeTab === id) setActiveTab(filtered.length > 0 ? filtered[filtered.length - 1].id : null)
      return filtered
    })
  }, [tabs, activeTab])

  // Mount xterm when containers appear
  useEffect(() => {
    tabs.forEach(tab => {
      const container = termRefs.current.get(tab.id)
      if (container && !container.hasChildNodes()) {
        tab.terminal.open(container)
        setTimeout(() => tab.fitAddon.fit(), 50)
      }
    })
  }, [tabs])

  // Auto-fit on resize
  useEffect(() => {
    const handleResize = () => {
      tabs.forEach(t => { if (t.id === activeTab && termRefs.current.get(t.id)) t.fitAddon.fit() })
    }
    window.addEventListener('resize', handleResize)

    // Fit after active tab changes
    const timer = setTimeout(handleResize, 150)
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timer) }
  }, [tabs, activeTab])

  // Initial tab
  useEffect(() => {
    if (tabs.length === 0) addTab(selectedShell)
  }, [])

  return (
    <div className="flex flex-col h-full" style={{ background: '#0c0c0c' }}>
      {/* Tab bar */}
      <div className="flex items-center shrink-0" style={{ background: '#1e1e1e', borderBottom: '1px solid #333', minHeight: 36 }}>
        <div className="flex items-center flex-1 overflow-x-auto">
          {tabs.map(tab => (
            <div key={tab.id}
              className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer select-none"
              style={{
                background: tab.id === activeTab ? '#0c0c0c' : 'transparent',
                color: tab.id === activeTab ? '#d4d4d4' : '#888',
                borderRight: '1px solid #333',
                minWidth: 100,
              }}
              onClick={() => setActiveTab(tab.id)}
              onMouseDown={(e) => { if (e.button === 1) closeTab(tab.id) }}>
              <span className="truncate">{tab.shell}</span>
              <span onClick={() => closeTab(tab.id)}
                className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 cursor-pointer text-[10px]"
                style={{ color: '#666' }}>✕</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 px-2 shrink-0">
          <select
            className="text-[11px] px-2 py-1 rounded outline-none cursor-pointer"
            style={{ background: '#2d2d2d', color: '#d4d4d4', border: '1px solid #444' }}
            value={selectedShell}
            onChange={e => setSelectedShell(e.target.value)}>
            {SHELL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => addTab(selectedShell)}
            className="px-2 py-1 text-xs rounded cursor-pointer hover:bg-white/10"
            style={{ color: '#d4d4d4', border: '1px solid #444' }}
            data-tooltip="New terminal">+</button>
        </div>
      </div>

      {/* Terminal containers */}
      <div className="flex-1 relative">
        {tabs.map(tab => (
          <div key={tab.id}
            ref={el => { if (el) termRefs.current.set(tab.id, el); else termRefs.current.delete(tab.id) }}
            className="absolute inset-0"
            style={{ display: tab.id === activeTab ? 'block' : 'none' }}
          />
        ))}
        {tabs.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: '#666' }}>
            <div className="text-center">
              <p className="mb-2">No terminals open</p>
              <button onClick={() => addTab(selectedShell)}
                className="px-3 py-1.5 rounded cursor-pointer"
                style={{ background: '#2d2d2d', color: '#d4d4d4', border: '1px solid #444' }}>
                Open Terminal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

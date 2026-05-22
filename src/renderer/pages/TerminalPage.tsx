import { useEffect, useRef, useState, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { SearchAddon } from '@xterm/addon-search'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { THEMES, loadConfig, saveConfig, type TermConfig, type TermProfile } from '../lib/terminal-config'

interface TermPane {
  id: string
  sessionId: string
  shell: string
  profileName: string
  terminal: Terminal
  fitAddon: FitAddon
  searchAddon: SearchAddon
  ws: WebSocket | null
  mounted: boolean
  type: 'local' | 'ssh'
  sshHost?: string
}

let paneCounter = 0

function createPane(shell: string, profile: TermProfile, sessionId = ''): TermPane {
  const theme = THEMES[profile.themeName] || THEMES['vs-code-dark']
  const terminal = new Terminal({
    cursorBlink: true,
    cursorStyle: 'bar',
    fontSize: profile.fontSize,
    fontFamily: profile.fontFamily,
    theme,
    allowProposedApi: true,
    cols: 80, rows: 24,
    allowTransparency: true,
  })
  const fitAddon = new FitAddon()
  const searchAddon = new SearchAddon()
  terminal.loadAddon(fitAddon)
  terminal.loadAddon(searchAddon)
  terminal.loadAddon(new WebLinksAddon())
  return {
    pane: {
      id: `pane-${++paneCounter}`,
      sessionId: sessionId || `term-${paneCounter}`,
      shell,
      profileName: profile.name,
      terminal,
      fitAddon,
      searchAddon,
      ws: null,
      mounted: false,
      type: 'local',
    },
  }
}

function connectTerminal(pane: TermPane): TermPane {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const ws = new WebSocket(`${protocol}//${location.host}/ws/terminal?shell=${encodeURIComponent(pane.shell)}&cols=${pane.terminal.cols}&rows=${pane.terminal.rows}&resume=${encodeURIComponent(pane.sessionId)}`)
  ws.onopen = () => { pane.terminal.clear(); pane.terminal.focus() }
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'output' && msg.data) pane.terminal.write(atob(msg.data))
      if (msg.type === 'exit') pane.terminal.write(`\r\n\x1b[31m[exit ${msg.code}]\x1b[0m\r\n`)
    } catch {}
  }
  ws.onclose = () => {
    pane.terminal.write('\r\n\x1b[33m[Connection closed]\x1b[0m\r\n')
  }
  pane.terminal.onData((data: string) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'stdin', data: btoa(data) }))
  })
  pane.terminal.onResize(({ cols, rows }) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'resize', cols, rows }))
  })
  pane.ws = ws
  return pane
}

const ALL_SHELLS = ['cmd.exe', 'powershell.exe', 'pwsh.exe', 'bash', 'sh', 'zsh']

export function TerminalPage() {
  const [config, setConfig] = useState<TermConfig>(loadConfig)
  const [panes, setPanes] = useState<TermPane[]>([])
  const [activePaneId, setActivePaneId] = useState<string | null>(null)
  const [gridCols, setGridCols] = useState(config.gridCols)
  const [gridRows, setGridRows] = useState(config.gridRows)
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showProfiles, setShowProfiles] = useState(false)
  const [showProfileEditor, setShowProfileEditor] = useState(false)
  const [editingProfile, setEditingProfile] = useState<TermProfile | null>(null)
  const [showSSH, setShowSSH] = useState(false)
  const [sshHost, setSshHost] = useState('')
  const [sshPort, setSshPort] = useState('22')
  const [sshUser, setSshUser] = useState('')
  const [sshPass, setSshPass] = useState('')
  const [showSerial, setShowSerial] = useState(false)
  const [serialPort, setSerialPort] = useState('COM1')
  const [serialBaud, setSerialBaud] = useState('115200')
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const activeProfile = config.profiles.find(p => p.name === config.activeProfile) || config.profiles[0]

  const persist = useCallback((patch: Partial<TermConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch }
      saveConfig(next)
      return next
    })
  }, [])

  const getActiveTheme = () => THEMES[activeProfile.themeName] || THEMES['vs-code-dark']

  const addPane = useCallback((shell: string) => {
    const profile = config.profiles.find(p => p.shell === shell) || { ...activeProfile, shell }
    const { pane } = createPane(shell, profile)
    const connected = connectTerminal(pane)
    setPanes(prev => [...prev, connected])
    setActivePaneId(connected.id)
  }, [config.profiles, activeProfile])

  const addPaneWithProfile = useCallback((profileName: string) => {
    const profile = config.profiles.find(p => p.name === profileName)
    if (!profile) return
    const { pane } = createPane(profile.shell, profile)
    const connected = connectTerminal(pane)
    setPanes(prev => [...prev, connected])
    setActivePaneId(connected.id)
  }, [config.profiles])

  const splitRight = useCallback(() => {
    setGridCols(c => Math.min(c + 1, 4))
    addPane(activeProfile.shell)
  }, [addPane, activeProfile])

  const splitDown = useCallback(() => {
    setGridRows(r => Math.min(r + 1, 4))
    addPane(activeProfile.shell)
  }, [addPane, activeProfile])

  const closePane = useCallback((id: string) => {
    setPanes(prev => {
      const pane = prev.find(p => p.id === id)
      if (pane) { pane.ws?.close(); pane.terminal.dispose() }
      const remaining = prev.filter(p => p.id !== id)
      if (remaining.length === 0) {
        const { pane: newPane } = createPane(activeProfile.shell, activeProfile)
        const connected = connectTerminal(newPane)
        setActivePaneId(connected.id)
        return [connected]
      }
      if (activePaneId === id) setActivePaneId(remaining[remaining.length - 1].id)
      return remaining
    })
  }, [activePaneId, activeProfile])

  const connectSSH = useCallback(() => {
    if (!sshHost || !sshUser || !sshPass) return
    const { pane } = createPane(`SSH: ${sshHost}`, activeProfile, `ssh-${sshHost}-${Date.now()}`)
    pane.type = 'ssh'
    pane.sshHost = sshHost
    const connected = connectTerminal(pane)
    // Send SSH connect command after WebSocket opens
    const origOpen = connected.ws!.onopen
    connected.ws!.onopen = (e) => {
      origOpen?.call(connected.ws, e)
      connected.ws!.send(JSON.stringify({
        type: 'ssh-connect', host: sshHost, port: parseInt(sshPort) || 22,
        username: sshUser, password: sshPass,
      }))
    }
    setPanes(prev => [...prev, connected])
    setActivePaneId(connected.id)
    setShowSSH(false)
    setSshHost(''); setSshPort('22'); setSshUser(''); setSshPass('')
  }, [sshHost, sshPort, sshUser, sshPass, activeProfile])

  const connectSerial = useCallback(() => {
    const { pane } = createPane(`Serial: ${serialPort}`, activeProfile, `serial-${serialPort}-${Date.now()}`)
    const connected = connectTerminal(pane)
    setPanes(prev => [...prev, connected])
    setActivePaneId(connected.id)
    setShowSerial(false)
  }, [serialPort, serialBaud, activeProfile])

  // Mount terminals to their DOM containers
  useEffect(() => {
    panes.forEach(pane => {
      const el = containerRefs.current.get(pane.id)
      if (el && !pane.mounted) {
        pane.terminal.open(el)
        setTimeout(() => pane.fitAddon.fit(), 50)
        pane.mounted = true
      }
    })
  }, [panes, gridCols, gridRows])

  // Fit terminals on resize
  useEffect(() => {
    const handleResize = () => {
      panes.forEach(p => { p.mounted && p.fitAddon.fit() })
    }
    window.addEventListener('resize', handleResize)
    const timer = setTimeout(handleResize, 200)
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timer) }
  }, [panes])

  // Initial pane
  useEffect(() => {
    if (panes.length === 0) addPane(activeProfile.shell)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault()
        setSearchVisible(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const activePane = panes.find(p => p.id === activePaneId) || panes[0]

  const doSearch = useCallback((dir: 'next' | 'prev') => {
    if (!searchQuery || !activePane) return
    if (dir === 'next') activePane.searchAddon.findNext(searchQuery)
    else activePane.searchAddon.findPrevious(searchQuery)
  }, [searchQuery, activePane])

  // Drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    files.forEach(f => {
      const path = (f as any).path || f.name
      if (activePane?.ws?.readyState === WebSocket.OPEN) {
        activePane.ws.send(JSON.stringify({ type: 'stdin', data: btoa(path + ' ') }))
      }
    })
  }, [activePane])

  const changeFontSize = useCallback((delta: number) => {
    const profile = activeProfile
    const newSize = Math.max(8, Math.min(32, profile.fontSize + delta))
    const updated: TermProfile = { ...profile, fontSize: newSize }
    persist({ profiles: config.profiles.map(p => p.name === profile.name ? updated : p) })
    panes.forEach(p => p.terminal.options.fontSize = newSize)
    setTimeout(() => panes.forEach(p => p.fitAddon.fit()), 100)
  }, [activeProfile, config.profiles, persist, panes])

  const changeTheme = useCallback((themeName: string) => {
    const profile = activeProfile
    const theme = THEMES[themeName]
    if (!theme) return
    const updated: TermProfile = { ...profile, themeName }
    persist({ profiles: config.profiles.map(p => p.name === profile.name ? updated : p) })
    panes.forEach(p => p.terminal.options.theme = theme)
  }, [activeProfile, config.profiles, persist, panes])

  const setProfile = useCallback((name: string) => {
    persist({ activeProfile: name })
  }, [persist])

  const saveEditedProfile = useCallback((profile: TermProfile) => {
    const exists = config.profiles.findIndex(p => p.name === profile.name)
    const profiles = exists >= 0
      ? config.profiles.map((p, i) => i === exists ? profile : p)
      : [...config.profiles, profile]
    persist({ profiles })
    setShowProfileEditor(false)
  }, [config.profiles, persist])

  const deleteProfile = useCallback((name: string) => {
    if (config.profiles.length <= 1) return
    const profiles = config.profiles.filter(p => p.name !== name)
    persist({ profiles, activeProfile: config.activeProfile === name ? profiles[0].name : config.activeProfile })
  }, [config, persist])

  const theme = getActiveTheme()

  return (
    <div className="flex flex-col h-full" style={{ background: '#0c0c0c', userSelect: 'none' }}>
      {/* Toolbar */}
      <div className="flex items-center shrink-0 gap-1 px-2" style={{ background: '#1e1e1e', borderBottom: '1px solid #333', minHeight: 36 }}>
        <button onClick={() => addPane(activeProfile.shell)} className="toolbar-btn" data-tooltip="New terminal">+</button>
        <button onClick={splitRight} className="toolbar-btn" data-tooltip="Split right">↔</button>
        <button onClick={splitDown} className="toolbar-btn" data-tooltip="Split down">↕</button>
        <button onClick={() => setShowSSH(true)} className="toolbar-btn text-[10px]" data-tooltip="SSH connection">🔒</button>
        <button onClick={() => setShowSerial(true)} className="toolbar-btn text-[10px]" data-tooltip="Serial port">🔌</button>
        <div className="w-px h-4 mx-1" style={{ background: '#333' }} />

        {/* Profile selector */}
        <div className="relative">
          <button onClick={() => setShowProfiles(v => !v)} className="toolbar-btn text-[11px]" data-tooltip="Switch profile">
            {activeProfile.name} ▾
          </button>
          {showProfiles && (
            <div className="absolute top-full left-0 mt-1 z-50 rounded shadow-xl" style={{ background: '#2d2d2d', border: '1px solid #444', minWidth: 160 }}>
              {config.profiles.map(p => (
                <button key={p.name} onClick={() => { setProfile(p.name); setShowProfiles(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 cursor-pointer"
                  style={{ color: p.name === config.activeProfile ? '#4ec9b0' : '#d4d4d4' }}>
                  {p.name}
                </button>
              ))}
              <div className="border-t border-white/10 my-1" />
              <button onClick={() => { setEditingProfile({ name: '', shell: 'cmd.exe', themeName: activeProfile.themeName, fontFamily: activeProfile.fontFamily, fontSize: activeProfile.fontSize, opacity: 1 }); setShowProfileEditor(true); setShowProfiles(false) }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 cursor-pointer" style={{ color: '#888' }}>
                + New profile
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-4 mx-1" style={{ background: '#333' }} />

        {/* Theme selector */}
        <select onChange={e => changeTheme(e.target.value)} value={activeProfile.themeName}
          className="toolbar-select" data-tooltip="Color theme">
          {Object.entries(THEMES).map(([k, t]) => <option key={k} value={k}>{t.name}</option>)}
        </select>

        {/* Font size */}
        <button onClick={() => changeFontSize(-1)} className="toolbar-btn text-[11px]" data-tooltip="Smaller font">A-</button>
        <span className="text-[11px] w-[24px] text-center" style={{ color: '#888' }}>{activeProfile.fontSize}</span>
        <button onClick={() => changeFontSize(1)} className="toolbar-btn text-[11px]" data-tooltip="Larger font">A+</button>

        <div className="flex-1" />

        {/* Search toggle */}
        <button onClick={() => setSearchVisible(v => !v)} className="toolbar-btn text-[11px]" data-tooltip="Search (Ctrl+Shift+F)">🔍</button>
      </div>

      {/* Grid area */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{ background: '#1e1e1e' }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {panes.length === 1 ? (
          <div className="absolute inset-0">
            {panes.map(pane => (
              <div key={pane.id}
                ref={el => { if (el) containerRefs.current.set(pane.id, el); else containerRefs.current.delete(pane.id) }}
                className="absolute inset-0 cursor-text"
                onClick={() => { setActivePaneId(pane.id); pane.terminal.focus() }}
              />
            ))}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${gridRows}, 1fr)`,
            gap: 2,
            width: '100%',
            height: '100%',
          }}>
            {Array.from({ length: gridCols * gridRows }).map((_, idx) => {
              const pane = panes[idx]
              if (!pane) return <div key={`empty-${idx}`} style={{ background: '#0c0c0c' }} />
              return (
                <div key={pane.id} className="relative flex flex-col" style={{ background: '#0c0c0c', minWidth: 0, minHeight: 0 }}
                  onClick={() => setActivePaneId(pane.id)}>
                  {/* Pane header */}
                  <div className="flex items-center px-2 shrink-0" style={{ height: 24, background: pane.id === activePaneId ? '#333' : '#262626', borderBottom: '1px solid #333' }}>
                    <span className="text-[10px] flex-1 truncate" style={{ color: pane.type === 'ssh' ? '#4ec9b0' : '#999' }}>
                      {pane.type === 'ssh' ? `🔒 ${pane.shell}` : pane.shell}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); closePane(pane.id) }}
                      className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 cursor-pointer text-[9px]"
                      style={{ color: '#666' }}>✕</button>
                  </div>
                  <div className="flex-1 relative min-h-0"
                    ref={el => { if (el) containerRefs.current.set(pane.id, el); else containerRefs.current.delete(pane.id) }} />
                </div>
              )
            })}
          </div>
        )}

        {/* Search bar */}
        {searchVisible && activePane && (
          <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded shadow-lg"
            style={{ background: '#2d2d2d', border: '1px solid #444' }}>
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doSearch('next'); if (e.key === 'Escape') setSearchVisible(false) }}
              className="outline-none text-xs px-2 py-0.5 rounded" placeholder="Find..."
              style={{ background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #555', width: 140 }}
              data-tooltip="Search terminal output" />
            <button onClick={() => doSearch('prev')} className="toolbar-btn text-[10px]" data-tooltip="Previous">▲</button>
            <button onClick={() => doSearch('next')} className="toolbar-btn text-[10px]" data-tooltip="Next">▼</button>
            <button onClick={() => setSearchVisible(false)} className="toolbar-btn text-[10px]" data-tooltip="Close search">✕</button>
          </div>
        )}
      </div>

      {/* Profile editor modal */}
      {showProfileEditor && editingProfile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowProfileEditor(false)}>
          <div className="rounded-xl p-6 shadow-2xl w-[380px]" style={{ background: '#2d2d2d', border: '1px solid #444' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#d4d4d4' }}>
              {editingProfile.name ? 'Edit Profile' : 'New Profile'}
            </h3>
            <div className="space-y-3">
              <label className="block text-xs" style={{ color: '#888' }}>Name</label>
              <input value={editingProfile.name} onChange={e => setEditingProfile({ ...editingProfile, name: e.target.value })}
                className="w-full px-3 py-1.5 rounded text-xs outline-none" placeholder="Profile name"
                style={{ background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #444' }} />
              <label className="block text-xs" style={{ color: '#888' }}>Shell</label>
              <select value={editingProfile.shell} onChange={e => setEditingProfile({ ...editingProfile, shell: e.target.value })}
                className="w-full px-3 py-1.5 rounded text-xs outline-none"
                style={{ background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #444' }}>
                {ALL_SHELLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <label className="block text-xs" style={{ color: '#888' }}>Theme</label>
              <select value={editingProfile.themeName} onChange={e => setEditingProfile({ ...editingProfile, themeName: e.target.value })}
                className="w-full px-3 py-1.5 rounded text-xs outline-none"
                style={{ background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #444' }}>
                {Object.entries(THEMES).map(([k, t]) => <option key={k} value={k}>{t.name}</option>)}
              </select>
              <label className="block text-xs" style={{ color: '#888' }}>Font size</label>
              <input type="number" value={editingProfile.fontSize} min={8} max={32}
                onChange={e => setEditingProfile({ ...editingProfile, fontSize: parseInt(e.target.value) || 13 })}
                className="w-full px-3 py-1.5 rounded text-xs outline-none"
                style={{ background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #444' }} />
              <label className="block text-xs" style={{ color: '#888' }}>Font family</label>
              <input value={editingProfile.fontFamily} onChange={e => setEditingProfile({ ...editingProfile, fontFamily: e.target.value })}
                className="w-full px-3 py-1.5 rounded text-xs outline-none" placeholder="Cascadia Code, monospace"
                style={{ background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #444' }} />
            </div>
            <div className="flex justify-between mt-5">
              {editingProfile.name && (
                <button onClick={() => { deleteProfile(editingProfile.name); setShowProfileEditor(false) }}
                  className="text-xs px-3 py-1.5 rounded cursor-pointer" style={{ color: '#f44747', border: '1px solid #555' }}>
                  Delete
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button onClick={() => setShowProfileEditor(false)}
                  className="text-xs px-3 py-1.5 rounded cursor-pointer" style={{ color: '#888', border: '1px solid #555' }}>
                  Cancel
                </button>
                <button onClick={() => saveEditedProfile(editingProfile)}
                  className="text-xs px-4 py-1.5 rounded font-medium cursor-pointer"
                  style={{ background: '#4ec9b0', color: '#1e1e1e' }}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SSH modal */}
      {showSSH && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowSSH(false)}>
          <div className="rounded-xl p-6 shadow-2xl w-[380px]" style={{ background: '#2d2d2d', border: '1px solid #444' }}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => { if (e.key === 'Enter') connectSSH(); if (e.key === 'Escape') setShowSSH(false) }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#d4d4d4' }}>SSH Connection</h3>
            <div className="space-y-3">
              <label className="block text-xs" style={{ color: '#888' }}>Host</label>
              <input autoFocus value={sshHost} onChange={e => setSshHost(e.target.value)}
                className="w-full px-3 py-1.5 rounded text-xs outline-none" placeholder="192.168.1.100"
                style={{ background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #444' }} />
              <label className="block text-xs" style={{ color: '#888' }}>Port</label>
              <input value={sshPort} onChange={e => setSshPort(e.target.value)}
                className="w-full px-3 py-1.5 rounded text-xs outline-none" placeholder="22"
                style={{ background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #444' }} />
              <label className="block text-xs" style={{ color: '#888' }}>Username</label>
              <input value={sshUser} onChange={e => setSshUser(e.target.value)}
                className="w-full px-3 py-1.5 rounded text-xs outline-none" placeholder="root"
                style={{ background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #444' }} />
              <label className="block text-xs" style={{ color: '#888' }}>Password</label>
              <input type="password" value={sshPass} onChange={e => setSshPass(e.target.value)}
                className="w-full px-3 py-1.5 rounded text-xs outline-none" placeholder="••••••••"
                style={{ background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #444' }} />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowSSH(false)}
                className="text-xs px-3 py-1.5 rounded cursor-pointer" style={{ color: '#888', border: '1px solid #555' }}>
                Cancel
              </button>
              <button onClick={connectSSH}
                className="text-xs px-4 py-1.5 rounded font-medium cursor-pointer"
                style={{ background: '#4ec9b0', color: '#1e1e1e' }}>
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Serial modal */}
      {showSerial && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowSerial(false)}>
          <div className="rounded-xl p-6 shadow-2xl w-[380px]" style={{ background: '#2d2d2d', border: '1px solid #444' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#d4d4d4' }}>Serial Terminal</h3>
            <div className="space-y-3">
              <label className="block text-xs" style={{ color: '#888' }}>Port</label>
              <input autoFocus value={serialPort} onChange={e => setSerialPort(e.target.value)}
                className="w-full px-3 py-1.5 rounded text-xs outline-none" placeholder="COM1"
                style={{ background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #444' }} />
              <label className="block text-xs" style={{ color: '#888' }}>Baud rate</label>
              <input value={serialBaud} onChange={e => setSerialBaud(e.target.value)}
                className="w-full px-3 py-1.5 rounded text-xs outline-none" placeholder="115200"
                style={{ background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #444' }} />
              <p className="text-[10px]" style={{ color: '#666' }}>
                Common: 9600, 19200, 38400, 57600, 115200, 230400, 921600
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowSerial(false)}
                className="text-xs px-3 py-1.5 rounded cursor-pointer" style={{ color: '#888', border: '1px solid #555' }}>
                Cancel
              </button>
              <button onClick={connectSerial}
                className="text-xs px-4 py-1.5 rounded font-medium cursor-pointer"
                style={{ background: '#4ec9b0', color: '#1e1e1e' }}>
                Open
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar button styles */}
      <style>{`
        .toolbar-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 26px;
          padding: 0 6px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          color: #999;
          background: transparent;
          border: none;
          transition: background 0.15s;
        }
        .toolbar-btn:hover { background: rgba(255,255,255,0.1); color: #d4d4d4; }
        .toolbar-select {
          height: 26px;
          padding: 0 6px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          color: #999;
          background: transparent;
          border: none;
          outline: none;
          transition: background 0.15s;
        }
        .toolbar-select:hover { background: rgba(255,255,255,0.1); color: #d4d4d4; }
      `}</style>
    </div>
  )
}

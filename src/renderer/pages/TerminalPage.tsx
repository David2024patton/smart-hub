// src/renderer/pages/TerminalPage.tsx
// Smart Hub | Terminal Matrix
// Phase 3: Native PTY Terminal

import { useState } from 'react'

interface ShellConfig {
  name: string
  promptColor: string
  prompt: string
  welcomeText: string
}

const SHELLS: Record<string, ShellConfig> = {
  'PowerShell': {
    name: 'PowerShell',
    promptColor: 'var(--accent)',
    prompt: 'PS C:\\Users\\David>',
    welcomeText: 'Windows PowerShell\nCopyright (C) Microsoft Corporation. All rights reserved.\n\nReady. Waiting for Tauri IPC bridge (Phase 3)...'
  },
  'CMD': {
    name: 'CMD',
    promptColor: 'var(--text-secondary)',
    prompt: 'C:\\Users\\David>',
    welcomeText: 'Microsoft Windows [Version 10.0.22631]\n(c) Microsoft Corporation. All rights reserved.\n\nReady.'
  },
  'WSL (Ubuntu)': {
    name: 'WSL (Ubuntu)',
    promptColor: 'var(--blue)',
    prompt: 'david@skynet:~$',
    welcomeText: 'Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.133.1-microsoft-standard-WSL2)\n\n* Documentation:  https://help.ubuntu.com\n* Management:     https://landscape.canonical.com\n* Support:        https://ubuntu.com/pro\n\nReady.'
  },
  'Git Bash': {
    name: 'Git Bash',
    promptColor: 'var(--amber)',
    prompt: 'david@Beast MINGW64 ~',
    welcomeText: 'Welcome to Git Bash (git version 2.43.0.windows.1)\n\nReady.'
  }
}

export function TerminalPage() {
  const [activeShell, setActiveShell] = useState<string>('PowerShell')
  const shell = SHELLS[activeShell] || SHELLS['PowerShell']

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Terminal Matrix</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Native PTY terminals with multi-shell support</p>
      </div>

      {/* Terminal placeholder */}
      <div className="glass-card overflow-hidden" style={{ minHeight: '400px' }}>
        {/* Terminal title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--glass-border)' }}>
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: 'var(--rose)' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: 'var(--amber)' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: 'var(--accent)' }} />
          </div>
          <span className="flex-1 text-center text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{shell.name}</span>
          <button 
            className="action-chip text-xs" 
            style={{ padding: '0.25rem 0.5rem', fontSize: '11px' }}
            onClick={() => alert(`Spawning new ${activeShell} tab...`)}
          >
            + Tab
          </button>
        </div>

        {/* Terminal body */}
        <div className="p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', minHeight: '350px' }}>
          <div style={{ color: 'var(--text-muted)' }}>{shell.welcomeText}</div>
          <div className="mt-4 flex items-center gap-1.5">
            <span style={{ color: shell.promptColor }}>{shell.prompt}</span>
            <span className="w-2 h-4 animate-pulse" style={{ background: 'var(--text-secondary)', display: 'inline-block' }} />
          </div>
        </div>
      </div>

      {/* Shell selector */}
      <div className="flex gap-3">
        {Object.keys(SHELLS).map((shellName) => {
          const isActive = activeShell === shellName
          return (
            <button 
              key={shellName} 
              className="action-chip cursor-pointer" 
              style={isActive ? {
                background: 'var(--accent-subtle)', 
                color: 'var(--accent)', 
                borderColor: 'hsla(160, 84%, 39%, 0.2)'
              } : {}}
              onClick={() => setActiveShell(shellName)}
            >
              {shellName}
            </button>
          )
        })}
      </div>
    </div>
  )
}


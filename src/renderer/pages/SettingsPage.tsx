// src/renderer/pages/SettingsPage.tsx
// Smart Hub | Settings
// System preferences and configuration

import { useState } from 'react'

export function SettingsPage() {
  const [theme, setTheme] = useState('Dark')
  const [language, setLanguage] = useState('English')
  const [startupBehavior, setStartupBehavior] = useState('Open last project')
  
  const [defaultProvider, setDefaultProvider] = useState('Ollama (Local)')
  const [cloudFallback, setCloudFallback] = useState('Gemini Pro')
  const [apiKey, setApiKey] = useState('••••••••')

  const [dbEngine, setDbEngine] = useState('PostgreSQL (embedded)')
  const [dbPort, setDbPort] = useState('5432')
  const [dbDir, setDbDir] = useState('%APPDATA%/smart-hub/pgdata')

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      alert('Settings saved successfully!')
    }, 800)
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all preferences to defaults?')) {
      setTheme('Dark')
      setLanguage('English')
      setStartupBehavior('Open last project')
      setDefaultProvider('Ollama (Local)')
      setCloudFallback('Gemini Pro')
      setApiKey('••••••••')
      setDbEngine('PostgreSQL (embedded)')
      setDbPort('5432')
      setDbDir('%APPDATA%/smart-hub/pgdata')
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-secondary)',
    textAlign: 'right' as const,
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>System preferences, provider configuration, and database management</p>
      </div>

      {/* General Settings */}
      <div className="glass-card p-6 animate-fade-up">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>General</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Theme</span>
            <div className="w-56">
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md text-sm font-mono outline-none cursor-pointer text-right appearance-none"
                style={inputStyle}
              >
                <option value="Dark">Dark Mode</option>
                <option value="Light">Light Mode</option>
                <option value="Cyberpunk">Cyberpunk Glow</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Language</span>
            <div className="w-56">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md text-sm font-mono outline-none cursor-pointer text-right appearance-none"
                style={inputStyle}
              >
                <option value="English">English</option>
                <option value="Spanish">Español</option>
                <option value="French">Français</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Startup behavior</span>
            <div className="w-56">
              <select
                value={startupBehavior}
                onChange={(e) => setStartupBehavior(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md text-sm font-mono outline-none cursor-pointer text-right appearance-none"
                style={inputStyle}
              >
                <option value="Open last project">Open last project</option>
                <option value="Show Dashboard">Show Dashboard</option>
                <option value="Open Terminal">Open Terminal</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* LLM Provider Settings */}
      <div className="glass-card p-6 animate-fade-up">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>LLM Provider</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Default Provider</span>
            <div className="w-56">
              <select
                value={defaultProvider}
                onChange={(e) => setDefaultProvider(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md text-sm font-mono outline-none cursor-pointer text-right appearance-none"
                style={inputStyle}
              >
                <option value="Ollama (Local)">Ollama (Local)</option>
                <option value="OpenAI">OpenAI</option>
                <option value="Anthropic">Anthropic</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cloud Fallback</span>
            <div className="w-56">
              <select
                value={cloudFallback}
                onChange={(e) => setCloudFallback(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md text-sm font-mono outline-none cursor-pointer text-right appearance-none"
                style={inputStyle}
              >
                <option value="Gemini Pro">Gemini Pro</option>
                <option value="GPT-4o">GPT-4o</option>
                <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>API Key</span>
            <div className="w-56">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md text-sm font-mono outline-none"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Database Settings */}
      <div className="glass-card p-6 animate-fade-up">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Database</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Engine</span>
            <div className="w-56">
              <input
                type="text"
                value={dbEngine}
                onChange={(e) => setDbEngine(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md text-sm font-mono outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Port</span>
            <div className="w-56">
              <input
                type="text"
                value={dbPort}
                onChange={(e) => setDbPort(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md text-sm font-mono outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Data Directory</span>
            <div className="w-56">
              <input
                type="text"
                value={dbDir}
                onChange={(e) => setDbDir(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md text-sm font-mono outline-none"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          className="action-chip action-chip-primary cursor-pointer"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <button 
          className="action-chip cursor-pointer"
          onClick={handleReset}
        >
          Reset Defaults
        </button>
      </div>
    </div>
  )
}


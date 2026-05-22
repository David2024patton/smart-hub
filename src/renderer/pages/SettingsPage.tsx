// src/renderer/pages/SettingsPage.tsx
// Smart Hub | Settings
// System preferences and configuration

import { useState } from 'react'
import { useCompanion } from '../contexts/CompanionContext'
import { useUser } from '../contexts/UserContext'

export function SettingsPage() {
  const { config, updateConfig } = useCompanion()
  const { resetUser } = useUser()
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

  const PET_OPTIONS = [
    { emoji: '🤖', label: 'Robot' },
    { emoji: '🐱', label: 'Cat' },
    { emoji: '🐶', label: 'Dog' },
    { emoji: '👾', label: 'Alien' },
    { emoji: '👻', label: 'Ghost' },
    { emoji: '🦊', label: 'Fox' },
    { emoji: '🐸', label: 'Frog' },
    { emoji: '🐧', label: 'Penguin' },
    { emoji: '🦉', label: 'Owl' },
    { emoji: '🐉', label: 'Dragon' },
  ]

  // Security state (#29-30)
  const [failedLogins, setFailedLogins] = useState(3)
  const [rateLimitHits, setRateLimitHits] = useState(17)
  const [blockedIps, setBlockedIps] = useState(2)
  const [rateLimitThresh, setRateLimitThresh] = useState(60)
  const [idsSensitivity, setIdsSensitivity] = useState(45)
  const [sessionTimeout, setSessionTimeout] = useState(30)

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
      setFailedLogins(0); setRateLimitHits(0); setBlockedIps(0)
      setRateLimitThresh(60); setIdsSensitivity(45); setSessionTimeout(30)
      updateConfig({ enabled: true, petStyle: '🤖', speechEnabled: true })
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
                data-tooltip="Select theme"
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
                data-tooltip="Select language"
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
                data-tooltip="Startup behavior"
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
                data-tooltip="Default LLM provider"
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
                data-tooltip="Cloud fallback model"
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
                data-tooltip="API key for cloud provider"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Security (#29-30: counters + sliders) */}
      <div className="glass-card p-6 animate-fade-up">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Security</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Intrusion counters and detection sensitivity controls.
        </p>

        {/* Counters */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Failed Logins', value: failedLogins, color: 'var(--rose)' },
            { label: 'Rate Limit Hits', value: rateLimitHits, color: 'var(--amber)' },
            { label: 'Blocked IPs', value: blockedIps, color: 'var(--violet)' },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-deep)', border: '1px solid var(--glass-border)' }}>
              <p className="text-2xl font-bold font-mono" style={{ color: item.color }}>{item.value}</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-ghost)' }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Reset counters button */}
        <button
          className="text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all hover:opacity-80 mb-5"
          style={{
            background: 'hsla(0, 72%, 51%, 0.08)', color: 'var(--rose)',
            border: '1px solid hsla(0, 72%, 51%, 0.12)',
          }}
          onClick={() => { setFailedLogins(0); setRateLimitHits(0); setBlockedIps(0) }}
          data-tooltip="Reset all security counters to zero"
        >
          Reset All Counters
        </button>

        {/* Sensitivity sliders */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: 'var(--text-secondary)' }}>Rate Limit Threshold</span>
              <span className="font-mono" style={{ color: rateLimitThresh > 70 ? 'var(--rose)' : rateLimitThresh > 40 ? 'var(--amber)' : 'var(--accent)' }}>
                {rateLimitThresh} req/s
              </span>
            </div>
            <input type="range" min="10" max="200" value={rateLimitThresh}
              onChange={e => setRateLimitThresh(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, var(--accent) ${rateLimitThresh / 2}%, rgba(255,255,255,0.06) ${rateLimitThresh / 2}%)` }}
              data-tooltip="Rate limit threshold (requests per second)"
            />
            <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--text-ghost)' }}>
              <span>10</span><span>200</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: 'var(--text-secondary)' }}>IDS Sensitivity</span>
              <span className="font-mono" style={{ color: idsSensitivity > 70 ? 'var(--rose)' : idsSensitivity > 40 ? 'var(--amber)' : 'var(--accent)' }}>
                {idsSensitivity}%
              </span>
            </div>
            <input type="range" min="0" max="100" value={idsSensitivity}
              onChange={e => setIdsSensitivity(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, var(--accent) ${idsSensitivity}%, rgba(255,255,255,0.06) ${idsSensitivity}%)` }}
              data-tooltip="IDS sensitivity level"
            />
            <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--text-ghost)' }}>
              <span>Off</span><span>Aggressive</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: 'var(--text-secondary)' }}>Session Timeout</span>
              <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{sessionTimeout} min</span>
            </div>
            <input type="range" min="5" max="120" step="5" value={sessionTimeout}
              onChange={e => setSessionTimeout(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, var(--accent) ${(sessionTimeout - 5) / 1.15}%, rgba(255,255,255,0.06) ${(sessionTimeout - 5) / 1.15}%)` }}
              data-tooltip="Session timeout in minutes"
            />
            <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--text-ghost)' }}>
              <span>5m</span><span>120m</span>
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
                data-tooltip="Database engine"
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
                data-tooltip="Database port number"
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
                data-tooltip="Database data directory path"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Companion Settings */}
      <div className="glass-card p-6 animate-fade-up">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Companion</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Your desktop buddy — a little friend that hangs out in the corner and reacts to what you're doing.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Enable Companion</span>
            <button
              className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${config.enabled ? 'bg-emerald-500/40' : 'bg-white/10'}`}
              onClick={() => updateConfig({ enabled: !config.enabled })}
              role="switch"
              aria-checked={config.enabled}
              data-tooltip={config.enabled ? 'Disable companion' : 'Enable companion'}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${config.enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pet Style</span>
            <div className="flex gap-1.5 flex-wrap justify-end max-w-[200px]">
              {PET_OPTIONS.map(p => (
                <button
                  key={p.emoji}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all cursor-pointer ${config.petStyle === p.emoji ? 'scale-110 ring-2 ring-emerald-400/60' : 'opacity-50 hover:opacity-80'}`}
                  style={{ background: config.petStyle === p.emoji ? 'var(--accent-subtle)' : 'rgba(255,255,255,0.04)' }}
                  onClick={() => updateConfig({ petStyle: p.emoji })}
                  data-tooltip={p.label}
                >
                  {p.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Speech Bubbles</span>
            <button
              className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${config.speechEnabled ? 'bg-emerald-500/40' : 'bg-white/10'}`}
              onClick={() => updateConfig({ speechEnabled: !config.speechEnabled })}
              role="switch"
              aria-checked={config.speechEnabled}
              data-tooltip={config.speechEnabled ? 'Disable speech bubbles' : 'Enable speech bubbles'}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${config.speechEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg text-xs" style={{ background: 'var(--bg-deep)', border: '1px solid var(--glass-border)', color: 'var(--text-ghost)' }}>
            <span className="text-lg">{config.enabled ? config.petStyle : '💤'}</span>
            <span>{config.enabled ? 'Your companion is active — click the buddy in the corner to say hi!' : 'Your companion is resting. Enable it to bring them back.'}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button 
          className="action-chip action-chip-primary cursor-pointer"
          onClick={handleSave}
          disabled={isSaving}
          data-tooltip="Save all setting changes"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <button 
          className="action-chip cursor-pointer"
          onClick={handleReset}
          data-tooltip="Reset all preferences to defaults"
        >
          Reset Defaults
        </button>
        <button
          className="action-chip cursor-pointer"
          onClick={() => resetUser()}
          style={{ borderColor: 'var(--rose)' }}
          data-tooltip="Restart the onboarding wizard"
        >
          Re-run Onboarding
        </button>
      </div>
    </div>
  )
}


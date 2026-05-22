import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const STORAGE_KEY = 'smart-hub:companion'

export interface CompanionConfig {
  enabled: boolean
  petStyle: string
  speechEnabled: boolean
}

interface CompanionContextValue {
  config: CompanionConfig
  updateConfig: (patch: Partial<CompanionConfig>) => void
}

const CompanionContext = createContext<CompanionContextValue | null>(null)

const DEFAULT_CONFIG: CompanionConfig = {
  enabled: true,
  petStyle: '🤖',
  speechEnabled: true,
}

function loadConfig(): CompanionConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch { /* ignore corrupt data */ }
  return DEFAULT_CONFIG
}

function saveConfig(config: CompanionConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch { /* storage full or unavailable */ }
}

export function CompanionProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<CompanionConfig>(loadConfig)

  useEffect(() => { saveConfig(config) }, [config])

  const updateConfig = (patch: Partial<CompanionConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }))
  }

  return (
    <CompanionContext.Provider value={{ config, updateConfig }}>
      {children}
    </CompanionContext.Provider>
  )
}

export function useCompanion() {
  const ctx = useContext(CompanionContext)
  if (!ctx) throw new Error('useCompanion must be used within CompanionProvider')
  return ctx
}

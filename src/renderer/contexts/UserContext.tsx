import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const STORAGE_KEY = 'smart-hub:user'

export interface UserConfig {
  name: string
  location: string
  email: string
  hasPassword: boolean
  totpSecret: string
  onboardingComplete: boolean
}

interface UserContextValue {
  user: UserConfig
  updateUser: (patch: Partial<UserConfig>) => void
  resetUser: () => void
}

const UserContext = createContext<UserContextValue | null>(null)

const DEFAULT_USER: UserConfig = {
  name: '',
  location: '',
  email: '',
  hasPassword: false,
  totpSecret: '',
  onboardingComplete: false,
}

function loadUser(): UserConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_USER, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return DEFAULT_USER
}

function saveUser(user: UserConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch { /* ignore */ }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserConfig>(loadUser)

  useEffect(() => { saveUser(user) }, [user])

  const updateUser = (patch: Partial<UserConfig>) => {
    setUser(prev => ({ ...prev, ...patch }))
  }

  const resetUser = () => {
    setUser(DEFAULT_USER)
  }

  return (
    <UserContext.Provider value={{ user, updateUser, resetUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}

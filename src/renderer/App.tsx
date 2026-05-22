import { useState } from 'react'
import { AppShell } from './components/AppShell'
import { CompanionProvider } from './contexts/CompanionContext'
import { UserProvider, useUser } from './contexts/UserContext'
import { DesktopProvider } from './contexts/DesktopContext'
import { OnboardingWizard } from './components/OnboardingWizard'
import { TooltipManager } from './components/TooltipManager'
import './index.css'

function AppInner() {
  const { user } = useUser()
  const [collapsed, setCollapsed] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')

  return (
    <>
      {!user.onboardingComplete && <OnboardingWizard />}
      <AppShell
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        activePage={activePage}
        onNavigate={setActivePage}
      />
    </>
  )
}

export function App() {
  return (
    <UserProvider>
      <CompanionProvider>
        <DesktopProvider>
          <AppInner />
          <TooltipManager />
        </DesktopProvider>
      </CompanionProvider>
    </UserProvider>
  )
}

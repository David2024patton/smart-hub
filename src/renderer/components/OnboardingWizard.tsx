import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import { useUser } from '../contexts/UserContext'
import { generateBase32Secret, verifyTOTP } from '../lib/totp'

const TOTP_ISSUER = 'Smart Hub'

export function OnboardingWizard() {
  const { user, updateUser } = useUser()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(user.name)
  const [location, setLocation] = useState(user.location)
  const [detecting, setDetecting] = useState(false)
  const [detectFailed, setDetectFailed] = useState(false)
  const [email, setEmail] = useState(user.email)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [totpUrl, setTotpUrl] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [totpVerified, setTotpVerified] = useState(false)
  const [totpInput, setTotpInput] = useState('')

  const steps = ['Welcome', 'Profile', 'Location', 'Account', 'Security', 'Ready']

  const passwordRules = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'At least 1 uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'At least 1 lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { label: 'At least 1 number', test: (p: string) => /\d/.test(p) },
    { label: 'At least 1 special character', test: (p: string) => /[!@#$%^&*()_\-+=<>?/{}~|]/.test(p) },
    { label: 'Passwords match', test: (p: string) => p === confirmPassword && p.length > 0 },
  ]

  const allRulesPass = passwordRules.every(r => r.test(password))

  const doVerify = useCallback(async (code: string) => {
    if (!totpUrl) return
    const secret = totpUrl.match(/secret=([^&]+)/)?.[1] || ''
    const ok = await verifyTOTP(secret, code)
    if (ok) setTotpVerified(true)
  }, [totpUrl])

  useEffect(() => {
    if (step === 2 && !location && !detecting) {
      setDetecting(true)
      fetch('https://ip-api.com/json/?fields=city,region,zip,countryCode')
        .then(r => r.json())
        .then(data => {
          if (data.city) {
            const loc = data.zip
              ? `${data.city}, ${data.region} ${data.zip}`
              : `${data.city}, ${data.countryCode}`
            setLocation(loc)
          } else {
            setDetectFailed(true)
          }
        })
        .catch(() => setDetectFailed(true))
        .finally(() => setDetecting(false))
    }
  }, [step, location, detecting])

  useEffect(() => {
    if (step === 4 && !totpUrl) {
      const secret = generateBase32Secret()
      const url = `otpauth://totp/${TOTP_ISSUER}:${email || 'user@smart-hub.local'}?secret=${secret}&issuer=${TOTP_ISSUER}`
      setTotpUrl(url)
      QRCode.toDataURL(url, { width: 200, margin: 1 }, (err, data) => {
        if (!err) setQrDataUrl(data)
      })
    }
  }, [step, email, totpUrl])

  const canNext = () => {
    switch (step) {
      case 0: return true
      case 1: return name.trim().length > 0
      case 2: return location.trim().length > 0
      case 3: return email.includes('@') && allRulesPass
      case 4: return totpVerified
      case 5: return true
      default: return false
    }
  }

  const handleNext = () => {
    if (step === 1) updateUser({ name: name.trim() })
    if (step === 2) updateUser({ location: location.trim() })
    if (step === 3) updateUser({ email: email.trim(), hasPassword: true })
    if (step === 4 && totpUrl) {
      const secret = totpUrl.match(/secret=([^&]+)/)?.[1] || ''
      updateUser({ totpSecret: secret })
    }
    if (step === 5) {
      updateUser({ onboardingComplete: true })
      return
    }
    setStep(s => Math.min(s + 1, steps.length - 1))
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-secondary)',
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}>
      <div className="glass-card w-full max-w-lg p-8 animate-fade-up">
        {/* Step indicator */}
        <div className="flex gap-1.5 mb-8 justify-center">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8' : 'w-3'}`}
              style={{ background: i <= step ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center space-y-4">
            <div className="text-5xl mb-2">🧠</div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome to Smart Hub</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Your sovereign AI orchestration OS. Let's get you set up in just a few steps.
            </p>
          </div>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>What should we call you?</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your name will appear on the dashboard.</p>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && canNext() && handleNext()}
            />
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Where are you?</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Used to show your local weather in the top bar.</p>

            {detecting && (
              <div className="flex items-center gap-3 p-4 rounded-lg text-sm" style={{ background: 'var(--bg-deep)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                Detecting your location...
              </div>
            )}

            {!detecting && !location && !detectFailed && (
              <div className="text-center p-4 rounded-lg" style={{ background: 'var(--bg-deep)', border: '1px solid var(--glass-border)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>✓ Location auto-detected!</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-ghost)' }}>Click Continue or type manually below.</p>
              </div>
            )}

            {!detecting && detectFailed && !location && (
              <div className="text-center p-4 rounded-lg" style={{ background: 'var(--bg-deep)', border: '1px solid var(--glass-border)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Could not auto-detect location.</p>
              </div>
            )}

            <input
              autoFocus={detectFailed || location.length > 0}
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. London, UK or New York, US"
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && canNext() && handleNext()}
            />
            {!location && (
              <p className="text-[10px]" style={{ color: 'var(--text-ghost)' }}>
                We'll use this for local weather. Country detection is automatic.
              </p>
            )}
          </div>
        )}

        {/* Step 3: Email + Password */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Create your account</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Email and password for local authentication.</p>

            {/* Email */}
            <input
              autoFocus
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
            />

            {/* Password with eye toggle */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none pr-10"
                style={inputStyle}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm cursor-pointer hover:opacity-70 transition-opacity"
                style={{ color: 'var(--text-ghost)' }}
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                data-tooltip={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Confirm password */}
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none pr-10"
                style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && canNext() && handleNext()}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm cursor-pointer hover:opacity-70 transition-opacity"
                style={{ color: 'var(--text-ghost)' }}
                onClick={() => setShowConfirm(v => !v)}
                tabIndex={-1}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                data-tooltip={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Password rules checklist */}
            {password.length > 0 && (
              <div className="space-y-1.5 text-xs">
                {passwordRules.map(rule => {
                  const pass = rule.test(password)
                  return (
                    <div key={rule.label} className="flex items-center gap-2" style={{ color: pass ? 'var(--accent)' : 'var(--text-ghost)' }}>
                      <span className="text-sm">{pass ? '✓' : '○'}</span>
                      <span>{rule.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 4: 2FA QR Code */}
        {step === 4 && (
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Two-Factor Authentication</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            {qrDataUrl ? (
              <div className="flex justify-center">
                <img src={qrDataUrl} alt="TOTP QR Code" className="rounded-lg" style={{ background: 'white', padding: '8px' }} />
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <div className="w-[200px] h-[200px] rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
            )}
            <p className="text-xs font-mono break-all" style={{ color: 'var(--text-ghost)' }}>{totpUrl}</p>
            <input
              autoFocus
              value={totpInput}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                setTotpInput(v)
                if (v.length === 6) doVerify(v)
              }}
              placeholder="Enter 6-digit code from app to verify"
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none text-center font-mono tracking-widest"
              style={inputStyle}
              maxLength={6}
            />
            {totpVerified && (
              <p className="text-xs font-medium" style={{ color: 'var(--accent)' }}>✓ Verified successfully</p>
            )}
          </div>
        )}

        {/* Step 5: Ready */}
        {step === 5 && (
          <div className="text-center space-y-4">
            <div className="text-5xl mb-2">🎉</div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>You're all set, {name}!</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Your Smart Hub is configured and ready to go. Let's dive in.
            </p>
            <div className="flex flex-col gap-1 text-xs mt-2" style={{ color: 'var(--text-ghost)' }}>
              <span>📍 {location}</span>
              <span>📧 {email}</span>
              <span>🔐 2FA {totpUrl ? 'enabled' : 'skipped'}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
          {step > 0 && (
            <button
              className="text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text-ghost)' }}
              onClick={() => setStep(s => s - 1)}
              data-tooltip="Go to previous step"
            >
              Back
            </button>
          )}
          {step === 0 && <div />}

          <button
            className={`text-xs px-5 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${canNext() ? 'hover:opacity-80' : 'opacity-40'}`}
            style={{
              background: 'var(--accent)',
              color: 'white',
            }}
            disabled={!canNext()}
            onClick={handleNext}
            data-tooltip={step === steps.length - 1 ? 'Finish setup' : 'Continue to next step'}
          >
            {step === steps.length - 1 ? 'Launch Smart Hub' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

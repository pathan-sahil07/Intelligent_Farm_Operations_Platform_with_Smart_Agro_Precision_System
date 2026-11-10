import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Globe, Leaf } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { APP_ROUTES } from '../constants/routes.constants'
import { FarmingJourney } from '../components/auth/FarmingJourney'
import { useAuthStore } from '../store/useAuthStore'
import {
  AUTH_TRANSLATIONS,
  getSavedLanguage,
  saveLanguage,
  type AppLanguage,
} from '../features/auth/utils/language'
import { validateEmail } from '../features/auth/utils/validators'

type LoginErrors = {
  email?: string
  password?: string
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()

  // State
  const [lang, setLang] = useState<AppLanguage>(getSavedLanguage)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<LoginErrors>({})
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState<'idle' | 'success' | 'error'>('idle')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const t = AUTH_TRANSLATIONS[lang]

  function toggleLanguage() {
    const nextLang: AppLanguage = lang === 'en' ? 'hi' : 'en'
    setLang(nextLang)
    saveLanguage(nextLang)
    // Clear previous error text so it doesn't linger in old language
    setErrors({})
    setStatus('')
    setStatusType('idle')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: LoginErrors = {}
    if (!email.trim()) {
      nextErrors.email = t.errEnterEmail
    } else if (!validateEmail(email.trim())) {
      nextErrors.email = t.errValidEmail
    }
    if (!password) {
      nextErrors.password = t.errEnterPassword
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStatusType('error')
      setStatus(t.errFixHighlighted)
      return
    }

    setStatusType('idle')
    setStatus('')
    setIsSubmitting(true)

    try {
      await login({ email: email.trim(), password })
      setStatusType('success')
      setStatus(t.msgLoginSuccess)
      const from = (location.state as { from?: { pathname: string; search?: string } })?.from
      navigate(from ? `${from.pathname}${from.search ?? ''}` : APP_ROUTES.dashboard, { replace: true })
    } catch (err: unknown) {
      setIsSubmitting(false)
      setStatusType('error')

      const message = err instanceof Error ? err.message : ''
      const code = err instanceof Error && 'code' in err && typeof err.code === 'string' ? err.code : ''
      const status = err instanceof Error && 'status' in err && typeof err.status === 'number'
        ? err.status
        : undefined

      if (code === 'invalid_credentials' || message.toLowerCase().includes('invalid')) {
        setStatus(t.errInvalidCredentials)
      } else if (status === 0 || (err instanceof Error && err.name === 'TypeError') || message.includes('Failed to fetch')) {
        setStatus(t.errServerConnection)
      } else {
        setStatus(message || t.errServerConnection)
      }
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-lifecycle-backdrop" aria-hidden="true" />

      <div className="auth-container">
        {/* Top bar with Brand and Language Toggle */}
        <header className="auth-top-bar">
          <Link aria-label="Fieldwise workspace home" className="auth-brand-top" to={APP_ROUTES.dashboard}>
            <span aria-hidden="true" className="brand-mark">
              <Leaf size={20} />
            </span>
            <span>
              <span className="brand-name">{t.brandName}</span>
              <span className="brand-caption">{t.brandCaption}</span>
            </span>
          </Link>

          <button
            type="button"
            className="auth-lang-btn"
            onClick={toggleLanguage}
            aria-label={lang === 'en' ? 'Switch interface to Hindi' : 'इंटरफ़ेस को अंग्रेज़ी में बदलें'}
          >
            <Globe size={14} aria-hidden="true" />
            <span>{t.switchLang}</span>
          </button>
        </header>

        {/* 2-Column Split: Crop Lifecycle Journey (Left) + Login Form (Right) */}
        <div className="auth-split">
          <div className="auth-journey-col">
            <FarmingJourney lang={lang} />
          </div>

          <div className="auth-form-col">
            <section aria-labelledby="login-title" className="auth-card">
              <div className="auth-heading">
                <p className="eyebrow">{t.loginEyebrow}</p>
                <h1 className="auth-title" id="login-title">
                  {t.loginTitle}
                </h1>
                <p className="auth-description">{t.loginDescription}</p>
              </div>

              <form aria-busy={isSubmitting} className="auth-form" noValidate onSubmit={handleSubmit}>
                <Input
                  autoComplete="email"
                  disabled={isSubmitting}
                  error={errors.email}
                  label={t.emailLabel}
                  name="email"
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setErrors((current) => ({ ...current, email: undefined }))
                    setStatus('')
                    setStatusType('idle')
                  }}
                  placeholder={t.emailPlaceholder}
                  required
                  type="email"
                  value={email}
                />

                <div className="auth-password-control">
                  <Input
                    autoComplete="current-password"
                    className="auth-password-input"
                    disabled={isSubmitting}
                    error={errors.password}
                    label={t.passwordLabel}
                    name="password"
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setErrors((current) => ({ ...current, password: undefined }))
                      setStatus('')
                      setStatusType('idle')
                    }}
                    placeholder={t.passwordPlaceholder}
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                    aria-pressed={showPassword}
                    className="auth-password-toggle"
                    disabled={isSubmitting}
                    onClick={() => setShowPassword((visible) => !visible)}
                    type="button"
                  >
                    {showPassword ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
                  </button>
                </div>

                {status && (
                  <p
                    className={`auth-status ${statusType === 'error' ? 'error' : statusType === 'success' ? 'success' : ''}`}
                    role={statusType === 'error' ? 'alert' : 'status'}
                  >
                    {status}
                  </p>
                )}

                <Button className="auth-submit" disabled={isSubmitting} size="lg" type="submit">
                  {isSubmitting ? t.signingInBtn : t.signInBtn}
                </Button>
              </form>

              <p className="auth-switch">
                {t.newToApp} <Link to={APP_ROUTES.signup}>{t.createAccountLink}</Link>
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

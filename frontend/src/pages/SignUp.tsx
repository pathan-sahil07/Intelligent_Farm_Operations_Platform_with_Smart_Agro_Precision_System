import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Globe, Leaf } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
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
import { validateEmail, validatePasswordRules } from '../features/auth/utils/validators'

type SignUpErrors = {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export default function SignUp() {
  const navigate = useNavigate()
  const { register } = useAuthStore()

  // State
  const [lang, setLang] = useState<AppLanguage>(getSavedLanguage)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<SignUpErrors>({})
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState<'idle' | 'success' | 'error'>('idle')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const t = AUTH_TRANSLATIONS[lang]

  function toggleLanguage() {
    const nextLang: AppLanguage = lang === 'en' ? 'hi' : 'en'
    setLang(nextLang)
    saveLanguage(nextLang)
    setErrors({})
    setStatus('')
    setStatusType('idle')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: SignUpErrors = {}
    if (!fullName.trim()) {
      nextErrors.fullName = t.errEnterName
    }
    if (!email.trim()) {
      nextErrors.email = t.errEnterEmail
    } else if (!validateEmail(email.trim())) {
      nextErrors.email = t.errValidEmail
    }

    if (!password) {
      nextErrors.password = t.errCreatePassword
    } else {
      const passwordRules = validatePasswordRules(password)
      if (!passwordRules.hasMinLength) {
        nextErrors.password = t.errPasswordLength
      } else if (!passwordRules.isValid) {
        nextErrors.password = t.errPasswordComplexity
      }
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = t.errConfirmPassword
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = t.errPasswordMismatch
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
      const result = await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      })
      setStatusType('success')

      if (result.requiresLogin) {
        setStatus(t.msgAccountCreatedPleaseLogin)
        setTimeout(() => {
          navigate(APP_ROUTES.login, { replace: true })
        }, 1200)
      } else {
        setStatus(t.msgAccountCreated)
        navigate(APP_ROUTES.dashboard, { replace: true })
      }
    } catch (err: any) {
      setIsSubmitting(false)
      setStatusType('error')

      const message = err?.message || ''
      const code = err?.code || ''

      if (code === 'account_conflict' || message.toLowerCase().includes('already exists')) {
        setStatus(t.errAccountConflict)
      } else if (err?.status === 0 || err?.name === 'TypeError' || message.includes('Failed to fetch')) {
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

        {/* 2-Column Split: Crop Lifecycle Journey (Left) + Registration Form (Right) */}
        <div className="auth-split">
          <div className="auth-journey-col">
            <FarmingJourney lang={lang} />
          </div>

          <div className="auth-form-col">
            <section aria-labelledby="signup-title" className="auth-card">
              <div className="auth-heading">
                <p className="eyebrow">{t.signupEyebrow}</p>
                <h1 className="auth-title" id="signup-title">
                  {t.signupTitle}
                </h1>
                <p className="auth-description">{t.signupDescription}</p>
              </div>

              <form aria-busy={isSubmitting} className="auth-form" noValidate onSubmit={handleSubmit}>
                <Input
                  autoComplete="name"
                  disabled={isSubmitting}
                  error={errors.fullName}
                  label={t.fullNameLabel}
                  name="fullName"
                  onChange={(event) => {
                    setFullName(event.target.value)
                    setErrors((current) => ({ ...current, fullName: undefined }))
                    setStatus('')
                    setStatusType('idle')
                  }}
                  placeholder={t.fullNamePlaceholder}
                  required
                  value={fullName}
                />

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
                    autoComplete="new-password"
                    className="auth-password-input"
                    disabled={isSubmitting}
                    error={errors.password}
                    label={t.passwordLabel}
                    name="password"
                    onChange={(event) => {
                      const nextPassword = event.target.value
                      setPassword(nextPassword)
                      setErrors((current) => ({
                        ...current,
                        password: undefined,
                        confirmPassword:
                          confirmPassword && nextPassword !== confirmPassword
                            ? t.errPasswordMismatch
                            : undefined,
                      }))
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

                <p className="auth-password-hint">{t.passwordHint}</p>

                <div className="auth-password-control">
                  <Input
                    autoComplete="new-password"
                    className="auth-password-input"
                    disabled={isSubmitting}
                    error={errors.confirmPassword}
                    label={t.confirmPasswordLabel}
                    name="confirmPassword"
                    onChange={(event) => {
                      setConfirmPassword(event.target.value)
                      setErrors((current) => ({
                        ...current,
                        confirmPassword:
                          event.target.value && event.target.value !== password
                            ? t.errPasswordMismatch
                            : undefined,
                      }))
                      setStatus('')
                      setStatusType('idle')
                    }}
                    placeholder={t.confirmPasswordPlaceholder}
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                  />
                  <button
                    aria-label={showConfirmPassword ? t.hideConfirmPassword : t.showConfirmPassword}
                    aria-pressed={showConfirmPassword}
                    className="auth-password-toggle"
                    disabled={isSubmitting}
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    type="button"
                  >
                    {showConfirmPassword ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
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
                  {isSubmitting ? t.signingUpBtn : t.signUpBtn}
                </Button>
              </form>

              <p className="auth-switch">
                {t.alreadyHaveAccount} <Link to={APP_ROUTES.login}>{t.signInLink}</Link>
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

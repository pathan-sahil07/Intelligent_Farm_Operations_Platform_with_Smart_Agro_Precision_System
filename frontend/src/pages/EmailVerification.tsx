import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { APP_ROUTES } from '../constants/routes.constants'
import { hierarchyService } from '../features/user-management/services/hierarchyService'

export default function EmailVerification() {
  const location = useLocation()
  const token = new URLSearchParams(location.search).get('token') ?? ''
  const [status, setStatus] = useState<'loading' | 'verified' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email address…')

  useEffect(() => {
    if (!token) return

    let active = true
    hierarchyService.verifyOwnerEmail(token)
      .then((response) => {
        if (!active) return
        setStatus('verified')
        setMessage(response.message)
      })
      .catch((cause: unknown) => {
        if (!active) return
        setStatus('error')
        setMessage(cause instanceof Error ? cause.message : 'Unable to verify this email address.')
      })

    return () => { active = false }
  }, [token])

  const displayStatus = token ? status : 'error'
  const displayMessage = token ? message : 'The email verification link is missing its token.'

  return (
    <main className="auth-page">
      <div className="auth-lifecycle-backdrop" aria-hidden="true" />
      <div className="auth-container">
        <section aria-labelledby="email-verification-title" className="auth-card">
          <div className="auth-heading">
            <p className="eyebrow">FarmVerse account verification</p>
            <h1 className="auth-title" id="email-verification-title">Verify your email</h1>
          </div>
          <p aria-live="polite" className={`auth-status ${displayStatus === 'error' ? 'error' : displayStatus === 'verified' ? 'success' : ''}`}>
            {displayMessage}
          </p>
          {displayStatus === 'verified' && (
            <p className="auth-switch">
              <Link to={APP_ROUTES.login}>Sign in to set up your organization and farms</Link>
            </p>
          )}
          {displayStatus === 'error' && (
            <p className="auth-switch">
              <Link to={APP_ROUTES.signup}>Return to registration</Link>
            </p>
          )}
        </section>
      </div>
    </main>
  )
}

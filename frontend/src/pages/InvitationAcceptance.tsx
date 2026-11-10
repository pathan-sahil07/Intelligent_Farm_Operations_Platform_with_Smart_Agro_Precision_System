import { useEffect, useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { APP_ROUTES } from '../constants/routes.constants'
import { hierarchyService, type FarmRole, type InvitationPreview } from '../features/user-management/services/hierarchyService'
import { calculatePasswordStrength, validateEmail, validateMobileNumber, validatePasswordRules } from '../features/auth/utils/validators'
import { getSavedLanguage, saveLanguage, type AppLanguage } from '../features/auth/utils/language'
import { useAuthStore } from '../store/useAuthStore'

export default function InvitationAcceptance() {
  const navigate = useNavigate()
  const location = useLocation()
  const { checkSession, isAuthenticated, logout, user } = useAuthStore()
  const token = new URLSearchParams(location.search).get('token') ?? ''
  const [preview, setPreview] = useState<InvitationPreview | null>(null)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [selectedRole, setSelectedRole] = useState<FarmRole | ''>('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [language, setLanguage] = useState<AppLanguage>(getSavedLanguage)
  const [isExistingAccount, setIsExistingAccount] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([checkSession(true), token ? hierarchyService.verifyInvitation(token) : Promise.resolve(null)])
      .then(([, invitation]) => {
        if (!active) return
        if (invitation) {
          setPreview(invitation)
          setFullName(invitation.fullName ?? '')
          if (invitation.email?.toLowerCase() === user?.email.toLowerCase()) {
            setIsExistingAccount(true)
          }
        } else {
          setError('Invitation token is missing.')
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to verify invitation.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [checkSession, token, user?.email])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!preview?.valid || !token) return
    setError('')
    if (isExistingAccount && (!isAuthenticated || user?.email.toLowerCase() !== preview.email?.toLowerCase())) {
      setError('Sign in with the invited email address before accepting this invitation.')
      return
    }
    if (!token || token.length > 256) {
      setError('The invitation token is invalid.')
      return
    }
    if (!selectedRole || selectedRole !== preview.role) {
      setError('Select the role shown in your invitation. Contact your inviter if it is incorrect.')
      return
    }
    if (!fullName.trim() || fullName.trim().length > 255) {
      setError('Enter a full name of no more than 255 characters.')
      return
    }
    if (!preview.email || !validateEmail(preview.email) || preview.email.length > 254) {
      setError('The invitation does not contain a valid email address.')
      return
    }
    if (!validateMobileNumber(mobileNumber) || mobileNumber.trim().length > 64) {
      setError('Enter a valid contact number.')
      return
    }
    if (!isExistingAccount && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!isExistingAccount && !validatePasswordRules(password).isValid) {
      setError('Use at least 12 characters with uppercase and lowercase letters, a number, and a special character. Avoid common passwords.')
      return
    }
    if (!isExistingAccount && Array.from(password).length > 1024) {
      setError('Password cannot be longer than 1024 characters.')
      return
    }

    setSubmitting(true)
    try {
      await hierarchyService.acceptInvitation({
        token,
        fullName: fullName.trim(),
        selectedRole,
        mobileNumber: mobileNumber.trim() || undefined,
        password: isExistingAccount ? undefined : password,
      })
      await checkSession(true)
      navigate(APP_ROUTES.dashboard, { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to accept invitation.')
      setSubmitting(false)
    }
  }

  const hasExistingSessionForInvite = Boolean(
    isAuthenticated && user?.email.toLowerCase() === preview?.email?.toLowerCase(),
  )

  return (
    <main className="auth-page">
      <div className="auth-lifecycle-backdrop" aria-hidden="true" />
      <div className="auth-container">
        <section aria-labelledby="invitation-title" className="auth-card">
          <div className="auth-heading">
            <p className="eyebrow">FarmVerse invitation</p>
            <h1 className="auth-title" id="invitation-title">Join your farm team</h1>
          </div>
          {loading ? (
            <p aria-live="polite">Verifying invitation…</p>
          ) : !preview?.valid ? (
            <div className="auth-status error" role="alert">{error || preview?.error || 'This invitation is not valid.'}</div>
          ) : (
            <>
              <dl className="invitation-details">
                <dt>Organization</dt><dd>{preview.organizationName}</dd>
                <dt>Invited email</dt><dd>{preview.email}</dd>
                <dt>Assigned role</dt><dd>{preview.role === 'FIELD_WORKER' ? 'Farm Worker' : preview.role?.replaceAll('_', ' ')}</dd>
                <dt>Assigned farm(s)</dt><dd>{preview.assignedFarms.map((farm) => farm.name).join(', ') || 'None'}</dd>
                {preview.fieldOrLocation && <><dt>Field or work location</dt><dd>{preview.fieldOrLocation}</dd></>}
              </dl>
              <label className="field">
                <span className="field-label">Select your role</span>
                <select
                  className="field-control"
                  disabled={submitting}
                  required
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value as FarmRole | '')}
                >
                  <option value="">Choose a role</option>
                  <option value="FARM_OWNER">Farm Owner</option>
                  <option value="FARM_MANAGER">Farm Manager</option>
                  <option value="FARMER">Farmer</option>
                  <option value="FIELD_WORKER">Farm Worker</option>
                </select>
                <span className="table-secondary">Your selected role must match the role authorized in this invitation.</span>
              </label>
              {preview.message && <p className="panel-subtitle">{preview.message}</p>}
              {isAuthenticated && !hasExistingSessionForInvite && (
                <p className="auth-status error" role="alert">
                  The signed-in account does not match the invited email. Sign out and sign in with the invited account.
                </p>
              )}
              {hasExistingSessionForInvite && (
                <p className="panel-subtitle">You are signed in with the invited email. Accepting will complete the account setup authorized by this invitation.</p>
              )}
              <form className="auth-form" onSubmit={handleSubmit}>
                <Input autoComplete="email" label="Email address" name="email" readOnly required type="email" value={preview.email ?? ''} />
                <Input autoComplete="name" disabled={submitting} label="Full name" name="fullName" required value={fullName} onChange={(event) => setFullName(event.target.value)} />
                <Input autoComplete="tel" disabled={submitting} label="Contact number" name="mobileNumber" required type="tel" value={mobileNumber} onChange={(event) => setMobileNumber(event.target.value)} />
                <label className="field">
                  <span className="field-label">Language preference</span>
                  <select
                    className="field-control"
                    disabled={submitting}
                    value={language}
                    onChange={(event) => {
                      const nextLanguage = event.target.value as AppLanguage
                      setLanguage(nextLanguage)
                      saveLanguage(nextLanguage)
                    }}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                  </select>
                </label>
                {!hasExistingSessionForInvite && (
                  <>
                    <div className="auth-password-control">
                      <Input autoComplete="new-password" className="auth-password-input" disabled={submitting} label="Create password" name="password" required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} />
                      <button aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="auth-password-toggle" disabled={submitting} onClick={() => setShowPassword((visible) => !visible)} type="button">
                        {showPassword ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
                      </button>
                    </div>
                    {password && <p className="auth-password-hint" aria-live="polite">Password strength: {calculatePasswordStrength(password).label} ({calculatePasswordStrength(password).percent}%). Use at least 12 characters with uppercase and lowercase letters, a number, and a special character.</p>}
                    <div className="auth-password-control">
                      <Input autoComplete="new-password" className="auth-password-input" disabled={submitting} label="Confirm password" name="confirmPassword" required type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                      <button aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'} aria-pressed={showConfirmPassword} className="auth-password-toggle" disabled={submitting} onClick={() => setShowConfirmPassword((visible) => !visible)} type="button">
                        {showConfirmPassword ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
                      </button>
                    </div>
                    <label className="field">
                      <span className="field-label">Already have an account?</span>
                      <span className="table-secondary">Sign in with the invited email to accept without creating a duplicate account.</span>
                    </label>
                    <Link to={APP_ROUTES.login} state={{ from: { pathname: location.pathname, search: location.search } }}>
                      Sign in first
                    </Link>
                  </>
                )}
                {error && <p className="auth-status error" role="alert">{error}</p>}
                {isAuthenticated && !hasExistingSessionForInvite && (
                  <Button
                    onClick={() => void logout().then(() => navigate(APP_ROUTES.login, {
                      state: { from: { pathname: location.pathname, search: location.search } },
                    }))}
                    type="button"
                    variant="secondary"
                  >
                    Sign out
                  </Button>
                )}
                <Button disabled={submitting || (isAuthenticated && !hasExistingSessionForInvite)} size="lg" type="submit">
                  {submitting ? 'Accepting…' : 'Accept invitation'}
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  )
}

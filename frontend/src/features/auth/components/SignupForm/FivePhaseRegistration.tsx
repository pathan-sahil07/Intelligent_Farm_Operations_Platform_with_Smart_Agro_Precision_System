import { useState, type FC, type FormEvent } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Edit2,
  Eye,
  EyeOff,
  Info,
  MapPin,
  ShieldCheck,
  Sprout,
  Tractor,
  Trees,
  User,
  UserCheck,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'
import { APP_ROUTES } from '../../../../constants/routes.constants'
import { useAuthStore } from '../../../../store/useAuthStore'
import {
  FARMVERSE_ROLES,
  type Phase1AccountData,
  type Phase2RoleData,
  type Phase3FarmData,
  type Phase4ProfessionalData,
  type RegistrationPhase,
} from '../../types/registration.types'
import {
  AUTH_TRANSLATIONS,
  type AppLanguage,
} from '../../utils/language'
import {
  calculatePasswordStrength,
  validateEmail,
  validateMobileNumber,
  validatePasswordRules,
} from '../../utils/validators'
import { StepIndicator } from './StepIndicator'
import './FivePhaseRegistration.css'

interface FivePhaseRegistrationProps {
  lang: AppLanguage
}

export const FivePhaseRegistration: FC<FivePhaseRegistrationProps> = ({ lang }) => {
  const navigate = useNavigate()
  const invitationTokenFromUrl = new URLSearchParams(window.location.search).get('token') ?? ''
  const { register } = useAuthStore()
  const t = AUTH_TRANSLATIONS[lang]

  // The registration flow uses role selection followed by account information.
  const [currentPhase, setCurrentPhase] = useState<RegistrationPhase>(1)
  const [completedPhases, setCompletedPhases] = useState<Set<RegistrationPhase>>(new Set())

  // Account information is retained while moving between the two registration steps.
  const [accountData, setAccountData] = useState<Phase1AccountData>({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [invitationToken, setInvitationToken] = useState(invitationTokenFromUrl)

  // Role choice is collected before account information.
  const [roleData, setRoleData] = useState<Phase2RoleData>({
    selectedRole: null,
  })

  // Phase 3: Farm Information
  const [farmData, setFarmData] = useState<Phase3FarmData>({
    farmOrOrgName: '',
    state: '',
    district: '',
    villageOrLocation: '',
    farmSize: '',
    farmSizeUnit: 'acre',
    ownershipOrScope: 'Sole Owner / Individual',
  })

  // Phase 4: Professional Information
  const [profData, setProfData] = useState<Phase4ProfessionalData>({
    organizationName: '',
    designation: '',
    specialization: 'General Farming & Crop Production',
    experienceYears: '2 to 5 years',
    alternateContact: '',
    preferredCommunication: 'whatsapp',
  })

  // Phase 5: Terms and Submission State
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [serverSuccess, setServerSuccess] = useState<string | null>(null)

  // Password strength calculation
  const pwdStrength = calculatePasswordStrength(accountData.password)

  // Clear errors for specific field
  function clearFieldError(field: string) {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
    setServerError(null)
  }

  // Phase 1 Validation
  function validatePhase1(): boolean {
    const nextErrors: Record<string, string> = {}

    if (!accountData.fullName.trim() || accountData.fullName.trim().length > 255) {
      nextErrors.fullName = t.errEnterName
    }

    if (!accountData.email.trim()) {
      nextErrors.email = t.errEnterEmail
    } else if (!validateEmail(accountData.email.trim()) || accountData.email.trim().length > 254) {
      nextErrors.email = t.errValidEmail
    }

    if (!accountData.mobileNumber.trim()) {
      nextErrors.mobileNumber = t.errEnterMobile
    } else if (!validateMobileNumber(accountData.mobileNumber.trim()) || accountData.mobileNumber.trim().length > 64) {
      nextErrors.mobileNumber = t.errValidMobile
    }

    if (!accountData.password) {
      nextErrors.password = t.errCreatePassword
    } else {
      const rules = validatePasswordRules(accountData.password)
      if (!rules.hasMinLength) {
        nextErrors.password = t.errPasswordLength
      } else if (!rules.isValid) {
        nextErrors.password = t.errPasswordComplexity
      } else if (Array.from(accountData.password).length > 1024) {
        nextErrors.password = 'Password cannot be longer than 1024 characters.'
      }
    }

    if (!accountData.confirmPassword) {
      nextErrors.confirmPassword = t.errConfirmPassword
    } else if (accountData.password !== accountData.confirmPassword) {
      nextErrors.confirmPassword = t.errPasswordMismatch
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  // Role validation
  function validatePhase2(): boolean {
    const nextErrors: Record<string, string> = {}

    if (!roleData.selectedRole) {
      nextErrors.role = t.errSelectRole
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  // Advance to next phase
  function handleNext() {
    if (currentPhase !== 1) return
    if (!validatePhase2()) return
    setCompletedPhases((prev) => new Set([...prev, 1]))
    setErrors({})
    setServerError(null)
    setCurrentPhase(2)
  }

  function validateAccountAndAuthorization(): boolean {
    const validAccount = validatePhase1()
    const nextErrors: Record<string, string> = {}

    if (!roleData.selectedRole) {
      nextErrors.role = t.errSelectRole
    } else if (roleData.selectedRole !== 'FARM_OWNER' && !invitationToken.trim()) {
      nextErrors.authorization = 'An authorized invitation is required. Ask a Farm Owner or your Farm Manager for an invitation.'
    }

    setErrors((current) => ({ ...current, ...nextErrors }))
    return validAccount && Object.keys(nextErrors).length === 0
  }

  // Go to previous phase
  function handlePrevious() {
    setErrors({})
    setServerError(null)
    setCurrentPhase((prev) => Math.max(1, prev - 1) as RegistrationPhase)
  }

  // Jump to specific step (if allowed)
  function handleSelectPhase(targetPhase: RegistrationPhase) {
    if (targetPhase < currentPhase || completedPhases.has(targetPhase)) {
      setErrors({})
      setServerError(null)
      setCurrentPhase(targetPhase)
    }
  }

  // Final Registration Submission
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateAccountAndAuthorization() || !roleData.selectedRole) {
      return
    }

    setIsSubmitting(true)
    setServerError(null)
    setServerSuccess(null)

    try {
      const result = await register({
        email: accountData.email.trim(),
        password: accountData.password,
        fullName: accountData.fullName.trim(),
        mobileNumber: accountData.mobileNumber.trim(),
        role: roleData.selectedRole,
        invitationToken: invitationToken.trim() || undefined,
      })

      if (result.requiresLogin && roleData.selectedRole === 'FARM_OWNER') {
        setServerSuccess(
          result.verificationMode === 'local-console'
            ? t.msgVerifyEmailLocal
            : t.msgVerifyEmail,
        )
        setIsSubmitting(false)
        return
      }

      if (result.requiresLogin || !result.user) {
        throw new Error('Your account could not be signed in after registration. Please sign in with your new account.')
      }
      setServerSuccess(t.msgAccountCreated)
      navigate(APP_ROUTES.dashboard, { replace: true })
    } catch (err: unknown) {
      setIsSubmitting(false)
      const failure = err && typeof err === 'object' ? err : {}
      const message = 'message' in failure && typeof failure.message === 'string' ? failure.message : ''
      const code = 'code' in failure && typeof failure.code === 'string' ? failure.code : ''

      if (code === 'account_conflict' || message.toLowerCase().includes('already exists')) {
        setServerError(t.errAccountConflict)
      } else if (
        ('status' in failure && failure.status === 0)
        || ('name' in failure && failure.name === 'TypeError')
        || message.includes('Failed to fetch')
      ) {
        setServerError(t.errServerConnection)
      } else {
        setServerError(message || t.errServerConnection)
      }
    }
  }

  // Role details lookup
  const currentRoleConfig = FARMVERSE_ROLES.find((r) => r.id === roleData.selectedRole)

  return (
    <section aria-labelledby="signup-flow-title" className="fv-auth-card">
      {/* Header */}
      <div className="fv-auth-header">
        <p className="eyebrow">{t.signupEyebrow}</p>
        <h1 className="fv-auth-title" id="signup-flow-title">
          {t.signupTitle}
        </h1>
        <p className="fv-auth-desc">{t.signupDescription}</p>
      </div>

      {/* Two-step registration progress */}
      <StepIndicator
        currentPhase={currentPhase}
        completedPhases={completedPhases}
        onSelectPhase={handleSelectPhase}
        lang={lang}
      />

      {/* Server Status Messages */}
      {serverError && (
        <div className="fv-alert error" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      {serverSuccess && (
        <div className="fv-alert success" role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{serverSuccess}</span>
        </div>
      )}

      {/* ACCOUNT INFORMATION */}
      {currentPhase === 2 && (
        <form aria-busy={isSubmitting} className="fv-phase-panel" noValidate onSubmit={handleSubmit}>
          <div className="fv-phase-title-wrap">
            <h2 className="fv-phase-title" id="p2-heading">
              <User size={18} aria-hidden="true" />
              <span>{t.phase2Title}</span>
            </h2>
            <p className="fv-phase-desc">{t.phase2Sub}</p>
          </div>

          <div className="fv-fields-stack">
            <Input
              autoComplete="name"
              disabled={isSubmitting}
              error={errors.fullName}
              label={t.fullNameLabel}
              name="fullName"
              placeholder={t.fullNamePlaceholder}
              required
              value={accountData.fullName}
              onChange={(e) => {
                setAccountData((prev) => ({ ...prev, fullName: e.target.value }))
                clearFieldError('fullName')
              }}
            />

            <div className="fv-fields-row">
              <Input
                autoComplete="email"
                disabled={isSubmitting}
                error={errors.email}
                label={t.emailLabel}
                name="email"
                placeholder={t.emailPlaceholder}
                required
                type="email"
                value={accountData.email}
                onChange={(e) => {
                  setAccountData((prev) => ({ ...prev, email: e.target.value }))
                  clearFieldError('email')
                }}
              />

              <Input
                autoComplete="tel"
                disabled={isSubmitting}
                error={errors.mobileNumber}
                label={t.mobileLabel}
                name="mobileNumber"
                placeholder={t.mobilePlaceholder}
                required
                type="tel"
                value={accountData.mobileNumber}
                onChange={(e) => {
                  setAccountData((prev) => ({ ...prev, mobileNumber: e.target.value }))
                  clearFieldError('mobileNumber')
                }}
              />
            </div>

            {/* Password input with toggle */}
            <div className="auth-password-control">
              <Input
                autoComplete="new-password"
                className="auth-password-input"
                disabled={isSubmitting}
                error={errors.password}
                label={t.passwordLabel}
                name="password"
                placeholder={t.passwordPlaceholder}
                required
                type={showPassword ? 'text' : 'password'}
                value={accountData.password}
                onChange={(e) => {
                  setAccountData((prev) => ({ ...prev, password: e.target.value }))
                  clearFieldError('password')
                }}
              />
              <button
                aria-label={showPassword ? t.hidePassword : t.showPassword}
                aria-pressed={showPassword}
                className="auth-password-toggle"
                disabled={isSubmitting}
                onClick={() => setShowPassword((v) => !v)}
                type="button"
              >
                {showPassword ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
              </button>
            </div>

            {/* Password strength meter */}
            {accountData.password.length > 0 && (
              <div className="fv-pwd-meter" aria-live="polite">
                <div className="fv-pwd-meter-header">
                  <span className="fv-pwd-meter-label">{t.passwordStrength}:</span>
                  <span className={`fv-pwd-meter-tag ${pwdStrength.label}`}>
                    {pwdStrength.label === 'weak' && t.strengthWeak}
                    {pwdStrength.label === 'fair' && t.strengthFair}
                    {pwdStrength.label === 'good' && t.strengthGood}
                    {pwdStrength.label === 'strong' && t.strengthStrong}
                  </span>
                </div>
                <div className="fv-pwd-bar-track">
                  <div
                    className={`fv-pwd-bar-fill ${pwdStrength.label}`}
                    style={{ width: `${pwdStrength.percent}%` }}
                  />
                </div>
              </div>
            )}

            <p className="auth-password-hint">{t.passwordHint}</p>

            {/* Confirm password input with toggle */}
            <div className="auth-password-control">
              <Input
                autoComplete="new-password"
                className="auth-password-input"
                disabled={isSubmitting}
                error={errors.confirmPassword}
                label={t.confirmPasswordLabel}
                name="confirmPassword"
                placeholder={t.confirmPasswordPlaceholder}
                required
                type={showConfirmPassword ? 'text' : 'password'}
                value={accountData.confirmPassword}
                onChange={(e) => {
                  setAccountData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  clearFieldError('confirmPassword')
                }}
              />
              <button
                aria-label={showConfirmPassword ? t.hideConfirmPassword : t.showConfirmPassword}
                aria-pressed={showConfirmPassword}
                className="auth-password-toggle"
                disabled={isSubmitting}
                onClick={() => setShowConfirmPassword((v) => !v)}
                type="button"
              >
                {showConfirmPassword ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
              </button>
            </div>

            {roleData.selectedRole && roleData.selectedRole !== 'FARM_OWNER' && (
              <>
                <p className="auth-password-hint">
                  This role is granted only by an authorized FarmVerse invitation. Open the secure invitation link from your email and enter its token here.
                </p>
                <Input
                  autoComplete="off"
                  disabled={isSubmitting}
                  error={errors.authorization}
                  label="Invitation token"
                  name="invitationToken"
                  required
                  value={invitationToken}
                  onChange={(event) => {
                    setInvitationToken(event.target.value)
                    clearFieldError('authorization')
                  }}
                />
              </>
            )}
          </div>

          {errors.authorization && <p className="fv-field-error" role="alert">{errors.authorization}</p>}

          <div className="fv-nav-actions">
            <Button disabled={isSubmitting} onClick={handlePrevious} size="lg" type="button" variant="secondary">
              <ArrowLeft size={16} aria-hidden="true" />
              <span>{t.btnPrevious}</span>
            </Button>
            <Button className="fv-btn-submit" disabled={isSubmitting} size="lg" type="submit">
              {isSubmitting ? t.btnCreatingAccount : t.btnCreateAccount}
            </Button>
          </div>
        </form>
      )}

      {/* PHASE 1: ROLE SELECTION */}
      {currentPhase === 1 && (
        <div className="fv-phase-panel" role="region" aria-labelledby="p1-heading">
          <div className="fv-phase-title-wrap">
            <h2 className="fv-phase-title" id="p1-heading">
              <ShieldCheck size={18} aria-hidden="true" />
              <span>{t.phase1Title}</span>
            </h2>
            <p className="fv-phase-desc">{t.roleSelectionSubtitle}</p>
          </div>

          <div className="fv-roles-grid" role="radiogroup" aria-label="Select FarmVerse Role">
            {FARMVERSE_ROLES.map((role) => {
              const isSelected = roleData.selectedRole === role.id
              const title = t[role.titleKey as keyof typeof t] as string
              const desc = t[role.descKey as keyof typeof t] as string
              const badge = t[role.badgeKey as keyof typeof t] as string

              let RoleIcon = Sprout
              if (role.id === 'FARM_OWNER') RoleIcon = Trees
              else if (role.id === 'FARM_MANAGER') RoleIcon = Tractor
              else if (role.id === 'FARMER') RoleIcon = Sprout
              else if (role.id === 'FIELD_WORKER') RoleIcon = Briefcase

              return (
                <div
                  key={role.id}
                  className={`fv-role-card ${isSelected ? 'selected' : ''}`}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => {
                    setRoleData((prev) => ({ ...prev, selectedRole: role.id }))
                    clearFieldError('role')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault()
                      setRoleData((prev) => ({ ...prev, selectedRole: role.id }))
                      clearFieldError('role')
                    }
                  }}
                >
                  <div className="fv-role-header">
                    <span className="fv-role-icon-box">
                      <RoleIcon size={20} />
                    </span>
                    <span className="fv-role-badge">{badge}</span>
                  </div>

                  <h3 className="fv-role-name">{title}</h3>
                  <p className="fv-role-desc">{desc}</p>

                  <div className="fv-role-radio-mark" aria-hidden="true">
                    <div className="fv-role-radio-dot" />
                  </div>
                </div>
              )
            })}
          </div>

          {errors.role && <p className="fv-field-error">{errors.role}</p>}

          <div className="fv-jwt-notice">
            <Info size={14} aria-hidden="true" />
            <span>{t.jwtNotice}</span>
          </div>

          <div className="fv-nav-actions">
            <Button className="fv-btn-next" size="lg" type="button" onClick={handleNext}>
              <span>{t.btnContinue}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {/* PHASE 3: FARM INFORMATION */}
      {currentPhase === 3 && (
        <div className="fv-phase-panel" role="region" aria-labelledby="p3-heading">
          <div className="fv-phase-title-wrap">
            <h2 className="fv-phase-title" id="p3-heading">
              <Sprout size={18} aria-hidden="true" />
              <span>{t.farmSectionTitle}</span>
            </h2>
            <p className="fv-phase-desc">{t.farmSectionDesc}</p>
          </div>

          <div className="fv-fields-stack">
            {/* Dynamic label based on role */}
            <Input
              disabled={isSubmitting}
              error={errors.farmOrOrgName}
              label={
                roleData.selectedRole === 'FIELD_WORKER'
                  ? t.assignedFarmLabel
                  : t.farmNameLabel
              }
              name="farmOrOrgName"
              placeholder={
                roleData.selectedRole === 'FIELD_WORKER'
                  ? t.assignedFarmPlaceholder
                  : t.farmNamePlaceholder
              }
              required
              value={farmData.farmOrOrgName}
              onChange={(e) => {
                setFarmData((prev) => ({ ...prev, farmOrOrgName: e.target.value }))
                clearFieldError('farmOrOrgName')
              }}
            />

            <div className="fv-fields-row">
              <Input
                disabled={isSubmitting}
                error={errors.state}
                label={t.stateLabel}
                name="state"
                placeholder={t.statePlaceholder}
                required
                value={farmData.state}
                onChange={(e) => {
                  setFarmData((prev) => ({ ...prev, state: e.target.value }))
                  clearFieldError('state')
                }}
              />

              <Input
                disabled={isSubmitting}
                error={errors.district}
                label={t.districtLabel}
                name="district"
                placeholder={t.districtPlaceholder}
                required
                value={farmData.district}
                onChange={(e) => {
                  setFarmData((prev) => ({ ...prev, district: e.target.value }))
                  clearFieldError('district')
                }}
              />
            </div>

            <div className="fv-fields-row">
              <Input
                disabled={isSubmitting}
                label={t.villageLabel}
                name="villageOrLocation"
                placeholder={t.villagePlaceholder}
                value={farmData.villageOrLocation}
                onChange={(e) => {
                  setFarmData((prev) => ({ ...prev, villageOrLocation: e.target.value }))
                }}
              />

              {/* Farm Size & Unit (Relevant for Owners, Managers, and Field Workers) */}
              <div className="fv-size-group">
                  <div className="fv-size-input">
                    <Input
                      disabled={isSubmitting}
                      label={t.farmSizeLabel}
                      name="farmSize"
                      placeholder={t.farmSizePlaceholder}
                      type="number"
                      value={farmData.farmSize}
                      onChange={(e) => {
                        setFarmData((prev) => ({ ...prev, farmSize: e.target.value }))
                      }}
                    />
                  </div>
                  <label className="fv-unit-select-wrap">
                    <span className="field-label">Unit</span>
                    <select
                      className="field-control fv-select"
                      disabled={isSubmitting}
                      value={farmData.farmSizeUnit}
                      onChange={(e) =>
                        setFarmData((prev) => ({
                          ...prev,
                          farmSizeUnit: e.target.value as 'acre' | 'hectare',
                        }))
                      }
                    >
                      <option value="acre">{t.unitAcre}</option>
                      <option value="hectare">{t.unitHectare}</option>
                    </select>
                  </label>
                </div>
            </div>

            {/* Ownership or operational scope */}
            {roleData.selectedRole === 'FARM_OWNER' && (
              <label className="fv-select-field">
                <span className="field-label">{t.ownershipTypeLabel}</span>
                <select
                  className="field-control fv-select"
                  disabled={isSubmitting}
                  value={farmData.ownershipOrScope}
                  onChange={(e) =>
                    setFarmData((prev) => ({ ...prev, ownershipOrScope: e.target.value }))
                  }
                >
                  <option value="Sole Owner / Individual">{t.ownershipSole}</option>
                  <option value="Family Farm">{t.ownershipFamily}</option>
                  <option value="Agricultural Cooperative">{t.ownershipCoop}</option>
                  <option value="Commercial Enterprise">{t.ownershipCorp}</option>
                </select>
              </label>
            )}
          </div>

          <div className="fv-nav-actions">
            <Button variant="secondary" size="lg" type="button" onClick={handlePrevious}>
              <ArrowLeft size={16} aria-hidden="true" />
              <span>{t.btnPrevious}</span>
            </Button>
            <Button className="fv-btn-next" size="lg" type="button" onClick={handleNext}>
              <span>{t.btnContinue}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {/* PHASE 4: PROFESSIONAL / CONTACT INFORMATION */}
      {currentPhase === 4 && (
        <div className="fv-phase-panel" role="region" aria-labelledby="p4-heading">
          <div className="fv-phase-title-wrap">
            <h2 className="fv-phase-title" id="p4-heading">
              <Tractor size={18} aria-hidden="true" />
              <span>{t.profSectionTitle}</span>
            </h2>
            <p className="fv-phase-desc">{t.profSectionDesc}</p>
          </div>

          <div className="fv-fields-stack">
            <div className="fv-fields-row">
              <Input
                disabled={isSubmitting}
                label={t.designationLabel}
                name="designation"
                placeholder={t.designationPlaceholder}
                value={profData.designation}
                onChange={(e) => {
                  setProfData((prev) => ({ ...prev, designation: e.target.value }))
                }}
              />

              <label className="fv-select-field">
                <span className="field-label">{t.experienceLabel}</span>
                <select
                  className="field-control fv-select"
                  disabled={isSubmitting}
                  value={profData.experienceYears}
                  onChange={(e) =>
                    setProfData((prev) => ({ ...prev, experienceYears: e.target.value }))
                  }
                >
                  <option value="Under 2 years">{t.expUnder2}</option>
                  <option value="2 to 5 years">{t.exp2to5}</option>
                  <option value="5 to 10 years">{t.exp5to10}</option>
                  <option value="Over 10 years">{t.expOver10}</option>
                </select>
              </label>
            </div>

            <label className="fv-select-field">
              <span className="field-label">{t.specializationLabel}</span>
              <select
                className="field-control fv-select"
                disabled={isSubmitting}
                value={profData.specialization}
                onChange={(e) =>
                  setProfData((prev) => ({ ...prev, specialization: e.target.value }))
                }
              >
                <option value="General Farming & Crop Production">{t.specGeneral}</option>
                <option value="Precision Irrigation & Water Systems">{t.specIrrigation}</option>
                <option value="Soil Health, Nutrition & Fertilizers">{t.specSoil}</option>
                <option value="Pest Management & Crop Protection">{t.specPest}</option>
                <option value="Horticulture & Greenhouse Cultivation">{t.specHorticulture}</option>
                <option value="Organic & Sustainable Agriculture">{t.specOrganic}</option>
              </select>
            </label>

            <div className="fv-fields-row">
              <Input
                disabled={isSubmitting}
                error={errors.alternateContact}
                label={t.altContactLabel}
                name="alternateContact"
                placeholder={t.altContactPlaceholder}
                type="tel"
                value={profData.alternateContact}
                onChange={(e) => {
                  setProfData((prev) => ({ ...prev, alternateContact: e.target.value }))
                  clearFieldError('alternateContact')
                }}
              />

              <label className="fv-select-field">
                <span className="field-label">{t.commPrefLabel}</span>
                <select
                  className="field-control fv-select"
                  disabled={isSubmitting}
                  value={profData.preferredCommunication}
                  onChange={(e) =>
                    setProfData((prev) => ({
                      ...prev,
                      preferredCommunication: e.target.value as 'whatsapp' | 'email' | 'phone',
                    }))
                  }
                >
                  <option value="whatsapp">{t.commWhatsapp}</option>
                  <option value="email">{t.commEmail}</option>
                  <option value="phone">{t.commPhone}</option>
                </select>
              </label>
            </div>
          </div>

          <div className="fv-nav-actions">
            <Button variant="secondary" size="lg" type="button" onClick={handlePrevious}>
              <ArrowLeft size={16} aria-hidden="true" />
              <span>{t.btnPrevious}</span>
            </Button>
            <Button className="fv-btn-next" size="lg" type="button" onClick={handleNext}>
              <span>{t.btnContinue}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {/* PHASE 5: REVIEW & CREATE ACCOUNT */}
      {currentPhase === 5 && (
        <form
          aria-busy={isSubmitting}
          className="fv-phase-panel"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="fv-phase-title-wrap">
            <h2 className="fv-phase-title" id="p5-heading">
              <UserCheck size={18} aria-hidden="true" />
              <span>{t.reviewSectionTitle}</span>
            </h2>
            <p className="fv-phase-desc">{t.reviewSectionDesc}</p>
          </div>

          {/* Review Summary Cards */}
          <div className="fv-review-grid">
            {/* Card 1: Account */}
            <div className="fv-review-card">
              <div className="fv-review-card-head">
                <div className="fv-review-card-title">
                  <User size={15} aria-hidden="true" />
                  <span>{t.reviewPersonalCard}</span>
                </div>
                <button
                  type="button"
                  className="fv-review-edit-btn"
                  onClick={() => setCurrentPhase(2)}
                  aria-label="Edit Personal Information"
                >
                  <Edit2 size={13} aria-hidden="true" />
                  <span>{t.editSectionBtn}</span>
                </button>
              </div>
              <dl className="fv-review-list">
                <div className="fv-review-row">
                  <dt>{t.fullNameLabel}:</dt>
                  <dd>{accountData.fullName || '—'}</dd>
                </div>
                <div className="fv-review-row">
                  <dt>{t.emailLabel}:</dt>
                  <dd>{accountData.email || '—'}</dd>
                </div>
                <div className="fv-review-row">
                  <dt>{t.mobileLabel}:</dt>
                  <dd>{accountData.mobileNumber || '—'}</dd>
                </div>
              </dl>
            </div>

            {/* Card 2: Role */}
            <div className="fv-review-card">
              <div className="fv-review-card-head">
                <div className="fv-review-card-title">
                  <ShieldCheck size={15} aria-hidden="true" />
                  <span>{t.reviewRoleCard}</span>
                </div>
                <button
                  type="button"
                  className="fv-review-edit-btn"
                  onClick={() => setCurrentPhase(1)}
                  aria-label="Edit Selected Role"
                >
                  <Edit2 size={13} aria-hidden="true" />
                  <span>{t.editSectionBtn}</span>
                </button>
              </div>
              <div className="fv-review-role-badge-box">
                <span className="fv-role-chip">{roleData.selectedRole}</span>
                <span className="fv-role-chip-desc">
                  {currentRoleConfig ? (t[currentRoleConfig.titleKey as keyof typeof t] as string) : ''}
                </span>
              </div>
            </div>

            {/* Card 3: Farm & Location */}
            <div className="fv-review-card">
              <div className="fv-review-card-head">
                <div className="fv-review-card-title">
                  <MapPin size={15} aria-hidden="true" />
                  <span>{t.reviewFarmCard}</span>
                </div>
                <button
                  type="button"
                  className="fv-review-edit-btn"
                  onClick={() => setCurrentPhase(3)}
                  aria-label="Edit Farm Information"
                >
                  <Edit2 size={13} aria-hidden="true" />
                  <span>{t.editSectionBtn}</span>
                </button>
              </div>
              <dl className="fv-review-list">
                <div className="fv-review-row">
                  <dt>Name:</dt>
                  <dd>{farmData.farmOrOrgName || '—'}</dd>
                </div>
                <div className="fv-review-row">
                  <dt>Location:</dt>
                  <dd>
                    {[farmData.villageOrLocation, farmData.district, farmData.state]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </dd>
                </div>
                {farmData.farmSize && (
                  <div className="fv-review-row">
                    <dt>Area:</dt>
                    <dd>
                      {farmData.farmSize} {farmData.farmSizeUnit}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Card 4: Professional */}
            <div className="fv-review-card">
              <div className="fv-review-card-head">
                <div className="fv-review-card-title">
                  <Briefcase size={15} aria-hidden="true" />
                  <span>{t.reviewProfCard}</span>
                </div>
                <button
                  type="button"
                  className="fv-review-edit-btn"
                  onClick={() => setCurrentPhase(4)}
                  aria-label="Edit Professional Details"
                >
                  <Edit2 size={13} aria-hidden="true" />
                  <span>{t.editSectionBtn}</span>
                </button>
              </div>
              <dl className="fv-review-list">
                {profData.designation && (
                  <div className="fv-review-row">
                    <dt>Title:</dt>
                    <dd>{profData.designation}</dd>
                  </div>
                )}
                <div className="fv-review-row">
                  <dt>Specialization:</dt>
                  <dd>{profData.specialization}</dd>
                </div>
                <div className="fv-review-row">
                  <dt>Experience:</dt>
                  <dd>{profData.experienceYears}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Terms & Conditions Acceptance */}
          <div className="fv-terms-box">
            <label className="fv-checkbox-label">
              <input
                type="checkbox"
                className="fv-checkbox-input"
                checked={agreedToTerms}
                disabled={isSubmitting}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked)
                  clearFieldError('terms')
                }}
              />
              <span className="fv-checkbox-text">{t.termsLabel}</span>
            </label>
            {errors.terms && <p className="fv-field-error">{errors.terms}</p>}
          </div>

          <div className="fv-nav-actions">
            <Button
              variant="secondary"
              size="lg"
              type="button"
              disabled={isSubmitting}
              onClick={handlePrevious}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>{t.btnPrevious}</span>
            </Button>
            <Button
              className="fv-btn-submit"
              disabled={isSubmitting}
              size="lg"
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <span className="fv-spinner" aria-hidden="true" />
                  <span>{t.btnCreatingAccount}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} aria-hidden="true" />
                  <span>{t.btnCreateAccount}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Switch to Sign In */}
      <p className="auth-switch">
        {t.alreadyHaveAccount} <Link to={APP_ROUTES.login}>{t.signInLink}</Link>
      </p>
    </section>
  )
}

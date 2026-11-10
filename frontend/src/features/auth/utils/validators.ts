export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const COMMON_PASSWORDS = new Set([
  'password', 'password123', 'password1234', 'password12345',
  '123456789012', 'qwerty', 'qwerty123', 'qwerty123456',
  'letmein', 'letmein123456', 'welcome', 'welcome123456',
  'admin', 'admin123456', 'iloveyou', 'iloveyou12345',
  'abc123', 'monkey', 'dragon', 'football', 'sunshine',
])

export interface PasswordValidationResult {
  isValid: boolean
  hasMinLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecial: boolean
}

export function validatePasswordRules(password: string): PasswordValidationResult {
  const hasMinLength = Array.from(password).length >= 12
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9\s]/.test(password)
  const normalized = password.toLowerCase().replace(/[^a-z0-9]/g, '')
  const isCommon = COMMON_PASSWORDS.has(normalized)

  return {
    isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial && !isCommon,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  }
}

export function validateEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim())
}

export function validateMobileNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, '')
  if (!cleaned) return false
  // Accepts standard 10-digit mobile (optionally prefixed with country code like +91 or 91)
  return /^(\+?[0-9]{1,3})?[6-9]\d{9}$/.test(cleaned) || /^[0-9]{10,14}$/.test(cleaned)
}

export interface PasswordStrength {
  score: number // 0 to 4
  label: 'weak' | 'fair' | 'good' | 'strong'
  percent: number
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: 'weak', percent: 0 }
  }

  let score = 0
  if (Array.from(password).length >= 12) score += 1
  if (Array.from(password).length >= 16) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^a-zA-Z0-9\s]/.test(password)) score += 1

  const normalizedScore = Math.min(4, Math.floor(score * 4 / 6))

  const labels: Array<'weak' | 'fair' | 'good' | 'strong'> = ['weak', 'fair', 'good', 'strong']
  const percents = [25, 50, 75, 100]

  return {
    score: normalizedScore,
    label: labels[normalizedScore] || 'weak',
    percent: percents[normalizedScore] || 25,
  }
}

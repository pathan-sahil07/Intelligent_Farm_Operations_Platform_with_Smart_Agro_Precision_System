export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface PasswordValidationResult {
  isValid: boolean
  hasMinLength: boolean
  hasLetter: boolean
  hasDigit: boolean
  hasSpecial: boolean
}

export function validatePasswordRules(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9\s]/.test(password)

  return {
    isValid: hasMinLength && hasLetter && hasDigit && hasSpecial,
    hasMinLength,
    hasLetter,
    hasDigit,
    hasSpecial,
  }
}

export function validateEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim())
}


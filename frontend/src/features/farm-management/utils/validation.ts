/**
 * Client-side checks that mirror the backend's bean-validation and service rules, so people get
 * an answer before the round trip. The server stays the authority: its messages are shown if
 * anything slips through.
 */

export type FieldErrors = Record<string, string>

/** Returns the number, null when blank, or NaN when the text is not a number. */
export function parseOptionalNumber(text: string): number | null {
  const trimmed = text.trim()
  if (trimmed === '') return null
  return Number(trimmed)
}

export function optionalText(text: string): string | null {
  const trimmed = text.trim()
  return trimmed === '' ? null : trimmed
}

export function isPositive(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0
}

export function checkRange(
  errors: FieldErrors,
  field: string,
  value: number | null,
  min: number,
  max: number,
  message: string,
) {
  if (value === null) return
  if (!Number.isFinite(value) || value < min || value > max) errors[field] = message
}

export function checkNonNegative(errors: FieldErrors, field: string, value: number | null, message: string) {
  if (value === null) return
  if (!Number.isFinite(value) || value < 0) errors[field] = message
}

/** The database stores fixed decimal places; anything finer would be rounded silently. */
export function checkDecimals(errors: FieldErrors, field: string, value: number | null, places: number) {
  if (value === null || !Number.isFinite(value) || errors[field]) return
  const scaled = value * 10 ** places
  if (Math.abs(scaled - Math.round(scaled)) > 1e-6) {
    errors[field] = places === 0 ? 'Use a whole number.' : `Use at most ${places} decimal place${places === 1 ? '' : 's'}.`
  }
}

export function checkMax(errors: FieldErrors, field: string, value: number | null, max: number) {
  if (value === null || !Number.isFinite(value) || errors[field]) return
  if (value > max) errors[field] = `Must be ${max.toLocaleString('en-IN')} or less.`
}

const numberFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })
const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export function formatAcres(value: number | null | undefined): string {
  return `${numberFormat.format(value ?? 0)} ac`
}

export function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : numberFormat.format(value)
}

/** Accepts "2026-10-31" (LocalDate), "2026-10-31T01:40:00.123" (LocalDateTime) or Jackson's array form. */
export function formatDate(value: string | number[] | null | undefined): string {
  if (!value) return '—'
  let year: number, month: number, day: number
  if (Array.isArray(value)) {
    ;[year, month, day] = value
  } else {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
    if (!match) return '—'
    ;[year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  }
  // Built from parts so a plain date never shifts a day because of the time zone.
  return dateFormat.format(new Date(year, month - 1, day))
}

/** Today as yyyy-MM-dd in the browser's own time zone (for <input type="date" max>). */
export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** Join the non-empty parts of an address: "Anandapuram, Visakhapatnam, Andhra Pradesh". */
export function formatLocation(farm: { village: string | null; district: string | null; state: string | null }): string {
  return [farm.village, farm.district, farm.state].filter(Boolean).join(', ') || 'Location not recorded'
}

export function userLabel(userId: number): string {
  return `User #${userId}`
}

/** Round to the 2 decimals the database stores so area sums do not show float noise. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

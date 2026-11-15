const num = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const formatNumber = (n: number | null | undefined) => (n === null || n === undefined ? '—' : num.format(n))
export const formatMoney = (n: number | null | undefined) => (n === null || n === undefined ? '—' : money.format(n))
export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
export const today = () => new Date().toLocaleDateString('en-CA')
export const options = <T extends string>(values: readonly T[]) => values.map((v) => ({ value: v, label: v.replace(/_/g, ' ') }))

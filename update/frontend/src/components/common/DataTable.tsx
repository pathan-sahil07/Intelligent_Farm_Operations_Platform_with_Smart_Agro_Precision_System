import type { ReactNode } from 'react'
import { EmptyState, ErrorState } from './StateViews'
import { Skeleton } from '@/components/ui/skeleton'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[] | undefined
  getKey: (row: T) => string | number
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  caption: string
}

export function DataTable<T>({ columns, rows, getKey, loading, error, onRetry, emptyTitle = 'Nothing here yet', emptyDescription, caption }: Props<T>) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (loading) {
    return (
      <div className="space-y-2 p-2" role="status" aria-label="Loading records">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    )
  }
  if (!rows || rows.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-neutral-200 text-xs tracking-wide text-neutral-500 uppercase">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={`px-3 py-2 font-semibold whitespace-nowrap ${c.className ?? ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getKey(row)} className="border-b border-neutral-100 hover:bg-brand-50/40">
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2.5 align-middle ${c.className ?? ''}`}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

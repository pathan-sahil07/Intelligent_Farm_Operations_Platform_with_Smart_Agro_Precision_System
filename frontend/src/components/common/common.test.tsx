import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataTable } from './DataTable'
import { EmptyState } from './StateViews'

describe('DataTable', () => {
  const columns = [{ key: 'n', header: 'Name', cell: (r: { n: string }) => r.n }]
  it('renders rows', () => {
    render(<DataTable caption="t" columns={columns} rows={[{ n: 'Wheat' }]} getKey={(r) => r.n} />)
    expect(screen.getByText('Wheat')).toBeInTheDocument()
  })
  it('shows an empty state with no rows', () => {
    render(<DataTable caption="t" columns={columns} rows={[]} getKey={(r) => r.n} emptyTitle="No crops yet" />)
    expect(screen.getByText('No crops yet')).toBeInTheDocument()
  })
  it('shows the error state with a message instead of rows', () => {
    render(<DataTable caption="t" columns={columns} rows={[{ n: 'x' }]} getKey={(r) => r.n} error={new Error('boom')} />)
    expect(screen.queryByText('x')).not.toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="Nothing" description="Add something" />)
    expect(screen.getByText('Nothing')).toBeInTheDocument()
    expect(screen.getByText('Add something')).toBeInTheDocument()
  })
})

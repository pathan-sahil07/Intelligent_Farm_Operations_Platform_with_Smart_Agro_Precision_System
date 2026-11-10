import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/api/endpoints'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader, Panel } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/useAuth'
import { useRun } from '@/hooks/useRun'
import { formatDate } from '@/lib/format'

export default function UsersPage() {
  const { user: me } = useAuth()
  const [q, setQ] = useState('')
  const { act } = useRun(['users'])
  const users = useQuery({ queryKey: ['users', q], queryFn: () => userApi.list({ q: q || undefined, size: 100 }) })
  const roles = useQuery({ queryKey: ['roles'], queryFn: userApi.roles })
  return (
    <>
      <PageHeader title="Users" description="Activate or deactivate accounts and assign roles." />
      <Panel title="All users" actions={<input aria-label="Search users" className="field-control !w-56 !py-1.5" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />}>
        <DataTable caption="Users" rows={users.data?.content} loading={users.isLoading} error={users.error} onRetry={() => users.refetch()} getKey={(u) => u.id} emptyTitle="No users found"
          columns={[
            { key: 'n', header: 'Name', cell: (u) => <span className="font-medium">{u.fullName}</span> },
            { key: 'e', header: 'Email', cell: (u) => u.email },
            { key: 'r', header: 'Role', cell: (u) => (
              <select aria-label={`Role of ${u.fullName}`} className="field-control !w-auto !py-1" value={u.role} disabled={u.id === me?.id}
                onChange={(e) => act(() => userApi.setRole(u.id, e.target.value), 'Role updated')}>
                {(roles.data ?? []).map((r) => <option key={r.name}>{r.name}</option>)}
              </select>) },
            { key: 'c', header: 'Joined', cell: (u) => formatDate(u.createdAt) },
            { key: 's', header: 'Status', cell: (u) => <StatusBadge value={u.active ? 'ACTIVE' : 'INACTIVE'} /> },
            { key: 'a', header: '', cell: (u) => u.id !== me?.id && (
              <div className="text-right"><Button size="sm" variant="ghost" onClick={() => act(() => userApi.setActive(u.id, !u.active), u.active ? 'User deactivated' : 'User activated')}>{u.active ? 'Deactivate' : 'Activate'}</Button></div>) },
          ]} />
      </Panel>
    </>
  )
}

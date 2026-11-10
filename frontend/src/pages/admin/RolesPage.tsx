import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/api/endpoints'
import type { RoleInfo } from '@/api/types'
import { ErrorState, Loading } from '@/components/common/StateViews'
import { PageHeader, Panel } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/Button'
import { useRun } from '@/hooks/useRun'

function RoleCard({ role, all }: { role: RoleInfo; all: string[] }) {
  const { act } = useRun(['roles', 'users'])
  const [sel, setSel] = useState<Set<string>>(new Set(role.permissions))
  const dirty = sel.size !== role.permissions.length || role.permissions.some((p) => !sel.has(p))
  const toggle = (p: string) => setSel((s) => { const n = new Set(s); if (n.has(p)) n.delete(p); else n.add(p); return n })
  return (
    <Panel title={role.name.replace(/_/g, ' ')} actions={<Button size="sm" disabled={!dirty} onClick={() => act(() => userApi.setRolePermissions(role.name, [...sel]), 'Permissions saved')}>Save</Button>}>
      <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
        {all.map((p) => (
          <label key={p} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sel.has(p)} onChange={() => toggle(p)} /> {p}
          </label>
        ))}
      </div>
    </Panel>
  )
}

export default function RolesPage() {
  const roles = useQuery({ queryKey: ['roles'], queryFn: userApi.roles })
  const perms = useQuery({ queryKey: ['permissions'], queryFn: userApi.permissions })
  return (
    <>
      <PageHeader title="Roles & permissions" description="Changes apply to users on their next request. Farm-level access is still enforced separately." />
      {roles.isLoading || perms.isLoading ? <Loading /> : roles.error || perms.error ? <ErrorState error={roles.error ?? perms.error} /> : (
        <div className="space-y-4">
          {roles.data?.map((r) => <RoleCard key={r.name + r.permissions.join()} role={r} all={(perms.data ?? []).map((p) => p.code)} />)}
        </div>
      )}
    </>
  )
}

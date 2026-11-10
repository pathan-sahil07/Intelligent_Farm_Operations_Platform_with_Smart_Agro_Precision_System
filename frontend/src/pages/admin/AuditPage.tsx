import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/api/endpoints'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader, Panel } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/lib/format'

export default function AuditPage() {
  const [page, setPage] = useState(0)
  const [entityType, setEntityType] = useState('')
  const q = useQuery({ queryKey: ['audit', page, entityType], queryFn: () => userApi.audit({ page, size: 25, entityType: entityType || undefined }) })
  return (
    <>
      <PageHeader title="Audit log" description="Who changed what, and when." />
      <Panel title="Events" actions={<input aria-label="Filter by entity type" className="field-control !w-48 !py-1.5" placeholder="Entity type…" value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(0) }} />}>
        <DataTable caption="Audit log" rows={q.data?.content} loading={q.isLoading} error={q.error} onRetry={() => q.refetch()} getKey={(a) => a.id} emptyTitle="No audit events"
          columns={[
            { key: 'w', header: 'When', cell: (a) => formatDateTime(a.createdAt) },
            { key: 'u', header: 'User', cell: (a) => a.userEmail ?? '—' },
            { key: 'a', header: 'Action', cell: (a) => a.action },
            { key: 'e', header: 'Entity', cell: (a) => `${a.entityType}${a.entityId ? ` #${a.entityId}` : ''}` },
            { key: 'd', header: 'Details', cell: (a) => a.details ?? '—' },
          ]} />
        <div className="mt-3 flex items-center justify-end gap-2 text-sm">
          <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span>Page {page + 1} of {Math.max(1, q.data?.totalPages ?? 1)}</span>
          <Button size="sm" variant="secondary" disabled={!q.data || page + 1 >= q.data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </Panel>
    </>
  )
}

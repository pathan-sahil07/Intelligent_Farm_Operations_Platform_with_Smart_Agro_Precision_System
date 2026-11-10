import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { equipmentApi } from '@/api/endpoints'
import type { Equipment } from '@/api/types'
import { ConfirmAction } from '@/components/common/ConfirmAction'
import { DataTable } from '@/components/common/DataTable'
import { FormDialog } from '@/components/common/FormDialog'
import { PageHeader, Panel } from '@/components/common/PageHeader'
import { NoFarm } from '@/components/common/StateViews'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/useAuth'
import { useFarm } from '@/contexts/useFarm'
import { useRun } from '@/hooks/useRun'
import { useStaff } from '@/hooks/useStaff'
import { formatDate, formatMoney, formatNumber, options, today } from '@/lib/format'

const KEYS = ['equipment', 'maintenance', 'dashboard', 'analytics']
const STATUSES = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED'] as const

type Dlg = { kind: 'edit'; row: Equipment | null } | { kind: 'hours' | 'allocate' | 'maint' | 'history'; row: Equipment } | null

export default function EquipmentPage() {
  const { can } = useAuth()
  const { farmId } = useFarm()
  const { run, act } = useRun(KEYS)
  const staff = useStaff()
  const canWrite = can('EQUIPMENT_WRITE')
  const [status, setStatus] = useState('')
  const [dlg, setDlg] = useState<Dlg>(null)
  const [deleting, setDeleting] = useState<Equipment | null>(null)

  const list = useQuery({ queryKey: ['equipment', farmId, status], queryFn: () => equipmentApi.list({ farmId, status }), enabled: !!farmId })
  const due = useQuery({ queryKey: ['maintenance', 'due', farmId], queryFn: () => equipmentApi.due({ farmId, days: 14 }), enabled: !!farmId })
  const hist = useQuery({ queryKey: ['maintenance', dlg && dlg.kind === 'history' ? dlg.row.id : 0], queryFn: () => equipmentApi.maintenance((dlg as { row: Equipment }).row.id), enabled: dlg?.kind === 'history' })

  if (!farmId) return <NoFarm />
  return (
    <>
      <PageHeader title="Equipment" description="Machinery status, allocation, operating hours and maintenance."
        actions={canWrite && <Button onClick={() => setDlg({ kind: 'edit', row: null })}><Plus size={16} aria-hidden="true" /> Add equipment</Button>} />

      {due.data && due.data.length > 0 && (
        <Panel title="Maintenance due in 14 days" className="mb-5">
          <ul className="divide-y divide-neutral-100 text-sm">
            {due.data.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><strong>{m.equipmentName}</strong> · {m.maintenanceType} · {formatDate(m.scheduledDate)}</span>
                {canWrite && <Button size="sm" variant="secondary" onClick={() => act(() => equipmentApi.completeMaintenance(m.id, { completedDate: today() }), 'Maintenance completed')}>Mark done</Button>}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Fleet" actions={
        <select aria-label="Filter by status" className="field-control !w-auto !py-1.5" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>}>
        <DataTable caption="Equipment" rows={list.data} loading={list.isLoading} error={list.error} onRetry={() => list.refetch()} getKey={(e) => e.id} emptyTitle="No equipment registered"
          columns={[
            { key: 'n', header: 'Name', cell: (e) => <span className="font-medium">{e.name}</span> },
            { key: 'c', header: 'Category', cell: (e) => e.category },
            { key: 's', header: 'Status', cell: (e) => <StatusBadge value={e.status} /> },
            { key: 'h', header: 'Hours', cell: (e) => formatNumber(e.operatingHours) },
            { key: 'al', header: 'Allocated to', cell: (e) => (e.allocatedToUserId ? staff.nameOf(e.allocatedToUserId) : '—') },
            { key: 'm', header: 'Next service', cell: (e) => formatDate(e.nextMaintenanceDate) },
            { key: 'a', header: '', cell: (e) => (
              <div className="flex flex-wrap justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => setDlg({ kind: 'history', row: e })}>Service history</Button>
                {canWrite && (
                  <>
                    {e.allocatedToUserId || e.allocatedToTaskId
                      ? <Button size="sm" variant="secondary" onClick={() => act(() => equipmentApi.release(e.id), 'Equipment released')}>Release</Button>
                      : e.status === 'AVAILABLE' && <Button size="sm" variant="secondary" onClick={() => setDlg({ kind: 'allocate', row: e })}>Allocate</Button>}
                    <Button size="sm" variant="ghost" onClick={() => setDlg({ kind: 'hours', row: e })}>Log hours</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDlg({ kind: 'maint', row: e })}>Schedule service</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDlg({ kind: 'edit', row: e })}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(e)}>Delete</Button>
                  </>
                )}
              </div>) },
          ]} />
      </Panel>

      {dlg?.kind === 'history' && (
        <Panel title={`Service history: ${dlg.row.name}`} className="mt-5" actions={<Button size="sm" variant="ghost" onClick={() => setDlg(null)}>Close</Button>}>
          <DataTable caption="Maintenance history" rows={hist.data} loading={hist.isLoading} error={hist.error} getKey={(m) => m.id} emptyTitle="No maintenance recorded"
            columns={[
              { key: 't', header: 'Type', cell: (m) => m.maintenanceType },
              { key: 's', header: 'Scheduled', cell: (m) => formatDate(m.scheduledDate) },
              { key: 'c', header: 'Completed', cell: (m) => formatDate(m.completedDate) },
              { key: 'co', header: 'Cost', cell: (m) => formatMoney(m.cost) },
            ]} />
        </Panel>
      )}

      <FormDialog open={dlg?.kind === 'edit'} title={dlg?.kind === 'edit' && dlg.row ? 'Edit equipment' : 'Add equipment'} fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'category', label: 'Category', required: true },
        { name: 'identifier', label: 'Serial / registration' },
        { name: 'status', label: 'Status', type: 'select', required: true, options: options(STATUSES) },
        { name: 'purchaseDate', label: 'Purchase date', type: 'date' },
        { name: 'purchaseCost', label: 'Purchase cost', type: 'number', min: 0, step: 'any' },
      ]} initial={dlg?.kind === 'edit' && dlg.row ? { ...dlg.row } : { status: 'AVAILABLE' }} onClose={() => setDlg(null)}
        onSubmit={(v) => run(() => (dlg?.kind === 'edit' && dlg.row ? equipmentApi.update(dlg.row.id, { ...v, farmId }) : equipmentApi.create({ ...v, farmId })), 'Equipment saved')} />
      <FormDialog open={dlg?.kind === 'hours'} title={`Log operating hours: ${dlg?.row?.name ?? ''}`} fields={[
        { name: 'usageDate', label: 'Date', type: 'date', required: true },
        { name: 'hours', label: 'Hours', type: 'number', required: true, min: 0.1, step: 'any' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]} initial={{ usageDate: today() }} onClose={() => setDlg(null)}
        onSubmit={(v) => run(() => equipmentApi.logHours((dlg as { row: Equipment }).row.id, v as never), 'Hours logged')} />
      <FormDialog open={dlg?.kind === 'allocate'} title={`Allocate: ${dlg?.row?.name ?? ''}`} fields={[
        { name: 'userId', label: 'Allocate to', type: 'select', required: true, options: staff.options },
      ]} onClose={() => setDlg(null)}
        onSubmit={(v) => run(() => equipmentApi.allocate((dlg as { row: Equipment }).row.id, { userId: Number(v.userId) }), 'Equipment allocated')} />
      <FormDialog open={dlg?.kind === 'maint'} title={`Schedule service: ${dlg?.row?.name ?? ''}`} fields={[
        { name: 'maintenanceType', label: 'Service type', required: true },
        { name: 'scheduledDate', label: 'Date', type: 'date', required: true },
        { name: 'cost', label: 'Estimated cost', type: 'number', min: 0, step: 'any' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]} initial={{ scheduledDate: today() }} onClose={() => setDlg(null)}
        onSubmit={(v) => run(() => equipmentApi.scheduleMaintenance((dlg as { row: Equipment }).row.id, v as never), 'Service scheduled')} />
      <ConfirmAction open={deleting !== null} title="Delete equipment?" message={`“${deleting?.name}” will be removed.`} onCancel={() => setDeleting(null)}
        onConfirm={() => run(() => equipmentApi.remove(deleting!.id), 'Equipment deleted')} />
    </>
  )
}

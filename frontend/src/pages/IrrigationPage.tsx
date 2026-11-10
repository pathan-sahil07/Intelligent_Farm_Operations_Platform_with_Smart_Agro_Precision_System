import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { cropApi, farmDataApi, irrigationApi } from '@/api/endpoints'
import type { Irrigation } from '@/api/types'
import { ConfirmAction } from '@/components/common/ConfirmAction'
import { DataTable, type Column } from '@/components/common/DataTable'
import { FormDialog } from '@/components/common/FormDialog'
import { PageHeader, Panel } from '@/components/common/PageHeader'
import { EmptyState, NoFarm } from '@/components/common/StateViews'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/useAuth'
import { useFarm } from '@/contexts/useFarm'
import { useRun } from '@/hooks/useRun'
import { formatDate, formatNumber, today } from '@/lib/format'

const KEYS = ['irrigation', 'moisture', 'dashboard', 'analytics']

export default function IrrigationPage() {
  const { can } = useAuth()
  const { farmId } = useFarm()
  const { run, act } = useRun(KEYS)
  const canWrite = can('IRRIGATION_WRITE')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState<Irrigation | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Irrigation | null>(null)
  const [moisturePlot, setMoisturePlot] = useState<number | null>(null)
  const [addMoistureOpen, setAddMoistureOpen] = useState(false)

  const list = useQuery({ queryKey: ['irrigation', farmId, status], queryFn: () => irrigationApi.list({ farmId, status }), enabled: !!farmId })
  const crops = useQuery({ queryKey: ['crops', farmId, 'active'], queryFn: () => cropApi.list({ farmId, status: 'Active' }), enabled: !!farmId })
  const plots = useQuery({ queryKey: ['plots', farmId], queryFn: () => farmDataApi.plots(farmId!), enabled: !!farmId })
  const recs = useQuery({ queryKey: ['irrigation', 'recommendations', farmId], queryFn: () => irrigationApi.recommendations(farmId!), enabled: !!farmId && can('WEATHER_READ'), retry: false })
  const moisture = useQuery({ queryKey: ['moisture', moisturePlot], queryFn: () => irrigationApi.moisture(moisturePlot!), enabled: moisturePlot !== null })

  const cropOptions = (crops.data ?? []).map((c) => ({ value: String(c.id), label: `${c.name} (${c.field_name})` }))
  const plotOptions = (plots.data ?? []).map((p) => ({ value: String(p.id), label: p.name }))

  const columns: Column<Irrigation>[] = [
    { key: 'date', header: 'Date', cell: (i) => `${formatDate(i.scheduled_date)} ${i.scheduled_time ?? ''}` },
    { key: 'crop', header: 'Crop', cell: (i) => i.crop_name },
    { key: 'water', header: 'Water (L)', cell: (i) => formatNumber(i.water_liters) },
    { key: 'method', header: 'Method', cell: (i) => i.method },
    { key: 'status', header: 'Status', cell: (i) => <StatusBadge value={i.status} /> },
    {
      key: 'actions',
      header: '',
      cell: (i) =>
        canWrite ? (
          <div className="flex justify-end gap-1">
            {i.status === 'Scheduled' && (
              <>
                <Button size="sm" variant="secondary" onClick={() => act(() => irrigationApi.setStatus(i.id, 'Completed'), 'Marked completed')}>Complete</Button>
                <Button size="sm" variant="ghost" onClick={() => act(() => irrigationApi.setStatus(i.id, 'Skipped'), 'Marked skipped')}>Skip</Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => setEditing(i)}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleting(i)}>Delete</Button>
          </div>
        ) : null,
    },
  ]

  if (!farmId) return <NoFarm />
  return (
    <>
      <PageHeader title="Irrigation" description="Schedule watering, track volumes and follow weather-based advice."
        actions={canWrite && <Button onClick={() => setEditing('new')}><Plus size={16} aria-hidden="true" /> Schedule irrigation</Button>} />

      {can('WEATHER_READ') && (
        <Panel title="Weather-based recommendations" className="mb-5">
          {recs.isLoading ? <p className="text-sm text-neutral-500">Checking forecast…</p>
            : recs.error ? <p className="text-sm text-neutral-600">{(recs.error as Error).message}</p>
            : recs.data?.length ? (
              <ul className="divide-y divide-neutral-100">
                {recs.data.map((r) => (
                  <li key={`${r.cropId}-${r.date}`} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                    <StatusBadge value={r.recommendation} />
                    <span className="font-medium">{r.cropName}</span>
                    <span className="text-neutral-500">{formatDate(r.date)}</span>
                    <span>{r.reason}</span>
                  </li>
                ))}
              </ul>
            ) : <EmptyState title="No scheduled irrigation to assess" />}
        </Panel>
      )}

      <Panel title="Schedules" actions={
        <select aria-label="Filter by status" className="field-control !w-auto !py-1.5" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option><option>Scheduled</option><option>Completed</option><option>Skipped</option>
        </select>}>
        <DataTable caption="Irrigation schedules" columns={columns} rows={list.data} getKey={(i) => i.id} loading={list.isLoading} error={list.error} onRetry={() => list.refetch()} emptyTitle="No irrigation scheduled" />
      </Panel>

      <Panel title="Soil moisture" className="mt-5" actions={
        <select aria-label="Select plot" className="field-control !w-auto !py-1.5" value={moisturePlot ?? ''} onChange={(e) => setMoisturePlot(e.target.value ? Number(e.target.value) : null)}>
          <option value="">Select plot…</option>{plotOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>}>
        {moisturePlot === null ? <EmptyState title="Choose a plot to see readings" /> : (
          <>
            {canWrite && <div className="mb-3"><Button size="sm" onClick={() => setAddMoistureOpen(true)}>Add reading</Button></div>}
            <DataTable caption="Soil moisture readings" rows={moisture.data} loading={moisture.isLoading} error={moisture.error} getKey={(m) => m.id} emptyTitle="No readings"
              columns={[
                { key: 'd', header: 'Date', cell: (m) => formatDate(m.readingDate) },
                { key: 'p', header: 'Moisture %', cell: (m) => formatNumber(m.moisturePercent) },
                { key: 's', header: 'Source', cell: (m) => m.source ?? '—' },
              ]} />
          </>
        )}
      </Panel>

      <FormDialog open={editing !== null} title={editing === 'new' ? 'Schedule irrigation' : 'Edit schedule'}
        description="Overlapping schedules for the same plot or crop are rejected."
        fields={[
          { name: 'crop_id', label: 'Crop', type: 'select', required: true, options: cropOptions },
          { name: 'plot_id', label: 'Plot', type: 'select', options: plotOptions },
          { name: 'scheduled_date', label: 'Date', type: 'date', required: true },
          { name: 'scheduled_time', label: 'Time', type: 'time' },
          { name: 'water_liters', label: 'Water (litres)', type: 'number', required: true, min: 1 },
          { name: 'method', label: 'Method', type: 'select', options: ['Drip', 'Sprinkler', 'Flood', 'Manual'].map((m) => ({ value: m, label: m })) },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ]}
        initial={editing && editing !== 'new' ? { ...editing } : { scheduled_date: today(), method: 'Drip' }}
        onClose={() => setEditing(null)}
        onSubmit={(v) => {
          const body = { ...v, crop_id: Number(v.crop_id), plot_id: v.plot_id ? Number(v.plot_id) : null } as never
          return run(() => (editing && editing !== 'new' ? irrigationApi.update(editing.id, body) : irrigationApi.create(body)), 'Schedule saved')
        }} />
      <FormDialog open={addMoistureOpen} title="Add soil moisture reading" fields={[
        { name: 'readingDate', label: 'Date', type: 'date', required: true },
        { name: 'moisturePercent', label: 'Moisture (%)', type: 'number', required: true, min: 0, max: 100 },
        { name: 'source', label: 'Source (sensor/manual)' },
      ]} initial={{ readingDate: today() }} onClose={() => setAddMoistureOpen(false)}
        onSubmit={(v) => run(() => irrigationApi.addMoisture(moisturePlot!, v as never), 'Reading added').then(() => undefined)} />
      <ConfirmAction open={deleting !== null} title="Delete schedule?" message="This irrigation schedule will be removed." onCancel={() => setDeleting(null)}
        onConfirm={() => run(() => irrigationApi.remove(deleting!.id), 'Schedule deleted')} />
    </>
  )
}

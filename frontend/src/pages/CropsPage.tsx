import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cropApi, farmDataApi, inventoryApi } from '@/api/endpoints'
import { GROWTH_STAGES, type Crop } from '@/api/types'
import { ConfirmAction } from '@/components/common/ConfirmAction'
import { DataTable, type Column } from '@/components/common/DataTable'
import { FormDialog, type FieldDef } from '@/components/common/FormDialog'
import { PageHeader, Panel } from '@/components/common/PageHeader'
import { NoFarm } from '@/components/common/StateViews'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/useAuth'
import { useFarm } from '@/contexts/useFarm'
import { useRun } from '@/hooks/useRun'
import { formatDate, formatNumber, options, today } from '@/lib/format'

const KEYS = ['crops', 'harvests', 'dashboard', 'analytics']

export default function CropsPage() {
  const { can } = useAuth()
  const { farmId } = useFarm()
  const { run, act } = useRun(KEYS)
  const canWrite = can('CROP_WRITE')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Crop | 'new' | null>(null)
  const [harvesting, setHarvesting] = useState<Crop | null>(null)
  const [deleting, setDeleting] = useState<Crop | null>(null)
  const [selected, setSelected] = useState<Crop | null>(null)

  const crops = useQuery({ queryKey: ['crops', farmId, status, search], queryFn: () => cropApi.list({ farmId, status, q: search }), enabled: !!farmId })
  const plots = useQuery({ queryKey: ['plots', farmId], queryFn: () => farmDataApi.plots(farmId!), enabled: !!farmId })
  const harvests = useQuery({ queryKey: ['harvests', farmId], queryFn: () => cropApi.harvests({ farmId }), enabled: !!farmId })

  const plotOptions = useMemo(() => (plots.data ?? []).map((p) => ({ value: String(p.id), label: p.name })), [plots.data])

  const cropFields: FieldDef[] = [
    { name: 'name', label: 'Crop name', required: true },
    { name: 'variety', label: 'Variety' },
    { name: 'plot_id', label: 'Plot', type: 'select', options: plotOptions },
    { name: 'field_name', label: 'Field name', required: true },
    { name: 'area_acres', label: 'Area (acres)', type: 'number', required: true, min: 0.01 },
    { name: 'planting_date', label: 'Planting / sowing date', type: 'date', required: true },
    { name: 'expected_harvest_date', label: 'Expected harvest date', type: 'date' },
    { name: 'growth_stage', label: 'Growth stage', type: 'select', required: true, options: options(GROWTH_STAGES) },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ]

  const columns: Column<Crop>[] = [
    { key: 'name', header: 'Crop', cell: (c) => <button className="text-left font-medium text-brand-700 hover:underline" onClick={() => setSelected(c)}>{c.name}{c.variety ? ` (${c.variety})` : ''}</button> },
    { key: 'field', header: 'Field', cell: (c) => c.field_name },
    { key: 'area', header: 'Acres', cell: (c) => formatNumber(c.area_acres) },
    { key: 'planted', header: 'Planted', cell: (c) => formatDate(c.planting_date) },
    { key: 'harvest', header: 'Harvest due', cell: (c) => formatDate(c.expected_harvest_date) },
    {
      key: 'stage',
      header: 'Stage',
      cell: (c) =>
        canWrite && c.status === 'Active' ? (
          <select aria-label={`Growth stage of ${c.name}`} className="field-control !w-auto !py-1" value={c.growth_stage} onChange={(e) => act(() => cropApi.setStage(c.id, e.target.value), 'Growth stage updated')}>
            {GROWTH_STAGES.map((s) => <option key={s}>{s}</option>)}
          </select>
        ) : c.growth_stage,
    },
    { key: 'status', header: 'Status', cell: (c) => <StatusBadge value={c.status} /> },
    {
      key: 'actions',
      header: '',
      cell: (c) =>
        canWrite ? (
          <div className="flex justify-end gap-1">
            {c.status === 'Active' && <Button size="sm" variant="secondary" onClick={() => setHarvesting(c)}>Harvest</Button>}
            <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleting(c)}>Delete</Button>
          </div>
        ) : null,
    },
  ]

  if (!farmId) return <NoFarm />

  return (
    <>
      <PageHeader
        title="Crop lifecycle"
        description="Register crops, track growth stages, health, inputs and harvests."
        actions={canWrite && <Button onClick={() => setEditing('new')}><Plus size={16} aria-hidden="true" /> Add crop</Button>}
      />
      <Panel
        title="Crops"
        actions={
          <div className="flex flex-wrap gap-2">
            <input aria-label="Search crops" className="field-control !w-44 !py-1.5" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select aria-label="Filter by status" className="field-control !w-auto !py-1.5" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option>Active</option>
              <option>Harvested</option>
            </select>
          </div>
        }
      >
        <DataTable caption="Crops" columns={columns} rows={crops.data} getKey={(c) => c.id} loading={crops.isLoading} error={crops.error} onRetry={() => crops.refetch()} emptyTitle="No crops yet" emptyDescription={canWrite ? 'Use “Add crop” to register your first crop.' : 'No crops have been registered for this farm.'} />
      </Panel>

      {selected && <CropDetails crop={selected} canWrite={canWrite} onClose={() => setSelected(null)} />}

      <Panel title="Harvest history" className="mt-5">
        <DataTable
          caption="Harvest records"
          columns={[
            { key: 'date', header: 'Date', cell: (h) => formatDate(h.harvest_date) },
            { key: 'crop', header: 'Crop', cell: (h) => h.crop_name },
            { key: 'qty', header: 'Yield (kg)', cell: (h) => formatNumber(h.quantity_kg) },
            { key: 'q', header: 'Quality', cell: (h) => h.quality ?? '—' },
            { key: 'n', header: 'Notes', cell: (h) => h.notes ?? '—' },
          ]}
          rows={harvests.data}
          getKey={(h) => h.id}
          loading={harvests.isLoading}
          error={harvests.error}
          emptyTitle="No harvests recorded"
        />
      </Panel>

      <FormDialog
        open={editing !== null}
        title={editing === 'new' ? 'Add crop' : 'Edit crop'}
        fields={cropFields}
        initial={editing && editing !== 'new' ? { ...editing } : { growth_stage: 'Seedling', planting_date: today() }}
        onClose={() => setEditing(null)}
        onSubmit={(v) => {
          const body = { ...v, farm_id: farmId, plot_id: v.plot_id ? Number(v.plot_id) : null } as never
          return run(() => (editing && editing !== 'new' ? cropApi.update(editing.id, body) : cropApi.create(body)), 'Crop saved')
        }}
      />
      <FormDialog
        open={harvesting !== null}
        title={`Record harvest${harvesting ? `: ${harvesting.name}` : ''}`}
        description="Recording a harvest marks the crop as harvested."
        submitLabel="Record harvest"
        fields={[
          { name: 'harvest_date', label: 'Harvest date', type: 'date', required: true },
          { name: 'quantity_kg', label: 'Yield (kg)', type: 'number', required: true, min: 0 },
          { name: 'quality', label: 'Quality grade' },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ]}
        initial={{ harvest_date: today() }}
        onClose={() => setHarvesting(null)}
        onSubmit={(v) => run(() => cropApi.harvest(harvesting!.id, v as never), 'Harvest recorded')}
      />
      <ConfirmAction
        open={deleting !== null}
        title="Delete crop?"
        message={`“${deleting?.name}” and its irrigation schedules, health and activity records will be removed.`}
        onCancel={() => setDeleting(null)}
        onConfirm={() => run(() => cropApi.remove(deleting!.id), 'Crop deleted').then(() => { if (selected?.id === deleting?.id) setSelected(null); toast.success('Deleted') })}
      />
    </>
  )
}

function CropDetails({ crop, canWrite, onClose }: { crop: Crop; canWrite: boolean; onClose: () => void }) {
  const { farmId } = useFarm()
  const { run } = useRun(['crop-health', 'crop-activities', 'inventory'])
  const [adding, setAdding] = useState<'health' | 'activity' | null>(null)
  const health = useQuery({ queryKey: ['crop-health', crop.id], queryFn: () => cropApi.health(crop.id) })
  const activities = useQuery({ queryKey: ['crop-activities', crop.id], queryFn: () => cropApi.activities(crop.id) })
  const items = useQuery({ queryKey: ['inventory', farmId, 'for-activity'], queryFn: () => inventoryApi.list({ farmId }), enabled: !!farmId })
  const itemOptions = (items.data ?? []).filter((i) => ['FERTILIZER', 'PESTICIDE'].includes(i.category)).map((i) => ({ value: String(i.id), label: `${i.name} (${formatNumber(i.quantity)} ${i.unit} in stock)` }))

  return (
    <Panel title={`${crop.name}: health & inputs`} className="mt-5" actions={<Button size="sm" variant="ghost" onClick={onClose}>Close</Button>}>
      <Tabs defaultValue="health">
        <TabsList>
          <TabsTrigger value="health">Health records</TabsTrigger>
          <TabsTrigger value="activities">Fertilizer & pesticide</TabsTrigger>
        </TabsList>
        <TabsContent value="health">
          {canWrite && <div className="mb-3"><Button size="sm" onClick={() => setAdding('health')}>Add health record</Button></div>}
          <DataTable caption="Health records" rows={health.data} loading={health.isLoading} error={health.error} getKey={(r) => r.id} emptyTitle="No health records"
            columns={[
              { key: 'd', header: 'Date', cell: (r) => formatDate(r.recordDate) },
              { key: 's', header: 'Status', cell: (r) => <StatusBadge value={r.status} /> },
              { key: 'i', header: 'Issue', cell: (r) => r.issue ?? '—' },
              { key: 'n', header: 'Notes', cell: (r) => r.notes ?? '—' },
            ]} />
        </TabsContent>
        <TabsContent value="activities">
          {canWrite && <div className="mb-3"><Button size="sm" onClick={() => setAdding('activity')}>Record application</Button></div>}
          <DataTable caption="Fertilizer and pesticide applications" rows={activities.data} loading={activities.isLoading} error={activities.error} getKey={(r) => r.id} emptyTitle="No applications recorded"
            columns={[
              { key: 'd', header: 'Date', cell: (r) => formatDate(r.activityDate) },
              { key: 't', header: 'Type', cell: (r) => <StatusBadge value={r.activityType} /> },
              { key: 'p', header: 'Product', cell: (r) => r.productName ?? '—' },
              { key: 'q', header: 'Quantity', cell: (r) => `${formatNumber(r.quantity)} ${r.unit ?? ''}` },
              { key: 'inv', header: 'From inventory', cell: (r) => (r.inventoryItemId ? 'Yes' : 'No') },
            ]} />
        </TabsContent>
      </Tabs>

      <FormDialog open={adding === 'health'} title="Add health record" fields={[
        { name: 'recordDate', label: 'Date', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', required: true, options: options(['HEALTHY', 'STRESSED', 'DISEASED', 'PEST']) },
        { name: 'issue', label: 'Issue observed' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]} initial={{ recordDate: today(), status: 'HEALTHY' }} onClose={() => setAdding(null)}
        onSubmit={(v) => run(() => cropApi.addHealth(crop.id, v as never), 'Health record added')} />
      <FormDialog open={adding === 'activity'} title="Record fertilizer / pesticide application" description="Choose an inventory item to deduct the quantity from stock automatically." fields={[
        { name: 'activityType', label: 'Type', type: 'select', required: true, options: options(['FERTILIZER', 'PESTICIDE', 'OTHER']) },
        { name: 'activityDate', label: 'Date', type: 'date', required: true },
        { name: 'inventoryItemId', label: 'Inventory item', type: 'select', options: itemOptions },
        { name: 'productName', label: 'Product name' },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 0 },
        { name: 'unit', label: 'Unit' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]} initial={{ activityType: 'FERTILIZER', activityDate: today() }} onClose={() => setAdding(null)}
        onSubmit={(v) => run(() => cropApi.addActivity(crop.id, { ...v, inventoryItemId: v.inventoryItemId ? Number(v.inventoryItemId) : null } as never), 'Application recorded')} />
    </Panel>
  )
}

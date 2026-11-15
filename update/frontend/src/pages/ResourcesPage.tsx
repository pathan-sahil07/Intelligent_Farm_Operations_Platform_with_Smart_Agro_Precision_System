import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { resourceApi } from '@/api/endpoints'
import { TASK_STATUSES, type Labour, type Resource, type Task } from '@/api/types'
import { ConfirmAction } from '@/components/common/ConfirmAction'
import { DataTable } from '@/components/common/DataTable'
import { FormDialog } from '@/components/common/FormDialog'
import { PageHeader, Panel } from '@/components/common/PageHeader'
import { NoFarm } from '@/components/common/StateViews'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/useAuth'
import { useFarm } from '@/contexts/useFarm'
import { useRun } from '@/hooks/useRun'
import { useStaff } from '@/hooks/useStaff'
import { formatDate, formatMoney, formatNumber, options, today } from '@/lib/format'

const KEYS = ['resources', 'utilization', 'tasks', 'labour', 'dashboard', 'analytics']
const CATEGORIES = ['SEED', 'FERTILIZER', 'WATER', 'FUEL', 'LABOUR', 'OTHER']

type Dlg = { kind: 'resource' | 'task' | 'labour'; row?: Resource | Task } | null

export default function ResourcesPage() {
  const { can } = useAuth()
  const { farmId } = useFarm()
  const { run, act } = useRun(KEYS)
  const staff = useStaff()
  const canWrite = can('RESOURCE_WRITE')
  const canTask = can('TASK_WRITE') || canWrite
  const [dlg, setDlg] = useState<Dlg>(null)
  const [del, setDel] = useState<{ kind: 'resource' | 'task' | 'labour'; id: number } | null>(null)

  const resources = useQuery({ queryKey: ['resources', farmId], queryFn: () => resourceApi.list({ farmId }), enabled: !!farmId })
  const util = useQuery({ queryKey: ['utilization', farmId], queryFn: () => resourceApi.utilization({ farmId }), enabled: !!farmId })
  const tasks = useQuery({ queryKey: ['tasks', farmId], queryFn: () => resourceApi.tasks({ farmId, size: 100 }), enabled: !!farmId })
  const labour = useQuery({ queryKey: ['labour', farmId], queryFn: () => resourceApi.labour({ farmId }), enabled: !!farmId })

  if (!farmId) return <NoFarm />
  const add = (kind: 'resource' | 'task' | 'labour', label: string, allowed: boolean) =>
    allowed && <Button size="sm" onClick={() => setDlg({ kind })}><Plus size={14} aria-hidden="true" /> {label}</Button>

  return (
    <>
      <PageHeader title="Resource planning" description="Plan resources, assign tasks, log labour and review utilization and cost." />
      <Tabs defaultValue="resources">
        <TabsList>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="labour">Labour</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="resources">
          <Panel title="Planned resources" actions={add('resource', 'Add resource', canWrite)}>
            <DataTable caption="Resources" rows={resources.data} loading={resources.isLoading} error={resources.error} getKey={(r) => r.id} emptyTitle="No resources planned"
              columns={[
                { key: 'n', header: 'Name', cell: (r) => r.name },
                { key: 'c', header: 'Category', cell: (r) => r.category },
                { key: 'p', header: 'Planned', cell: (r) => `${formatNumber(r.plannedQuantity)} ${r.unit}` },
                { key: 'u', header: 'Consumed', cell: (r) => `${formatNumber(r.consumedQuantity)} ${r.unit}` },
                { key: 'co', header: 'Cost', cell: (r) => formatMoney(r.cost) },
                { key: 's', header: 'Season', cell: (r) => r.season ?? '—' },
                { key: 'a', header: '', cell: (r) => canWrite && (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setDlg({ kind: 'resource', row: r })}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDel({ kind: 'resource', id: r.id })}>Delete</Button>
                  </div>) },
              ]} />
          </Panel>
        </TabsContent>

        <TabsContent value="tasks">
          <Panel title="Tasks" actions={add('task', 'Add task', canTask)}>
            <DataTable caption="Tasks" rows={tasks.data?.content} loading={tasks.isLoading} error={tasks.error} getKey={(t) => t.id} emptyTitle="No tasks"
              columns={[
                { key: 't', header: 'Title', cell: (t) => t.title },
                { key: 'as', header: 'Assigned to', cell: (t) => t.assignedToName ?? staff.nameOf(t.assignedTo) },
                { key: 'd', header: 'Due', cell: (t) => formatDate(t.dueDate) },
                { key: 'st', header: 'Status', cell: (t) => canTask ? (
                  <select aria-label={`Status of ${t.title}`} className="field-control !w-auto !py-1" value={t.status} onChange={(e) => act(() => resourceApi.setTaskStatus(t.id, e.target.value), 'Task updated')}>
                    {TASK_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>) : <StatusBadge value={t.status} /> },
                { key: 'cost', header: 'Est. / actual cost', cell: (t) => `${formatMoney(t.estimatedCost)} / ${formatMoney(t.actualCost)}` },
                { key: 'a', header: '', cell: (t) => canTask && (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setDlg({ kind: 'task', row: t })}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDel({ kind: 'task', id: t.id })}>Delete</Button>
                  </div>) },
              ]} />
          </Panel>
        </TabsContent>

        <TabsContent value="labour">
          <Panel title="Labour log" actions={add('labour', 'Log labour', canWrite)}>
            <DataTable caption="Labour records" rows={labour.data} loading={labour.isLoading} error={labour.error} getKey={(l) => l.id} emptyTitle="No labour logged"
              columns={[
                { key: 'd', header: 'Date', cell: (l) => formatDate(l.workDate) },
                { key: 'w', header: 'Worker', cell: (l) => l.userName ?? staff.nameOf(l.userId) },
                { key: 'h', header: 'Hours', cell: (l) => formatNumber(l.hours) },
                { key: 'r', header: 'Rate', cell: (l) => formatMoney(l.hourlyRate) },
                { key: 'c', header: 'Cost', cell: (l) => formatMoney(l.cost) },
                { key: 'a', header: '', cell: (l) => canWrite && <div className="text-right"><Button size="sm" variant="ghost" onClick={() => setDel({ kind: 'labour', id: l.id })}>Delete</Button></div> },
              ]} />
          </Panel>
        </TabsContent>

        <TabsContent value="utilization">
          <Panel title="Utilization by category">
            <DataTable caption="Resource utilization" rows={util.data} loading={util.isLoading} error={util.error} getKey={(u) => u.category} emptyTitle="No resource data"
              columns={[
                { key: 'c', header: 'Category', cell: (u) => u.category },
                { key: 'p', header: 'Planned', cell: (u) => formatNumber(u.planned) },
                { key: 'co', header: 'Consumed', cell: (u) => formatNumber(u.consumed) },
                { key: 'u', header: 'Utilization', cell: (u) => `${formatNumber(u.utilizationPercent)}%` },
                { key: 'cost', header: 'Cost', cell: (u) => formatMoney(u.cost) },
              ]} />
          </Panel>
        </TabsContent>
      </Tabs>

      <FormDialog open={dlg?.kind === 'resource'} title={dlg?.row ? 'Edit resource' : 'Add resource'} fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'category', label: 'Category', type: 'select', required: true, options: options(CATEGORIES) },
        { name: 'unit', label: 'Unit', required: true },
        { name: 'plannedQuantity', label: 'Planned quantity', type: 'number', required: true, min: 0 },
        { name: 'consumedQuantity', label: 'Consumed quantity', type: 'number', min: 0 },
        { name: 'cost', label: 'Cost', type: 'number', min: 0 },
        { name: 'season', label: 'Season' },
      ]} initial={dlg?.row ? { ...dlg.row } : { category: 'SEED', consumedQuantity: 0, cost: 0 }} onClose={() => setDlg(null)}
        onSubmit={(v) => run(() => (dlg?.row ? resourceApi.update((dlg.row as Resource).id, { ...v, farmId } as never) : resourceApi.create({ ...v, farmId } as never)), 'Resource saved')} />
      <FormDialog open={dlg?.kind === 'task'} title={dlg?.row ? 'Edit task' : 'Add task'} fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'taskType', label: 'Type' },
        { name: 'assignedTo', label: 'Assign to', type: 'select', options: staff.options },
        { name: 'dueDate', label: 'Due date', type: 'date' },
        { name: 'estimatedCost', label: 'Estimated cost', type: 'number', min: 0 },
        { name: 'actualCost', label: 'Actual cost', type: 'number', min: 0 },
      ]} initial={dlg?.row ? { ...dlg.row } : {}} onClose={() => setDlg(null)}
        onSubmit={(v) => {
          const body = { ...v, farmId, assignedTo: v.assignedTo ? Number(v.assignedTo) : null } as never
          return run(() => (dlg?.row ? resourceApi.updateTask((dlg.row as Task).id, body) : resourceApi.createTask(body)), 'Task saved')
        }} />
      <FormDialog open={dlg?.kind === 'labour'} title="Log labour" fields={[
        { name: 'userId', label: 'Worker', type: 'select', required: true, options: staff.options },
        { name: 'workDate', label: 'Date', type: 'date', required: true },
        { name: 'hours', label: 'Hours', type: 'number', required: true, min: 0.25, step: 'any' },
        { name: 'hourlyRate', label: 'Hourly rate', type: 'number', required: true, min: 0, step: 'any' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]} initial={{ workDate: today() }} onClose={() => setDlg(null)}
        onSubmit={(v) => run(() => resourceApi.addLabour({ ...v, farmId, userId: Number(v.userId) } as Partial<Labour>), 'Labour logged')} />
      <ConfirmAction open={del !== null} title="Delete record?" message="This cannot be undone." onCancel={() => setDel(null)}
        onConfirm={() => run(() => (del!.kind === 'resource' ? resourceApi.remove(del!.id) : del!.kind === 'task' ? resourceApi.removeTask(del!.id) : resourceApi.removeLabour(del!.id)), 'Deleted')} />
    </>
  )
}

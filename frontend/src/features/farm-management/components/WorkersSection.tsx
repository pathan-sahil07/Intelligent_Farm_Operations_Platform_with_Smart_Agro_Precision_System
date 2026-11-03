import { useState, type FormEvent } from 'react'
import { UserMinus, UserPlus } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Table } from '../../../components/ui/Table'
import { farmApi, toApiError } from '../services/farmApi'
import type { WorkerInfo } from '../types/farm-management.types'
import { formatDate, userLabel } from '../utils/format'

interface WorkersSectionProps {
  farmId: number
  workers: WorkerInfo[]
  canManage: boolean
  onChanged: (message: string) => void
  onFailed: (message: string) => void
}

export function WorkersSection({ farmId, workers, canManage, onChanged, onFailed }: WorkersSectionProps) {
  const [userId, setUserId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = Number(userId)
    if (!Number.isInteger(id) || id <= 0) {
      setError('Enter the worker’s user id (a whole number above 0).')
      return
    }
    setError('')
    setBusy(true)
    try {
      await farmApi.assignWorker(farmId, id)
      setUserId('')
      onChanged(`${userLabel(id)} is now assigned to this farm.`)
    } catch (e) {
      setError(toApiError(e).message)
    } finally {
      setBusy(false)
    }
  }

  async function unassign(worker: WorkerInfo) {
    try {
      await farmApi.unassignWorker(farmId, worker.userId)
      onChanged(`${worker.name ?? userLabel(worker.userId)} was removed from this farm.`)
    } catch (e) {
      onFailed(toApiError(e).message)
    }
  }

  const columns = [
    {
      key: 'worker',
      header: 'Worker',
      render: (worker: WorkerInfo) =>
        worker.name ? (
          <>
            <span className="table-primary">{worker.name}</span>
            <span className="table-secondary">{userLabel(worker.userId)}</span>
          </>
        ) : (
          <span className="table-primary">{userLabel(worker.userId)}</span>
        ),
    },
    { key: 'assigned', header: 'Assigned on', render: (worker: WorkerInfo) => formatDate(worker.assignedAt) },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            render: (worker: WorkerInfo) => (
              <span className="row-actions">
                <Button onClick={() => unassign(worker)} size="sm" variant="secondary">
                  <UserMinus aria-hidden="true" size={13} /> Remove
                  <span className="sr-only"> {worker.name ?? userLabel(worker.userId)} from this farm</span>
                </Button>
              </span>
            ),
          },
        ]
      : []),
  ]

  return (
    <Card padding={false}>
      {canManage && (
        <form className="assign-form" noValidate onSubmit={assign}>
          <Input
            error={error}
            inputMode="numeric"
            label="Assign a field worker"
            min="1"
            onChange={(event) => setUserId(event.target.value)}
            placeholder="Worker’s user id"
            step="1"
            type="number"
            value={userId}
          />
          <Button disabled={busy} type="submit">
            <UserPlus aria-hidden="true" size={14} /> {busy ? 'Assigning…' : 'Assign worker'}
          </Button>
        </form>
      )}
      <Table
        caption="Workers assigned to this farm"
        columns={columns}
        emptyMessage={canManage ? 'No workers assigned yet. Add a field worker by user id above.' : 'No workers are assigned to this farm yet.'}
        getRowKey={(worker) => worker.userId}
        rows={workers}
      />
    </Card>
  )
}

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import {
  hierarchyService,
  type CurrentUser,
  type Farm,
  type FarmTask,
  type UserSummary,
} from '../features/user-management/services/hierarchyService'

const today = new Date().toISOString().slice(0, 10)

export default function Tasks() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [farms, setFarms] = useState<Farm[]>([])
  const [members, setMembers] = useState<UserSummary[]>([])
  const [tasks, setTasks] = useState<FarmTask[]>([])
  const [farmId, setFarmId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [problemReports, setProblemReports] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isWorker = user?.role === 'FIELD_WORKER'
  const todaysTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'COMPLETED' && (!task.dueDate || task.dueDate <= today)),
    [tasks],
  )
  const farmMembers = useMemo(
    () => members.filter((member) => member.assignedFarms.some((farm) => farm.id === farmId)),
    [farmId, members],
  )
  const possibleAssignees = user?.role === 'FARMER'
    ? farmMembers.filter((member) => member.role === 'FIELD_WORKER')
    : farmMembers

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [currentUser, availableFarms] = await Promise.all([
          hierarchyService.getCurrentUser(),
          hierarchyService.listFarms(),
        ])
        const [availableTasks, organizationUsers] = await Promise.all([
          hierarchyService.listTasks(),
          currentUser.role === 'FIELD_WORKER' ? Promise.resolve([]) : hierarchyService.listUsers(),
        ])
        if (!active) return
        setUser(currentUser)
        setFarms(availableFarms)
        setTasks(availableTasks)
        setMembers(organizationUsers)
        setFarmId(availableFarms[0]?.id ?? '')
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load tasks.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!farmId) return
    setError('')
    setSaving(true)
    try {
      const task = await hierarchyService.createTask({
        farmId,
        title: title.trim(),
        description: description.trim() || undefined,
        assignedTo: assignee || undefined,
        dueDate: dueDate || undefined,
      })
      setTasks((current) => [task, ...current])
      setTitle('')
      setDescription('')
      setAssignee('')
      setDueDate('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create task.')
    } finally {
      setSaving(false)
    }
  }

  async function updateTask(task: FarmTask, status: 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED') {
    setError('')
    try {
      const updated = await hierarchyService.updateTask(task.id, {
        status,
        problemReport: problemReports[task.id]?.trim() || undefined,
      })
      setTasks((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update task.')
    }
  }

  if (loading) return <p aria-busy="true">Loading assigned tasks…</p>

  return (
    <>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">{user?.role.replaceAll('_', ' ')}</p>
          <h1 className="page-title">{isWorker ? "Today's assigned tasks" : 'Farm tasks'}</h1>
          <p className="page-description">Tasks and status changes are saved in the FarmVerse database.</p>
        </div>
      </div>
      {error && <p className="auth-status error" role="alert">{error}</p>}

      <div className="content-grid two">
        {!isWorker && (
          <Card>
            <h2 className="panel-title">Create a task</h2>
            {farms.length === 0 ? (
              <p className="table-empty">No assigned farms are available.</p>
            ) : (
              <form className="fv-fields-stack" onSubmit={handleCreate}>
                <label className="field">
                  <span className="field-label">Farm</span>
                  <select className="field-control" required value={farmId} onChange={(event) => { setFarmId(event.target.value); setAssignee('') }}>
                    {farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
                  </select>
                </label>
                <Input label="Task title" name="title" required value={title} onChange={(event) => setTitle(event.target.value)} />
                <label className="field">
                  <span className="field-label">Description</span>
                  <textarea className="field-control" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
                </label>
                <label className="field">
                  <span className="field-label">{user?.role === 'FARMER' ? 'Assign to field worker' : 'Assign to member (optional)'}</span>
                  <select className="field-control" required={user?.role === 'FARMER'} value={assignee} onChange={(event) => setAssignee(event.target.value)}>
                    <option value="">Unassigned</option>
                    {possibleAssignees.map((member) => <option key={member.id} value={member.id}>{member.fullName} · {member.role.replaceAll('_', ' ')}</option>)}
                  </select>
                </label>
                <Input label="Due date (optional)" name="dueDate" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                <Button disabled={saving} type="submit">{saving ? 'Saving…' : 'Create task'}</Button>
              </form>
            )}
          </Card>
        )}

        <Card>
          <h2 className="panel-title">{isWorker ? "Today's tasks" : 'Assigned work'}</h2>
          {todaysTasks.length === 0 ? (
            <p className="table-empty">No outstanding tasks due today.</p>
          ) : (
            <div className="fv-fields-stack">
              {todaysTasks.map((task) => (
                <article className="task-card" key={task.id}>
                  <div className="section-heading" style={{ marginTop: 0 }}>
                    <div>
                      <h3>{task.title}</h3>
                      <p className="table-secondary">{task.farmName}{task.dueDate ? ` · Due ${task.dueDate}` : ''}</p>
                    </div>
                    <span className="tag">{task.status.replaceAll('_', ' ')}</span>
                  </div>
                  {task.description && <p>{task.description}</p>}
                  {!isWorker && <p className="table-secondary">Assigned to: {task.assignedToName || 'Unassigned'}</p>}
                  {isWorker && (
                    <>
                      <label className="field">
                        <span className="field-label">Report a problem (optional)</span>
                        <textarea className="field-control" rows={2} value={problemReports[task.id] ?? ''} onChange={(event) => setProblemReports((current) => ({ ...current, [task.id]: event.target.value }))} />
                      </label>
                      <div className="content-grid three">
                        <Button onClick={() => void updateTask(task, 'IN_PROGRESS')} size="sm" type="button" variant="secondary">Start</Button>
                        <Button onClick={() => void updateTask(task, 'COMPLETED')} size="sm" type="button">Complete</Button>
                        <Button onClick={() => void updateTask(task, 'BLOCKED')} size="sm" type="button" variant="danger">Report issue</Button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}

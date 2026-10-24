import { useState, type FormEvent } from 'react'
import { Plus, Users, Wallet, Wheat } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { Table } from '../../../components/ui/Table'
import {
  farmExpenses,
  farmFields as initialFields,
  farmProfiles,
  farmTasks,
  farmWorkers,
} from '../data/sampleData'
import type { FarmExpense, FarmField, FarmTask, FarmWorker } from '../types/farm-management.types'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const totalFarmArea = farmProfiles.reduce((total, farm) => total + farm.totalArea, 0)
const mappedArea = initialFields.reduce((total, field) => total + field.area, 0)
const unmappedArea = totalFarmArea - mappedArea

function FarmManagementPage() {
  const [fields, setFields] = useState(initialFields)
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState('')

  function addField(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const crop = String(formData.get('crop') ?? '').trim()
    const area = Number(formData.get('area'))
    if (!name || !crop || !Number.isFinite(area) || area <= 0) {
      setFormError('Enter a field name, crop, and area greater than zero.')
      return
    }
    setFields((current) => [
      ...current,
      { id: `field-${Date.now()}`, name, crop, area, status: 'Preparing' },
    ])
    setFormError('')
    setModalOpen(false)
    event.currentTarget.reset()
  }

  const fieldColumns = [
    {
      key: 'name',
      header: 'Field',
      render: (field: FarmField) => (
        <>
          <span className="table-primary">{field.name}</span>
          <span className="table-secondary">{field.area} acres</span>
        </>
      ),
    },
    {
      key: 'farm',
      header: 'Farm',
      render: (field: FarmField) => farmProfiles.find((farm) => farm.id === field.farmId)?.farmName ?? 'Unassigned',
    },
    { key: 'crop', header: 'Crop', render: (field: FarmField) => field.crop },
    { key: 'status', header: 'Status', render: (field: FarmField) => <span className="tag">{field.status}</span> },
  ]
  const workerColumns = [
    { key: 'name', header: 'Worker', render: (worker: FarmWorker) => worker.name },
    { key: 'role', header: 'Role', render: (worker: FarmWorker) => worker.role },
    { key: 'field', header: 'Assigned field', render: (worker: FarmWorker) => worker.assignedField },
  ]
  const taskColumns = [
    { key: 'task', header: 'Task', render: (task: FarmTask) => task.task },
    { key: 'field', header: 'Field', render: (task: FarmTask) => task.field },
    { key: 'due', header: 'Due', render: (task: FarmTask) => task.due },
    { key: 'status', header: 'Status', render: (task: FarmTask) => <span className={`tag ${task.status === 'Needs attention' ? 'warning' : ''}`}>{task.status}</span> },
  ]
  const expenseColumns = [
    {
      key: 'description',
      header: 'Expense',
      render: (expense: FarmExpense) => (
        <>
          <span className="table-primary">{expense.description}</span>
          <span className="table-secondary">{expense.category}</span>
        </>
      ),
    },
    { key: 'date', header: 'Date', render: (expense: FarmExpense) => expense.date },
    { key: 'amount', header: 'Amount', render: (expense: FarmExpense) => currency.format(expense.amount) },
  ]

  return (
    <>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Operations / Farm management</p>
          <h1 className="page-title">Your farm, at a glance</h1>
          <p className="page-description">Manage the farm profile, fields, people, work, and operating costs.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus aria-hidden="true" size={15} /> Register field
        </Button>
      </div>
      <div className="notice">
        <Wheat aria-hidden="true" size={15} />
        <span>Sample farm and staff records. New fields are held in local page state and will not persist after reload.</span>
      </div>

      <div className="content-grid three" style={{ marginTop: 16 }}>
        <Card className="profile-card">
          <span className="stat-label">Farm profiles</span>
          {farmProfiles.map((farm) => (
            <div key={farm.id} style={{ marginTop: 12 }}>
              <p className="panel-title">{farm.farmName} · {farm.totalArea} ac</p>
              <p className="panel-subtitle">{farm.farmer ?? 'Manager not recorded'} · {farm.location}</p>
            </div>
          ))}
        </Card>
        <Card className="stat-card">
          <span className="stat-label">Managed area</span>
          <p className="stat-value">{totalFarmArea} ac</p>
          <span className="stat-note">Sample farm portfolio total</span>
          <span className="stat-note">{mappedArea} mapped · {unmappedArea} unmapped</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-label"><span>People & costs</span><Users aria-hidden="true" size={16} /></span>
          <p className="stat-value">{farmWorkers.length} workers</p>
          <span className="stat-note"><Wallet aria-hidden="true" size={11} /> {farmExpenses.length} sample expenses listed</span>
        </Card>
      </div>

      <div className="section-heading">
        <div><h2>Registered fields</h2><p>Field areas and current work status</p></div>
      </div>
      <Card padding={false}>
        <Table caption="Registered farm fields" columns={fieldColumns} getRowKey={(field) => field.id} rows={fields} />
      </Card>

      <div className="content-grid two">
        <section>
          <div className="section-heading"><div><h2>Worker records</h2><p>Sample team assignments</p></div></div>
          <Card padding={false}>
            <Table caption="Farm workers" columns={workerColumns} getRowKey={(worker) => worker.id} rows={farmWorkers} />
          </Card>
        </section>
        <section>
          <div className="section-heading"><div><h2>Task management</h2><p>Upcoming field work</p></div></div>
          <Card padding={false}>
            <Table caption="Farm tasks" columns={taskColumns} getRowKey={(task) => task.id} rows={farmTasks} />
          </Card>
        </section>
      </div>
      <div className="section-heading"><div><h2>Expense tracking</h2><p>Recent sample operating expenses</p></div></div>
      <Card padding={false}>
        <Table caption="Farm expenses" columns={expenseColumns} getRowKey={(expense) => expense.id} rows={farmExpenses} />
      </Card>

      <Modal description="Add a field to the current demo view." onClose={() => setModalOpen(false)} open={modalOpen} title="Register a field">
        <form onSubmit={addField}>
          <div className="form-grid">
            <Input autoFocus label="Field name" name="name" placeholder="e.g. West Meadow" required />
            <Input label="Crop" name="crop" placeholder="e.g. Barley" required />
            <Input label="Area (acres)" min="0.1" name="area" required step="0.1" type="number" />
          </div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="form-actions">
            <Button onClick={() => setModalOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit">Add field</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export { FarmManagementPage }

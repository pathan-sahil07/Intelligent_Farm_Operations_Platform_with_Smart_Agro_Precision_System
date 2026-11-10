import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react'
import { Plus, Users, Wallet, Wheat } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { Table } from '../../../components/ui/Table'
import { hierarchyService, type CurrentUser, type Farm as OrganizationFarm } from '../../user-management/services/hierarchyService'
import {
  createField,
  getFarmAcreageSummary,
  getFarmManagementSnapshot,
  subscribeFarmManagement,
} from '../services/farmManagementService'
import {
  farmExpenses,
  farmTasks,
  farmWorkers,
} from '../data/sampleData'
import type { FarmExpense, FarmField, FarmTask, FarmWorker } from '../types/farm-management.types'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function FarmManagementPage() {
  const snapshot = useSyncExternalStore(subscribeFarmManagement, getFarmManagementSnapshot)
  const acreage = getFarmAcreageSummary(undefined, snapshot)
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [organizationFarms, setOrganizationFarms] = useState<OrganizationFarm[]>([])
  const [farmModalOpen, setFarmModalOpen] = useState(false)
  const [farmError, setFarmError] = useState('')
  const [farmNotice, setFarmNotice] = useState('')

  useEffect(() => {
    Promise.all([hierarchyService.getCurrentUser(), hierarchyService.listFarms()])
      .then(([user, farms]) => {
        setCurrentUser(user)
        setOrganizationFarms(farms)
      })
      .catch((cause: unknown) => setFarmError(cause instanceof Error ? cause.message : 'Unable to load your saved farms.'))
  }, [])

  function addField(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const farmId = String(formData.get('farmId') ?? '').trim()
    const name = String(formData.get('name') ?? '').trim()
    const crop = String(formData.get('crop') ?? '').trim()
    const area = Number(formData.get('area'))
    if (!farmId || !name || !crop || !Number.isFinite(area) || area <= 0) {
      setFormError('Choose a farm, enter a field name and crop, and provide an area greater than zero.')
      return
    }
    const result = createField({
      id: `field-${Date.now()}`,
      farmId,
      name,
      crop,
      area,
      status: 'Preparing',
    })
    if (!result.success) {
      setFormError(result.error)
      return
    }
    setFormError('')
    setModalOpen(false)
    event.currentTarget.reset()
  }

  async function addOrganizationFarm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const areaValue = String(formData.get('area') ?? '')
    const area = areaValue ? Number(areaValue) : null
    if (area === null || !Number.isFinite(area) || area < 0.01) {
      setFarmError('Enter a farm area greater than zero.')
      return
    }

    setFarmError('')
    setFarmNotice('')
    try {
      const farm = await hierarchyService.createFarm({
        name: String(formData.get('name') ?? '').trim(),
        location: String(formData.get('location') ?? '').trim(),
        address: String(formData.get('address') ?? '').trim(),
        area,
        areaUnit: String(formData.get('areaUnit') ?? 'acre'),
        description: String(formData.get('description') ?? '').trim(),
      })
      setOrganizationFarms((current) => [...current, farm])
      setFarmNotice(`${farm.name} was saved to your organization.`)
      setFarmModalOpen(false)
      form.reset()
    } catch (cause) {
      setFarmError(cause instanceof Error ? cause.message : 'Unable to save this farm.')
    }
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
      render: (field: FarmField) => snapshot.farms.find((farm) => farm.id === field.farmId)?.farmName ?? 'Unknown farm',
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

  if (currentUser?.role === 'FIELD_WORKER') {
    return (
      <>
        <div className="page-heading-row">
          <div>
            <p className="eyebrow">Assigned farm information</p>
            <h1 className="page-title">Your farm and field</h1>
          </div>
        </div>
        {farmError && <p className="auth-status error" role="alert">{farmError}</p>}
        {organizationFarms.length === 0 ? (
          <p className="table-empty">No farm has been assigned to your account.</p>
        ) : (
          <div className="content-grid two">
            {organizationFarms.map((farm) => (
              <Card key={farm.id}>
                <h2 className="panel-title">{farm.name}</h2>
                <p className="panel-subtitle">{farm.location || farm.address || 'Location not provided'}</p>
                <p>{farm.area ?? 'Area not provided'} {farm.areaUnit ?? ''}</p>
                {farm.description && <p>{farm.description}</p>}
                <p><strong>Assigned field / work location:</strong> {currentUser.assignedFields.join(', ') || 'Not specified'}</p>
              </Card>
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Operations / Farm management</p>
          <h1 className="page-title">Your farm, at a glance</h1>
          <p className="page-description">Manage the farm profile, fields, people, work, and operating costs.</p>
        </div>
        <span className="content-grid two">
          {currentUser?.role === 'FARM_OWNER' && (
            <Button onClick={() => setFarmModalOpen(true)} type="button">
              <Plus aria-hidden="true" size={15} /> Add farm
            </Button>
          )}
          <Button onClick={() => setModalOpen(true)} type="button">
            <Plus aria-hidden="true" size={15} /> Register field
          </Button>
        </span>
      </div>
      {farmError && <p className="auth-status error" role="alert">{farmError}</p>}
      {farmNotice && <p className="auth-status success" role="status">{farmNotice}</p>}
      <div className="section-heading">
        <div><h2>Organization farms</h2><p>Saved farms available to your role</p></div>
      </div>
      {organizationFarms.length === 0 ? (
        <Card><p className="table-empty">No farms are assigned to your account yet.</p></Card>
      ) : (
        <div className="content-grid three">
          {organizationFarms.map((farm) => (
            <Card key={farm.id}>
              <h3 className="panel-title">{farm.name}</h3>
              <p className="panel-subtitle">{farm.location || farm.address || 'Location not provided'}</p>
              <p>{farm.area ?? 'Area not provided'} {farm.areaUnit ?? ''}</p>
              {farm.description && <p>{farm.description}</p>}
            </Card>
          ))}
        </div>
      )}
      <div className="notice">
        <Wheat aria-hidden="true" size={15} />
        <span>Sample farm and staff records. New fields are held in shared in-memory state and will not persist after reload.</span>
      </div>

      <div className="content-grid three" style={{ marginTop: 16 }}>
        <Card className="profile-card">
          <span className="stat-label">Farm profiles</span>
          {snapshot.farms.map((farm) => (
            <div key={farm.id} style={{ marginTop: 12 }}>
              <p className="panel-title">{farm.farmName} · {farm.totalArea} ac</p>
              <p className="panel-subtitle">{farm.farmer ?? 'Manager not recorded'} · {farm.location}</p>
            </div>
          ))}
        </Card>
        <Card className="stat-card">
          <span className="stat-label">Managed area</span>
          <p className="stat-value">{acreage.totalArea} ac</p>
          <span className="stat-note">Sample farm portfolio total</span>
          <span className="stat-note">{acreage.registeredArea} ac registered · {acreage.unregisteredArea} ac not assigned to fields</span>
          <span className="stat-note">{acreage.mappedFields} mapped fields · {acreage.unmappedFields} without boundaries</span>
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
        <Table caption="Registered farm fields" columns={fieldColumns} getRowKey={(field) => field.id} rows={snapshot.fields} />
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
            <label className="field">
              <span className="field-label">Farm</span>
              <select className="field-control" defaultValue="" name="farmId" required>
                <option disabled value="">Choose a farm</option>
                {snapshot.farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>{farm.farmName}</option>
                ))}
              </select>
            </label>
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
      <Modal description="Save a farm to your organization." onClose={() => setFarmModalOpen(false)} open={farmModalOpen} title="Add a farm">
        <form className="fv-fields-stack" onSubmit={(event) => void addOrganizationFarm(event)}>
          <Input autoFocus label="Farm name" name="name" required />
          <Input label="Location" name="location" required />
          <Input label="Address" name="address" required />
          <div className="content-grid two">
            <Input label="Farm area" min="0.01" name="area" required step="any" type="number" />
            <label className="field">
              <span className="field-label">Area unit</span>
              <select className="field-control" defaultValue="acre" name="areaUnit">
                <option value="acre">Acre</option>
                <option value="hectare">Hectare</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span className="field-label">Description</span>
            <textarea className="field-control" name="description" rows={3} />
          </label>
          {farmError && <p className="form-error" role="alert">{farmError}</p>}
          <div className="form-actions">
            <Button onClick={() => setFarmModalOpen(false)} type="button" variant="secondary">Cancel</Button>
            <Button type="submit">Save farm</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export { FarmManagementPage }

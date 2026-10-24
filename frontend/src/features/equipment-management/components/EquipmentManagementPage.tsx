import { useState, type FormEvent } from 'react'
import { CalendarClock, Plus, Tractor, Wrench } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { Table } from '../../../components/ui/Table'
import { equipmentRecords as initialEquipment, equipmentRepairs, equipmentUsage } from '../data/sampleData'
import type { EquipmentRecord, EquipmentRepair, EquipmentUsage } from '../types/equipment-management.types'

function EquipmentManagementPage() {
  const [equipment, setEquipment] = useState(initialEquipment)
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState('')

  function addEquipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const category = String(data.get('category') ?? '').trim()
    const lastService = String(data.get('lastService') ?? '').trim()
    const nextService = String(data.get('nextService') ?? '').trim()
    if (!name || !category) {
      setFormError('Equipment name and category are required.')
      return
    }
    setEquipment((current) => [
      ...current,
      {
        id: `equipment-${Date.now()}`,
        name,
        category,
        status: 'Available',
        lastService: lastService || 'Not recorded',
        nextService: nextService || 'Not scheduled',
      },
    ])
    setFormError('')
    setModalOpen(false)
    event.currentTarget.reset()
  }

  const equipmentColumns = [
    {
      key: 'equipment',
      header: 'Equipment',
      render: (row: EquipmentRecord) => (
        <>
          <span className="table-primary">{row.name}</span>
          <span className="table-secondary">{row.category}</span>
        </>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: EquipmentRecord) => <span className={`tag ${row.status === 'Maintenance due' ? 'warning' : ''}`}>{row.status}</span>,
    },
    { key: 'last', header: 'Last service', render: (row: EquipmentRecord) => row.lastService },
    { key: 'next', header: 'Next service', render: (row: EquipmentRecord) => row.nextService },
  ]
  const usageColumns = [
    { key: 'equipment', header: 'Equipment', render: (row: EquipmentUsage) => row.equipment },
    { key: 'activity', header: 'Activity', render: (row: EquipmentUsage) => row.activity },
    { key: 'date', header: 'Date', render: (row: EquipmentUsage) => row.date },
    { key: 'hours', header: 'Hours', render: (row: EquipmentUsage) => row.hours.toFixed(1) },
  ]
  const repairColumns = [
    { key: 'equipment', header: 'Equipment', render: (row: EquipmentRepair) => row.equipment },
    { key: 'repair', header: 'Repair / inspection', render: (row: EquipmentRepair) => row.repair },
    { key: 'date', header: 'Date', render: (row: EquipmentRepair) => row.date },
    { key: 'status', header: 'Status', render: (row: EquipmentRepair) => <span className={`tag ${row.status === 'Open' ? 'warning' : ''}`}>{row.status}</span> },
  ]
  const dueCount = equipment.filter((item) => item.status === 'Maintenance due').length

  return (
    <>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Operations / Equipment</p>
          <h1 className="page-title">Keep equipment field-ready</h1>
          <p className="page-description">Review equipment availability, usage records, upcoming service dates, and repair notes.</p>
        </div>
        <Button onClick={() => { setFormError(''); setModalOpen(true) }}><Plus aria-hidden="true" size={15} /> Add equipment</Button>
      </div>
      <div className="notice">
        <Tractor aria-hidden="true" size={15} />
        <span>Equipment, usage, and maintenance details are sample records. They are not linked to telemetry or service-provider systems.</span>
      </div>
      <div className="content-grid three" style={{ marginTop: 16 }}>
        <Card className="stat-card"><span className="stat-label">Equipment records</span><p className="stat-value">{equipment.length}</p><span className="stat-note">Sample fleet list</span></Card>
        <Card className="stat-card"><span className="stat-label">Maintenance due <CalendarClock aria-hidden="true" size={15} /></span><p className="stat-value">{dueCount}</p><span className="stat-note">Review service schedule</span></Card>
        <Card className="stat-card"><span className="stat-label">Open repair records <Wrench aria-hidden="true" size={15} /></span><p className="stat-value">{equipmentRepairs.filter((repair) => repair.status === 'Open').length}</p><span className="stat-note">Sample service log</span></Card>
      </div>
      <div className="section-heading"><div><h2>Equipment register</h2><p>Current status and service schedule</p></div></div>
      <Card padding={false}>
        <Table caption="Farm equipment register" columns={equipmentColumns} getRowKey={(row) => row.id} rows={equipment} />
      </Card>
      <div className="content-grid two">
        <section>
          <div className="section-heading"><div><h2>Usage history</h2><p>Sample equipment work log</p></div></div>
          <Card padding={false}>
            <Table caption="Equipment usage history" columns={usageColumns} getRowKey={(row) => row.id} rows={equipmentUsage} />
          </Card>
        </section>
        <section>
          <div className="section-heading"><div><h2>Repair records</h2><p>Recent maintenance notes</p></div></div>
          <Card padding={false}>
            <Table caption="Equipment repairs" columns={repairColumns} getRowKey={(row) => row.id} rows={equipmentRepairs} />
          </Card>
        </section>
      </div>
      <Modal description="Add an equipment record to the current demo view." onClose={() => setModalOpen(false)} open={modalOpen} title="Add equipment">
        <form onSubmit={addEquipment}>
          <div className="form-grid">
            <Input autoFocus label="Equipment name" name="name" placeholder="e.g. Field sprayer" required />
            <Input label="Category" name="category" placeholder="Tractor, irrigation..." required />
            <Input label="Last service date" name="lastService" placeholder="Optional" />
            <Input label="Next service date" name="nextService" placeholder="Optional" />
          </div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="form-actions">
            <Button onClick={() => setModalOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit">Add equipment</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export { EquipmentManagementPage }

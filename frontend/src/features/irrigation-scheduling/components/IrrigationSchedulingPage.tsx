import { useState, type FormEvent } from 'react'
import { Clock3, Droplets, Plus } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { Table } from '../../../components/ui/Table'
import {
  cropWaterRequirements,
  irrigationHistory,
  irrigationSchedules as initialSchedules,
} from '../data/sampleData'
import type {
  CropWaterRequirement,
  IrrigationHistory,
  IrrigationSchedule,
} from '../types/irrigation-scheduling.types'

function IrrigationSchedulingPage() {
  const [schedules, setSchedules] = useState(initialSchedules)
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState('')

  function addSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const field = String(data.get('field') ?? '').trim()
    const crop = String(data.get('crop') ?? '').trim()
    const date = String(data.get('date') ?? '')
    const durationHours = Number(data.get('duration'))
    const waterGallons = Number(data.get('water'))
    if (!field || !crop || !date || durationHours <= 0 || waterGallons <= 0) {
      setFormError('Provide a field, crop, date, and positive duration and water amount.')
      return
    }
    setSchedules((items) => [
      ...items,
      {
        id: `ir-${Date.now()}`,
        field,
        crop,
        date,
        durationHours,
        waterGallons,
        status: 'Scheduled',
      },
    ])
    setFormError('')
    setModalOpen(false)
    event.currentTarget.reset()
  }

  const scheduleColumns = [
    { key: 'date', header: 'Date', render: (row: IrrigationSchedule) => row.date },
    {
      key: 'field',
      header: 'Field / crop',
      render: (row: IrrigationSchedule) => (
        <>
          <span className="table-primary">{row.field}</span>
          <span className="table-secondary">{row.crop}</span>
        </>
      ),
    },
    { key: 'duration', header: 'Duration', render: (row: IrrigationSchedule) => `${row.durationHours} hr` },
    { key: 'water', header: 'Planned water', render: (row: IrrigationSchedule) => `${row.waterGallons.toLocaleString()} gal` },
    { key: 'status', header: 'Status', render: (row: IrrigationSchedule) => <span className={`tag ${row.status === 'Needs review' ? 'warning' : ''}`}>{row.status}</span> },
  ]
  const requirementColumns = [
    { key: 'crop', header: 'Crop', render: (row: CropWaterRequirement) => row.crop },
    { key: 'stage', header: 'Growth stage', render: (row: CropWaterRequirement) => row.stage },
    { key: 'need', header: 'Planning reference', render: (row: CropWaterRequirement) => `${row.inchesPerWeek.toFixed(1)} in/week` },
  ]
  const historyColumns = [
    { key: 'date', header: 'Date', render: (row: IrrigationHistory) => row.date },
    { key: 'field', header: 'Field', render: (row: IrrigationHistory) => row.field },
    { key: 'amount', header: 'Applied', render: (row: IrrigationHistory) => `${row.appliedInches.toFixed(1)} in` },
    { key: 'method', header: 'Method', render: (row: IrrigationHistory) => row.method },
  ]

  return (
    <>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Operations / Irrigation</p>
          <h1 className="page-title">Plan water with confidence</h1>
          <p className="page-description">Create irrigation schedules, review crop water planning references, and track recent application history.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus aria-hidden="true" size={15} /> Schedule irrigation</Button>
      </div>
      <div className="notice warning">
        <Droplets aria-hidden="true" size={15} />
        <span>Schedules and crop water figures are illustrative planning data. They are not sensor-verified or AI-generated recommendations.</span>
      </div>
      <div className="section-heading"><div><h2>Planning notes</h2><p>Rule-based reminders based on the sample records shown on this page</p></div></div>
      <div className="content-grid two">
        <Card>
          <span className="tag warning"><Clock3 aria-hidden="true" size={12} /> Check before dispatch</span>
          <h2 className="panel-title" style={{ marginTop: 12 }}>Review field conditions</h2>
          <p className="panel-subtitle">Confirm recent rainfall, soil moisture, and local restrictions before using a planned amount. This reminder is general guidance and does not use live measurements.</p>
        </Card>
        <Card>
          <span className="tag">Schedule overview</span>
          <p className="stat-value">{schedules.filter((entry) => entry.status === 'Scheduled').length}</p>
          <span className="stat-note">Sample upcoming irrigation runs</span>
        </Card>
      </div>
      <div className="section-heading"><div><h2>Upcoming irrigation</h2><p>Planned volume and duration by field</p></div></div>
      <Card padding={false}>
        <Table caption="Irrigation schedule" columns={scheduleColumns} getRowKey={(entry) => entry.id} rows={schedules} />
      </Card>
      <div className="content-grid two">
        <section>
          <div className="section-heading"><div><h2>Crop water requirements</h2><p>Illustrative weekly planning references</p></div></div>
          <Card padding={false}>
            <Table caption="Crop water requirement references" columns={requirementColumns} getRowKey={(entry) => entry.crop} rows={cropWaterRequirements} />
          </Card>
        </section>
        <section>
          <div className="section-heading"><div><h2>Irrigation history</h2><p>Recent sample applications</p></div></div>
          <Card padding={false}>
            <Table caption="Irrigation application history" columns={historyColumns} getRowKey={(entry) => entry.id} rows={irrigationHistory} />
          </Card>
        </section>
      </div>
      <Modal description="Add an irrigation run to the current demo view." onClose={() => setModalOpen(false)} open={modalOpen} title="Schedule irrigation">
        <form onSubmit={addSchedule}>
          <div className="form-grid">
            <Input autoFocus label="Field" name="field" placeholder="e.g. West Field" required />
            <Input label="Crop" name="crop" placeholder="e.g. Beans" required />
            <Input label="Schedule date" name="date" required type="date" />
            <Input label="Duration (hours)" min="0.1" name="duration" required step="0.1" type="number" />
            <Input label="Planned water (gallons)" min="1" name="water" required step="1" type="number" />
          </div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="form-actions">
            <Button onClick={() => setModalOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit">Save schedule</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export { IrrigationSchedulingPage }

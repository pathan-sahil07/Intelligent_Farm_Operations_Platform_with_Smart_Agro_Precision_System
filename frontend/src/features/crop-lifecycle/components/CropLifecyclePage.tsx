import { useState, type FormEvent } from 'react'
import { CalendarDays, Plus, Sprout } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { Table } from '../../../components/ui/Table'
import { cropRecords as initialCrops, fertilizerApplications } from '../data/sampleData'
import type { CropHealth, CropRecord, FertilizerApplication, GrowthStage } from '../types/crop-lifecycle.types'

function CropLifecyclePage() {
  const [crops, setCrops] = useState(initialCrops)
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState('')

  function addCrop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const crop = String(data.get('crop') ?? '').trim()
    const field = String(data.get('field') ?? '').trim()
    const sowingDate = String(data.get('sowingDate') ?? '')
    const harvestDate = String(data.get('harvestDate') ?? '')
    if (!crop || !field || !sowingDate || !harvestDate) {
      setFormError('Complete the crop, field, sowing date, and harvest date.')
      return
    }
    if (harvestDate < sowingDate) {
      setFormError('Harvest date must be on or after the sowing date.')
      return
    }
    setCrops((items) => [
      ...items,
      {
        id: `crop-${Date.now()}`,
        crop,
        variety: 'Unspecified',
        field,
        sowingDate,
        stage: 'Seedling',
        health: 'Healthy',
        harvestDate,
      },
    ])
    setFormError('')
    setModalOpen(false)
    event.currentTarget.reset()
  }

  const cropColumns = [
    {
      key: 'crop',
      header: 'Crop / variety',
      render: (row: CropRecord) => (
        <>
          <span className="table-primary">{row.crop}</span>
          <span className="table-secondary">{row.variety}</span>
        </>
      ),
    },
    { key: 'field', header: 'Field', render: (row: CropRecord) => row.field },
    { key: 'sowing', header: 'Sowing', render: (row: CropRecord) => row.sowingDate },
    { key: 'stage', header: 'Growth stage', render: (row: CropRecord) => <span className="tag">{row.stage}</span> },
    {
      key: 'health',
      header: 'Health',
      render: (row: CropRecord) => <span className={`tag ${row.health === 'Attention needed' ? 'danger' : row.health === 'Monitor' ? 'warning' : ''}`}>{row.health}</span>,
    },
    { key: 'harvest', header: 'Harvest plan', render: (row: CropRecord) => row.harvestDate },
  ]
  const fertilizerColumns = [
    { key: 'crop', header: 'Crop / field', render: (row: FertilizerApplication) => row.crop },
    { key: 'product', header: 'Product', render: (row: FertilizerApplication) => row.product },
    { key: 'date', header: 'Applied', render: (row: FertilizerApplication) => row.appliedOn },
    { key: 'amount', header: 'Amount', render: (row: FertilizerApplication) => row.amount },
  ]

  const stageCounts: GrowthStage[] = ['Seedling', 'Vegetative', 'Flowering', 'Maturing', 'Harvesting']
  const healthLevels: CropHealth[] = ['Healthy', 'Monitor', 'Attention needed']

  return (
    <>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Operations / Crop lifecycle</p>
          <h1 className="page-title">Follow every crop stage</h1>
          <p className="page-description">Track sowing, growth stage, crop health, fertilizer applications, and expected harvest dates.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus aria-hidden="true" size={15} /> Add crop record</Button>
      </div>
      <div className="notice">
        <Sprout aria-hidden="true" size={15} />
        <span>Crop observations and dates shown are sample records. Health status reflects demo entries, not a diagnosis.</span>
      </div>
      <div className="section-heading"><div><h2>Season overview</h2><p>Sample crop counts by growth and health status</p></div></div>
      <div className="content-grid two">
        <Card>
          <h2 className="panel-title">Growth stages</h2>
          <ul className="compact-list">
            {stageCounts.map((stage) => (
              <li key={stage}><span>{stage}</span><strong>{crops.filter((crop) => crop.stage === stage).length}</strong></li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="panel-title">Crop health entries</h2>
          <ul className="compact-list">
            {healthLevels.map((health) => (
              <li key={health}><span>{health}</span><strong>{crops.filter((crop) => crop.health === health).length}</strong></li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="section-heading"><div><h2>Crop records</h2><p>Sowing dates, stages, health checks, and harvest schedule</p></div><span className="tag"><CalendarDays aria-hidden="true" size={12} /> {crops.length} records</span></div>
      <Card padding={false}>
        <Table caption="Crop lifecycle records" columns={cropColumns} getRowKey={(crop) => crop.id} rows={crops} />
      </Card>
      <div className="section-heading"><div><h2>Fertilizer applications</h2><p>Sample application history</p></div></div>
      <Card padding={false}>
        <Table caption="Fertilizer application history" columns={fertilizerColumns} getRowKey={(entry) => entry.id} rows={fertilizerApplications} />
      </Card>
      <Modal description="Add a crop record to the current demo view." onClose={() => setModalOpen(false)} open={modalOpen} title="Add crop record">
        <form onSubmit={addCrop}>
          <div className="form-grid">
            <Input autoFocus label="Crop" name="crop" placeholder="e.g. Peppers" required />
            <Input label="Field" name="field" placeholder="e.g. West Meadow" required />
            <Input label="Sowing date" name="sowingDate" required type="date" />
            <Input label="Expected harvest" name="harvestDate" required type="date" />
          </div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="form-actions">
            <Button onClick={() => setModalOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit">Save crop</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export { CropLifecyclePage }

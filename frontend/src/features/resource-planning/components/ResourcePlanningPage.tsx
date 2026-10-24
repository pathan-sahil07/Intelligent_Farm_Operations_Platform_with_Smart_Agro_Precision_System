import { useState, type FormEvent } from 'react'
import { ClipboardList, Plus, Scale } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { Table } from '../../../components/ui/Table'
import { resourceAllocations as initialAllocations } from '../data/sampleData'
import type { ResourceAllocation, ResourceCategory } from '../types/resource-planning.types'

const categories: ResourceCategory[] = ['Seeds', 'Fertilizer', 'Water', 'Labour', 'Other']

function ResourcePlanningPage() {
  const [allocations, setAllocations] = useState(initialAllocations)
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState('')

  function addAllocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const resource = String(data.get('resource') ?? '').trim()
    const category = String(data.get('category') ?? '') as ResourceCategory
    const quantity = Number(data.get('quantity'))
    const unit = String(data.get('unit') ?? '').trim()
    const field = String(data.get('field') ?? '').trim()
    const period = String(data.get('period') ?? '').trim()
    if (!resource || !categories.includes(category) || quantity <= 0 || !unit || !field || !period) {
      setFormError('Complete all fields and enter a quantity greater than zero.')
      return
    }
    setAllocations((items) => [
      ...items,
      { id: `allocation-${Date.now()}`, resource, category, quantity, unit, field, period },
    ])
    setFormError('')
    setModalOpen(false)
    event.currentTarget.reset()
  }

  const columns = [
    {
      key: 'resource',
      header: 'Resource',
      render: (row: ResourceAllocation) => (
        <>
          <span className="table-primary">{row.resource}</span>
          <span className="table-secondary">{row.category}</span>
        </>
      ),
    },
    { key: 'amount', header: 'Planned amount', render: (row: ResourceAllocation) => `${row.quantity} ${row.unit}` },
    { key: 'field', header: 'Allocation', render: (row: ResourceAllocation) => row.field },
    { key: 'period', header: 'Period', render: (row: ResourceAllocation) => row.period },
  ]

  return (
    <>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Operations / Resource planning</p>
          <h1 className="page-title">Put resources where they matter</h1>
          <p className="page-description">Plan seeds, fertilizer, water, labour, and other inputs against fields and work periods.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus aria-hidden="true" size={15} /> Add allocation</Button>
      </div>
      <div className="notice">
        <Scale aria-hidden="true" size={15} />
        <span>Allocations are sample plans held only in this browser view; they are not reservations or verified stock balances.</span>
      </div>
      <div className="section-heading"><div><h2>Allocation overview</h2><p>Current sample plan by resource type</p></div></div>
      <div className="content-grid four">
        {categories.map((category) => (
          <Card className="stat-card" key={category}>
            <span className="stat-label">{category}</span>
            <p className="stat-value">{allocations.filter((allocation) => allocation.category === category).length}</p>
            <span className="stat-note">planned allocation(s)</span>
          </Card>
        ))}
      </div>
      <div className="section-heading"><div><h2>Resource allocations</h2><p>Sample plans by amount, field, and period</p></div><span className="tag"><ClipboardList aria-hidden="true" size={12} /> {allocations.length} plans</span></div>
      <Card padding={false}>
        <Table caption="Farm resource allocations" columns={columns} getRowKey={(row) => row.id} rows={allocations} />
      </Card>
      <Modal description="Create a local resource plan entry." onClose={() => setModalOpen(false)} open={modalOpen} title="Add resource allocation">
        <form onSubmit={addAllocation}>
          <div className="form-grid">
            <Input autoFocus label="Resource" name="resource" placeholder="e.g. Cover crop seed" required />
            <label className="field">
              <span className="field-label">Category</span>
              <select className="field-control" defaultValue="" name="category" required>
                <option disabled value="">Choose a category</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <Input label="Quantity" min="0.1" name="quantity" required step="0.1" type="number" />
            <Input label="Unit" name="unit" placeholder="lb, gal, hours..." required />
            <Input label="Field or area" name="field" placeholder="e.g. North Orchard" required />
            <Input label="Planning period" name="period" placeholder="e.g. November" required />
          </div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="form-actions">
            <Button onClick={() => setModalOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit">Save allocation</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export { ResourcePlanningPage }

import { useState, type FormEvent } from 'react'
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Package, Plus } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { Table } from '../../../components/ui/Table'
import { inventoryItems as initialItems, stockMovements as initialMovements } from '../data/sampleData'
import type { InventoryItem, StockMovement } from '../types/inventory-management.types'

type ModalMode = 'item' | 'movement' | null

function InventoryManagementPage() {
  const [items, setItems] = useState(initialItems)
  const [movements, setMovements] = useState(initialMovements)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [formError, setFormError] = useState('')
  const lowStock = items.filter((item) => item.quantity <= item.minimum)

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const category = String(data.get('category') ?? '').trim()
    const quantity = Number(data.get('quantity'))
    const unit = String(data.get('unit') ?? '').trim()
    const minimum = Number(data.get('minimum'))
    const expiryDate = String(data.get('expiryDate') ?? '')
    if (!name || !category || quantity < 0 || !unit || minimum < 0) {
      setFormError('Enter an item, category, unit, and valid stock quantities.')
      return
    }
    setItems((current) => [
      ...current,
      { id: `item-${Date.now()}`, name, category, quantity, unit, minimum, expiryDate },
    ])
    setFormError('')
    setModalMode(null)
    event.currentTarget.reset()
  }

  function recordMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const itemId = String(data.get('itemId') ?? '')
    const kind = String(data.get('kind') ?? '') as StockMovement['kind']
    const quantity = Number(data.get('quantity'))
    const note = String(data.get('note') ?? '').trim()
    const item = items.find((entry) => entry.id === itemId)
    if (!item || !['Purchase', 'Consumption'].includes(kind) || quantity <= 0) {
      setFormError('Choose an item and movement type, then enter a quantity greater than zero.')
      return
    }
    if (kind === 'Consumption' && quantity > item.quantity) {
      setFormError(`Only ${item.quantity} ${item.unit} are currently listed in this demo stock.`)
      return
    }
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? { ...entry, quantity: entry.quantity + (kind === 'Purchase' ? quantity : -quantity) }
          : entry,
      ),
    )
    setMovements((current) => [
      {
        id: `movement-${Date.now()}`,
        itemId,
        itemName: item.name,
        kind,
        quantity,
        unit: item.unit,
        date: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date()),
        note: note || (kind === 'Purchase' ? 'Stock received' : 'Stock used'),
      },
      ...current,
    ])
    setFormError('')
    setModalMode(null)
    event.currentTarget.reset()
  }

  const itemColumns = [
    {
      key: 'item',
      header: 'Item',
      render: (item: InventoryItem) => (
        <>
          <span className="table-primary">{item.name}</span>
          <span className="table-secondary">{item.category}</span>
        </>
      ),
    },
    { key: 'stock', header: 'On hand', render: (item: InventoryItem) => `${item.quantity} ${item.unit}` },
    {
      key: 'minimum',
      header: 'Stock status',
      render: (item: InventoryItem) =>
        item.quantity <= item.minimum ? (
          <span className="tag warning">Low · min {item.minimum}</span>
        ) : (
          <span className="tag">In range</span>
        ),
    },
    {
      key: 'expiry',
      header: 'Expiry',
      render: (item: InventoryItem) => item.expiryDate || <span className="muted">Not applicable</span>,
    },
  ]
  const movementColumns = [
    {
      key: 'kind',
      header: 'Movement',
      render: (movement: StockMovement) => (
        <span className={`tag ${movement.kind === 'Purchase' ? '' : 'neutral'}`}>
          {movement.kind === 'Purchase' ? <ArrowDownToLine aria-hidden="true" size={12} /> : <ArrowUpFromLine aria-hidden="true" size={12} />}
          {movement.kind}
        </span>
      ),
    },
    { key: 'item', header: 'Item', render: (movement: StockMovement) => movement.itemName },
    { key: 'quantity', header: 'Quantity', render: (movement: StockMovement) => `${movement.quantity} ${movement.unit}` },
    { key: 'date', header: 'Date', render: (movement: StockMovement) => movement.date },
    { key: 'note', header: 'Note', render: (movement: StockMovement) => movement.note },
  ]

  return (
    <>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Operations / Inventory</p>
          <h1 className="page-title">Know what is in stock</h1>
          <p className="page-description">Review quantities, low-stock thresholds, expiry dates, purchases, and consumption.</p>
        </div>
        <div className="inline-actions">
          <Button onClick={() => { setFormError(''); setModalMode('movement') }} variant="secondary">
            <ArrowUpFromLine aria-hidden="true" size={14} /> Record movement
          </Button>
          <Button onClick={() => { setFormError(''); setModalMode('item') }}>
            <Plus aria-hidden="true" size={15} /> Add item
          </Button>
        </div>
      </div>
      <div className="notice warning">
        <Package aria-hidden="true" size={15} />
        <span>Inventory and movement history are sample entries. Stock updates made here are temporary and not connected to purchasing or accounting systems.</span>
      </div>
      <div className="content-grid three" style={{ marginTop: 16 }}>
        <Card className="stat-card">
          <span className="stat-label">Tracked items</span>
          <p className="stat-value">{items.length}</p>
          <span className="stat-note">Current demo list</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-label">Low-stock alerts <AlertTriangle aria-hidden="true" size={15} /></span>
          <p className="stat-value">{lowStock.length}</p>
          <span className="stat-note">At or below sample minimum</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-label">Expiry dates recorded</span>
          <p className="stat-value">{items.filter((item) => item.expiryDate).length}</p>
          <span className="stat-note">Check supplier labels before use</span>
        </Card>
      </div>
      {lowStock.length > 0 && (
        <div className="low-stock-list" role="status">
          {lowStock.map((item) => (
            <span className="tag warning" key={item.id}>
              <AlertTriangle aria-hidden="true" size={12} /> {item.name}: {item.quantity} {item.unit} listed
            </span>
          ))}
        </div>
      )}
      <div className="section-heading"><div><h2>Inventory list</h2><p>Sample quantity, threshold, and expiry information</p></div></div>
      <Card padding={false}>
        <Table caption="Inventory stock" columns={itemColumns} getRowKey={(item) => item.id} rows={items} />
      </Card>
      <div className="section-heading"><div><h2>Purchases and consumption</h2><p>Sample stock movement ledger</p></div></div>
      <Card padding={false}>
        <Table caption="Inventory purchase and consumption history" columns={movementColumns} getRowKey={(movement) => movement.id} rows={movements} />
      </Card>
      <Modal description={modalMode === 'item' ? 'Add an item to local demo inventory.' : 'Record a purchase or consumption and update local demo stock.'} onClose={() => setModalMode(null)} open={modalMode !== null} title={modalMode === 'item' ? 'Add inventory item' : 'Record stock movement'}>
        {modalMode === 'item' ? (
          <form onSubmit={addItem}>
            <div className="form-grid">
              <Input autoFocus label="Item name" name="name" placeholder="e.g. Pea seed" required />
              <Input label="Category" name="category" placeholder="Seeds, fertilizer..." required />
              <Input label="Opening quantity" min="0" name="quantity" required step="0.1" type="number" />
              <Input label="Unit" name="unit" placeholder="lb, bags, gal..." required />
              <Input label="Low-stock threshold" min="0" name="minimum" required step="0.1" type="number" />
              <Input label="Expiry date (optional)" name="expiryDate" type="date" />
            </div>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="form-actions">
              <Button onClick={() => setModalMode(null)} variant="secondary">Cancel</Button>
              <Button type="submit">Add item</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={recordMovement}>
            <div className="form-grid">
              <label className="field">
                <span className="field-label">Inventory item</span>
                <select className="field-control" defaultValue="" name="itemId" required>
                  <option disabled value="">Choose an item</option>
                  {items.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.quantity} {item.unit}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="field-label">Movement type</span>
                <select className="field-control" defaultValue="" name="kind" required>
                  <option disabled value="">Choose a type</option>
                  <option value="Purchase">Purchase / stock received</option>
                  <option value="Consumption">Consumption / stock used</option>
                </select>
              </label>
              <Input autoFocus label="Quantity" min="0.1" name="quantity" required step="0.1" type="number" />
              <Input label="Note" name="note" placeholder="Optional note" />
            </div>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="form-actions">
              <Button onClick={() => setModalMode(null)} variant="secondary">Cancel</Button>
              <Button type="submit">Save movement</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}

export { InventoryManagementPage }

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { inventoryApi } from '@/api/endpoints'
import { INVENTORY_CATEGORIES, type InventoryItem, type Supplier } from '@/api/types'
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
import { formatDate, formatDateTime, formatMoney, formatNumber, options } from '@/lib/format'

const KEYS = ['inventory', 'inventory-tx', 'suppliers', 'dashboard', 'analytics']

export default function InventoryPage() {
  const { can } = useAuth()
  const { farmId } = useFarm()
  const { run } = useRun(KEYS)
  const canWrite = can('INVENTORY_WRITE')
  const [category, setCategory] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | 'new' | null>(null)
  const [txItem, setTxItem] = useState<InventoryItem | null>(null)
  const [deleting, setDeleting] = useState<InventoryItem | null>(null)
  const [supplier, setSupplier] = useState<Supplier | 'new' | null>(null)
  const [delSupplier, setDelSupplier] = useState<Supplier | null>(null)

  const items = useQuery({ queryKey: ['inventory', farmId, category, lowOnly], queryFn: () => inventoryApi.list({ farmId, category, lowStock: lowOnly || undefined }), enabled: !!farmId })
  const suppliers = useQuery({ queryKey: ['suppliers', farmId], queryFn: () => inventoryApi.suppliers({ farmId }), enabled: !!farmId })
  const history = useQuery({ queryKey: ['inventory-tx', farmId], queryFn: () => inventoryApi.history({ farmId, size: 50 }), enabled: !!farmId })
  const purchases = useQuery({ queryKey: ['inventory-tx', farmId, 'purchases'], queryFn: () => inventoryApi.purchases({ farmId, size: 50 }), enabled: !!farmId })

  const supplierOptions = (suppliers.data ?? []).map((s) => ({ value: String(s.id), label: s.name }))
  const itemName = (id: number) => items.data?.find((i) => i.id === id)?.name ?? `Item #${id}`
  const supplierName = (id: number | null) => (id ? (suppliers.data?.find((s) => s.id === id)?.name ?? `#${id}`) : '—')

  if (!farmId) return <NoFarm />
  return (
    <>
      <PageHeader title="Inventory" description="Seeds, fertilizers, pesticides and consumables with stock movements and low-stock alerts."
        actions={canWrite && <Button onClick={() => setEditing('new')}><Plus size={16} aria-hidden="true" /> Add item</Button>} />
      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Stock</TabsTrigger>
          <TabsTrigger value="history">Movements</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Panel title="Items" actions={
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label="Filter by category" className="field-control !w-auto !py-1.5" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>{INVENTORY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Low stock only</label>
            </div>}>
            <DataTable caption="Inventory items" rows={items.data} loading={items.isLoading} error={items.error} onRetry={() => items.refetch()} getKey={(i) => i.id} emptyTitle="No inventory items"
              columns={[
                { key: 'n', header: 'Item', cell: (i) => <span className="font-medium">{i.name}</span> },
                { key: 'c', header: 'Category', cell: (i) => i.category },
                { key: 'q', header: 'In stock', cell: (i) => `${formatNumber(i.quantity)} ${i.unit}` },
                { key: 'r', header: 'Reorder at', cell: (i) => formatNumber(i.reorderLevel) },
                { key: 'e', header: 'Expiry', cell: (i) => formatDate(i.expiryDate) },
                { key: 's', header: 'Status', cell: (i) => (i.lowStock ? <StatusBadge value="LOW_STOCK" /> : <StatusBadge value="OK" />) },
                { key: 'a', header: '', cell: (i) => canWrite && (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="secondary" onClick={() => setTxItem(i)}>Stock in/out</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(i)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(i)}>Delete</Button>
                  </div>) },
              ]} />
          </Panel>
        </TabsContent>

        <TabsContent value="history">
          <Panel title="Stock movements">
            <DataTable caption="Stock movements" rows={history.data?.content} loading={history.isLoading} error={history.error} getKey={(t) => t.id} emptyTitle="No movements"
              columns={[
                { key: 'd', header: 'When', cell: (t) => formatDateTime(t.createdAt) },
                { key: 'i', header: 'Item', cell: (t) => itemName(t.inventoryItemId) },
                { key: 't', header: 'Type', cell: (t) => <StatusBadge value={t.transactionType} /> },
                { key: 'q', header: 'Quantity', cell: (t) => formatNumber(t.quantity) },
                { key: 'n', header: 'Notes', cell: (t) => t.notes ?? '—' },
              ]} />
          </Panel>
        </TabsContent>

        <TabsContent value="purchases">
          <Panel title="Purchase records">
            <DataTable caption="Purchases" rows={purchases.data?.content} loading={purchases.isLoading} error={purchases.error} getKey={(t) => t.id} emptyTitle="No purchases recorded"
              columns={[
                { key: 'd', header: 'When', cell: (t) => formatDateTime(t.createdAt) },
                { key: 'i', header: 'Item', cell: (t) => itemName(t.inventoryItemId) },
                { key: 'q', header: 'Quantity', cell: (t) => formatNumber(t.quantity) },
                { key: 'u', header: 'Unit cost', cell: (t) => formatMoney(t.unitCost) },
                { key: 's', header: 'Supplier', cell: (t) => supplierName(t.supplierId) },
              ]} />
          </Panel>
        </TabsContent>

        <TabsContent value="suppliers">
          <Panel title="Suppliers" actions={canWrite && <Button size="sm" onClick={() => setSupplier('new')}>Add supplier</Button>}>
            <DataTable caption="Suppliers" rows={suppliers.data} loading={suppliers.isLoading} error={suppliers.error} getKey={(s) => s.id} emptyTitle="No suppliers"
              columns={[
                { key: 'n', header: 'Name', cell: (s) => s.name },
                { key: 'c', header: 'Contact', cell: (s) => s.contactPerson ?? '—' },
                { key: 'p', header: 'Phone', cell: (s) => s.phone ?? '—' },
                { key: 'e', header: 'Email', cell: (s) => s.email ?? '—' },
                { key: 'a', header: '', cell: (s) => canWrite && (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setSupplier(s)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDelSupplier(s)}>Delete</Button>
                  </div>) },
              ]} />
          </Panel>
        </TabsContent>
      </Tabs>

      <FormDialog open={editing !== null} title={editing === 'new' ? 'Add inventory item' : 'Edit item'}
        description={editing === 'new' ? undefined : 'Change stock with “Stock in/out” so movements are recorded.'}
        fields={[
          { name: 'name', label: 'Name', required: true },
          { name: 'category', label: 'Category', type: 'select', required: true, options: options(INVENTORY_CATEGORIES) },
          { name: 'unit', label: 'Unit', required: true },
          ...(editing === 'new' ? [{ name: 'quantity', label: 'Opening quantity', type: 'number' as const, min: 0 }] : []),
          { name: 'reorderLevel', label: 'Reorder level', type: 'number', min: 0 },
          { name: 'unitCost', label: 'Unit cost', type: 'number', min: 0, step: 'any' },
          { name: 'expiryDate', label: 'Expiry date', type: 'date' },
          { name: 'supplierId', label: 'Supplier', type: 'select', options: supplierOptions },
        ]}
        initial={editing && editing !== 'new' ? { ...editing } : { category: 'SEED', quantity: 0, reorderLevel: 0 }}
        onClose={() => setEditing(null)}
        onSubmit={(v) => {
          const body = { ...v, farmId, supplierId: v.supplierId ? Number(v.supplierId) : null } as never
          return run(() => (editing && editing !== 'new' ? inventoryApi.update(editing.id, body) : inventoryApi.create(body)), 'Item saved')
        }} />
      <FormDialog open={txItem !== null} title={`Stock movement: ${txItem?.name ?? ''}`} description="Stock out cannot exceed the quantity on hand." fields={[
        { name: 'transactionType', label: 'Type', type: 'select', required: true, options: options(['PURCHASE', 'USAGE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT']) },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 0.01, step: 'any' },
        { name: 'unitCost', label: 'Unit cost (purchases)', type: 'number', min: 0, step: 'any' },
        { name: 'supplierId', label: 'Supplier', type: 'select', options: supplierOptions },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]} initial={{ transactionType: 'PURCHASE' }} onClose={() => setTxItem(null)}
        onSubmit={(v) => run(() => inventoryApi.transact(txItem!.id, { ...v, supplierId: v.supplierId ? Number(v.supplierId) : null } as never), 'Stock updated')} />
      <FormDialog open={supplier !== null} title={supplier === 'new' ? 'Add supplier' : 'Edit supplier'} fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'contactPerson', label: 'Contact person' },
        { name: 'phone', label: 'Phone' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'address', label: 'Address', type: 'textarea' },
      ]} initial={supplier && supplier !== 'new' ? { ...supplier } : {}} onClose={() => setSupplier(null)}
        onSubmit={(v) => run(() => (supplier && supplier !== 'new' ? inventoryApi.updateSupplier(supplier.id, { ...v, farmId }) : inventoryApi.createSupplier({ ...v, farmId })), 'Supplier saved')} />
      <ConfirmAction open={deleting !== null} title="Delete item?" message={`“${deleting?.name}” and its movement history will be removed.`} onCancel={() => setDeleting(null)}
        onConfirm={() => run(() => inventoryApi.remove(deleting!.id), 'Item deleted')} />
      <ConfirmAction open={delSupplier !== null} title="Delete supplier?" message={`“${delSupplier?.name}” will be removed.`} onCancel={() => setDelSupplier(null)}
        onConfirm={() => run(() => inventoryApi.removeSupplier(delSupplier!.id), 'Supplier deleted')} />
    </>
  )
}

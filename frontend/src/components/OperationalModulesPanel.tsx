import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Equipment, type InventoryItem } from '../services/api'

type Module = 'Analytics' | 'Inventory' | 'Equipment' | 'Resources' | 'Weather' | 'GIS Farm Mapping'
type Props = { module: Module }

const errorText = (error: unknown) => error instanceof Error ? error.message : 'The request failed.'

export default function OperationalModulesPanel({ module }: Props) {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [form, setForm] = useState<Record<string, string>>({})
  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }))
  const refresh = (key: string) => queryClient.invalidateQueries({ queryKey: [key] })

  const analytics = useQuery({ queryKey: ['analytics'], queryFn: api.getAnalytics, enabled: module === 'Analytics' })
  const inventory = useQuery({ queryKey: ['inventory'], queryFn: api.getInventory, enabled: module === 'Inventory' })
  const equipment = useQuery({ queryKey: ['equipment'], queryFn: api.getEquipment, enabled: module === 'Equipment' })
  const resources = useQuery({ queryKey: ['resources'], queryFn: api.getResources, enabled: module === 'Resources' })
  const weather = useQuery({ queryKey: ['weather', form.latitude, form.longitude], queryFn: () => api.getWeather(Number(form.latitude), Number(form.longitude)), enabled: module === 'Weather' && !!form.latitude && !!form.longitude })
  const gis = useQuery({ queryKey: ['gis-farms'], queryFn: api.getGisFarms, enabled: module === 'GIS Farm Mapping' })

  const inventoryCreate = useMutation({ mutationFn: api.createInventory, onSuccess: () => { refresh('inventory'); setMessage('Inventory item saved.') }, onError: error => setMessage(errorText(error)) })
  const inventoryConsume = useMutation({ mutationFn: ({ id, quantity }: { id: number; quantity: number }) => api.consumeInventory(id, quantity), onSuccess: () => { refresh('inventory'); setMessage('Stock consumption recorded.') }, onError: error => setMessage(errorText(error)) })
  const equipmentCreate = useMutation({ mutationFn: api.createEquipment, onSuccess: () => { refresh('equipment'); setMessage('Equipment saved.') }, onError: error => setMessage(errorText(error)) })
  const resourceCreate = useMutation({ mutationFn: api.createResource, onSuccess: () => { refresh('resources'); setMessage('Resource plan saved.') }, onError: error => setMessage(errorText(error)) })
  const resourceConsume = useMutation({ mutationFn: ({ id, quantity }: { id: number; quantity: number }) => api.consumeResource(id, quantity), onSuccess: () => { refresh('resources'); setMessage('Resource consumption recorded.') }, onError: error => setMessage(errorText(error)) })

  if (module === 'Analytics') {
    if (analytics.isLoading) return <Loading label="analytics" />
    if (analytics.isError) return <ErrorPanel message={errorText(analytics.error)} />
    const data = analytics.data
    return <section className="panel operational-panel"><ModuleHeader eyebrow="DATABASE-BACKED METRICS" title="Farm analytics" detail="Live totals calculated from persisted farm operations." />
      <div className="metric-grid">{data && Object.entries(data).map(([label, value]) => <div className="metric-card" key={label}><strong>{typeof value === 'number' ? value.toLocaleString() : String(value)}</strong><span>{label.replace(/[A-Z]/g, letter => ` ${letter}`).trim()}</span></div>)}</div>
    </section>
  }

  if (module === 'Inventory') {
    const rows = inventory.data ?? []
    return <section className="panel operational-panel"><ModuleHeader eyebrow="STOCK CONTROL" title="Inventory" detail="Track seed, fertilizer, pesticide and supply quantities with transaction history." />
      <FormGrid onSubmit={event => { event.preventDefault(); inventoryCreate.mutate({ farmId: Number(form.farmId) || null, name: form.name || '', category: form.category || 'Seeds', unit: form.unit || 'kg', quantity: Number(form.quantity) || 0, reorderLevel: Number(form.reorderLevel) || 0, unitCost: Number(form.unitCost) || 0, expiryDate: form.expiryDate || null }) }} submit="Add stock item">
        <input required placeholder="Item name" value={form.name || ''} onChange={event => set('name', event.target.value)} />
        <input required placeholder="Category (Seeds)" value={form.category || ''} onChange={event => set('category', event.target.value)} />
        <input required placeholder="Unit (kg)" value={form.unit || ''} onChange={event => set('unit', event.target.value)} />
        <input required type="number" min="0" placeholder="Opening quantity" value={form.quantity || ''} onChange={event => set('quantity', event.target.value)} />
        <input type="number" min="0" placeholder="Reorder level" value={form.reorderLevel || ''} onChange={event => set('reorderLevel', event.target.value)} />
        <input type="number" min="0" step="0.01" placeholder="Unit cost" value={form.unitCost || ''} onChange={event => set('unitCost', event.target.value)} />
      </FormGrid>
      <OperationRows rows={rows} kind="inventory" onAction={(item: InventoryItem) => { const quantity = window.prompt(`Consume ${item.name} quantity`, '1'); if (quantity) inventoryConsume.mutate({ id: item.id, quantity: Number(quantity) }) }} />
      {message && <p className="module-message">{message}</p>}
    </section>
  }

  if (module === 'Equipment') {
    const rows = equipment.data ?? []
    return <section className="panel operational-panel"><ModuleHeader eyebrow="ASSET OPERATIONS" title="Equipment" detail="Register machinery and keep maintenance planning visible." />
      <FormGrid onSubmit={event => { event.preventDefault(); equipmentCreate.mutate({ farmId: Number(form.farmId) || null, name: form.name || '', category: form.category || 'Machinery', identifier: form.identifier || null, status: form.status || 'AVAILABLE' }) }} submit="Add equipment">
        <input required placeholder="Equipment name" value={form.name || ''} onChange={event => set('name', event.target.value)} />
        <input required placeholder="Category" value={form.category || ''} onChange={event => set('category', event.target.value)} />
        <input placeholder="Identifier / registration" value={form.identifier || ''} onChange={event => set('identifier', event.target.value)} />
        <select value={form.status || 'AVAILABLE'} onChange={event => set('status', event.target.value)}><option>AVAILABLE</option><option>IN_USE</option><option>MAINTENANCE</option></select>
      </FormGrid>
      <OperationRows rows={rows} kind="equipment" />
      {message && <p className="module-message">{message}</p>}
    </section>
  }

  if (module === 'Resources') {
    const rows = resources.data ?? []
    return <section className="panel operational-panel"><ModuleHeader eyebrow="SEASON PLANNING" title="Farm resources" detail="Plan labour, seed, fertilizer and water, then record consumption." />
      <FormGrid onSubmit={event => { event.preventDefault(); resourceCreate.mutate({ farmId: Number(form.farmId) || null, name: form.name || '', category: form.category || 'Water', unit: form.unit || 'liters', plannedQuantity: Number(form.quantity) || 0, consumedQuantity: 0, cost: Number(form.cost) || 0, season: form.season || null }) }} submit="Add resource plan">
        <input required placeholder="Resource name" value={form.name || ''} onChange={event => set('name', event.target.value)} />
        <input required placeholder="Category" value={form.category || ''} onChange={event => set('category', event.target.value)} />
        <input required placeholder="Unit" value={form.unit || ''} onChange={event => set('unit', event.target.value)} />
        <input required type="number" min="0" placeholder="Planned quantity" value={form.quantity || ''} onChange={event => set('quantity', event.target.value)} />
        <input type="number" min="0" step="0.01" placeholder="Budget / cost" value={form.cost || ''} onChange={event => set('cost', event.target.value)} />
        <input placeholder="Season" value={form.season || ''} onChange={event => set('season', event.target.value)} />
      </FormGrid>
      <div className="operations-list">{rows.length ? rows.map(resource => <article className="operation-row" key={resource.id}><strong>{resource.name}</strong><span>{resource.category}</span><span>{resource.consumedQuantity} / {resource.plannedQuantity} {resource.unit}</span><button className="btn btn-secondary" onClick={() => { const quantity = window.prompt('Consume quantity', '1'); if (quantity) resourceConsume.mutate({ id: resource.id, quantity: Number(quantity) }) }}>Consume</button></article>) : <Empty />}</div>
      {message && <p className="module-message">{message}</p>}
    </section>
  }

  if (module === 'Weather') {
    const current = weather.data?.current_weather
    return <section className="panel operational-panel"><ModuleHeader eyebrow="LIVE PROVIDER DATA" title="Weather monitoring" detail="Load current conditions for any farm coordinate. No values are fabricated." />
      <FormGrid onSubmit={event => { event.preventDefault(); void weather.refetch() }} submit="Load weather"><input required type="number" step="any" placeholder="Latitude" value={form.latitude || ''} onChange={event => set('latitude', event.target.value)} /><input required type="number" step="any" placeholder="Longitude" value={form.longitude || ''} onChange={event => set('longitude', event.target.value)} /></FormGrid>
      {weather.isError && <p className="error-text">{errorText(weather.error)} Configure WEATHER_PROVIDER_URL on the backend.</p>}
      {current && <div className="weather-result"><strong>{current.temperature}°</strong><span>Wind {current.windspeed} km/h · Updated {current.time}</span></div>}
    </section>
  }

  if (module === 'GIS Farm Mapping') {
    return <section className="panel operational-panel"><ModuleHeader eyebrow="GEOSPATIAL FARM VIEW" title="GIS farm mapping" detail="Farm coordinates are served as GeoJSON for map clients." />
      <div className="operations-list">{gis.isLoading ? <Loading label="farm locations" /> : gis.data?.features.length ? gis.data.features.map(feature => <article className="operation-row" key={feature.properties.id}><strong>{feature.properties.name}</strong><span>Latitude {feature.geometry.coordinates[1].toFixed(4)}</span><span>Longitude {feature.geometry.coordinates[0].toFixed(4)}</span><a className="text-btn" href={`https://www.openstreetmap.org/?mlat=${feature.geometry.coordinates[1]}&mlon=${feature.geometry.coordinates[0]}#map=15/${feature.geometry.coordinates[1]}/${feature.geometry.coordinates[0]}`} target="_blank" rel="noreferrer">Open map ↗</a></article>) : <Empty />}</div>
    </section>
  }

  return <Loading label="module" />
}

function ModuleHeader({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return <div className="panel-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{detail}</p></div></div>
}

function FormGrid({ children, onSubmit, submit }: { children: ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void; submit: string }) {
  return <form className="module-form" onSubmit={onSubmit}><div className="module-form-grid">{children}</div><button className="btn btn-primary" type="submit">{submit}</button></form>
}

function OperationRows({ rows, kind, onAction }: { rows: Array<InventoryItem | Equipment>; kind: 'inventory' | 'equipment'; onAction?: (item: InventoryItem) => void }) {
  return <div className="operations-list">{rows.length ? rows.map(item => <article className="operation-row" key={item.id}><strong>{item.name}</strong><span>{item.category}</span><span>{kind === 'inventory' ? `${(item as InventoryItem).quantity} ${(item as InventoryItem).unit}` : (item as Equipment).status}</span>{onAction && <button className="btn btn-secondary" onClick={() => onAction(item as InventoryItem)}>Consume</button>}</article>) : <Empty />}</div>
}

function Empty() { return <p className="empty-state">No records yet. Add the first record above.</p> }
function Loading({ label }: { label: string }) { return <section className="panel"><p>Loading {label}…</p></section> }
function ErrorPanel({ message }: { message: string }) { return <section className="panel"><p className="error-text">{message}</p></section> }

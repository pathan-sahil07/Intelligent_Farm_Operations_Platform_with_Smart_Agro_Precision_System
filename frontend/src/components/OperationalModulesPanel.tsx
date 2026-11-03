import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

type Props = { module: 'Analytics' | 'Inventory' | 'Equipment' | 'Resources' | 'Weather' | 'GIS Farm Mapping' }

export default function OperationalModulesPanel({ module }: Props) {
  const analytics = useQuery({ queryKey: ['analytics'], queryFn: api.getAnalytics, enabled: module === 'Analytics' })
  const inventory = useQuery({ queryKey: ['inventory'], queryFn: api.getInventory, enabled: module === 'Inventory' })
  const equipment = useQuery({ queryKey: ['equipment'], queryFn: api.getEquipment, enabled: module === 'Equipment' })

  if (module === 'Analytics') {
    if (analytics.isLoading) return <section className="panel"><p>Loading analytics…</p></section>
    if (analytics.isError) return <section className="panel"><p className="error-text">{analytics.error.message}</p></section>
    const data = analytics.data
    if (!data) return <section className="panel"><p>No analytics data available.</p></section>
    return <section className="panel operational-panel"><span className="eyebrow">DATABASE-BACKED METRICS</span><h2>Farm analytics</h2><div className="metric-grid">
      {Object.entries(data).map(([label, value]) => <div className="metric-card" key={label}><strong>{typeof value === 'number' ? value.toLocaleString() : String(value)}</strong><span>{label.replace(/[A-Z]/g, letter => ` ${letter}`).trim()}</span></div>)}
    </div></section>
  }

  if (module === 'Inventory' || module === 'Equipment') {
    const query = module === 'Inventory' ? inventory : equipment
    if (query.isLoading) return <section className="panel"><p>Loading {module.toLowerCase()}…</p></section>
    if (query.isError) return <section className="panel"><p className="error-text">{query.error.message}</p></section>
    const rows = query.data ?? []
    return <section className="panel operational-panel"><span className="eyebrow">PERSISTED OPERATIONS</span><h2>{module}</h2><div className="operations-list">{rows.length === 0 ? <p>No records yet. Add the first record through the API or module form.</p> : rows.map(item => <article key={item.id} className="operation-row"><strong>{item.name}</strong><span>{'category' in item ? item.category : ''}</span><span>{'quantity' in item ? `${item.quantity} ${item.unit}` : item.status}</span></article>)}</div></section>
  }

  return <section className="panel operational-panel"><span className="eyebrow">CONNECTED MODULE</span><h2>{module}</h2><p>{module === 'Weather' ? 'Configure WEATHER_PROVIDER_URL on the backend to load live provider data.' : module === 'GIS Farm Mapping' ? 'Farm coordinates are available through the GeoJSON endpoint at /api/gis/farms.' : 'Resource planning records are available through /api/resources.'}</p></section>
}

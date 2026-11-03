import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type Crop as ApiCrop, type IrrigationSchedule, type HarvestRecord } from './services/api'
import AgriculturalChat from './components/AgriculturalChat'
import './App.css'

type Crop = {
  id: number
  name: string
  field: string
  planted: string
  harvest: string
  stage: string
  area: number
  status: 'Healthy' | 'Needs attention'
}

type Irrigation = {
  id: number
  crop_id: number
  crop: string
  date: string
  time: string
  water: number
  status: 'Scheduled' | 'Completed' | 'Skipped'
}

type Tab = 'Overview' | 'Crop Lifecycle' | 'Irrigation' | 'Harvest Records' | 'AI Farm Assistant'

const stages = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Mature']

function mapCrop(c: ApiCrop): Crop {
  return {
    id: c.id,
    name: c.name,
    field: c.field_name,
    planted: String(c.planting_date).slice(0, 10),
    harvest: c.expected_harvest_date ? String(c.expected_harvest_date).slice(0, 10) : '—',
    stage: c.growth_stage,
    area: Number(c.area_acres),
    status: c.status === 'Active' ? 'Healthy' : 'Needs attention',
  }
}

function mapIrrigation(i: IrrigationSchedule): Irrigation {
  return {
    id: i.id,
    crop_id: i.crop_id,
    crop: i.crop_name || `Crop #${i.crop_id}`,
    date: String(i.scheduled_date).slice(0, 10),
    time: i.scheduled_time?.slice(0, 5) || '—',
    water: Number(i.water_liters),
    status: i.status,
  }
}

function App() {
  const [tab, setTab] = useState<Tab>('Overview')
  const [crops, setCrops] = useState<Crop[]>([])
  const [irrigation, setIrrigation] = useState<Irrigation[]>([])
  const [harvests, setHarvests] = useState<HarvestRecord[]>([])
  const [showCropForm, setShowCropForm] = useState(false)
  const [showWaterForm, setShowWaterForm] = useState(false)
  const [search, setSearch] = useState('')
  const [cropName, setCropName] = useState('')
  const [field, setField] = useState('')
  const [planted, setPlanted] = useState('')
  const [harvest, setHarvest] = useState('')
  const [area, setArea] = useState('1')
  const [waterCrop, setWaterCrop] = useState('')
  const [waterDate, setWaterDate] = useState('')
  const [waterTime, setWaterTime] = useState('06:00')
  const [waterAmount, setWaterAmount] = useState('500')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const refreshData = useCallback(async () => {
    try {
      const [cropData, irrigationData, harvestData] = await Promise.all([
        api.getCrops(),
        api.getIrrigation(),
        api.getHarvests(),
      ])
      setCrops(cropData.filter(c => c.status === 'Active').map(mapCrop))
      setIrrigation(irrigationData.map(mapIrrigation))
      setHarvests(harvestData)
      setWaterCrop(current => current || String(cropData.find(c => c.status === 'Active')?.id ?? ''))
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not load data from the backend.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshData()
  }, [refreshData])

  const filteredCrops = useMemo(() => crops.filter(c =>
    `${c.name} ${c.field} ${c.stage}`.toLowerCase().includes(search.toLowerCase())
  ), [crops, search])

  const totalArea = crops.reduce((sum, c) => sum + c.area, 0)
  const scheduledWater = irrigation.filter(i => i.status === 'Scheduled').reduce((sum, i) => sum + i.water, 0)
  const completedWater = irrigation.filter(i => i.status === 'Completed').reduce((sum, i) => sum + i.water, 0)

  async function addCrop(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!cropName.trim() || !field.trim() || !planted || !area || Number(area) <= 0) return
    if (harvest && harvest < planted) {
      setNotice('Harvest date cannot be earlier than planting date.')
      return
    }

    setBusy(true)
    try {
      await api.createCrop({
        name: cropName.trim(),
        field_name: field.trim(),
        area_acres: Number(area),
        planting_date: planted,
        expected_harvest_date: harvest || undefined,
        growth_stage: 'Seedling',
      })
      await refreshData()
      setCropName('')
      setField('')
      setPlanted('')
      setHarvest('')
      setArea('1')
      setShowCropForm(false)
      setNotice('Crop saved to the database.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not register crop.')
    } finally {
      setBusy(false)
    }
  }

  async function addIrrigation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!waterCrop || !waterDate || Number(waterAmount) <= 0) {
      setNotice('Register an active crop and complete the irrigation details first.')
      return
    }

    setBusy(true)
    try {
      await api.createIrrigation({
        crop_id: Number(waterCrop),
        scheduled_date: waterDate,
        scheduled_time: waterTime || undefined,
        water_liters: Number(waterAmount),
        method: 'Drip',
      })
      await refreshData()
      setShowWaterForm(false)
      setNotice('Irrigation schedule saved to the database.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not create irrigation schedule.')
    } finally {
      setBusy(false)
    }
  }

  async function updateStage(id: number, stage: string) {
    if (!stages.includes(stage)) return
    try {
      await api.updateCropStage(id, stage as ApiCrop['growth_stage'])
      await refreshData()
      setNotice('Crop growth stage updated.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not update growth stage.')
      await refreshData()
    }
  }

  async function completeIrrigation(id: number) {
    try {
      await api.updateIrrigationStatus(id, 'Completed')
      await refreshData()
      setNotice('Irrigation marked as completed.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not update irrigation.')
    }
  }

  async function recordHarvest(crop: Crop) {
    const quantity = window.prompt(`Enter harvest quantity in kg for ${crop.name}:`)
    if (quantity === null) return
    const quantityKg = Number(quantity)
    if (quantity.trim() === '' || !Number.isFinite(quantityKg) || quantityKg < 0) {
      setNotice('Enter a valid, non-negative harvest quantity.')
      return
    }

    const date = window.prompt('Harvest date (YYYY-MM-DD):', new Date().toISOString().slice(0, 10))
    if (!date) return

    setBusy(true)
    try {
      await api.recordHarvest(crop.id, {
        harvest_date: date,
        quantity_kg: quantityKg,
      })
      await refreshData()
      setNotice(`${crop.name} harvest saved. The crop has been moved to harvest history.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not record harvest.')
    } finally {
      setBusy(false)
    }
  }

  const navItems: { name: Tab; icon: string }[] = [
    { name: 'Overview', icon: '◫' },
    { name: 'Crop Lifecycle', icon: '♧' },
    { name: 'Irrigation', icon: '♧' },
    { name: 'Harvest Records', icon: '▤' },
    { name: 'AI Farm Assistant', icon: '✳' },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon">✳</div><div><strong>AgroPrecision</strong><span>FARM OPERATIONS</span></div></div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {navItems.map(item => (
            <button key={item.name} className={`nav-item ${tab === item.name ? 'active' : ''}`}
              onClick={() => { setTab(item.name); setNotice('') }}>
              <span className="nav-icon">{item.icon}</span>{item.name}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="weather-mini"><span>☀</span><div><strong>Weather insights</strong><small>Connect a weather API</small></div></div>
          <div className="profile"><div className="avatar">CO</div><div><strong>Crop Operations</strong><small>Farm management</small></div></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">Farm Management <span>/</span> <strong>{tab}</strong></div>
          <div className="top-actions"><span className="live-dot" /> Development preview</div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">PRECISION AGRICULTURE / OPERATIONS</div>
              <h1>{tab === 'Overview' ? 'Crop Operations' : tab}</h1>
              <p>Manage crop growth, planting, harvesting and irrigation in one place.</p>
            </div>
            <div className="heading-actions">
              <button className="btn btn-secondary" onClick={() => setShowWaterForm(true)} disabled={!crops.length}>＋ Irrigation</button>
              <button className="btn btn-primary" onClick={() => setShowCropForm(true)}>＋ Register crop</button>
            </div>
          </div>

          {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
          {loading && <p>Loading farm data…</p>}
          {busy && <p>Saving changes…</p>}

          <div className="stats-grid">
            <Stat label="Active crops" value={String(crops.length).padStart(2, '0')} detail="Registered crop cycles" icon="♧" />
            <Stat label="Cultivated area" value={`${totalArea.toFixed(1)} acres`} detail="Across registered crops" icon="▦" />
            <Stat label="Water scheduled" value={`${scheduledWater.toLocaleString()} L`} detail="Upcoming irrigation" icon="♧" />
            <Stat label="Water used" value={`${completedWater.toLocaleString()} L`} detail="Recorded completed events" icon="↗" />
          </div>

          {tab === 'Overview' && (
            <div className="overview-grid">
              <section className="panel crop-panel">
                <div className="panel-heading"><div><h2>Crop lifecycle</h2><p>Monitor growth and crop health</p></div><button className="text-btn" onClick={() => setTab('Crop Lifecycle')}>View all →</button></div>
                <CropTable crops={filteredCrops.slice(0, 4)} onStageChange={updateStage} onHarvest={recordHarvest} />
              </section>
              <section className="panel irrigation-panel">
                <div className="panel-heading"><div><h2>Irrigation schedule</h2><p>Planned water applications</p></div><button className="text-btn" onClick={() => setTab('Irrigation')}>View all →</button></div>
                <IrrigationList items={irrigation.slice(0, 4)} onComplete={completeIrrigation} />
                <button className="btn btn-secondary full-width" onClick={() => setShowWaterForm(true)} disabled={!crops.length}>＋ Add irrigation schedule</button>
              </section>
              <section className="panel recommendation-panel">
                <div className="recommend-icon">☼</div><div className="recommend-content">
                  <div className="eyebrow">SMART IRRIGATION</div><h2>Weather-informed recommendations</h2>
                  <p>Recommendations require a weather provider and field-specific crop requirements.</p>
                  <span className="status-pill pending">Integration pending</span>
                </div>
              </section>
            </div>
          )}

          {tab === 'Crop Lifecycle' && (
            <section className="panel">
              <div className="panel-heading"><div><h2>Crop registry</h2><p>Manage planting and growth stages</p></div><input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search crops or fields..." /></div>
              <CropTable crops={filteredCrops} onStageChange={updateStage} onHarvest={recordHarvest} />
            </section>
          )}

          {tab === 'Irrigation' && (
            <section className="panel">
              <div className="panel-heading"><div><h2>Irrigation planner</h2><p>Track schedules and actual water usage</p></div><button className="btn btn-primary" onClick={() => setShowWaterForm(true)} disabled={!crops.length}>＋ Add schedule</button></div>
              <IrrigationList items={irrigation} onComplete={completeIrrigation} />
            </section>
          )}

          {tab === 'Harvest Records' && (
            <section className="panel">
              <div className="panel-heading"><div><h2>Harvest records</h2><p>Harvest history saved in the database</p></div></div>
              {!harvests.length ? <div className="empty-state">No harvest records yet. Record a harvest from the Crop Lifecycle tab.</div> :
                <div className="table-scroll"><table><thead><tr><th>CROP</th><th>HARVEST DATE</th><th>QUANTITY</th><th>QUALITY</th></tr></thead><tbody>
                  {harvests.map((h: HarvestRecord) => <tr key={h.id}><td>{h.crop_name}</td><td>{String(h.harvest_date).slice(0, 10)}</td><td>{Number(h.quantity_kg).toLocaleString()} kg</td><td>{h.quality || '—'}</td></tr>)}
                </tbody></table></div>}
            </section>
          )}

          {tab === 'AI Farm Assistant' && <AgriculturalChat />}

          <footer className="page-footer">INTELLIGENT FARM OPERATIONS PLATFORM <span>•</span> CROP OPERATIONS MODULE</footer>
        </section>
      </main>

      {showCropForm && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowCropForm(false) }}>
          <form className="modal" onSubmit={addCrop}>
            <div className="modal-heading"><div><h2>Register a crop</h2><p>Enter the crop cycle details.</p></div><button type="button" className="close-btn" onClick={() => setShowCropForm(false)}>×</button></div>
            <label>Crop name<input required value={cropName} onChange={e => setCropName(e.target.value)} placeholder="e.g. Rice" /></label>
            <label>Farm / field<input required value={field} onChange={e => setField(e.target.value)} placeholder="e.g. North Field" /></label>
            <div className="form-row">
              <label>Planting date<input required type="date" value={planted} onChange={e => setPlanted(e.target.value)} /></label>
              <label>Expected harvest<input type="date" min={planted || undefined} value={harvest} onChange={e => setHarvest(e.target.value)} /></label>
            </div>
            <label>Area (acres)<input required type="number" min="0.01" step="0.01" value={area} onChange={e => setArea(e.target.value)} /></label>
            <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCropForm(false)}>Cancel</button><button className="btn btn-primary" disabled={busy}>Register crop</button></div>
          </form>
        </div>
      )}

      {showWaterForm && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowWaterForm(false) }}>
          <form className="modal" onSubmit={addIrrigation}>
            <div className="modal-heading"><div><h2>Schedule irrigation</h2><p>Plan a water application.</p></div><button type="button" className="close-btn" onClick={() => setShowWaterForm(false)}>×</button></div>
            <label>Crop<select required value={waterCrop} onChange={e => setWaterCrop(e.target.value)}>{crops.map(c => <option key={c.id} value={String(c.id)}>{c.name} — {c.field}</option>)}</select></label>
            <label>Scheduled date<input required type="date" value={waterDate} onChange={e => setWaterDate(e.target.value)} /></label>
            <div className="form-row">
              <label>Time<input required type="time" value={waterTime} onChange={e => setWaterTime(e.target.value)} /></label>
              <label>Water (litres)<input required type="number" min="1" step="1" value={waterAmount} onChange={e => setWaterAmount(e.target.value)} /></label>
            </div>
            <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowWaterForm(false)}>Cancel</button><button className="btn btn-primary" disabled={busy}>Save schedule</button></div>
          </form>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: string }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><strong className="stat-value">{value}</strong><span className="stat-detail">{detail}</span></div>
}

function CropTable({ crops, onStageChange, onHarvest }: {
  crops: Crop[]
  onStageChange: (id: number, stage: string) => void
  onHarvest: (crop: Crop) => void
}) {
  if (!crops.length) return <div className="empty-state">No active crops found. Register your first crop to get started.</div>
  return (
    <div className="table-scroll"><table><thead><tr><th>CROP / FIELD</th><th>PLANTING DATE</th><th>GROWTH STAGE</th><th>AREA</th><th>HEALTH</th><th>ACTION</th></tr></thead>
      <tbody>{crops.map(c => <tr key={c.id}>
        <td><div className="crop-name"><span className="crop-avatar">{c.name.slice(0, 1).toUpperCase()}</span><div><strong>{c.name}</strong><small>{c.field}</small></div></div></td>
        <td>{c.planted}</td>
        <td><select className="stage-select" value={c.stage} onChange={e => onStageChange(c.id, e.target.value)}>{stages.map(s => <option key={s}>{s}</option>)}</select></td>
        <td>{c.area} acres</td>
        <td><span className={`status-pill ${c.status === 'Healthy' ? 'healthy' : 'warning'}`}><span className="pill-dot" />{c.status}</span></td>
        <td><button className="text-btn" onClick={() => onHarvest(c)}>Record harvest</button></td>
      </tr>)}</tbody>
    </table></div>
  )
}

function IrrigationList({ items, onComplete }: { items: Irrigation[]; onComplete: (id: number) => void }) {
  if (!items.length) return <div className="empty-state">No irrigation schedules yet.</div>
  return <div className="irrigation-list">{items.map(i => <div className="irrigation-item" key={i.id}>
    <div className="water-icon">↯</div><div className="irrigation-info"><strong>{i.crop}</strong><span>{i.date} · {i.time}</span><small>{i.water.toLocaleString()} litres</small></div>
    <div className="irrigation-action">{i.status === 'Completed' ? <span className="status-pill healthy">Completed</span> : i.status === 'Skipped' ? <span className="status-pill warning">Skipped</span> : <button className="text-btn" onClick={() => onComplete(i.id)}>Mark done</button>}</div>
  </div>)}</div>
}

export default App

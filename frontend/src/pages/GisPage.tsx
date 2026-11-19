import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { farmDataApi, gisApi } from '@/api/endpoints'
import { PageHeader, Panel } from '@/components/common/PageHeader'
import { NoFarm } from '@/components/common/StateViews'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/useAuth'
import { useFarm } from '@/contexts/useFarm'
import { useRun } from '@/hooks/useRun'
import { AREA_TOLERANCE, areaAcres, relativeDifference, scaleToAcres, squareForAcres, type LngLat } from '@/lib/geo'
import { formatNumber } from '@/lib/format'

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const toLatLng = (p: LngLat) => L.latLng(p.lat, p.lng)

export default function GisPage() {
  const { can } = useAuth()
  const { farmId, farm } = useFarm()
  const { act } = useRun(['gis-plots', 'gis-farms', 'plots', 'dashboard'])
  const canWrite = can('GIS_WRITE')
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const saved = useRef<L.LayerGroup | null>(null)
  const draftLayer = useRef<L.LayerGroup | null>(null)
  const [plotId, setPlotId] = useState('')
  const [drawing, setDrawing] = useState(false)
  const [draft, setDraft] = useState<LngLat[]>([])

  const farms = useQuery({ queryKey: ['gis-farms'], queryFn: gisApi.farms })
  const plotsGeo = useQuery({ queryKey: ['gis-plots', farmId], queryFn: () => gisApi.plots(farmId!), enabled: !!farmId })
  const plots = useQuery({ queryKey: ['plots', farmId], queryFn: () => farmDataApi.plots(farmId!), enabled: !!farmId })

  const plot = plots.data?.find((p) => String(p.id) === plotId)
  const declared = Number(plot?.areaAcres ?? 0)
  const drawn = useMemo(() => areaAcres(draft), [draft])
  const diff = declared > 0 && draft.length >= 3 ? relativeDifference(drawn, declared) : null
  const withinTolerance = diff !== null && diff <= AREA_TOLERANCE

  const farmFeature = farms.data?.features.find((f) => Number(f.properties.id) === farmId)
  const farmCenter = useMemo<LngLat | null>(() => {
    const g = farmFeature?.geometry as { coordinates?: [number, number] } | null | undefined
    return g?.coordinates ? { lng: g.coordinates[0], lat: g.coordinates[1] } : null
  }, [farmFeature])

  // map setup
  useEffect(() => {
    if (!el.current || map.current) return
    const m = L.map(el.current).setView([20.5, 78.9], 5)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(m)
    map.current = m
    saved.current = L.layerGroup().addTo(m)
    draftLayer.current = L.layerGroup().addTo(m)
    return () => { m.remove(); map.current = null }
  }, [])

  // saved layers: farm marker, approximate farm extent sized from total acres, real plot boundaries
  useEffect(() => {
    const m = map.current
    const layer = saved.current
    if (!m || !layer) return
    layer.clearLayers()
    const bounds: L.LatLngBounds[] = []
    for (const feat of farms.data?.features ?? []) {
      const g = feat.geometry as { type: string; coordinates: [number, number] } | null
      if (g?.type !== 'Point') continue
      const center = { lng: g.coordinates[0], lat: g.coordinates[1] }
      layer.addLayer(L.marker([center.lat, center.lng]).bindPopup(`<strong>${String(feat.properties.name ?? 'Farm')}</strong><br/>${formatNumber(Number(feat.properties.totalAreaAcres ?? 0))} acres`))
      const acres = Number(feat.properties.totalAreaAcres ?? 0)
      if (acres > 0 && Number(feat.properties.id) === farmId) {
        const ext = L.polygon(squareForAcres(center, acres).map(toLatLng), { color: '#9aa79e', weight: 1.5, dashArray: '6 6', fillOpacity: 0.04, interactive: false })
        ext.bindTooltip(`Approximate extent of ${formatNumber(acres)} acres`, { sticky: true })
        layer.addLayer(ext)
        bounds.push(ext.getBounds())
      } else {
        bounds.push(L.latLngBounds([center.lat, center.lng], [center.lat, center.lng]))
      }
    }
    for (const feat of plotsGeo.data?.features ?? []) {
      if (!feat.geometry) continue
      const declaredAcres = Number(feat.properties.areaAcres ?? 0)
      const computed = Number(feat.properties.computedAreaAcres ?? 0)
      const gj = L.geoJSON(feat as never, { style: { color: '#2f7b45', weight: 2, fillOpacity: 0.28 } }).bindPopup(
        `<strong>${String(feat.properties.name ?? 'Plot')}</strong><br/>Declared: ${formatNumber(declaredAcres)} acres<br/>Mapped: ${formatNumber(computed)} acres`,
      )
      layer.addLayer(gj)
      bounds.push(gj.getBounds())
    }
    if (bounds.length) m.fitBounds(bounds.reduce((a, b) => a.extend(b)), { maxZoom: 17, padding: [40, 40] })
  }, [farms.data, plotsGeo.data, farmId])

  // draft polygon with draggable corners
  useEffect(() => {
    const layer = draftLayer.current
    if (!layer) return
    layer.clearLayers()
    if (draft.length >= 3) L.polygon(draft.map(toLatLng), { color: '#c05621', weight: 2, dashArray: '5 5', fillOpacity: 0.2, interactive: false }).addTo(layer)
    else if (draft.length === 2) L.polyline(draft.map(toLatLng), { color: '#c05621', dashArray: '5 5' }).addTo(layer)
    draft.forEach((p, i) => {
      const marker = L.marker(toLatLng(p), {
        draggable: true,
        icon: L.divIcon({ className: '', html: '<span style="display:block;width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid #c05621;box-shadow:0 1px 3px rgba(0,0,0,.35)"></span>', iconSize: [14, 14], iconAnchor: [7, 7] }),
      })
      marker.on('dragend', () => {
        const ll = marker.getLatLng()
        setDraft((d) => d.map((q, j) => (j === i ? { lat: ll.lat, lng: ll.lng } : q)))
      })
      marker.addTo(layer)
    })
  }, [draft])

  // click-to-add corners while drawing
  useEffect(() => {
    const m = map.current
    if (!m || !drawing) return
    const onClick = (e: L.LeafletMouseEvent) => setDraft((d) => [...d, { lat: e.latlng.lat, lng: e.latlng.lng }])
    m.on('click', onClick)
    m.getContainer().style.cursor = 'crosshair'
    return () => { m.off('click', onClick); m.getContainer().style.cursor = '' }
  }, [drawing])

  const reset = () => { setDraft([]); setDrawing(false) }
  const startDrawing = () => { setDraft([]); setDrawing(true) }

  const generate = () => {
    const center = farmCenter ?? (map.current ? { lat: map.current.getCenter().lat, lng: map.current.getCenter().lng } : null)
    if (!center || declared <= 0) return
    const square = squareForAcres(center, declared)
    setDraft(square)
    setDrawing(false)
    map.current?.fitBounds(L.latLngBounds(square.map(toLatLng)), { maxZoom: 18, padding: [60, 60] })
  }
  const fit = () => setDraft((d) => scaleToAcres(d, declared))

  const save = () => {
    const ring = [...draft, draft[0]].map((p) => [p.lng, p.lat])
    void act(async () => { await gisApi.setBoundary(Number(plotId), { type: 'Polygon', coordinates: [ring] }); reset() }, 'Boundary saved')
  }
  if (!farmId) return <NoFarm />

  return (
    <>
      <PageHeader title="Map" description={`Farm location and plot boundaries for ${farm?.name ?? 'your farm'}. Boundaries are checked against each plot's declared acres.`} />
      {canWrite && (
        <Panel title="Plot boundary">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <select aria-label="Plot to edit" className="field-control !w-auto !py-1.5" value={plotId} onChange={(e) => { setPlotId(e.target.value); reset() }}>
              <option value="">Select plot…</option>
              {(plots.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} ({formatNumber(Number(p.areaAcres))} ac)</option>)}
            </select>
            <Button size="sm" disabled={!plotId} onClick={generate}>Generate from {declared ? `${formatNumber(declared)} acres` : 'acres'}</Button>
            <Button size="sm" variant="secondary" disabled={!plotId || drawing} onClick={startDrawing}>Draw by hand</Button>
            <Button size="sm" variant="secondary" disabled={draft.length < 3 || withinTolerance} onClick={fit}>Scale to match acres</Button>
            <Button size="sm" disabled={!withinTolerance} onClick={save}>Save boundary</Button>
            <Button size="sm" variant="ghost" disabled={draft.length === 0 && !drawing} onClick={reset}>Cancel</Button>
            <Button size="sm" variant="ghost" disabled={!plotId} onClick={() => act(() => gisApi.clearBoundary(Number(plotId)), 'Boundary cleared')}>Remove saved boundary</Button>
          </div>
          {plotId && (
            <p className="mt-3 text-sm text-neutral-600" aria-live="polite">
              Declared size: <strong>{formatNumber(declared)} acres</strong>
              {draft.length >= 3 && <> · Drawn: <strong className={withinTolerance ? 'text-brand-700' : 'text-amber-700'}>{formatNumber(drawn)} acres</strong></>}
              {draft.length >= 3 && !withinTolerance && <> · Must be within {AREA_TOLERANCE * 100}% of the declared size. Drag the corners, or use “Scale to match acres”.</>}
              {drawing && draft.length < 3 && <> · Click the map to add corners (at least 3). Drag a corner to adjust it.</>}
              {!drawing && draft.length === 0 && <> · “Generate” places a square of exactly this size on your farm; drag its corners to fit your land.</>}
            </p>
          )}
        </Panel>
      )}
      <div ref={el} className="h-[560px] w-full overflow-hidden rounded-xl border border-neutral-200" role="region" aria-label="Farm map" />
    </>
  )
}

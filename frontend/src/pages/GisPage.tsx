import { useEffect, useRef, useState } from 'react'
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
import { formatNumber } from '@/lib/format'

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function GisPage() {
  const { can } = useAuth()
  const { farmId, farm } = useFarm()
  const { act } = useRun(['gis-plots', 'gis-farms', 'plots', 'dashboard'])
  const canWrite = can('GIS_WRITE')
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const draft = useRef<L.LatLng[]>([])
  const draftLayer = useRef<L.LayerGroup | null>(null)
  const [plotId, setPlotId] = useState('')
  const [drawing, setDrawing] = useState(false)
  const [vertices, setVertices] = useState(0)

  const farms = useQuery({ queryKey: ['gis-farms'], queryFn: gisApi.farms })
  const plotsGeo = useQuery({ queryKey: ['gis-plots', farmId], queryFn: () => gisApi.plots(farmId!), enabled: !!farmId })
  const plots = useQuery({ queryKey: ['plots', farmId], queryFn: () => farmDataApi.plots(farmId!), enabled: !!farmId })

  useEffect(() => {
    if (!el.current || map.current) return
    map.current = L.map(el.current).setView([20.5, 78.9], 5)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map.current)
    layer.current = L.layerGroup().addTo(map.current)
    draftLayer.current = L.layerGroup().addTo(map.current)
    return () => { map.current?.remove(); map.current = null }
  }, [])

  useEffect(() => {
    if (!map.current || !layer.current) return
    layer.current.clearLayers()
    const bounds: L.LatLngBounds[] = []
    for (const feat of farms.data?.features ?? []) {
      const g = feat.geometry as { type: string; coordinates: [number, number] } | null
      if (g?.type === 'Point') {
        const m = L.marker([g.coordinates[1], g.coordinates[0]]).bindPopup(String(feat.properties.name ?? 'Farm'))
        layer.current.addLayer(m)
        bounds.push(L.latLngBounds([g.coordinates[1], g.coordinates[0]], [g.coordinates[1], g.coordinates[0]]))
      }
    }
    for (const feat of plotsGeo.data?.features ?? []) {
      if (!feat.geometry) continue
      const gj = L.geoJSON(feat as never, { style: { color: '#2f7d32', weight: 2, fillOpacity: 0.25 } })
        .bindPopup(`<strong>${String(feat.properties.name ?? 'Plot')}</strong><br/>${formatNumber(Number(feat.properties.areaAcres ?? 0))} acres`)
      layer.current.addLayer(gj)
      bounds.push(gj.getBounds())
    }
    if (bounds.length) map.current.fitBounds(bounds.reduce((a, b) => a.extend(b)), { maxZoom: 16, padding: [30, 30] })
  }, [farms.data, plotsGeo.data])

  useEffect(() => {
    const m = map.current
    if (!m || !drawing) return
    const onClick = (e: L.LeafletMouseEvent) => {
      draft.current.push(e.latlng)
      setVertices(draft.current.length)
      draftLayer.current?.clearLayers()
      draft.current.forEach((p) => L.circleMarker(p, { radius: 4, color: '#c05621' }).addTo(draftLayer.current!))
      if (draft.current.length > 1) L.polygon(draft.current, { color: '#c05621', dashArray: '4' }).addTo(draftLayer.current!)
    }
    m.on('click', onClick)
    return () => { m.off('click', onClick) }
  }, [drawing])

  const reset = () => { draft.current = []; setVertices(0); setDrawing(false); draftLayer.current?.clearLayers() }
  const save = () => {
    const ring = [...draft.current, draft.current[0]].map((p) => [p.lng, p.lat])
    void act(async () => { await gisApi.setBoundary(Number(plotId), { type: 'Polygon', coordinates: [ring] }); reset() }, 'Boundary saved; area calculated by PostGIS')
  }
  if (!farmId) return <NoFarm />

  return (
    <>
      <PageHeader title="Map" description={`Farm locations and plot boundaries for ${farm?.name ?? 'your farm'}. Areas are calculated by PostGIS.`} />
      {canWrite && (
        <Panel title="Plot boundary" className="mb-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <select aria-label="Plot to edit" className="field-control !w-auto !py-1.5" value={plotId} onChange={(e) => { setPlotId(e.target.value); reset() }}>
              <option value="">Select plot…</option>{(plots.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Button size="sm" disabled={!plotId || drawing} onClick={() => setDrawing(true)}>Draw boundary</Button>
            <Button size="sm" variant="secondary" disabled={vertices < 3} onClick={save}>Save boundary</Button>
            <Button size="sm" variant="ghost" disabled={!drawing} onClick={reset}>Cancel</Button>
            <Button size="sm" variant="ghost" disabled={!plotId} onClick={() => act(() => gisApi.clearBoundary(Number(plotId)), 'Boundary cleared')}>Clear saved boundary</Button>
            {drawing && <span className="text-neutral-600">Click the map to add corners ({vertices} so far; at least 3).</span>}
          </div>
        </Panel>
      )}
      <div ref={el} className="h-[520px] w-full rounded-lg border border-neutral-200" role="region" aria-label="Farm map" />
    </>
  )
}

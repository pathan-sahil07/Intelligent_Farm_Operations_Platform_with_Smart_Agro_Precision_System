import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { analyticsApi } from '@/api/endpoints'
import { EmptyState, ErrorState, Loading, NoFarm } from '@/components/common/StateViews'
import { PageHeader, Panel, StatCard } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/Button'
import { useFarm } from '@/contexts/useFarm'
import { errorMessage } from '@/lib/axios'
import { formatMoney, formatNumber } from '@/lib/format'

const yearStart = () => `${new Date().getFullYear()}-01-01`
const nowStr = () => new Date().toLocaleDateString('en-CA')
const REPORTS = ['production', 'irrigation', 'inventory', 'equipment', 'resources', 'costs']

function Chart({ data, x, bars, empty }: { data: Record<string, unknown>[] | undefined; x: string; bars: { key: string; name: string; color: string }[]; empty: string }) {
  if (!data?.length) return <EmptyState title={empty} />
  return (
    <div className="h-64" role="img" aria-label={bars.map((b) => b.name).join(', ')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey={x} fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Legend />
          {bars.map((b) => <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={[3, 3, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function AnalyticsPage() {
  const { farmId } = useFarm()
  const [from, setFrom] = useState(yearStart())
  const [to, setTo] = useState(nowStr())
  const [report, setReport] = useState('production')
  const f = { farmId: farmId ?? undefined, from, to }
  const on = !!farmId
  const overview = useQuery({ queryKey: ['analytics', 'overview', f], queryFn: () => analyticsApi.overview(f), enabled: on })
  const prod = useQuery({ queryKey: ['analytics', 'production', f], queryFn: () => analyticsApi.production(f), enabled: on })
  const irr = useQuery({ queryKey: ['analytics', 'irrigation', f], queryFn: () => analyticsApi.irrigation(f), enabled: on })
  const inv = useQuery({ queryKey: ['analytics', 'inventory', f], queryFn: () => analyticsApi.inventory(f), enabled: on })
  const eq = useQuery({ queryKey: ['analytics', 'equipment', f], queryFn: () => analyticsApi.equipment(f), enabled: on })
  const res = useQuery({ queryKey: ['analytics', 'resources', f], queryFn: () => analyticsApi.resources(f), enabled: on })
  const costs = useQuery({ queryKey: ['analytics', 'costs', f], queryFn: () => analyticsApi.costs(f), enabled: on })

  if (!farmId) return <NoFarm />
  const o = overview.data
  const exportCsv = () => analyticsApi.exportCsv(report, f).catch((e) => toast.error(errorMessage(e)))

  return (
    <>
      <PageHeader title="Analytics" description="Production, water, inventory, equipment, resource and cost reports for the selected farm."
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs">From<input type="date" className="field-control !py-1.5" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
            <label className="text-xs">To<input type="date" className="field-control !py-1.5" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
            <label className="text-xs">Export<select className="field-control !py-1.5" value={report} onChange={(e) => setReport(e.target.value)}>{REPORTS.map((r) => <option key={r}>{r}</option>)}</select></label>
            <Button variant="secondary" onClick={exportCsv}>Export CSV</Button>
          </div>} />
      {overview.isLoading ? <Loading /> : overview.error ? <ErrorState error={overview.error} onRetry={() => overview.refetch()} /> : o && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Harvest (kg)" value={formatNumber(o.totalHarvestKg)} />
          <StatCard label="Water used (L)" value={formatNumber(o.totalWaterLiters)} />
          <StatCard label="Operational cost" value={formatMoney(o.operationalCost)} />
          <StatCard label="Low-stock items" value={o.lowStockCount} tone={o.lowStockCount ? 'warning' : 'default'} />
        </div>
      )}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Panel title="Yield by crop (kg)"><Chart data={prod.data?.byCrop} x="crop" bars={[{ key: 'quantityKg', name: 'Yield (kg)', color: '#2f7d32' }]} empty="No harvests in this period" /></Panel>
        <Panel title="Yield by month (kg)">
          {prod.data?.byMonth.length ? (
            <div className="h-64" role="img" aria-label="Yield by month">
              <ResponsiveContainer width="100%" height="100%"><LineChart data={prod.data.byMonth}><CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" /><XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Line dataKey="quantityKg" name="Yield (kg)" stroke="#2f7d32" strokeWidth={2} /></LineChart></ResponsiveContainer>
            </div>) : <EmptyState title="No harvests in this period" />}
        </Panel>
        <Panel title="Water used by crop (L)"><Chart data={irr.data?.byCrop} x="crop" bars={[{ key: 'liters', name: 'Litres', color: '#1d6fa5' }]} empty="No completed irrigation" /></Panel>
        <Panel title="Stock value by category"><Chart data={inv.data?.byCategory} x="category" bars={[{ key: 'stockValue', name: 'Value', color: '#b7791f' }]} empty="No inventory" /></Panel>
        <Panel title="Equipment operating hours"><Chart data={eq.data?.items} x="name" bars={[{ key: 'operatingHours', name: 'Hours', color: '#6b46c1' }]} empty="No equipment" /></Panel>
        <Panel title="Resource planned vs consumed"><Chart data={res.data?.byCategory} x="category" bars={[{ key: 'planned', name: 'Planned', color: '#9ca3af' }, { key: 'consumed', name: 'Consumed', color: '#2f7d32' }]} empty="No resources" /></Panel>
        <Panel title={`Costs by category (total ${formatMoney(costs.data?.total ?? 0)})`}><Chart data={costs.data?.byCategory} x="category" bars={[{ key: 'amount', name: 'Amount', color: '#c05621' }]} empty="No costs recorded" /></Panel>
        <Panel title="Labour"><p className="text-sm">{formatNumber(res.data?.labourHours)} hours · {formatMoney(res.data?.labourCost)}</p></Panel>
      </div>
    </>
  )
}

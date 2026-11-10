import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CloudSun } from 'lucide-react'
import { farmDataApi, notificationApi, weatherApi } from '@/api/endpoints'
import { EmptyState, ErrorState, Loading, NoFarm } from '@/components/common/StateViews'
import { PageHeader, Panel, StatCard } from '@/components/common/PageHeader'
import { useAuth } from '@/contexts/useAuth'
import { useFarm } from '@/contexts/useFarm'
import { formatDate, formatDateTime, formatNumber } from '@/lib/format'

export default function DashboardPage() {
  const { user, can } = useAuth()
  const { farmId, farm, loading: farmsLoading } = useFarm()
  const dashboard = useQuery({ queryKey: ['dashboard', farmId], queryFn: () => farmDataApi.dashboard(farmId!), enabled: !!farmId })
  const weather = useQuery({ queryKey: ['weather', farmId], queryFn: () => weatherApi.forFarm(farmId!), enabled: !!farmId && can('WEATHER_READ'), retry: false })
  const notes = useQuery({ queryKey: ['notifications', 'recent'], queryFn: () => notificationApi.list({ size: 5 }) })

  if (farmsLoading) return <Loading />
  if (!farmId) {
    return (
      <>
        <PageHeader title={`Welcome, ${user?.fullName ?? ''}`} description="Your farm operations at a glance." />
        <NoFarm />
        {can('FARM_WRITE') && (
          <p className="text-center">
            <Link className="font-medium text-brand-700 underline" to="/farms">Add your first farm</Link>
          </p>
        )}
      </>
    )
  }

  const d = dashboard.data
  return (
    <>
      <PageHeader title={farm?.name ?? 'Dashboard'} description="Today’s status across crops, irrigation, inventory, equipment and tasks." />
      {dashboard.isLoading ? (
        <Loading />
      ) : dashboard.error ? (
        <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />
      ) : d ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard label="Plots" value={d.plotCount} hint={`${formatNumber(d.plottedAcres)} of ${formatNumber(d.farm.totalAreaAcres)} acres mapped`} />
            <StatCard label="Active crops" value={d.activeCrops} />
            <StatCard label="Irrigation pending" value={d.pendingIrrigation} />
            <StatCard label="Open tasks" value={d.openTasks} />
            <StatCard label="Low-stock items" value={d.lowStockItems} tone={d.lowStockItems ? 'warning' : 'default'} />
            <StatCard label="Maintenance due (14d)" value={d.equipmentDueMaintenance} tone={d.equipmentDueMaintenance ? 'warning' : 'default'} />
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <Panel title="Harvests in the next 14 days" className="lg:col-span-1">
              {d.upcomingHarvests.length === 0 ? (
                <EmptyState title="No harvests due" description="Crops with an expected harvest date appear here." />
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {d.upcomingHarvests.map((h) => (
                    <li key={h.cropId} className="flex justify-between py-2 text-sm">
                      <span className="font-medium">{h.name}</span>
                      <span className="text-neutral-500">{formatDate(h.expectedHarvestDate)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Weather now" className="lg:col-span-1">
              {!can('WEATHER_READ') ? (
                <p className="text-sm text-neutral-500">Weather is not available for your role.</p>
              ) : weather.isLoading ? (
                <Loading />
              ) : weather.error ? (
                <p className="text-sm text-neutral-600">{(weather.error as Error).message}</p>
              ) : weather.data?.current ? (
                <div className="flex items-center gap-4">
                  <CloudSun size={40} className="text-brand-600" aria-hidden="true" />
                  <div className="text-sm">
                    <p className="text-2xl font-semibold text-neutral-900">{formatNumber(weather.data.current.temperatureC)} °C</p>
                    <p>Humidity {formatNumber(weather.data.current.humidityPercent)}% · Wind {formatNumber(weather.data.current.windSpeedKmh)} km/h</p>
                    {weather.data.alerts.length > 0 && <p className="font-medium text-amber-700">{weather.data.alerts.length} active alert(s)</p>}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">No current conditions returned.</p>
              )}
            </Panel>
            <Panel title="Recent notifications" className="lg:col-span-1">
              {notes.data?.content.length ? (
                <ul className="divide-y divide-neutral-100">
                  {notes.data.content.map((n) => (
                    <li key={n.id} className="py-2 text-sm">
                      <span className={n.read ? '' : 'font-semibold text-neutral-900'}>{n.title}</span>
                      <span className="block text-xs text-neutral-500">{formatDateTime(n.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="You are all caught up" />
              )}
            </Panel>
          </div>
        </>
      ) : null}
    </>
  )
}

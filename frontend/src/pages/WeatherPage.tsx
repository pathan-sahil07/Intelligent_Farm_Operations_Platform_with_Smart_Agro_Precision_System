import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { weatherApi } from '@/api/endpoints'
import { ErrorState, Loading, NoFarm } from '@/components/common/StateViews'
import { PageHeader, Panel, StatCard } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useFarm } from '@/contexts/useFarm'
import { formatDate, formatDateTime, formatNumber } from '@/lib/format'

export default function WeatherPage() {
  const { farmId, farm } = useFarm()
  const q = useQuery({ queryKey: ['weather', farmId], queryFn: () => weatherApi.forFarm(farmId!), enabled: !!farmId, retry: false })
  if (!farmId) return <NoFarm />
  const w = q.data
  return (
    <>
      <PageHeader title="Weather" description={`Live conditions and forecast for ${farm?.name ?? 'your farm'}, from the configured weather provider.`} />
      {q.isLoading ? <Loading /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : w ? (
        <>
          {w.current && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Temperature" value={`${formatNumber(w.current.temperatureC)} °C`} hint={formatDateTime(w.current.time)} />
              <StatCard label="Humidity" value={`${formatNumber(w.current.humidityPercent)}%`} />
              <StatCard label="Wind" value={`${formatNumber(w.current.windSpeedKmh)} km/h`} />
              <StatCard label="Rain now" value={`${formatNumber(w.current.precipitationMm)} mm`} />
            </div>
          )}
          <Panel title="Alerts" className="mt-5">
            {w.alerts.length === 0 ? <p className="text-sm text-neutral-600">No weather alerts for the coming days.</p> : (
              <ul className="space-y-2">
                {w.alerts.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle size={16} className="mt-0.5 text-amber-600" aria-hidden="true" />
                    <span><StatusBadge value={a.severity} /> <strong>{a.type.replace(/_/g, ' ')}</strong> on {formatDate(a.date)}: {a.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Forecast" className="mt-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Daily forecast</caption>
                <thead><tr className="text-xs uppercase text-neutral-500"><th className="py-2">Date</th><th>High</th><th>Low</th><th>Rain</th><th>Rain chance</th><th>Max wind</th></tr></thead>
                <tbody>
                  {w.forecast.map((d) => (
                    <tr key={d.date} className="border-t border-neutral-100">
                      <td className="py-2">{formatDate(d.date)}</td><td>{formatNumber(d.tempMaxC)} °C</td><td>{formatNumber(d.tempMinC)} °C</td>
                      <td>{formatNumber(d.precipitationMm)} mm</td><td>{formatNumber(d.precipitationProbability)}%</td><td>{formatNumber(d.windMaxKmh)} km/h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-neutral-500">Source: {w.source}</p>
          </Panel>
        </>
      ) : null}
    </>
  )
}

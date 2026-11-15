import type { Plot } from '../types/farm-management.types'
import { formatAcres, round2 } from '../utils/format'

const SHADES = ['#2c4930', '#547d3f', '#6d984f', '#9acb69', '#3f6a3a', '#86b05f', '#b8d98f', '#1f3a25']

interface AreaBarProps {
  totalAcres: number
  plots: Plot[]
  unplottedAcres: number
}

/**
 * The whole farm as one bar: each plot is a slice sized by its acreage and the hatched remainder
 * is land that is not divided into plots yet. It makes the "plots cannot exceed the farm" rule visible.
 */
export function AreaBar({ totalAcres, plots, unplottedAcres }: AreaBarProps) {
  const summary = [
    ...plots.map((plot) => `${plot.name} ${formatAcres(plot.areaAcres)}`),
    `unplotted ${formatAcres(unplottedAcres)}`,
  ].join(', ')

  return (
    <div>
      <div aria-label={`Land use of ${formatAcres(totalAcres)}: ${summary}`} className="area-bar" role="img">
        {plots.map((plot, index) => (
          <span
            className="area-bar-slice"
            key={plot.id}
            style={{ flex: `${plot.areaAcres} 1 0`, background: SHADES[index % SHADES.length] }}
            title={`${plot.name}: ${formatAcres(plot.areaAcres)}`}
          />
        ))}
        {unplottedAcres > 0 && (
          <span
            className="area-bar-slice area-bar-open"
            style={{ flex: `${unplottedAcres} 1 0` }}
            title={`Unplotted: ${formatAcres(unplottedAcres)}`}
          />
        )}
      </div>
      <ul className="area-legend">
        {plots.map((plot, index) => (
          <li key={plot.id}>
            <span aria-hidden="true" className="legend-dot" style={{ background: SHADES[index % SHADES.length] }} />
            <span>{plot.name}</span>
            <span className="muted">{formatAcres(plot.areaAcres)}</span>
          </li>
        ))}
        <li>
          <span aria-hidden="true" className="legend-dot legend-dot-open" />
          <span>Unplotted</span>
          <span className="muted">{formatAcres(round2(unplottedAcres))}</span>
        </li>
      </ul>
    </div>
  )
}

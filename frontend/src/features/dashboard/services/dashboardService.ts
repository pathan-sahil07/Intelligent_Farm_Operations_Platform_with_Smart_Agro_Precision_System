import type { DashboardStat, DashboardSummary } from '../types/dashboard.types'
import {
  getFarmAcreageSummary,
  getFarmManagementSnapshot,
} from '../../farm-management/services/farmManagementService'
import type { FarmManagementSnapshot } from '../../farm-management/types/farm-management.types'

const demoStats: DashboardStat[] = [
  { id: 'crops', label: 'Active crop cycles', value: '12', note: 'Across 4 crop types' },
  { id: 'water', label: 'Water scheduled', value: '18.4k gal', note: 'This week · sample' },
  { id: 'tasks', label: 'Open field tasks', value: '07', note: '2 due today · sample' },
]

function formatDueDate(daysFromToday: number, currentDate: Date): string {
  const dueDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate() + daysFromToday,
  )

  if (daysFromToday === 0) return 'Today'
  if (daysFromToday === 1) return 'Tomorrow'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(dueDate)
}

const demoSummary: Pick<DashboardSummary, 'activities'> = {
  activities: [
    {
      id: 'fertilizer',
      title: 'Fertilizer application recorded',
      detail: 'North Orchard · nitrogen blend',
      time: 'Today, 9:20 AM',
    },
    {
      id: 'irrigation',
      title: 'Irrigation cycle scheduled',
      detail: 'Field 04 · 1.2 inches planned',
      time: 'Today, 8:05 AM',
    },
    {
      id: 'maintenance',
      title: 'Equipment inspection due soon',
      detail: 'Utility tractor · 3 days remaining',
      time: 'Yesterday',
    },
  ],
}

export function getDashboardSummary(
  snapshot: FarmManagementSnapshot = getFarmManagementSnapshot(),
  currentDate = new Date(),
): DashboardSummary {
  const acreage = getFarmAcreageSummary(undefined, snapshot)
  return {
    ...demoSummary,
    tasks: [
      {
        id: 'field-07',
        title: 'Scout for leaf spot',
        field: 'East Field',
        dueDate: formatDueDate(0, currentDate),
        status: 'Needs attention',
      },
      {
        id: 'field-02',
        title: 'Apply compost',
        field: 'South Plot',
        dueDate: formatDueDate(1, currentDate),
        status: 'Planned',
      },
      {
        id: 'field-04',
        title: 'Check irrigation lines',
        field: 'River Field',
        dueDate: formatDueDate(3, currentDate),
        status: 'In progress',
      },
    ],
    stats: [
      {
        id: 'area',
        label: 'Managed area',
        value: `${acreage.totalArea} ac`,
        note: `${acreage.totalFields} field records · ${acreage.mappedFields} mapped fields, ${acreage.unmappedFields} without boundaries`,
      },
      ...demoStats,
    ],
  }
}
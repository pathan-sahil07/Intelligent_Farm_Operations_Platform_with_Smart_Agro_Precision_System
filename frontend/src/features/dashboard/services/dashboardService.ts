import type { DashboardSummary } from '../types/dashboard.types'
import { farmFields, farmProfiles } from '../../farm-management/data/sampleData'

const managedAreaAcres = farmProfiles.reduce((total, farm) => total + farm.totalArea, 0)
const mappedAreaAcres = farmFields.reduce((total, field) => total + field.area, 0)
const unmappedAreaAcres = managedAreaAcres - mappedAreaAcres

const demoSummary: DashboardSummary = {
  stats: [
    {
      id: 'area',
      label: 'Managed area',
      value: `${managedAreaAcres} ac`,
      note: `${farmFields.length} field records · ${mappedAreaAcres} mapped, ${unmappedAreaAcres} unmapped`,
    },
    { id: 'crops', label: 'Active crop cycles', value: '12', note: 'Across 4 crop types' },
    { id: 'water', label: 'Water scheduled', value: '18.4k gal', note: 'This week · sample' },
    { id: 'tasks', label: 'Open field tasks', value: '07', note: '2 due today · sample' },
  ],
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
  tasks: [
    {
      id: 'field-07',
      title: 'Scout for leaf spot',
      field: 'East Field',
      dueDate: 'Today',
      status: 'Needs attention',
    },
    {
      id: 'field-02',
      title: 'Apply compost',
      field: 'South Plot',
      dueDate: 'Tomorrow',
      status: 'Planned',
    },
    {
      id: 'field-04',
      title: 'Check irrigation lines',
      field: 'River Field',
      dueDate: 'Oct 27',
      status: 'In progress',
    },
  ],
}

export function getDashboardSummary(): DashboardSummary {
  return demoSummary
}
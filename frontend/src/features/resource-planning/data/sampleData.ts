import type { ResourceAllocation } from '../types/resource-planning.types'

export const resourceAllocations: ResourceAllocation[] = [
  { id: 'ra-01', resource: 'Cover crop seed', category: 'Seeds', quantity: 480, unit: 'lb', field: 'South Plot', period: 'Oct–Nov' },
  { id: 'ra-02', resource: 'Compost blend', category: 'Fertilizer', quantity: 12, unit: 'ton', field: 'North Orchard', period: 'October' },
  { id: 'ra-03', resource: 'Irrigation water', category: 'Water', quantity: 18.4, unit: 'kgal', field: 'River Field', period: 'This week' },
  { id: 'ra-04', resource: 'Harvest crew', category: 'Labour', quantity: 56, unit: 'hours', field: 'East Field', period: 'Oct 23–27' },
  { id: 'ra-05', resource: 'Equipment fuel', category: 'Other', quantity: 95, unit: 'gal', field: 'Shared', period: 'This week' },
]

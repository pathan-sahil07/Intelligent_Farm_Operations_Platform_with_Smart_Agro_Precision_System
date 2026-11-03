import type { EquipmentRecord, EquipmentRepair, EquipmentUsage } from '../types/equipment-management.types'

export const equipmentRecords: EquipmentRecord[] = [
  { id: 'eq-01', name: 'Utility tractor', category: 'Tractor', status: 'Maintenance due', lastService: 'Aug 12, 2026', nextService: 'Oct 26, 2026' },
  { id: 'eq-02', name: 'Precision seeder', category: 'Planting', status: 'Available', lastService: 'Sep 04, 2026', nextService: 'Mar 01, 2027' },
  { id: 'eq-03', name: 'Harvest trailer', category: 'Transport', status: 'In use', lastService: 'Jul 18, 2026', nextService: 'Dec 15, 2026' },
]

export const equipmentUsage: EquipmentUsage[] = [
  { id: 'use-01', equipment: 'Utility tractor', activity: 'Haul compost', date: 'Oct 21', hours: 3.5 },
  { id: 'use-02', equipment: 'Harvest trailer', activity: 'Move produce bins', date: 'Oct 20', hours: 5 },
  { id: 'use-03', equipment: 'Precision seeder', activity: 'Cover crop planting', date: 'Oct 18', hours: 2 },
]

export const equipmentRepairs: EquipmentRepair[] = [
  { id: 'repair-01', equipment: 'Utility tractor', repair: 'Replace hydraulic hose', date: 'Sep 16', status: 'Complete' },
  { id: 'repair-02', equipment: 'Harvest trailer', repair: 'Inspect brake lights', date: 'Oct 22', status: 'Open' },
]

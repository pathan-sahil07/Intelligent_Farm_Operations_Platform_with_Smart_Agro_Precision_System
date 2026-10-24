import type { FarmExpense, FarmField, FarmProfile, FarmTask, FarmWorker } from '../types/farm-management.types'

export const farmProfiles: FarmProfile[] = [
  {
    id: 'farm-demo-01',
    farmer: 'Jordan Lee',
    farmName: 'Meadowbrook Farm',
    location: 'Central Valley, California',
    totalArea: 84,
  },
  {
    id: 'farm-demo-02',
    farmName: 'Creekside Farm',
    location: 'Central Valley, California',
    totalArea: 42,
  },
]

export const farmFields: FarmField[] = [
  { id: 'MB-N01', farmId: 'farm-demo-01', name: 'North Orchard', crop: 'Apple', area: 32, status: 'Growing' },
  { id: 'MB-R04', farmId: 'farm-demo-01', name: 'River Field', crop: 'Sweet corn', area: 28, status: 'Growing' },
  { id: 'MB-E07', farmId: 'farm-demo-01', name: 'East Field', crop: 'Tomato', area: 24, status: 'Harvesting' },
  { id: 'CS-S02', farmId: 'farm-demo-02', name: 'South Plot', crop: 'Cover crop', area: 18, status: 'Preparing' },
]

export const farmWorkers: FarmWorker[] = [
  { id: 'w-01', name: 'Maya Chen', role: 'Field lead', assignedField: 'North Orchard' },
  { id: 'w-02', name: 'Luis Gomez', role: 'Irrigation technician', assignedField: 'River Field' },
  { id: 'w-03', name: 'Avery Patel', role: 'Crop scout', assignedField: 'East Field' },
]

export const farmTasks: FarmTask[] = [
  { id: 't-01', task: 'Scout for leaf spot', field: 'East Field', due: 'Today', status: 'Needs attention' },
  { id: 't-02', task: 'Apply compost', field: 'South Plot', due: 'Tomorrow', status: 'Planned' },
  { id: 't-03', task: 'Inspect drip lines', field: 'River Field', due: 'Oct 27', status: 'In progress' },
]

export const farmExpenses: FarmExpense[] = [
  { id: 'e-01', category: 'Supplies', description: 'Compost blend', amount: 840, date: 'Oct 20' },
  { id: 'e-02', category: 'Fuel', description: 'Tractor diesel', amount: 325, date: 'Oct 18' },
  { id: 'e-03', category: 'Labour', description: 'Harvest crew', amount: 1260, date: 'Oct 16' },
]

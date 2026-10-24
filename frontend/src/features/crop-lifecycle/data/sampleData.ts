import type { CropRecord, FertilizerApplication } from '../types/crop-lifecycle.types'

export const cropRecords: CropRecord[] = [
  { id: 'c-01', crop: 'Tomato', variety: 'Roma', field: 'East Field', sowingDate: '2026-04-18', stage: 'Harvesting', health: 'Monitor', harvestDate: '2026-10-28' },
  { id: 'c-02', crop: 'Sweet corn', variety: 'Golden Bantam', field: 'River Field', sowingDate: '2026-05-02', stage: 'Maturing', health: 'Healthy', harvestDate: '2026-11-04' },
  { id: 'c-03', crop: 'Apple', variety: 'Gala', field: 'North Orchard', sowingDate: '2026-03-12', stage: 'Maturing', health: 'Healthy', harvestDate: '2026-11-12' },
]

export const fertilizerApplications: FertilizerApplication[] = [
  { id: 'fa-01', crop: 'Tomato · East Field', product: 'Balanced NPK', appliedOn: 'Oct 15', amount: '42 lb/ac' },
  { id: 'fa-02', crop: 'Sweet corn · River Field', product: 'Compost blend', appliedOn: 'Oct 11', amount: '1.4 ton/ac' },
  { id: 'fa-03', crop: 'Apple · North Orchard', product: 'Potassium sulfate', appliedOn: 'Oct 08', amount: '18 lb/ac' },
]

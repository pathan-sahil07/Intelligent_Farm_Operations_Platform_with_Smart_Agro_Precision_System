import type {
  CropWaterRequirement,
  IrrigationHistory,
  IrrigationSchedule,
} from '../types/irrigation-scheduling.types'

export const irrigationSchedules: IrrigationSchedule[] = [
  { id: 'ir-01', field: 'River Field', crop: 'Sweet corn', date: '2026-10-24', durationHours: 2, waterGallons: 5200, status: 'Scheduled' },
  { id: 'ir-02', field: 'North Orchard', crop: 'Apple', date: '2026-10-25', durationHours: 1.5, waterGallons: 3100, status: 'Scheduled' },
  { id: 'ir-03', field: 'East Field', crop: 'Tomato', date: '2026-10-22', durationHours: 1, waterGallons: 1800, status: 'Completed' },
]

export const cropWaterRequirements: CropWaterRequirement[] = [
  { crop: 'Tomato', stage: 'Fruit development', inchesPerWeek: 1.2 },
  { crop: 'Sweet corn', stage: 'Maturing', inchesPerWeek: 1.0 },
  { crop: 'Apple', stage: 'Fruit development', inchesPerWeek: 0.8 },
]

export const irrigationHistory: IrrigationHistory[] = [
  { id: 'ih-01', field: 'East Field', date: 'Oct 22', appliedInches: 0.4, method: 'Drip' },
  { id: 'ih-02', field: 'River Field', date: 'Oct 20', appliedInches: 0.6, method: 'Drip' },
  { id: 'ih-03', field: 'North Orchard', date: 'Oct 19', appliedInches: 0.3, method: 'Micro-sprinkler' },
]

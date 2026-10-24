export interface IrrigationSchedule {
  id: string
  field: string
  crop: string
  date: string
  durationHours: number
  waterGallons: number
  status: 'Scheduled' | 'Completed' | 'Needs review'
}

export interface CropWaterRequirement {
  crop: string
  stage: string
  inchesPerWeek: number
}

export interface IrrigationHistory {
  id: string
  field: string
  date: string
  appliedInches: number
  method: string
}

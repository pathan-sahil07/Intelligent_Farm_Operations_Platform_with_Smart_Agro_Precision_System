export type GrowthStage = 'Seedling' | 'Vegetative' | 'Flowering' | 'Maturing' | 'Harvesting'
export type CropHealth = 'Healthy' | 'Monitor' | 'Attention needed'

export interface CropRecord {
  id: string
  crop: string
  variety: string
  field: string
  sowingDate: string
  stage: GrowthStage
  health: CropHealth
  harvestDate: string
}

export interface FertilizerApplication {
  id: string
  crop: string
  product: string
  appliedOn: string
  amount: string
}

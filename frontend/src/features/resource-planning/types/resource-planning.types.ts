export type ResourceCategory = 'Seeds' | 'Fertilizer' | 'Water' | 'Labour' | 'Other'

export interface ResourceAllocation {
  id: string
  resource: string
  category: ResourceCategory
  quantity: number
  unit: string
  field: string
  period: string
}

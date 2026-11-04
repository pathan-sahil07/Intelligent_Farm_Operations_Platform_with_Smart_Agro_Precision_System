import type { Feature, FeatureCollection, Polygon } from 'geojson'
import type { FarmProfile } from '../../farm-management/types/farm-management.types'

export type { FarmCoordinates } from '../../farm-management/types/farm-management.types'
export type FarmMapRecord = FarmProfile

export type IrrigationStatus = 'Scheduled' | 'Needs irrigation' | 'Up to date'

export interface FieldBoundaryProperties {
  fieldId: string
  irrigationStatus: IrrigationStatus
}

export interface FieldProperties {
  farmId: string
  fieldId: string
  name: string
  areaAcres: number
  crop: string
  irrigationStatus: IrrigationStatus
}

export type FieldBoundary = Feature<Polygon, FieldProperties>

export interface SampleFarmMapData {
  fields: FeatureCollection<Polygon, FieldBoundaryProperties>
}

export interface FarmMapData {
  farms: FarmMapRecord[]
  fields: FeatureCollection<Polygon, FieldProperties>
}

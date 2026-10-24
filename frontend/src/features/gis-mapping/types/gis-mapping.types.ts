import type { Feature, FeatureCollection, Polygon } from 'geojson'

export interface FarmCoordinates {
  latitude: number
  longitude: number
}

export interface FarmMapRecord {
  id: string
  name: string
  location: string
  coordinates: FarmCoordinates
  areaAcres: number
}

export type IrrigationStatus = 'Scheduled' | 'Needs irrigation' | 'Up to date'

export interface FieldProperties {
  farmId: string
  fieldId: string
  name: string
  areaAcres: number
  crop: string
  irrigationStatus: IrrigationStatus
}

export type FieldBoundary = Feature<Polygon, FieldProperties>

export interface FarmMapData {
  farms: FarmMapRecord[]
  fields: FeatureCollection<Polygon, FieldProperties>
}

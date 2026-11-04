import { sampleFarmMapData } from '../data/sampleData'
import { getFarmManagementSnapshot } from '../../farm-management/services/farmManagementService'
import type { FarmManagementSnapshot } from '../../farm-management/types/farm-management.types'
import type { FarmMapData } from '../types/gis-mapping.types'

export function getFarmMapData(
  snapshot: FarmManagementSnapshot = getFarmManagementSnapshot(),
): FarmMapData {
  const farmsById = new Map(snapshot.farms.map((farm) => [farm.id, farm]))
  const fieldsById = new Map(snapshot.fields.map((field) => [field.id, field]))
  const features = sampleFarmMapData.fields.features.flatMap((boundary) => {
    const field = fieldsById.get(boundary.properties.fieldId)
    const farm = field ? farmsById.get(field.farmId) : undefined
    if (!field || !farm) return []

    return [{
      ...boundary,
      properties: {
        farmId: farm.id,
        fieldId: field.id,
        name: field.name,
        areaAcres: field.area,
        crop: field.crop,
        irrigationStatus: boundary.properties.irrigationStatus,
      },
    }]
  })

  return {
    farms: snapshot.farms,
    fields: { ...sampleFarmMapData.fields, features },
  }
}

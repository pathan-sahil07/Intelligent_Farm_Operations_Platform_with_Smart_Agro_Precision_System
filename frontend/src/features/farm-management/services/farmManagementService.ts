import { sampleFarmMapData } from '../../gis-mapping/data/sampleData'
import { farmFields, farmProfiles } from '../data/sampleData'
import type {
  FarmField,
  FarmManagementSnapshot,
  FarmProfile,
} from '../types/farm-management.types'

export type FarmManagementResult<T> =
  | { success: true; value: T }
  | { success: false; error: string; dependents?: string[] }

export interface FarmAcreageSummary {
  totalArea: number
  registeredArea: number
  unregisteredArea: number
  totalFields: number
  mappedFields: number
  unmappedFields: number
}

let snapshot: FarmManagementSnapshot = {
  farms: farmProfiles.map((farm) => ({ ...farm, coordinates: { ...farm.coordinates } })),
  fields: farmFields.map((field) => ({ ...field })),
}

const listeners = new Set<() => void>()

function publish(next: FarmManagementSnapshot) {
  snapshot = next
  listeners.forEach((listener) => listener())
}

function validCoordinates(coordinates: FarmProfile['coordinates']) {
  return (
    coordinates === undefined ||
    (Number.isFinite(coordinates.latitude) &&
      coordinates.latitude >= -90 &&
      coordinates.latitude <= 90 &&
      Number.isFinite(coordinates.longitude) &&
      coordinates.longitude >= -180 &&
      coordinates.longitude <= 180)
  )
}

function validateFarm(farm: FarmProfile, currentId?: string): string | undefined {
  if (!farm.id.trim() || !farm.farmName.trim() || !farm.location.trim()) {
    return 'Enter a farm ID, farm name, and location.'
  }
  if (!Number.isFinite(farm.totalArea) || farm.totalArea <= 0) {
    return 'Farm area must be a positive number.'
  }
  if (!validCoordinates(farm.coordinates)) {
    return 'Enter valid latitude and longitude coordinates.'
  }
  if (snapshot.farms.some((item) => item.id === farm.id.trim() && item.id !== currentId)) {
    return `Farm ID "${farm.id.trim()}" is already in use.`
  }
  const allocatedArea = snapshot.fields
    .filter((field) => field.farmId === (currentId ?? farm.id.trim()))
    .reduce((total, field) => total + field.area, 0)
  if (farm.totalArea + Number.EPSILON < allocatedArea) {
    return `Farm area cannot be less than its ${allocatedArea} acres of registered fields.`
  }
  return undefined
}

function validateField(field: FarmField, currentId?: string): string | undefined {
  if (!field.id.trim() || !field.farmId.trim() || !field.name.trim() || !field.crop.trim()) {
    return 'Enter a field ID, farm, field name, and crop.'
  }
  if (!Number.isFinite(field.area) || field.area <= 0) {
    return 'Field area must be a positive number.'
  }
  if (snapshot.fields.some((item) => item.id === field.id.trim() && item.id !== currentId)) {
    return `Field ID "${field.id.trim()}" is already in use.`
  }
  const farm = snapshot.farms.find((item) => item.id === field.farmId.trim())
  if (!farm) return 'Choose an existing farm for this field.'
  const allocatedArea = snapshot.fields
    .filter((item) => item.farmId === field.farmId.trim() && item.id !== currentId)
    .reduce((total, item) => total + item.area, 0)
  if (allocatedArea + field.area > farm.totalArea + Number.EPSILON) {
    return `This field would exceed ${farm.farmName}'s ${farm.totalArea} acre total.`
  }
  return undefined
}

function farmDependents(farmId: string): string[] {
  const farmFields = snapshot.fields.filter((field) => field.farmId === farmId)
  return farmFields.map((field) => `Field ${field.name} (${field.id})`)
}

export function subscribeFarmManagement(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getFarmManagementSnapshot() {
  return snapshot
}

export function getFarmAcreageSummary(
  farmId?: string,
  source: FarmManagementSnapshot = snapshot,
): FarmAcreageSummary {
  const farms = source.farms.filter((farm) => !farmId || farm.id === farmId)
  const farmIds = new Set(farms.map((farm) => farm.id))
  const fields = source.fields.filter((field) => farmIds.has(field.farmId))
  const mappedFieldIds = new Set(
    sampleFarmMapData.fields.features.map((feature) => feature.properties.fieldId),
  )
  const mappedFields = fields.filter((field) => mappedFieldIds.has(field.id)).length
  const totalArea = farms.reduce((total, farm) => total + farm.totalArea, 0)
  const registeredArea = fields.reduce((total, field) => total + field.area, 0)
  return {
    totalArea,
    registeredArea,
    unregisteredArea: totalArea - registeredArea,
    totalFields: fields.length,
    mappedFields,
    unmappedFields: fields.length - mappedFields,
  }
}

export function createFarm(farm: FarmProfile): FarmManagementResult<FarmProfile> {
  const normalized = {
    ...farm,
    id: farm.id.trim(),
    farmName: farm.farmName.trim(),
    location: farm.location.trim(),
    farmer: farm.farmer?.trim() || undefined,
    coordinates: { ...farm.coordinates },
  }
  const error = validateFarm(normalized)
  if (error) return { success: false, error }
  publish({ ...snapshot, farms: [...snapshot.farms, normalized] })
  return { success: true, value: normalized }
}

export function updateFarm(
  farmId: string,
  farm: Omit<FarmProfile, 'id'>,
): FarmManagementResult<FarmProfile> {
  const current = snapshot.farms.find((item) => item.id === farmId)
  if (!current) return { success: false, error: `Farm "${farmId}" was not found.` }
  const normalized: FarmProfile = {
    ...farm,
    id: farmId,
    farmName: farm.farmName.trim(),
    location: farm.location.trim(),
    farmer: farm.farmer?.trim() || undefined,
    coordinates: { ...farm.coordinates },
  }
  const error = validateFarm(normalized, farmId)
  if (error) return { success: false, error }
  publish({
    ...snapshot,
    farms: snapshot.farms.map((item) => (item.id === farmId ? normalized : item)),
  })
  return { success: true, value: normalized }
}

export function deleteFarm(farmId: string): FarmManagementResult<string> {
  const farm = snapshot.farms.find((item) => item.id === farmId)
  if (!farm) return { success: false, error: `Farm "${farmId}" was not found.` }
  const dependents = farmDependents(farmId)
  if (dependents.length > 0) {
    return {
      success: false,
      error: `Cannot delete ${farm.farmName}; dependent records must be resolved first.`,
      dependents,
    }
  }
  publish({ ...snapshot, farms: snapshot.farms.filter((item) => item.id !== farmId) })
  return { success: true, value: farmId }
}

export function createField(field: FarmField): FarmManagementResult<FarmField> {
  const normalized = {
    ...field,
    id: field.id.trim(),
    farmId: field.farmId.trim(),
    name: field.name.trim(),
    crop: field.crop.trim(),
  }
  const error = validateField(normalized)
  if (error) return { success: false, error }
  publish({ ...snapshot, fields: [...snapshot.fields, normalized] })
  return { success: true, value: normalized }
}

export function updateField(
  fieldId: string,
  field: Omit<FarmField, 'id'>,
): FarmManagementResult<FarmField> {
  const current = snapshot.fields.find((item) => item.id === fieldId)
  if (!current) return { success: false, error: `Field "${fieldId}" was not found.` }
  const normalized: FarmField = {
    ...field,
    id: fieldId,
    farmId: field.farmId.trim(),
    name: field.name.trim(),
    crop: field.crop.trim(),
  }
  const error = validateField(normalized, fieldId)
  if (error) return { success: false, error }
  publish({
    ...snapshot,
    fields: snapshot.fields.map((item) => (item.id === fieldId ? normalized : item)),
  })
  return { success: true, value: normalized }
}

export function deleteField(fieldId: string): FarmManagementResult<string> {
  const field = snapshot.fields.find((item) => item.id === fieldId)
  if (!field) return { success: false, error: `Field "${fieldId}" was not found.` }
  publish({ ...snapshot, fields: snapshot.fields.filter((item) => item.id !== fieldId) })
  return { success: true, value: fieldId }
}

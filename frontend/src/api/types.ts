export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface User {
  id: number
  fullName: string
  email: string
  phone: string | null
  role: string
  active: boolean
  createdAt: string
}
export interface AuthResponse {
  token: string
  tokenType: string
  expiresIn: number
  user: User
}
export interface UserLookup {
  id: number
  fullName: string
  email: string
  role: string
}
export interface RoleInfo {
  name: string
  description: string | null
  permissions: string[]
}
export interface PermissionInfo {
  code: string
  description: string | null
}
export interface AuditEntry {
  id: number
  userId: number | null
  userEmail: string | null
  action: string
  entityType: string
  entityId: number | null
  details: string | null
  createdAt: string
}

export interface FarmRef {
  id: number
  name: string
  latitude: number | null
  longitude: number | null
  totalAreaAcres: number
  ownerId: number
}

export interface FarmDashboard {
  farm: FarmRef
  plotCount: number
  plottedAcres: number
  activeCrops: number
  upcomingHarvests: { cropId: number; name: string; expectedHarvestDate: string }[]
  pendingIrrigation: number
  lowStockItems: number
  equipmentDueMaintenance: number
  openTasks: number
}

export interface PlotRef {
  id: number
  name: string
  areaAcres: number
}

// ---- crops (snake_case, legacy contract) ----
export const GROWTH_STAGES = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Mature'] as const
export interface Crop {
  id: number
  name: string
  variety: string | null
  farm_id: number | null
  plot_id: number | null
  field_name: string
  area_acres: number
  planting_date: string
  expected_harvest_date: string | null
  growth_stage: (typeof GROWTH_STAGES)[number]
  status: 'Active' | 'Harvested'
  notes: string | null
}
export interface CropInput {
  name: string
  variety?: string
  farm_id: number
  plot_id?: number | null
  field_name: string
  area_acres: number
  planting_date: string
  expected_harvest_date?: string | null
  growth_stage: string
  notes?: string
}
export interface Harvest {
  id: number
  crop_id: number | null
  crop_name: string
  farm_id: number | null
  harvest_date: string
  quantity_kg: number
  quality: string | null
  notes: string | null
}
export interface CropHealth {
  id: number
  cropId: number
  recordDate: string
  status: string
  issue: string | null
  notes: string | null
}
export interface CropActivity {
  id: number
  cropId: number
  activityType: string
  activityDate: string
  productName: string | null
  inventoryItemId: number | null
  quantity: number
  unit: string | null
  notes: string | null
}

// ---- irrigation ----
export interface Irrigation {
  id: number
  crop_id: number
  crop_name: string
  farm_id: number | null
  plot_id: number | null
  scheduled_date: string
  scheduled_time: string | null
  water_liters: number
  method: string
  status: 'Scheduled' | 'Completed' | 'Skipped'
  notes: string | null
}
export interface Recommendation {
  cropId: number
  cropName: string
  plotId: number | null
  date: string
  recommendation: 'IRRIGATE' | 'SKIP' | 'DELAY'
  reason: string
  rainMm: number | null
  rainProbability: number | null
  tempMaxC: number | null
}
export interface SoilMoisture {
  id: number
  plotId: number
  readingDate: string
  moisturePercent: number
  source: string | null
}

// ---- resources / tasks / labour ----
export interface Resource {
  id: number
  farmId: number | null
  name: string
  category: string
  unit: string
  plannedQuantity: number
  consumedQuantity: number
  cost: number
  season: string | null
}
export interface Utilization {
  category: string
  planned: number
  consumed: number
  utilizationPercent: number
  cost: number
}
export const TASK_STATUSES = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const
export interface Task {
  id: number
  farmId: number
  title: string
  description: string | null
  taskType: string | null
  assignedTo: number | null
  assignedToName: string | null
  dueDate: string | null
  status: (typeof TASK_STATUSES)[number]
  estimatedCost: number | null
  actualCost: number | null
}
export interface Labour {
  id: number
  farmId: number
  userId: number
  userName: string | null
  workDate: string
  hours: number
  hourlyRate: number
  cost: number
  notes: string | null
}

// ---- inventory ----
export const INVENTORY_CATEGORIES = ['SEED', 'FERTILIZER', 'PESTICIDE', 'CONSUMABLE', 'OTHER'] as const
export interface InventoryItem {
  id: number
  farmId: number | null
  name: string
  category: string
  unit: string
  quantity: number
  reorderLevel: number
  unitCost: number | null
  expiryDate: string | null
  supplierId: number | null
  lowStock: boolean
}
export interface InventoryTx {
  id: number
  inventoryItemId: number
  transactionType: string
  quantity: number
  unitCost: number | null
  supplierId: number | null
  cropId: number | null
  notes: string | null
  createdAt: string
}
export interface Supplier {
  id: number
  farmId: number
  name: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
}

// ---- equipment ----
export interface Equipment {
  id: number
  farmId: number | null
  name: string
  category: string
  identifier: string | null
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED'
  purchaseDate: string | null
  purchaseCost: number | null
  operatingHours: number
  allocatedToUserId: number | null
  allocatedToTaskId: number | null
  nextMaintenanceDate: string | null
}
export interface Maintenance {
  id: number
  equipmentId: number
  equipmentName: string
  scheduledDate: string
  completedDate: string | null
  maintenanceType: string
  cost: number | null
  notes: string | null
}

// ---- weather ----
export interface WeatherReport {
  farmId: number
  source: string
  current: {
    time: string | null
    temperatureC: number | null
    humidityPercent: number | null
    windSpeedKmh: number | null
    precipitationMm: number | null
    weatherCode: number | null
  } | null
  forecast: {
    date: string
    tempMaxC: number | null
    tempMinC: number | null
    precipitationMm: number | null
    precipitationProbability: number | null
    windMaxKmh: number | null
  }[]
  alerts: { type: string; severity: string; date: string; message: string }[]
}

// ---- gis ----
export interface GeoFeature {
  type: 'Feature'
  geometry: { type: string; coordinates: unknown } | null
  properties: Record<string, unknown>
}
export interface FeatureCollection {
  type: 'FeatureCollection'
  features: GeoFeature[]
}

// ---- notifications ----
export interface AppNotification {
  id: number
  type: string
  title: string
  message: string | null
  link: string | null
  read: boolean
  createdAt: string
}

// ---- analytics ----
export interface AnalyticsOverview {
  totalFarms: number
  totalPlots: number
  activeCrops: number
  harvestRecords: number
  irrigationSchedules: number
  inventoryItems: number
  totalHarvestKg: number
  completedIrrigation: number
  totalWaterLiters: number
  operationalCost: number
  lowStockCount: number
  openTasks: number
}
export interface AnalyticsFilter {
  farmId?: number
  from?: string
  to?: string
}

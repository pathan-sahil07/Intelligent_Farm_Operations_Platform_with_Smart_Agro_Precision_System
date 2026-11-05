/**
 * Shapes returned by the Spring Boot Farm Management API (module 2).
 * They mirror the backend entities and DTOs one-to-one: BigDecimal fields arrive as
 * JSON numbers and LocalDate / LocalDateTime fields arrive as ISO strings.
 */

export interface Farm {
  id: number
  name: string
  ownerId: number
  village: string | null
  district: string | null
  state: string | null
  latitude: number | null
  longitude: number | null
  totalAreaAcres: number
  createdAt: string | null
}

export interface Plot {
  id: number
  farmId: number
  name: string
  areaAcres: number
  soilType: string | null
}

export interface SoilTest {
  id: number
  plotId: number
  testDate: string
  ph: number | null
  nitrogen: number | null
  phosphorus: number | null
  potassium: number | null
  notes: string | null
}

export interface FarmWorkerRecord {
  id: number
  farmId: number
  userId: number
  assignedAt: string | null
}

export interface LandDocument {
  id: number
  farmId: number
  docType: string | null
  fileName: string
  uploadedAt: string | null
}

export interface PlotWithSoil {
  plot: Plot
  latestSoilTest: SoilTest | null
}

export interface WorkerInfo {
  userId: number
  /** null until Module 1 (User & Access) provides user names */
  name: string | null
  assignedAt: string | null
}

export interface FarmSummary {
  farm: Farm
  plotCount: number
  plottedAreaAcres: number
  unplottedAreaAcres: number
  plots: PlotWithSoil[]
  assignedWorkerIds: number[]
  workers: WorkerInfo[]
  documentCount: number
  /** e.g. { crops: 'Coming soon', irrigation: 'Coming soon', ... } */
  upcomingModules: Record<string, string>
}

/** Body of POST /api/farms */
export interface FarmCreateInput {
  name: string
  ownerId: number
  village?: string | null
  district?: string | null
  state?: string | null
  latitude?: number | null
  longitude?: number | null
  totalAreaAcres: number
}

/** Body of PUT /api/farms/{id} (the owner cannot be changed) */
export type FarmUpdateInput = Omit<FarmCreateInput, 'ownerId'>

/** Body of POST /api/farms/{id}/plots and PUT /api/plots/{id} */
export interface PlotInput {
  name: string
  areaAcres: number
  soilType?: string | null
}

/** Body of POST /api/plots/{id}/soil-tests and PUT /api/soil-tests/{id} */
export interface SoilTestInput {
  testDate: string
  ph?: number | null
  nitrogen?: number | null
  phosphorus?: number | null
  potassium?: number | null
  notes?: string | null
}

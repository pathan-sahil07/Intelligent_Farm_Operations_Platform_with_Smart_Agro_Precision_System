import type {
  Farm,
  FarmCreateInput,
  FarmSummary,
  FarmUpdateInput,
  FarmWorkerRecord,
  LandDocument,
  Plot,
  PlotInput,
  SoilTest,
  SoilTestInput,
} from '../types/farm-management.types'

/**
 * In development the Vite dev server proxies these paths to the Spring Boot app
 * (see vite.config.ts), so the default base is the same origin. For a deployed build
 * set VITE_FARM_API_URL, e.g. https://farm.example.com/api
 */
const API_BASE = (import.meta.env.VITE_FARM_API_URL as string | undefined)?.replace(/\/+$/, '') ?? '/api'

/** Error thrown for every failed call. `fieldErrors` is filled for 400 validation responses. */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  return new ApiError(0, error instanceof Error ? error.message : 'Something went wrong.')
}

const NETWORK_MESSAGE = 'Cannot reach the farm service. Check that the backend is running on port 8080.'

async function send(path: string, init: RequestInit = {}): Promise<Response> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, NETWORK_MESSAGE)
  }
  if (response.ok) return response

  // GlobalExceptionHandler returns { timestamp, status, error, message }.
  // `message` is a string, or a { field: message } map for bean-validation failures.
  const body = (await response.json().catch(() => null)) as { message?: unknown } | null
  const message = body?.message
  if (message && typeof message === 'object') {
    throw new ApiError(response.status, 'Check the highlighted fields and try again.', message as Record<string, string>)
  }
  if (typeof message === 'string' && message) throw new ApiError(response.status, message)
  // A proxy answers 5xx with no JSON body when the Spring app is down.
  throw new ApiError(
    response.status,
    response.status >= 500 ? NETWORK_MESSAGE : `The request failed (${response.status}).`,
  )
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await send(path, init)
  return (await response.json()) as T
}

function jsonBody(method: 'POST' | 'PUT', payload: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
}

export const farmApi = {
  // ---- Farms ----
  listFarms(filter: { ownerId?: number; workerId?: number } = {}, signal?: AbortSignal) {
    const params = new URLSearchParams()
    if (filter.ownerId !== undefined) params.set('ownerId', String(filter.ownerId))
    if (filter.workerId !== undefined) params.set('workerId', String(filter.workerId))
    const query = params.size ? `?${params}` : ''
    return json<Farm[]>(`/farms${query}`, { signal })
  },
  createFarm: (input: FarmCreateInput) => json<Farm>('/farms', jsonBody('POST', input)),
  updateFarm: (id: number, input: FarmUpdateInput) => json<Farm>(`/farms/${id}`, jsonBody('PUT', input)),
  async deleteFarm(id: number) {
    await send(`/farms/${id}`, { method: 'DELETE' })
  },
  getSummary: (id: number, signal?: AbortSignal) => json<FarmSummary>(`/farms/${id}/summary`, { signal }),

  // ---- Plots ----
  createPlot: (farmId: number, input: PlotInput) => json<Plot>(`/farms/${farmId}/plots`, jsonBody('POST', input)),
  updatePlot: (id: number, input: PlotInput) => json<Plot>(`/plots/${id}`, jsonBody('PUT', input)),
  async deletePlot(id: number) {
    await send(`/plots/${id}`, { method: 'DELETE' })
  },

  // ---- Soil tests ----
  listSoilTests: (plotId: number, signal?: AbortSignal) =>
    json<SoilTest[]>(`/plots/${plotId}/soil-tests`, { signal }),
  addSoilTest: (plotId: number, input: SoilTestInput) =>
    json<SoilTest>(`/plots/${plotId}/soil-tests`, jsonBody('POST', input)),
  updateSoilTest: (id: number, input: SoilTestInput) => json<SoilTest>(`/soil-tests/${id}`, jsonBody('PUT', input)),
  async deleteSoilTest(id: number) {
    await send(`/soil-tests/${id}`, { method: 'DELETE' })
  },

  // ---- Workers ----
  assignWorker: (farmId: number, userId: number) =>
    json<FarmWorkerRecord>(`/farms/${farmId}/workers/${userId}`, { method: 'POST' }),
  async unassignWorker(farmId: number, userId: number) {
    await send(`/farms/${farmId}/workers/${userId}`, { method: 'DELETE' })
  },

  // ---- Land documents ----
  listDocuments: (farmId: number, signal?: AbortSignal) =>
    json<LandDocument[]>(`/farms/${farmId}/documents`, { signal }),
  uploadDocument(farmId: number, file: File, docType: string) {
    // Do not set Content-Type: the browser adds the multipart boundary itself.
    const form = new FormData()
    form.append('file', file)
    if (docType) form.append('docType', docType)
    return json<LandDocument>(`/farms/${farmId}/documents`, { method: 'POST', body: form })
  },
  async downloadDocument(id: number): Promise<Blob> {
    return (await send(`/documents/${id}/download`)).blob()
  },
  async deleteDocument(id: number) {
    await send(`/documents/${id}`, { method: 'DELETE' })
  },
}

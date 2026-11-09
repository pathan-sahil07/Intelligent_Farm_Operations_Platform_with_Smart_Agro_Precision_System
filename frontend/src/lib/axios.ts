import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { API_URL, TOKEN_STORAGE_KEY } from '@/config/env'

/** Error thrown for every failed API call. `fieldErrors` is filled for 400 validation responses. */
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

export const NETWORK_MESSAGE = 'Cannot reach the farm service. Check your connection and that the backend is running.'
export const VALIDATION_MESSAGE = 'Check the highlighted fields and try again.'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    /* storage unavailable: the session just will not survive a reload */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** Turns anything thrown by axios (or elsewhere) into an ApiError using the contract's error format. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError(error)) {
    const response = error.response
    if (!response) {
      if (error.code === 'ERR_CANCELED') return new ApiError(0, 'Request cancelled.')
      return new ApiError(0, NETWORK_MESSAGE)
    }
    const body = response.data as { message?: unknown; error?: unknown } | null | undefined
    const message = body && typeof body === 'object' ? body.message : undefined
    if (message && typeof message === 'object') {
      return new ApiError(response.status, VALIDATION_MESSAGE, message as Record<string, string>)
    }
    if (typeof message === 'string' && message) return new ApiError(response.status, message)
    if (response.status >= 500 && response.status !== 503) {
      return new ApiError(response.status, 'The server had a problem handling this request. Please try again.')
    }
    if (response.status === 503) return new ApiError(503, 'This service is currently unavailable.')
    if (response.status === 403) return new ApiError(403, 'You do not have permission to do that.')
    if (response.status === 401) return new ApiError(401, 'Your session has expired. Please sign in again.')
    return new ApiError(response.status, `The request failed (${response.status}).`)
  }
  return new ApiError(0, error instanceof Error ? error.message : 'Something went wrong.')
}

export function errorMessage(error: unknown): string {
  return toApiError(error).message
}

let unauthorizedHandler: () => void = () => {
  const path = window.location.pathname
  if (path !== '/login' && path !== '/register') window.location.assign('/login')
}

/** Lets the app (and tests) replace the default hard redirect to /login after a 401. */
export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

const PUBLIC_PATHS = ['/auth/login', '/auth/register']

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    const url = (error as AxiosError).config?.url ?? ''
    if (apiError.status === 401 && !PUBLIC_PATHS.some((path) => url.endsWith(path))) {
      clearToken()
      unauthorizedHandler()
    }
    return Promise.reject(apiError)
  },
)

/** Drops empty filter values so they are not sent as `?q=`. */
export function cleanParams<T extends Record<string, unknown>>(params?: T): Partial<T> | undefined {
  if (!params) return undefined
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')) as Partial<T>
}

export async function get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
  return (await api.get<T>(url, { ...config, params: cleanParams(params) })).data
}
export async function post<T = void>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return (await api.post<T>(url, body, config)).data
}
export async function put<T = void>(url: string, body?: unknown): Promise<T> {
  return (await api.put<T>(url, body)).data
}
export async function patch<T = void>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return (await api.patch<T>(url, body, config)).data
}
export async function del(url: string): Promise<void> {
  await api.delete(url)
}

/** Fetches a file with the auth header and hands it to the browser as a download. */
export async function downloadFile(url: string, params: Record<string, unknown>, filename: string) {
  const response = await api.get<Blob>(url, { params: cleanParams(params), responseType: 'blob' })
  const href = URL.createObjectURL(response.data)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(href)
}

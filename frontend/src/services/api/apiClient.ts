import { API_ENDPOINTS } from './apiConfig'

export interface ApiErrorResponse {
  code?: string
  message: string
}

export class ApiError extends Error {
  code?: string
  status: number

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function unavailableMessage(status: number): string {
  return `The server or an upstream service is unavailable (HTTP ${status}). Check that the backend is running and try again.`
}

function isGatewayFailure(status: number): boolean {
  return status === 502 || status === 504
}

class ApiClient {
  private csrfToken: string | null = null
  private csrfPromise: Promise<string> | null = null

  public setCsrfToken(token: string | null) {
    this.csrfToken = token
  }

  public getCsrfToken(): string | null {
    return this.csrfToken
  }

  public async fetchCsrfToken(): Promise<string> {
    if (this.csrfToken) {
      return this.csrfToken
    }
    if (this.csrfPromise) {
      return this.csrfPromise
    }

    this.csrfPromise = (async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      try {
        const response = await fetch(API_ENDPOINTS.csrf, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          const message = isGatewayFailure(response.status)
            ? unavailableMessage(response.status)
            : `Failed to initialize security token (HTTP ${response.status}).`
          throw new ApiError(message, response.status)
        }

        let data: unknown
        try {
          data = await response.json()
        } catch {
          throw new ApiError('The server returned an invalid security token response.', response.status)
        }
        if (!isRecord(data) || typeof data.csrfToken !== 'string' || !data.csrfToken) {
          throw new ApiError('Security token was missing from the server response.', response.status)
        }
        this.csrfToken = data.csrfToken
        return data.csrfToken
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new ApiError('Security token request timed out. Please check your connection.', 408)
        }
        if (err instanceof TypeError) {
          throw new ApiError(
            'Unable to connect to the authentication service. Check that the backend is running and try again.',
            0,
          )
        }
        throw err
      } finally {
        clearTimeout(timeoutId)
        this.csrfPromise = null
      }
    })()

    return this.csrfPromise
  }

  public async request<T = unknown>(url: string, options: RequestInit & { _isRetry?: boolean; timeout?: number } = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase()
    const headers = new Headers(options.headers || {})

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json')
    }

    if (method !== 'GET' && method !== 'HEAD') {
      if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
        headers.set('Content-Type', 'application/json')
      }

      const token = await this.fetchCsrfToken()
      headers.set('X-CSRF-Token', token)
    }

    const controller = new AbortController()
    const timeoutMs = options.timeout || 10000
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    const abortFromCaller = () => controller.abort()
    options.signal?.addEventListener('abort', abortFromCaller, { once: true })
    if (options.signal?.aborted) {
      controller.abort()
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        signal: controller.signal,
      })

      if (response.status === 204) {
        return null as T
      }

      let responseData: unknown = null
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        try {
          responseData = await response.json()
        } catch {
          if (response.ok) {
            throw new ApiError('The server returned an invalid response.', response.status)
          }
        }
      } else {
        const text = await response.text()
        try {
          responseData = JSON.parse(text)
        } catch {
          responseData = { message: text }
        }
      }

      if (!response.ok) {
        const message = isGatewayFailure(response.status)
          ? unavailableMessage(response.status)
          : isRecord(responseData) && typeof responseData.message === 'string'
            ? responseData.message
            : `Request failed with status ${response.status}`
        const code = isRecord(responseData) && typeof responseData.code === 'string'
          ? responseData.code
          : undefined

        // If token expired or was invalidated, clear cache and retry once with fresh token
        if (response.status === 403 && code === 'csrf_invalid' && !options._isRetry) {
          this.csrfToken = null
          const freshToken = await this.fetchCsrfToken()
          const retryHeaders = new Headers(options.headers || {})
          if (!retryHeaders.has('Accept')) {
            retryHeaders.set('Accept', 'application/json')
          }
          if (!retryHeaders.has('Content-Type') && options.body && typeof options.body === 'string') {
            retryHeaders.set('Content-Type', 'application/json')
          }
          retryHeaders.set('X-CSRF-Token', freshToken)
          return this.request<T>(url, { ...options, headers: retryHeaders, _isRetry: true })
        }

        throw new ApiError(message, response.status, code)
      }

      if (url === API_ENDPOINTS.session && isRecord(responseData) && responseData.authenticated === false) {
        this.csrfToken = null
      }

      // Capture new CSRF token if provided by backend grant response
      if (isRecord(responseData) && typeof responseData.csrfToken === 'string' && responseData.csrfToken) {
        this.csrfToken = responseData.csrfToken
      }

      return responseData as T
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiError('Request timed out while communicating with the server.', 408)
      }
      if (err instanceof TypeError) {
        throw new ApiError(
          'Unable to connect to the server. Check your connection and make sure the backend is running.',
          0,
        )
      }
      throw err
    } finally {
      clearTimeout(timeoutId)
      options.signal?.removeEventListener('abort', abortFromCaller)
    }
  }
}

export const apiClient = new ApiClient()

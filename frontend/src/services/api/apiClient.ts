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
      try {
        const response = await fetch(API_ENDPOINTS.csrf, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new ApiError('Failed to initialize security token.', response.status)
        }

        const data = (await response.json()) as { csrfToken: string }
        this.csrfToken = data.csrfToken
        return data.csrfToken
      } finally {
        this.csrfPromise = null
      }
    })()

    return this.csrfPromise
  }

  public async request<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase()
    const headers = new Headers(options.headers || {})

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json')
    }

    if (method !== 'GET' && method !== 'HEAD') {
      if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
        headers.set('Content-Type', 'application/json')
      }

      // Ensure CSRF token for mutating requests
      try {
        const token = await this.fetchCsrfToken()
        if (token) {
          headers.set('X-CSRF-Token', token)
        }
      } catch (err) {
        // Continue even if CSRF bootstrap fails, server filter will return 403 if missing
        console.warn('Could not pre-fetch CSRF token:', err)
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })

    if (response.status === 204) {
      return null as T
    }

    let responseData: any = null
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json()
      } catch {
        responseData = null
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
      const message = responseData?.message || `Request failed with status ${response.status}`
      const code = responseData?.code
      throw new ApiError(message, response.status, code)
    }

    // Capture new CSRF token if provided by backend grant response
    if (responseData && typeof responseData === 'object' && 'csrfToken' in responseData && responseData.csrfToken) {
      this.csrfToken = responseData.csrfToken
    }

    return responseData as T
  }
}

export const apiClient = new ApiClient()


import { apiClient } from '../../../services/api/apiClient'
import { API_ENDPOINTS } from '../../../services/api/apiConfig'
import type { AuthResponse, CsrfResponse, LoginCredentials, RegistrationData } from '../types/auth.types'

export const authService = {
  async getCsrf(): Promise<CsrfResponse> {
    return apiClient.request<CsrfResponse>(API_ENDPOINTS.csrf, {
      method: 'GET',
    })
  },

  async register(data: RegistrationData): Promise<AuthResponse> {
    return apiClient.request<AuthResponse>(API_ENDPOINTS.register, {
      method: 'POST',
      body: JSON.stringify({
        email: data.email.trim(),
        password: data.password,
      }),
    })
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient.request<AuthResponse>(API_ENDPOINTS.login, {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password,
      }),
    })
  },

  async getSession(): Promise<AuthResponse> {
    return apiClient.request<AuthResponse>(API_ENDPOINTS.session, {
      method: 'GET',
    })
  },

  async logout(): Promise<void> {
    try {
      await apiClient.request<void>(API_ENDPOINTS.logout, {
        method: 'POST',
      })
    } finally {
      apiClient.setCsrfToken(null)
    }
  },
}


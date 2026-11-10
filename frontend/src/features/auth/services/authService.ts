import { apiClient } from '../../../services/api/apiClient'
import { API_BASE_URL, API_ENDPOINTS } from '../../../services/api/apiConfig'
import type { AuthResponse, CsrfResponse, LoginCredentials, RegistrationData } from '../types/auth.types'

const SESSION_VERIFICATION_TIMEOUT_MS = 7000

export const authService = {
  async getCsrf(): Promise<CsrfResponse> {
    return apiClient.request<CsrfResponse>(API_ENDPOINTS.csrf, {
      method: 'GET',
    })
  },

  async register(data: RegistrationData): Promise<AuthResponse> {
    const account = {
      email: data.email.trim(),
      fullName: data.fullName.trim(),
      mobileNumber: data.mobileNumber.trim(),
      password: data.password,
    }

    if (data.role === 'FARM_OWNER' && !data.invitationToken?.trim()) {
      return apiClient.request<AuthResponse>(API_ENDPOINTS.register, {
        method: 'POST',
        body: JSON.stringify(account),
      })
    }

    if (!data.invitationToken?.trim()) {
      throw new Error(
        'An authorized invitation is required for this role. Ask a Farm Owner or your Farm Manager for an invitation.',
      )
    }

    return apiClient.request<AuthResponse>(`${API_BASE_URL}/invitations/accept`, {
      method: 'POST',
      body: JSON.stringify({
        token: data.invitationToken.trim(),
        fullName: account.fullName,
        selectedRole: data.role,
        password: account.password,
        mobileNumber: account.mobileNumber,
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
      timeout: SESSION_VERIFICATION_TIMEOUT_MS,
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

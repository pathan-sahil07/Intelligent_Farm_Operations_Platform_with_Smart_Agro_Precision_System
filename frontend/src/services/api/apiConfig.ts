export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const API_ENDPOINTS = {
  csrf: `${API_BASE_URL}/auth/csrf`,
  register: `${API_BASE_URL}/auth/register`,
  verifyEmail: `${API_BASE_URL}/auth/verify-email`,
  login: `${API_BASE_URL}/auth/login`,
  session: `${API_BASE_URL}/auth/session`,
  logout: `${API_BASE_URL}/auth/logout`,
} as const

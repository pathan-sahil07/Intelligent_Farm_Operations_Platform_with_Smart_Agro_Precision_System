export interface LoginCredentials {
  email: string
  password: string
}

export interface RegistrationData {
  email: string
  password: string
  fullName?: string
}

export interface CsrfResponse {
  csrfToken: string
}

export interface AuthResponse {
  authenticated: boolean
  email: string | null
  csrfToken?: string | null
}

export interface AuthUser {
  email: string
  fullName?: string
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  status: AuthStatus
  error: string | null
}

export interface RegisterResult {
  user: AuthUser | null
  requiresLogin: boolean
}



export interface LoginCredentials {
  email: string
  password: string
}

export interface RegistrationData {
  email: string
  password: string
  fullName: string
  mobileNumber: string
  role: 'FARM_OWNER' | 'FARM_MANAGER' | 'FARMER' | 'FIELD_WORKER'
  invitationToken?: string
}

export interface CsrfResponse {
  csrfToken: string
}

export interface AuthResponse {
  authenticated: boolean
  email: string | null
  csrfToken?: string | null
  verificationMode?: 'local-console' | 'smtp'
}

export interface AuthUser {
  email: string
  fullName?: string
  role?: string
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

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
  verificationMode?: AuthResponse['verificationMode']
}

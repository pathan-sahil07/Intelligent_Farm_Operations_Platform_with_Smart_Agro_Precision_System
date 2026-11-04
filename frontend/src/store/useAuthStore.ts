import { useSyncExternalStore } from 'react'
import { authService } from '../features/auth/services/authService'
import type {
  AuthState,
  AuthUser,
  LoginCredentials,
  RegisterResult,
  RegistrationData,
} from '../features/auth/types/auth.types'

let state: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  status: 'loading',
  error: null,
}

let inFlightSessionCheck: Promise<boolean> | null = null
const listeners = new Set<() => void>()

function setState(updater: Partial<AuthState> | ((prev: AuthState) => AuthState)) {
  const next = typeof updater === 'function' ? updater(state) : { ...state, ...updater }
  state = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): AuthState {
  return state
}

export const authStore = {
  getSnapshot,
  subscribe,

  /**
   * Validates active session against backend cookie.
   * If already initialized and not forced, returns cached authentication status
   * to avoid wiping dashboard state or unmounting protected pages during navigation.
   */
  async checkSession(force = false): Promise<boolean> {
    if (state.isInitialized && !force) {
      return state.isAuthenticated
    }

    if (inFlightSessionCheck) {
      return inFlightSessionCheck
    }

    inFlightSessionCheck = (async () => {
      try {
        const response = await authService.getSession()
        if (response && response.authenticated && response.email) {
          setState({
            user: { email: response.email },
            isAuthenticated: true,
            isInitialized: true,
            status: 'authenticated',
            isLoading: false,
            error: null,
          })
          return true
        } else {
          setState({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            status: 'unauthenticated',
            isLoading: false,
            error: null,
          })
          return false
        }
      } catch {
        setState({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          status: 'unauthenticated',
          isLoading: false,
          error: null,
        })
        return false
      } finally {
        inFlightSessionCheck = null
      }
    })()

    return inFlightSessionCheck
  },

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    setState({ isLoading: true, error: null })
    try {
      const response = await authService.login(credentials)
      const user: AuthUser = { email: response.email || credentials.email }
      setState({
        user,
        isAuthenticated: true,
        isInitialized: true,
        status: 'authenticated',
        isLoading: false,
        error: null,
      })
      return user
    } catch (err: any) {
      const errorMsg = err?.message || 'Login failed'
      setState({
        error: errorMsg,
        isLoading: false,
      })
      throw err
    }
  },

  async register(data: RegistrationData): Promise<RegisterResult> {
    setState({ isLoading: true, error: null })
    try {
      const response = await authService.register(data)
      const user: AuthUser = { email: response.email || data.email, fullName: data.fullName }

      // Check whether backend granted an active authenticated session
      if (response && response.authenticated) {
        setState({
          user,
          isAuthenticated: true,
          isInitialized: true,
          status: 'authenticated',
          isLoading: false,
          error: null,
        })
        return { user, requiresLogin: false }
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          status: 'unauthenticated',
          isLoading: false,
          error: null,
        })
        return { user: null, requiresLogin: true }
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Registration failed'
      setState({
        error: errorMsg,
        isLoading: false,
      })
      throw err
    }
  },

  async logout(): Promise<void> {
    setState({ isLoading: true, error: null })
    try {
      await authService.logout()
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isInitialized: true,
        status: 'unauthenticated',
        isLoading: false,
        error: null,
      })
    }
  },

  clearError(): void {
    setState({ error: null })
  },
}

export function useAuthStore(): AuthState & typeof authStore {
  const current = useSyncExternalStore(authStore.subscribe, authStore.getSnapshot)
  return {
    ...current,
    ...authStore,
  }
}

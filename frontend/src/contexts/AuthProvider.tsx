import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/endpoints'
import type { User } from '@/api/types'
import { roleHasPermission, type Permission } from '@/config/permissions'
import { clearToken, getToken, setToken, setUnauthorizedHandler } from '@/lib/axios'
import { AuthContext, type AuthState, type RegisterInput } from './auth.context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(() => getToken() !== null)

  const logout = useCallback(() => {
    clearToken()
    setUserState(null)
    queryClient.clear()
  }, [queryClient])

  // A 401 anywhere (expired or revoked token) signs the user out; route guards then send them to /login.
  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  useEffect(() => {
    if (!getToken()) return
    let cancelled = false
    authApi
      .me()
      .then((me) => {
        if (!cancelled) setUserState(me)
      })
      .catch(() => {
        if (!cancelled) clearToken()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    setToken(response.token)
    setUserState(response.user)
    return response.user
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const response = await authApi.register(input)
    setToken(response.token)
    setUserState(response.user)
    return response.user
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      setUser: setUserState,
      can: (permission: Permission) => roleHasPermission(user?.role, permission),
    }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

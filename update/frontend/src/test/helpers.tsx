import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext, type AuthState } from '@/contexts/auth.context'
import { roleHasPermission } from '@/config/permissions'

export const makeUser = (role = 'FARM_OWNER') => ({ id: 1, fullName: 'Test User', email: 't@example.com', phone: null, role, active: true, createdAt: '2026-01-01T00:00:00Z' })

export function authValue(over: Partial<AuthState> & { role?: string | null } = {}): AuthState {
  const role = over.role === undefined ? 'FARM_OWNER' : over.role
  return {
    user: role ? makeUser(role) : null,
    loading: false,
    login: async () => makeUser(role ?? 'FARM_OWNER'),
    register: async () => makeUser(role ?? 'FARM_OWNER'),
    logout: () => undefined,
    setUser: () => undefined,
    can: (p) => roleHasPermission(role, p),
    ...over,
  }
}

export function renderWith(ui: ReactElement, opts: { auth?: Partial<AuthState> & { role?: string | null }; route?: string } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={authValue(opts.auth)}>
        <MemoryRouter initialEntries={[opts.route ?? '/']}>{ui}</MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

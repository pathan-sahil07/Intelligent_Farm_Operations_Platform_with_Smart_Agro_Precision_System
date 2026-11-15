import { createContext } from 'react'
import type { User } from '@/api/types'
import type { Permission } from '@/config/permissions'

export interface RegisterInput {
  fullName: string
  email: string
  password: string
  phone?: string
  role: string
}

export interface AuthState {
  user: User | null
  /** True while the stored token is being checked on first load. */
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => void
  setUser: (user: User) => void
  /** UI gating only. The server enforces permissions on every request. */
  can: (permission: Permission) => boolean
}

export const AuthContext = createContext<AuthState | null>(null)

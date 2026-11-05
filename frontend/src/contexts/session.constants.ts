import type { Role } from './SessionContext'

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  farmer: 'Farmer',
  worker: 'Field worker',
}

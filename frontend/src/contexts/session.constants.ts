import type { Role } from './session.context'

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  farmer: 'Farm owner / manager',
  worker: 'Field staff',
}

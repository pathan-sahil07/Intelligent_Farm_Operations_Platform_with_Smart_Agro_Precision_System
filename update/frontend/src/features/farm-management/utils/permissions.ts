import type { Role } from '../../../contexts/SessionContext'

/**
 * Screen-level convenience: admins and farm owners/managers may edit farms, other staff only read.
 * The Spring API enforces the real rules (JWT permissions + farm-level access) on every request.
 */
export function canManageFarms(role: Role): boolean {
  return role === 'admin' || role === 'farmer'
}

import type { Role } from '../../../contexts/SessionContext'

/**
 * Role rules from the module README: Admin works with every farm, a Farmer with their own farms,
 * a Field Worker only reads the farms they are assigned to.
 *
 * These checks only shape the screens. The Spring API does not enforce them until Module 1
 * (login / JWT) is connected, so they are a convenience, not security.
 */
export function canManageFarms(role: Role): boolean {
  return role === 'admin' || role === 'farmer'
}

/**
 * Permission codes and the default role -> permission map, mirroring the seed in docs/API_CONTRACT.md.
 *
 * This only decides which buttons and pages the UI shows. The server loads the real permissions from the
 * database on every request and enforces them, so an admin edit in "Roles & permissions" takes effect on the
 * API immediately even though this static map (used for UI gating) is not updated until the next release.
 */
export const PERMISSIONS = [
  'FARM_READ', 'FARM_WRITE', 'FARM_DELETE', 'FARM_ASSIGN',
  'CROP_READ', 'CROP_WRITE',
  'IRRIGATION_READ', 'IRRIGATION_WRITE', 'IRRIGATION_UPDATE',
  'INVENTORY_READ', 'INVENTORY_WRITE',
  'EQUIPMENT_READ', 'EQUIPMENT_WRITE',
  'RESOURCE_READ', 'RESOURCE_WRITE',
  'TASK_READ', 'TASK_WRITE', 'TASK_UPDATE',
  'WEATHER_READ', 'GIS_READ', 'GIS_WRITE', 'ANALYTICS_READ',
  'USER_MANAGE', 'ROLE_MANAGE', 'AUDIT_READ',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const ROLES = ['ADMIN', 'FARM_OWNER', 'FARM_MANAGER', 'AGRONOMIST', 'FIELD_WORKER'] as const
export type RoleName = (typeof ROLES)[number]

export const ROLE_LABELS_BY_NAME: Record<RoleName, string> = {
  ADMIN: 'Administrator',
  FARM_OWNER: 'Farm owner',
  FARM_MANAGER: 'Farm manager',
  AGRONOMIST: 'Agronomist',
  FIELD_WORKER: 'Field worker',
}

const ADMIN_ONLY: Permission[] = ['USER_MANAGE', 'ROLE_MANAGE', 'AUDIT_READ']
const OWNER_PERMISSIONS = PERMISSIONS.filter((code) => !ADMIN_ONLY.includes(code))

export const ROLE_PERMISSIONS: Record<RoleName, readonly Permission[]> = {
  ADMIN: PERMISSIONS,
  FARM_OWNER: OWNER_PERMISSIONS,
  FARM_MANAGER: OWNER_PERMISSIONS.filter((code) => code !== 'FARM_DELETE'),
  AGRONOMIST: [
    'FARM_READ', 'CROP_READ', 'CROP_WRITE', 'IRRIGATION_READ', 'IRRIGATION_WRITE', 'IRRIGATION_UPDATE',
    'INVENTORY_READ', 'WEATHER_READ', 'GIS_READ', 'ANALYTICS_READ', 'TASK_READ',
  ],
  FIELD_WORKER: [
    'FARM_READ', 'CROP_READ', 'IRRIGATION_READ', 'IRRIGATION_UPDATE', 'INVENTORY_READ', 'EQUIPMENT_READ',
    'WEATHER_READ', 'GIS_READ', 'TASK_READ', 'TASK_UPDATE',
  ],
}

export function isRoleName(value: unknown): value is RoleName {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

export function permissionsForRole(role: string | null | undefined): readonly Permission[] {
  return isRoleName(role) ? ROLE_PERMISSIONS[role] : []
}

export function roleHasPermission(role: string | null | undefined, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission)
}

/** Coarse role used by the farm-management screens. */
export type SessionRole = 'admin' | 'farmer' | 'worker'

export function toSessionRole(role: string | null | undefined): SessionRole {
  if (role === 'ADMIN') return 'admin'
  if (role === 'FARM_OWNER' || role === 'FARM_MANAGER') return 'farmer'
  return 'worker'
}

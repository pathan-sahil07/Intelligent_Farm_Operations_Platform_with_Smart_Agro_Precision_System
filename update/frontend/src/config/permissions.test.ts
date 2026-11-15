import { describe, expect, it } from 'vitest'
import { PERMISSIONS, ROLES, permissionsForRole, roleHasPermission } from './permissions'

describe('role permission map', () => {
  it('gives ADMIN every permission', () => {
    expect(permissionsForRole('ADMIN')).toHaveLength(PERMISSIONS.length)
  })
  it('keeps admin-only permissions away from other roles', () => {
    for (const role of ROLES.filter((r) => r !== 'ADMIN')) {
      expect(roleHasPermission(role, 'USER_MANAGE')).toBe(false)
      expect(roleHasPermission(role, 'AUDIT_READ')).toBe(false)
    }
  })
  it('limits field workers to read plus task/irrigation updates', () => {
    expect(roleHasPermission('FIELD_WORKER', 'CROP_WRITE')).toBe(false)
    expect(roleHasPermission('FIELD_WORKER', 'TASK_UPDATE')).toBe(true)
  })
  it('denies everything for unknown roles', () => {
    expect(permissionsForRole('HACKER')).toEqual([])
    expect(permissionsForRole(null)).toEqual([])
  })
})

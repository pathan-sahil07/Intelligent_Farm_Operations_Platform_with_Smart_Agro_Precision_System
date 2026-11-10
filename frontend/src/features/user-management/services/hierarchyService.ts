import { API_BASE_URL, API_ENDPOINTS } from '../../../services/api/apiConfig'
import { apiClient } from '../../../services/api/apiClient'

export type FarmRole = 'FARM_OWNER' | 'FARM_MANAGER' | 'FARMER' | 'FIELD_WORKER'
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'

export interface Farm {
  id: string
  organizationId: string
  name: string
  location: string | null
  address: string | null
  area: number | null
  areaUnit: string | null
  description: string | null
  createdAt: string
}

export interface Organization {
  id: string
  name: string
  email: string
  contact: string | null
  address: string | null
  description: string | null
  createdBy: string
  createdAt: string
  farmCount: number
  userCount: number
}

export interface CurrentUser {
  userId: string
  email: string
  fullName: string
  role: FarmRole
  organizationId: string | null
  organizationName: string | null
  assignedFarms: Farm[]
  assignedFields: string[]
  permissions: string[]
}

export interface Invitation {
  id: string
  email: string
  fullName: string | null
  role: FarmRole
  status: InvitationStatus
  farmIds: string[]
  fieldOrLocation: string | null
  message: string | null
  organizationName: string
  createdAt: string
  expiresAt: string
  acceptedAt: string | null
}

export interface UserSummary {
  id: string
  email: string
  fullName: string
  mobileNumber: string | null
  role: FarmRole
  status: string
  assignedFarms: Farm[]
  assignedFields: string[]
  createdAt: string
}

export interface FarmTask {
  id: string
  organizationId: string
  farmId: string
  farmName: string
  title: string
  description: string | null
  assignedTo: string | null
  assignedToName: string | null
  createdBy: string | null
  createdByName: string | null
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
  dueDate: string | null
  problemReport: string | null
  createdAt: string
  updatedAt: string
}

export interface InvitationPreview {
  valid: boolean
  email: string | null
  fullName: string | null
  role: FarmRole | null
  organizationName: string | null
  assignedFarms: Farm[]
  fieldOrLocation: string | null
  message: string | null
  error: string | null
}

export interface FarmInput {
  name: string
  location?: string
  address?: string
  area?: number | null
  areaUnit?: string
  description?: string
}

export interface CreateOrganizationInput {
  name: string
  email: string
  contact: string
  address: string
  description: string
  initialFarms: FarmInput[]
}

export interface CreateInvitationInput {
  email: string
  fullName?: string
  role: FarmRole
  farmIds: string[]
  fieldOrLocation?: string
  message?: string
}

export const hierarchyService = {
  verifyOwnerEmail(token: string) {
    return apiClient.request<{ verified: boolean; message: string }>(
      API_ENDPOINTS.verifyEmail,
      { method: 'POST', body: JSON.stringify({ token }) },
    )
  },

  getCurrentUser() {
    return apiClient.request<CurrentUser>(`${API_BASE_URL}/users/me`)
  },

  getCurrentOrganization() {
    return apiClient.request<Organization | null>(`${API_BASE_URL}/organizations/current`)
  },

  createOrganization(input: CreateOrganizationInput) {
    return apiClient.request<Organization>(`${API_BASE_URL}/organizations`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  createFarm(input: FarmInput) {
    return apiClient.request<Farm>(`${API_BASE_URL}/farms`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  listFarms() {
    return apiClient.request<Farm[]>(`${API_BASE_URL}/farms`)
  },

  listInvitations() {
    return apiClient.request<Invitation[]>(`${API_BASE_URL}/invitations`)
  },

  listUsers() {
    return apiClient.request<UserSummary[]>(`${API_BASE_URL}/users`)
  },

  listTasks(farmId?: string) {
    const query = farmId ? `?farmId=${encodeURIComponent(farmId)}` : ''
    return apiClient.request<FarmTask[]>(`${API_BASE_URL}/tasks${query}`)
  },

  createTask(input: {
    farmId: string
    title: string
    description?: string
    assignedTo?: string
    dueDate?: string
  }) {
    return apiClient.request<FarmTask>(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  updateTask(id: string, input: { status: string; problemReport?: string }) {
    return apiClient.request<FarmTask>(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  },

  createInvitation(input: CreateInvitationInput) {
    return apiClient.request<Invitation>(`${API_BASE_URL}/invitations`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  resendInvitation(id: string) {
    return apiClient.request<Invitation>(`${API_BASE_URL}/invitations/${id}/resend`, {
      method: 'POST',
      body: '{}',
    })
  },

  revokeInvitation(id: string) {
    return apiClient.request<void>(`${API_BASE_URL}/invitations/${id}/revoke`, {
      method: 'POST',
      body: '{}',
    })
  },

  verifyInvitation(token: string) {
    return apiClient.request<InvitationPreview>(
      `${API_BASE_URL}/invitations/verify?token=${encodeURIComponent(token)}`,
    )
  },

  acceptInvitation(input: {
    token: string
    fullName: string
    selectedRole: FarmRole
    password?: string
    mobileNumber?: string
  }) {
    return apiClient.request<{ authenticated: boolean; email: string | null }>(
      `${API_BASE_URL}/invitations/accept`,
      { method: 'POST', body: JSON.stringify(input) },
    )
  },
}

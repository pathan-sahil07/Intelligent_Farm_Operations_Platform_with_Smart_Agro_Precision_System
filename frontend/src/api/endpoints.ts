import { del, downloadFile, get, patch, post, put } from '@/lib/axios'
import type * as T from './types'

type Q = Record<string, unknown>

export const authApi = {
  login: (body: { email: string; password: string }) => post<T.AuthResponse>('/auth/login', body),
  register: (body: { fullName: string; email: string; password: string; phone?: string; role: string }) =>
    post<T.AuthResponse>('/auth/register', body),
  me: () => get<T.User>('/auth/me'),
  updateProfile: (body: { fullName: string; phone?: string }) => put<T.User>('/users/me', body),
  changePassword: (body: { currentPassword: string; newPassword: string }) => post('/users/me/password', body),
}

export const userApi = {
  list: (params: Q) => get<T.Page<T.User>>('/users', params),
  lookup: (q: string) => get<T.UserLookup[]>('/users/lookup', { q }),
  setActive: (id: number, active: boolean) => patch<T.User>(`/users/${id}/active`, { active }),
  setRole: (id: number, role: string) => patch<T.User>(`/users/${id}/role`, { role }),
  roles: () => get<T.RoleInfo[]>('/roles'),
  permissions: () => get<T.PermissionInfo[]>('/permissions'),
  setRolePermissions: (name: string, permissions: string[]) => put<T.RoleInfo>(`/roles/${name}/permissions`, { permissions }),
  audit: (params: Q) => get<T.Page<T.AuditEntry>>('/audit', params),
}

export const farmDataApi = {
  dashboard: (farmId: number) => get<T.FarmDashboard>(`/farms/${farmId}/dashboard`),
  plots: (farmId: number) => get<T.PlotRef[]>(`/farms/${farmId}/plots`),
}

export const cropApi = {
  list: (params: Q) => get<T.Crop[]>('/crops', params),
  create: (body: T.CropInput) => post<T.Crop>('/crops', body),
  update: (id: number, body: T.CropInput) => put<T.Crop>(`/crops/${id}`, body),
  remove: (id: number) => del(`/crops/${id}`),
  setStage: (id: number, growth_stage: string) => patch<T.Crop>(`/crops/${id}/stage`, { growth_stage }),
  harvest: (id: number, body: { harvest_date: string; quantity_kg: number; quality?: string; notes?: string }) =>
    post<T.Harvest>(`/crops/${id}/harvest`, body),
  harvests: (params: Q) => get<T.Harvest[]>('/harvests', params),
  health: (id: number) => get<T.CropHealth[]>(`/crops/${id}/health`),
  addHealth: (id: number, body: { recordDate: string; status: string; issue?: string; notes?: string }) =>
    post<T.CropHealth>(`/crops/${id}/health`, body),
  activities: (id: number) => get<T.CropActivity[]>(`/crops/${id}/activities`),
  addActivity: (
    id: number,
    body: { activityType: string; activityDate: string; productName?: string; inventoryItemId?: number | null; quantity: number; unit?: string; notes?: string },
  ) => post<T.CropActivity>(`/crops/${id}/activities`, body),
}

export interface IrrigationInput {
  crop_id: number
  plot_id?: number | null
  scheduled_date: string
  scheduled_time?: string | null
  water_liters: number
  method?: string
  notes?: string
}
export const irrigationApi = {
  list: (params: Q) => get<T.Irrigation[]>('/irrigation', params),
  create: (body: IrrigationInput) => post<T.Irrigation>('/irrigation', body),
  update: (id: number, body: IrrigationInput) => put<T.Irrigation>(`/irrigation/${id}`, body),
  remove: (id: number) => del(`/irrigation/${id}`),
  setStatus: (id: number, status: string) => patch<T.Irrigation>(`/irrigation/${id}/status`, { status }),
  recommendations: (farmId: number) => get<T.Recommendation[]>('/irrigation/recommendations', { farmId }),
  moisture: (plotId: number) => get<T.SoilMoisture[]>(`/plots/${plotId}/soil-moisture`),
  addMoisture: (plotId: number, body: { readingDate: string; moisturePercent: number; source?: string }) =>
    post<T.SoilMoisture>(`/plots/${plotId}/soil-moisture`, body),
}

export const resourceApi = {
  list: (params: Q) => get<T.Resource[]>('/resources', params),
  create: (body: Partial<T.Resource>) => post<T.Resource>('/resources', body),
  update: (id: number, body: Partial<T.Resource>) => put<T.Resource>(`/resources/${id}`, body),
  remove: (id: number) => del(`/resources/${id}`),
  consume: (id: number, quantity: number) => patch<T.Resource>(`/resources/${id}/consume?quantity=${quantity}`),
  utilization: (params: Q) => get<T.Utilization[]>('/resources/utilization', params),
  tasks: (params: Q) => get<T.Page<T.Task>>('/tasks', params),
  createTask: (body: Partial<T.Task>) => post<T.Task>('/tasks', body),
  updateTask: (id: number, body: Partial<T.Task>) => put<T.Task>(`/tasks/${id}`, body),
  setTaskStatus: (id: number, status: string) => patch<T.Task>(`/tasks/${id}/status`, { status }),
  removeTask: (id: number) => del(`/tasks/${id}`),
  labour: (params: Q) => get<T.Labour[]>('/labour', params),
  addLabour: (body: Partial<T.Labour>) => post<T.Labour>('/labour', body),
  removeLabour: (id: number) => del(`/labour/${id}`),
}

export const inventoryApi = {
  list: (params: Q) => get<T.InventoryItem[]>('/inventory', params),
  create: (body: Partial<T.InventoryItem>) => post<T.InventoryItem>('/inventory', body),
  update: (id: number, body: Partial<T.InventoryItem>) => put<T.InventoryItem>(`/inventory/${id}`, body),
  remove: (id: number) => del(`/inventory/${id}`),
  transact: (id: number, body: { transactionType: string; quantity: number; unitCost?: number; supplierId?: number | null; notes?: string }) =>
    post<T.InventoryTx>(`/inventory/${id}/transactions`, body),
  itemHistory: (id: number) => get<T.InventoryTx[]>(`/inventory/${id}/transactions`),
  history: (params: Q) => get<T.Page<T.InventoryTx>>('/inventory/transactions', params),
  purchases: (params: Q) => get<T.Page<T.InventoryTx>>('/inventory/purchases', params),
  suppliers: (params: Q) => get<T.Supplier[]>('/suppliers', params),
  createSupplier: (body: Partial<T.Supplier>) => post<T.Supplier>('/suppliers', body),
  updateSupplier: (id: number, body: Partial<T.Supplier>) => put<T.Supplier>(`/suppliers/${id}`, body),
  removeSupplier: (id: number) => del(`/suppliers/${id}`),
}

export const equipmentApi = {
  list: (params: Q) => get<T.Equipment[]>('/equipment', params),
  create: (body: Partial<T.Equipment>) => post<T.Equipment>('/equipment', body),
  update: (id: number, body: Partial<T.Equipment>) => put<T.Equipment>(`/equipment/${id}`, body),
  remove: (id: number) => del(`/equipment/${id}`),
  allocate: (id: number, body: { userId?: number | null; taskId?: number | null }) => post<T.Equipment>(`/equipment/${id}/allocate`, body),
  release: (id: number) => post<T.Equipment>(`/equipment/${id}/release`),
  logHours: (id: number, body: { hours: number; usageDate: string; notes?: string }) => post<T.Equipment>(`/equipment/${id}/hours`, body),
  maintenance: (id: number) => get<T.Maintenance[]>(`/equipment/${id}/maintenance`),
  scheduleMaintenance: (id: number, body: { scheduledDate: string; maintenanceType: string; cost?: number; notes?: string }) =>
    post<T.Maintenance>(`/equipment/${id}/maintenance`, body),
  completeMaintenance: (id: number, body: { completedDate: string; cost?: number }) =>
    patch<T.Maintenance>(`/equipment/maintenance/${id}/complete`, body),
  due: (params: Q) => get<T.Maintenance[]>('/equipment/maintenance/due', params),
}

export const weatherApi = {
  forFarm: (farmId: number) => get<T.WeatherReport>(`/weather/farms/${farmId}`),
}

export const gisApi = {
  farms: () => get<T.FeatureCollection>('/gis/farms'),
  plots: (farmId: number) => get<T.FeatureCollection>(`/gis/farms/${farmId}/plots`),
  setBoundary: (plotId: number, geometry: unknown) => put<T.GeoFeature>(`/gis/plots/${plotId}/boundary`, { geometry }),
  clearBoundary: (plotId: number) => del(`/gis/plots/${plotId}/boundary`),
  setLocation: (farmId: number, latitude: number, longitude: number) => put(`/gis/farms/${farmId}/location`, { latitude, longitude }),
}

export const notificationApi = {
  list: (params: Q) => get<T.Page<T.AppNotification>>('/notifications', params),
  unread: () => get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: number) => patch<T.AppNotification>(`/notifications/${id}/read`),
  readAll: () => post('/notifications/read-all'),
  refresh: () => post<{ processed: number }>('/notifications/refresh'),
}

export const analyticsApi = {
  overview: (f: T.AnalyticsFilter) => get<T.AnalyticsOverview>('/analytics/overview', { ...f }),
  production: (f: T.AnalyticsFilter) =>
    get<{ byCrop: { crop: string; quantityKg: number; records: number }[]; byMonth: { month: string; quantityKg: number }[] }>('/analytics/production', { ...f }),
  irrigation: (f: T.AnalyticsFilter) =>
    get<{ byDay: { date: string; liters: number }[]; byCrop: { crop: string; liters: number }[]; statusCounts: Record<string, number> }>('/analytics/irrigation', { ...f }),
  inventory: (f: T.AnalyticsFilter) =>
    get<{
      byCategory: { category: string; itemCount: number; stockValue: number }[]
      lowStock: { id: number; name: string; quantity: number; reorderLevel: number; unit: string }[]
      consumptionByMonth: { month: string; quantity: number }[]
    }>('/analytics/inventory', { ...f }),
  equipment: (f: T.AnalyticsFilter) =>
    get<{ items: { id: number; name: string; category: string; status: string; operatingHours: number; maintenanceCost: number }[] }>('/analytics/equipment', { ...f }),
  resources: (f: T.AnalyticsFilter) =>
    get<{ byCategory: { category: string; planned: number; consumed: number; cost: number }[]; labourHours: number; labourCost: number }>('/analytics/resources', { ...f }),
  costs: (f: T.AnalyticsFilter) => get<{ byCategory: { category: string; amount: number }[]; total: number }>('/analytics/costs', { ...f }),
  exportCsv: (report: string, f: T.AnalyticsFilter) => downloadFile('/analytics/export', { report, ...f }, `${report}-report.csv`),
}

export const assistantApi = {
  chat: (body: unknown) => post<Record<string, unknown>>('/assistant/chat', body),
}

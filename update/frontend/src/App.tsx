import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage, RegisterPage } from '@/pages/AuthPages'
import { AccessDeniedPage, NotFoundPage } from '@/pages/SimplePages'
import { ProtectedRoute, PublicRoute } from '@/routes/guards'

const Dashboard = lazy(() => import('@/pages/DashboardPage'))
const Farms = lazy(() => import('@/pages/FarmsPage'))
const FarmDetail = lazy(() => import('@/pages/FarmDetailRoute'))
const Crops = lazy(() => import('@/pages/CropsPage'))
const Irrigation = lazy(() => import('@/pages/IrrigationPage'))
const Resources = lazy(() => import('@/pages/ResourcesPage'))
const Inventory = lazy(() => import('@/pages/InventoryPage'))
const Equipment = lazy(() => import('@/pages/EquipmentPage'))
const Weather = lazy(() => import('@/pages/WeatherPage'))
const Gis = lazy(() => import('@/pages/GisPage'))
const Analytics = lazy(() => import('@/pages/AnalyticsPage'))
const Notifications = lazy(() => import('@/pages/NotificationsPage'))
const Assistant = lazy(() => import('@/pages/AssistantPage'))
const Profile = lazy(() => import('@/pages/ProfilePage'))
const Users = lazy(() => import('@/pages/admin/UsersPage'))
const Roles = lazy(() => import('@/pages/admin/RolesPage'))
const Audit = lazy(() => import('@/pages/admin/AuditPage'))

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="profile" element={<Profile />} />
          <Route path="access-denied" element={<AccessDeniedPage />} />

          <Route element={<ProtectedRoute permission="FARM_READ" />}>
            <Route path="farms" element={<Farms />} />
            <Route path="farms/:farmId" element={<FarmDetail />} />
          </Route>
          <Route element={<ProtectedRoute permission="CROP_READ" />}>
            <Route path="crops" element={<Crops />} />
          </Route>
          <Route element={<ProtectedRoute permission="IRRIGATION_READ" />}>
            <Route path="irrigation" element={<Irrigation />} />
          </Route>
          <Route element={<ProtectedRoute permission="RESOURCE_READ" />}>
            <Route path="resources" element={<Resources />} />
          </Route>
          <Route element={<ProtectedRoute permission="INVENTORY_READ" />}>
            <Route path="inventory" element={<Inventory />} />
          </Route>
          <Route element={<ProtectedRoute permission="EQUIPMENT_READ" />}>
            <Route path="equipment" element={<Equipment />} />
          </Route>
          <Route element={<ProtectedRoute permission="WEATHER_READ" />}>
            <Route path="weather" element={<Weather />} />
          </Route>
          <Route element={<ProtectedRoute permission="GIS_READ" />}>
            <Route path="gis" element={<Gis />} />
          </Route>
          <Route element={<ProtectedRoute permission="ANALYTICS_READ" />}>
            <Route path="analytics" element={<Analytics />} />
          </Route>
          <Route element={<ProtectedRoute permission="USER_MANAGE" />}>
            <Route path="admin/users" element={<Users />} />
          </Route>
          <Route element={<ProtectedRoute permission="ROLE_MANAGE" />}>
            <Route path="admin/roles" element={<Roles />} />
          </Route>
          <Route element={<ProtectedRoute permission="AUDIT_READ" />}>
            <Route path="admin/audit" element={<Audit />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

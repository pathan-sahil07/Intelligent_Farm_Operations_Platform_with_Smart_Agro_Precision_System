import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { APP_ROUTES } from '../constants/routes.constants'
import DashboardLayout from '../layout/DashboardLayout/DashboardLayout'
import NotFound from '../pages/NotFound'
import type { AppRoute } from './routes.config'
import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'
import { RoleRoute } from './RoleRoute'
import type { FarmRole } from '../features/user-management/services/hierarchyService'

interface ErrorBoundaryState {
  hasError: boolean
}

const Dashboard = lazy(() => import('../pages/Dashboard'))
const LoginPage = lazy(() => import('../pages/Login'))
const SignUpPage = lazy(() => import('../pages/SignUp'))
const EmailVerificationPage = lazy(() => import('../pages/EmailVerification'))
const InitialOwnerSetupPage = lazy(() => import('../pages/InitialOwnerSetup'))
const OrganizationSetupPage = lazy(() => import('../pages/OrganizationSetup'))
const UserManagementPage = lazy(() => import('../pages/UserManagement'))
const InvitationAcceptancePage = lazy(() => import('../pages/InvitationAcceptance'))
const TasksPage = lazy(() => import('../pages/Tasks'))
const FarmManagementPage = lazy(() =>
  import('../features/farm-management/components/FarmManagementPage').then((module) => ({
    default: module.FarmManagementPage,
  })),
)
const CropLifecyclePage = lazy(() =>
  import('../features/crop-lifecycle/components/CropLifecyclePage').then((module) => ({
    default: module.CropLifecyclePage,
  })),
)
const IrrigationSchedulingPage = lazy(() =>
  import('../features/irrigation-scheduling/components/IrrigationSchedulingPage').then((module) => ({
    default: module.IrrigationSchedulingPage,
  })),
)
const ResourcePlanningPage = lazy(() =>
  import('../features/resource-planning/components/ResourcePlanningPage').then((module) => ({
    default: module.ResourcePlanningPage,
  })),
)
const InventoryManagementPage = lazy(() =>
  import('../features/inventory-management/components/InventoryManagementPage').then((module) => ({
    default: module.InventoryManagementPage,
  })),
)
const EquipmentManagementPage = lazy(() =>
  import('../features/equipment-management/components/EquipmentManagementPage').then((module) => ({
    default: module.EquipmentManagementPage,
  })),
)
const WeatherMonitoringPage = lazy(() =>
  import('../features/weather-monitoring/components/WeatherMonitoringPage').then((module) => ({
    default: module.WeatherMonitoringPage,
  })),
)
const GisMappingPage = lazy(() =>
  import('../features/gis-mapping/components/GisMappingPage').then((module) => ({
    default: module.GisMappingPage,
  })),
)
const AgriculturalAnalyticsPage = lazy(() =>
  import('../features/agricultural-analytics/components/AgriculturalAnalyticsPage').then((module) => ({
    default: module.AgriculturalAnalyticsPage,
  })),
)

const ownerManager: FarmRole[] = ['FARM_OWNER', 'FARM_MANAGER']
const ownerManagerFarmer: FarmRole[] = ['FARM_OWNER', 'FARM_MANAGER', 'FARMER']
const everyRole: FarmRole[] = [...ownerManagerFarmer, 'FIELD_WORKER']

const appRoutes: AppRoute[] = [
  { path: APP_ROUTES.dashboard, element: <Dashboard />, roles: everyRole },
  { path: APP_ROUTES.farms, element: <FarmManagementPage />, roles: everyRole },
  { path: APP_ROUTES.crops, element: <CropLifecyclePage />, roles: ownerManagerFarmer },
  { path: APP_ROUTES.irrigation, element: <IrrigationSchedulingPage />, roles: ownerManagerFarmer },
  { path: APP_ROUTES.resources, element: <ResourcePlanningPage />, roles: ownerManager },
  { path: APP_ROUTES.inventory, element: <InventoryManagementPage />, roles: ownerManager },
  { path: APP_ROUTES.equipment, element: <EquipmentManagementPage />, roles: ownerManager },
  { path: APP_ROUTES.weather, element: <WeatherMonitoringPage />, roles: ownerManagerFarmer },
  { path: APP_ROUTES.gis, element: <GisMappingPage />, roles: ownerManagerFarmer },
  { path: APP_ROUTES.analytics, element: <AgriculturalAnalyticsPage />, roles: ownerManager },
]

class RouteErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('A route failed to render.', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="not-found" role="alert">
          <p className="eyebrow">Page unavailable</p>
          <h1 className="page-title">We could not load this page.</h1>
          <p className="page-description">Try reloading the workspace. Your local page state may not be saved.</p>
          <button className="button button-primary" onClick={() => window.location.reload()} type="button">
            Reload workspace
          </button>
        </main>
      )
    }

    return this.props.children
  }
}

export function AppRoutes() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<div aria-busy="true" aria-live="polite" className="route-loading">Loading page…</div>}>
        <Routes>
          <Route
            path={APP_ROUTES.login}
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path={APP_ROUTES.signup}
            element={
              <PublicRoute>
                <SignUpPage />
              </PublicRoute>
            }
          />
          <Route path={APP_ROUTES.verifyEmail} element={<EmailVerificationPage />} />
          <Route
            path={APP_ROUTES.ownerSetup}
            element={
              <PublicRoute>
                <InitialOwnerSetupPage />
              </PublicRoute>
            }
          />
          <Route path={APP_ROUTES.invitationAccept} element={<InvitationAcceptancePage />} />
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {appRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<RoleRoute allowedRoles={route.roles}>{route.element}</RoleRoute>}
              />
            ))}
            <Route
              path={APP_ROUTES.organizationSetup}
              element={<RoleRoute allowedRoles={['FARM_OWNER']} allowMissingOrganization><OrganizationSetupPage /></RoleRoute>}
            />
            <Route
              path={APP_ROUTES.users}
              element={<RoleRoute allowedRoles={ownerManagerFarmer}><UserManagementPage /></RoleRoute>}
            />
            <Route
              path={APP_ROUTES.tasks}
              element={<RoleRoute allowedRoles={everyRole}><TasksPage /></RoleRoute>}
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  )
}
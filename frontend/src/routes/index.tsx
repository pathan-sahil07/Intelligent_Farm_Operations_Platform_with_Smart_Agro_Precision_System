import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { APP_ROUTES } from '../constants/routes.constants'
import DashboardLayout from '../layout/DashboardLayout/DashboardLayout'
import NotFound from '../pages/NotFound'
import type { AppRoute } from './routes.config'

interface ErrorBoundaryState {
  hasError: boolean
}

const Dashboard = lazy(() => import('../pages/Dashboard'))
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

const appRoutes: AppRoute[] = [
  { path: APP_ROUTES.dashboard, element: <Dashboard /> },
  { path: APP_ROUTES.farms, element: <FarmManagementPage /> },
  { path: APP_ROUTES.crops, element: <CropLifecyclePage /> },
  { path: APP_ROUTES.irrigation, element: <IrrigationSchedulingPage /> },
  { path: APP_ROUTES.resources, element: <ResourcePlanningPage /> },
  { path: APP_ROUTES.inventory, element: <InventoryManagementPage /> },
  { path: APP_ROUTES.equipment, element: <EquipmentManagementPage /> },
  { path: APP_ROUTES.weather, element: <WeatherMonitoringPage /> },
  { path: APP_ROUTES.gis, element: <GisMappingPage /> },
  { path: APP_ROUTES.analytics, element: <AgriculturalAnalyticsPage /> },
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
          <Route element={<DashboardLayout />}>
            {appRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  )
}
import { useState } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Header } from '../../components/shared/Header/Header'
import { Sidebar } from '../../components/shared/Sidebar/Sidebar'
import { APP_ROUTES, APP_ROUTE_LABELS } from '../../constants/routes.constants'
import '../../App.css'

export default function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const title =
    Object.entries(APP_ROUTE_LABELS).find(([path]) => path === location.pathname)?.[1] ??
    'Farm operations'

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      <div className="app-main">
        <Header onMenuClick={() => setMenuOpen(true)} />
        <main className="page-content">
          <div aria-label="Breadcrumb" className="breadcrumb">
            <Home aria-hidden="true" size={12} />
            {location.pathname === APP_ROUTES.dashboard ? (
              <span>Workspace</span>
            ) : (
              <Link to={APP_ROUTES.dashboard}>Workspace</Link>
            )}
            <ChevronRight aria-hidden="true" size={11} />
            <strong aria-current="page">{title}</strong>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

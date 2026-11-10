import { useEffect, useState } from 'react'
import {
  BarChart3,
  CloudSun,
  Droplets,
  Tractor,
  ClipboardList,
  Leaf,
  LayoutDashboard,
  MapPinned,
  Package,
  Sprout,
  Users,
  ClipboardCheck,
  Building2,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { APP_ROUTES } from '../../../constants/routes.constants'
import { hierarchyService, type CurrentUser, type FarmRole } from '../../../features/user-management/services/hierarchyService'

interface SidebarProps {
  open: boolean
  onNavigate: () => void
}

const navItems = [
  { label: 'Overview', path: APP_ROUTES.dashboard, icon: LayoutDashboard, end: true },
  { label: 'Farm management', path: APP_ROUTES.farms, icon: Leaf },
  { label: 'Crop lifecycle', path: APP_ROUTES.crops, icon: Sprout },
  { label: 'Irrigation', path: APP_ROUTES.irrigation, icon: Droplets },
  { label: 'Resource planning', path: APP_ROUTES.resources, icon: ClipboardList },
  { label: 'Inventory', path: APP_ROUTES.inventory, icon: Package },
  { label: 'Equipment', path: APP_ROUTES.equipment, icon: Tractor },
  { label: 'Weather', path: APP_ROUTES.weather, icon: CloudSun },
  { label: 'GIS Farm Mapping', path: APP_ROUTES.gis, icon: MapPinned },
  { label: 'Analytics', path: APP_ROUTES.analytics, icon: BarChart3 },
  { label: 'Tasks', path: APP_ROUTES.tasks, icon: ClipboardCheck },
  { label: 'People and invitations', path: APP_ROUTES.users, icon: Users },
  { label: 'Organization setup', path: APP_ROUTES.organizationSetup, icon: Building2 },
]

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    hierarchyService.getCurrentUser()
      .then(setUser)
      .catch((cause: unknown) => setLoadError(cause instanceof Error ? cause.message : 'Unable to load role access.'))
  }, [])

  const rolePaths: Record<FarmRole, string[]> = {
    FARM_OWNER: [
      APP_ROUTES.dashboard, APP_ROUTES.farms, APP_ROUTES.crops, APP_ROUTES.irrigation,
      APP_ROUTES.resources, APP_ROUTES.inventory, APP_ROUTES.equipment, APP_ROUTES.weather,
      APP_ROUTES.gis, APP_ROUTES.analytics, APP_ROUTES.tasks, APP_ROUTES.users,
      ...(user?.organizationId ? [] : [APP_ROUTES.organizationSetup]),
    ],
    FARM_MANAGER: [
      APP_ROUTES.dashboard, APP_ROUTES.farms, APP_ROUTES.crops, APP_ROUTES.irrigation,
      APP_ROUTES.resources, APP_ROUTES.inventory, APP_ROUTES.equipment, APP_ROUTES.weather,
      APP_ROUTES.gis, APP_ROUTES.analytics, APP_ROUTES.tasks, APP_ROUTES.users,
    ],
    FARMER: [
      APP_ROUTES.dashboard, APP_ROUTES.farms, APP_ROUTES.crops, APP_ROUTES.irrigation,
      APP_ROUTES.weather, APP_ROUTES.gis, APP_ROUTES.tasks, APP_ROUTES.users,
    ],
    FIELD_WORKER: [APP_ROUTES.dashboard, APP_ROUTES.farms, APP_ROUTES.tasks],
  }
  const visibleItems = user ? navItems.filter((item) => rolePaths[user.role].includes(item.path)) : []

  return (
    <>
      <button
        aria-label="Close navigation menu"
        className={`mobile-overlay ${open ? 'open' : ''}`}
        onClick={onNavigate}
        type="button"
      />
      <aside aria-label="Main navigation" className={`app-sidebar ${open ? 'open' : ''}`}>
        <Link className="brand" onClick={onNavigate} to={APP_ROUTES.dashboard}>
          <span className="brand-mark">
            <Leaf aria-hidden="true" size={21} />
          </span>
          <span>
            <span className="brand-name">Fieldwise</span>
            <span className="brand-caption">Farm operations</span>
          </span>
        </Link>
        <p className="sidebar-label">Workspace</p>
        <nav aria-label="Farm modules" className="sidebar-nav">
          {loadError && <p className="sidebar-label" role="alert">Navigation unavailable: {loadError}</p>}
          {visibleItems.map(({ label, path, icon: Icon, end }) => (
            <NavLink
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              end={end}
              key={path}
              onClick={onNavigate}
              to={path}
            >
              <Icon aria-hidden="true" size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-soil-card">
          <strong>Built for the growing season</strong>
          <p>Keep plans, inputs, and field work connected in one place.</p>
        </div>
      </aside>
    </>
  )
}

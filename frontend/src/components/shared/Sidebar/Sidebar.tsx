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
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { APP_ROUTES } from '../../../constants/routes.constants'

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
  { label: 'GIS farm mapping', path: APP_ROUTES.gis, icon: MapPinned },
  { label: 'Analytics', path: APP_ROUTES.analytics, icon: BarChart3 },
]

export function Sidebar({ open, onNavigate }: SidebarProps) {
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
          {navItems.map(({ label, path, icon: Icon, end }) => (
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

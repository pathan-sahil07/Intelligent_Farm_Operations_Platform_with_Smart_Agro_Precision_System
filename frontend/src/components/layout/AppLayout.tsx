import { Suspense, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3, Bell, Bot, CloudSun, Cog, Droplets, History, LayoutDashboard, LogOut, Map as MapIcon, Menu, Package,
  Shield, Sprout, Tractor, Users, UserCircle, Wheat, Warehouse, X, type LucideIcon,
} from 'lucide-react'
import { notificationApi } from '@/api/endpoints'
import { Loading } from '@/components/common/StateViews'
import type { Permission } from '@/config/permissions'
import { ROLE_LABELS_BY_NAME, isRoleName } from '@/config/permissions'
import { useAuth } from '@/contexts/useAuth'
import { useFarm } from '@/contexts/useFarm'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  anyOf?: Permission[]
  end?: boolean
}

const MAIN: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/farms', label: 'Farms', icon: Warehouse, anyOf: ['FARM_READ'] },
  { to: '/crops', label: 'Crops', icon: Sprout, anyOf: ['CROP_READ'] },
  { to: '/irrigation', label: 'Irrigation', icon: Droplets, anyOf: ['IRRIGATION_READ'] },
  { to: '/resources', label: 'Resources & tasks', icon: Users, anyOf: ['RESOURCE_READ', 'TASK_READ'] },
  { to: '/inventory', label: 'Inventory', icon: Package, anyOf: ['INVENTORY_READ'] },
  { to: '/equipment', label: 'Equipment', icon: Tractor, anyOf: ['EQUIPMENT_READ'] },
  { to: '/weather', label: 'Weather', icon: CloudSun, anyOf: ['WEATHER_READ'] },
  { to: '/gis', label: 'GIS map', icon: MapIcon, anyOf: ['GIS_READ'] },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, anyOf: ['ANALYTICS_READ'] },
  { to: '/assistant', label: 'AI assistant', icon: Bot },
]

const ADMIN: NavItem[] = [
  { to: '/admin/users', label: 'Users', icon: UserCircle, anyOf: ['USER_MANAGE'] },
  { to: '/admin/roles', label: 'Roles & permissions', icon: Shield, anyOf: ['ROLE_MANAGE'] },
  { to: '/admin/audit', label: 'Audit log', icon: History, anyOf: ['AUDIT_READ'] },
]

function NavGroup({ items, onNavigate }: { items: NavItem[]; onNavigate: () => void }) {
  const { can } = useAuth()
  return (
    <>
      {items
        .filter((i) => !i.anyOf || i.anyOf.some((p) => can(p)))
        .map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-brand-600 text-white' : 'text-brand-100 hover:bg-brand-700'
              }`
            }
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
    </>
  )
}

export function AppLayout() {
  const { user, logout, can } = useAuth()
  const { farms, farmId, setFarmId } = useFarm()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationApi.unread,
    refetchInterval: 60_000,
  })
  const showAdmin = can('USER_MANAGE') || can('ROLE_MANAGE') || can('AUDIT_READ')

  return (
    <div className="min-h-svh lg:flex">
      {open && <div className="fixed inset-0 z-30 bg-neutral-900/50 lg:hidden" onClick={close} aria-hidden="true" />}
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-1 overflow-y-auto bg-brand-900 p-4 transition-transform lg:sticky lg:top-0 lg:h-svh lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Wheat size={22} aria-hidden="true" />
            <span className="text-base leading-tight font-semibold">Smart Agro<br />Farm Platform</span>
          </div>
          <button className="text-brand-100 lg:hidden" onClick={close} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          <NavGroup items={MAIN} onNavigate={close} />
          {showAdmin && <p className="mt-4 mb-1 px-3 text-xs font-semibold tracking-wider text-brand-200 uppercase">Administration</p>}
          <NavGroup items={ADMIN} onNavigate={close} />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-white/95 px-4 py-2.5 backdrop-blur">
          <button className="rounded-md p-1.5 hover:bg-neutral-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Cog size={16} className="text-neutral-400" aria-hidden="true" />
            <label htmlFor="farm-select" className="sr-only">
              Selected farm
            </label>
            <select
              id="farm-select"
              className="field-control max-w-56 !py-1.5"
              value={farmId ?? ''}
              onChange={(e) => setFarmId(Number(e.target.value))}
              disabled={farms.length === 0}
            >
              {farms.length === 0 && <option value="">No farms available</option>}
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="relative rounded-md p-2 hover:bg-neutral-100"
              onClick={() => navigate('/notifications')}
              aria-label={`Notifications, ${unread?.count ?? 0} unread`}
            >
              <Bell size={18} />
              {!!unread?.count && (
                <span className="absolute top-0.5 right-0.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] leading-4 font-bold text-white">
                  {unread.count > 99 ? '99+' : unread.count}
                </span>
              )}
            </button>
            <button className="flex items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-neutral-100" onClick={() => navigate('/profile')}>
              <UserCircle size={22} className="text-brand-600" aria-hidden="true" />
              <span className="hidden text-sm leading-tight sm:block">
                <span className="block font-medium text-neutral-900">{user?.fullName}</span>
                <span className="block text-xs text-neutral-500">{user && isRoleName(user.role) ? ROLE_LABELS_BY_NAME[user.role] : user?.role}</span>
              </span>
            </button>
            <button
              className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { ArrowUpRight, CalendarDays, CircleAlert, Leaf, Plus } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Table } from '../components/ui/Table'
import { APP_ROUTES } from '../constants/routes.constants'
import { getDashboardSummary } from '../features/dashboard/services/dashboardService'
import { useCurrentDate } from '../hooks/useCurrentDate'
import {
  getFarmManagementSnapshot,
  subscribeFarmManagement,
} from '../features/farm-management/services/farmManagementService'
import type { DashboardTask } from '../features/dashboard/types/dashboard.types'
import { hierarchyService, type CurrentUser } from '../features/user-management/services/hierarchyService'

const taskColumns = [
  {
    key: 'task',
    header: 'Field task',
    render: (task: DashboardTask) => (
      <>
        <span className="table-primary">{task.title}</span>
        <span className="table-secondary">{task.field}</span>
      </>
    ),
  },
  { key: 'due', header: 'Due', render: (task: DashboardTask) => task.dueDate },
  {
    key: 'status',
    header: 'Status',
    render: (task: DashboardTask) => (
      <span className={`tag ${task.status === 'Needs attention' ? 'warning' : ''}`}>
        {task.status}
      </span>
    ),
  },
]

function Dashboard() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [profileError, setProfileError] = useState('')
  const currentDate = useCurrentDate()
  const farmSnapshot = useSyncExternalStore(
    subscribeFarmManagement,
    getFarmManagementSnapshot,
  )
  const summary = getDashboardSummary(farmSnapshot, currentDate)
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(currentDate)
  const hour = currentDate.getHours()
  useEffect(() => {
    hierarchyService.getCurrentUser()
      .then(setCurrentUser)
      .catch((cause: unknown) => setProfileError(cause instanceof Error ? cause.message : 'Unable to load role information.'))
  }, [])
  const modules = useMemo(() => {
    const allModules = [
      ['Farm management', APP_ROUTES.farms, 'Fields, people, work, and expenses'],
      ['Crop lifecycle', APP_ROUTES.crops, 'Crop stages, health, and harvest plans'],
      ['Irrigation', APP_ROUTES.irrigation, 'Water schedules and field history'],
      ['Resources', APP_ROUTES.resources, 'Plan inputs, labour, and water'],
      ['Inventory', APP_ROUTES.inventory, 'Stock levels, purchases, and use'],
      ['Equipment', APP_ROUTES.equipment, 'Usage and maintenance tracking'],
      ['Weather', APP_ROUTES.weather, 'Sample forecast and farming notes'],
      ['Analytics', APP_ROUTES.analytics, 'Sample yield and cost charts'],
      ['Tasks', APP_ROUTES.tasks, 'Assigned work and task status'],
    ]
    const allowed = currentUser?.role === 'FIELD_WORKER'
      ? new Set([APP_ROUTES.farms, APP_ROUTES.tasks])
      : currentUser?.role === 'FARMER'
        ? new Set([APP_ROUTES.farms, APP_ROUTES.crops, APP_ROUTES.irrigation, APP_ROUTES.weather, APP_ROUTES.gis, APP_ROUTES.tasks])
        : new Set(allModules.map(([, path]) => path))
    return allModules.filter(([, path]) => allowed.has(path))
  }, [currentUser?.role])
  const greeting =
    hour >= 5 && hour < 12
      ? 'Good morning'
      : hour >= 12 && hour < 17
        ? 'Good afternoon'
        : hour >= 17 && hour < 21
          ? 'Good evening'
          : 'Good night'

  if (currentUser?.role === 'FARM_OWNER' && !currentUser.organizationId) {
    return <Navigate replace to={APP_ROUTES.organizationSetup} />
  }
  if (profileError) return <p role="alert">{profileError}</p>
  if (!currentUser) return <p aria-busy="true">Loading your role-specific dashboard…</p>

  return (
    <>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">{today}</p>
          <h1 className="page-title">{greeting}, {currentUser.fullName}</h1>
          <p className="page-description">
            {currentUser.role.replaceAll('_', ' ')} workspace for {currentUser.organizationName || 'your farm team'}.
            {' '}Dashboard figures below remain illustrative demo data.
          </p>
        </div>
        <Link className="button button-primary" to={APP_ROUTES.farms}>
          <Plus aria-hidden="true" size={15} />
          Manage farms
        </Link>
      </div>

      <div className="notice">
        <CircleAlert aria-hidden="true" size={15} />
        <span>
          Demo workspace: records and metrics are sample data and are not connected to a farm
          database or live sensors.
        </span>
      </div>

      <section aria-label="Farm summary" className="content-grid four" style={{ marginTop: 16 }}>
        {summary.stats.map((stat, index) => {
          const Icon = [Leaf, CalendarDays, ArrowUpRight, CircleAlert][index]
          return (
            <Card className="stat-card" key={stat.id}>
              <div className="stat-label">
                {stat.label}
                <span className="stat-icon">
                  <Icon aria-hidden="true" size={15} />
                </span>
              </div>
              <p className="stat-value">{stat.value}</p>
              <span className="stat-note">{stat.note}</span>
            </Card>
          )
        })}
      </section>

      <div className="content-grid two" style={{ marginTop: 17 }}>
        <Card>
          <div className="section-heading" style={{ marginTop: 0 }}>
            <div>
              <h2>Upcoming field work</h2>
              <p>Sample tasks in the next few days</p>
            </div>
            <Link className="button button-secondary button-sm" to={APP_ROUTES.farms}>
              View tasks
            </Link>
          </div>
          <Table
            caption="Upcoming demo field tasks"
            columns={taskColumns}
            getRowKey={(task) => task.id}
            rows={summary.tasks}
          />
        </Card>

        <Card>
          <h2 className="panel-title">Recent activity</h2>
          <p className="panel-subtitle">Illustrative records from this demo workspace</p>
          {summary.activities.length === 0 ? (
            <p className="table-empty">No recent activity.</p>
          ) : (
            <ul className="activity-list">
              {summary.activities.map((activity) => (
                <li className="activity-item" key={activity.id}>
                  <span aria-hidden="true" className="activity-dot" />
                  <span>
                    <strong>{activity.title}</strong>
                    <span className="table-secondary">{activity.detail}</span>
                    <span className="activity-time">{activity.time}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="section-heading">
        <div>
          <h2>Operations modules</h2>
          <p>Quick access to the tools used across the season</p>
        </div>
      </div>
      <div className="content-grid three">
        {modules.map(([label, path, description]) => (
          <Link className="module-link" key={path} to={path}>
            <Card>
              <span className="module-link-title">{label}</span>
              <span className="module-link-description">{description}</span>
              <ArrowUpRight aria-hidden="true" className="module-link-icon" size={15} />
            </Card>
          </Link>
        ))}
      </div>
    </>
  )
}

export default Dashboard
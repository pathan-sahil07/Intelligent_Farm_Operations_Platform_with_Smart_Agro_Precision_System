import { ArrowUpRight, CalendarDays, CircleAlert, Leaf, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Table } from '../components/ui/Table'
import { APP_ROUTES } from '../constants/routes.constants'
import { getDashboardSummary } from '../features/dashboard/services/dashboardService'
import type { DashboardTask } from '../features/dashboard/types/dashboard.types'

const summary = getDashboardSummary()

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
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">{today}</p>
          <h1 className="page-title">Good morning, farm team</h1>
          <p className="page-description">
            Here is a snapshot of your operation. All figures below are illustrative demo data.
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
        {[
          ['Farm management', APP_ROUTES.farms, 'Fields, people, work, and expenses'],
          ['Crop lifecycle', APP_ROUTES.crops, 'Crop stages, health, and harvest plans'],
          ['Irrigation', APP_ROUTES.irrigation, 'Water schedules and field history'],
          ['Resources', APP_ROUTES.resources, 'Plan inputs, labour, and water'],
          ['Inventory', APP_ROUTES.inventory, 'Stock levels, purchases, and use'],
          ['Equipment', APP_ROUTES.equipment, 'Usage and maintenance tracking'],
          ['Weather', APP_ROUTES.weather, 'Sample forecast and farming notes'],
          ['Analytics', APP_ROUTES.analytics, 'Sample yield and cost charts'],
        ].map(([label, path, description]) => (
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
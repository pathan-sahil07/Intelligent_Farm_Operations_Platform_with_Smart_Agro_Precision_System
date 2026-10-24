export interface DashboardStat {
  id: string
  label: string
  value: string
  note: string
}

export interface DashboardActivity {
  id: string
  title: string
  detail: string
  time: string
}

export interface DashboardTask {
  id: string
  title: string
  field: string
  dueDate: string
  status: 'Planned' | 'In progress' | 'Needs attention'
}

export interface DashboardSummary {
  stats: DashboardStat[]
  activities: DashboardActivity[]
  tasks: DashboardTask[]
}
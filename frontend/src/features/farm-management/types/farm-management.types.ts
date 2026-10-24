export interface FarmProfile {
  id: string
  farmer?: string
  farmName: string
  location: string
  totalArea: number
}

export interface FarmField {
  id: string
  farmId?: string
  name: string
  crop: string
  area: number
  status: 'Growing' | 'Preparing' | 'Harvesting'
}

export interface FarmWorker {
  id: string
  name: string
  role: string
  assignedField: string
}

export interface FarmTask {
  id: string
  task: string
  field: string
  due: string
  status: 'Planned' | 'In progress' | 'Needs attention'
}

export interface FarmExpense {
  id: string
  category: string
  description: string
  amount: number
  date: string
}

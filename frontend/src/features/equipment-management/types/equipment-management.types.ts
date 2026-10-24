export interface EquipmentRecord {
  id: string
  name: string
  category: string
  status: 'Available' | 'In use' | 'Maintenance due'
  lastService: string
  nextService: string
}

export interface EquipmentUsage {
  id: string
  equipment: string
  activity: string
  date: string
  hours: number
}

export interface EquipmentRepair {
  id: string
  equipment: string
  repair: string
  date: string
  status: 'Complete' | 'Open'
}

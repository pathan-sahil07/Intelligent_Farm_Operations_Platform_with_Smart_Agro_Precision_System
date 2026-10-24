export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  minimum: number
  expiryDate: string
}

export interface StockMovement {
  id: string
  itemId: string
  itemName: string
  kind: 'Purchase' | 'Consumption'
  quantity: number
  unit: string
  date: string
  note: string
}

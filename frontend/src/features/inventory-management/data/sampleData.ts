import type { InventoryItem, StockMovement } from '../types/inventory-management.types'

export const inventoryItems: InventoryItem[] = [
  { id: 'i-01', name: 'Tomato seed · Roma', category: 'Seeds', quantity: 34, unit: 'lb', minimum: 20, expiryDate: '2027-02-15' },
  { id: 'i-02', name: 'Balanced NPK', category: 'Fertilizer', quantity: 8, unit: 'bags', minimum: 12, expiryDate: '2027-06-30' },
  { id: 'i-03', name: 'Drip line connectors', category: 'Irrigation', quantity: 146, unit: 'units', minimum: 40, expiryDate: '' },
  { id: 'i-04', name: 'Organic pest control', category: 'Crop care', quantity: 5, unit: 'gal', minimum: 4, expiryDate: '2026-12-10' },
]

export const stockMovements: StockMovement[] = [
  { id: 'm-01', itemId: 'i-01', itemName: 'Tomato seed · Roma', kind: 'Purchase', quantity: 20, unit: 'lb', date: 'Oct 15', note: 'Spring planting stock' },
  { id: 'm-02', itemId: 'i-02', itemName: 'Balanced NPK', kind: 'Consumption', quantity: 4, unit: 'bags', date: 'Oct 13', note: 'East Field application' },
  { id: 'm-03', itemId: 'i-03', itemName: 'Drip line connectors', kind: 'Purchase', quantity: 50, unit: 'units', date: 'Oct 10', note: 'Irrigation repair kit' },
]

export const APP_ROUTES = {
  dashboard: '/',
  farms: '/farms',
  crops: '/crops',
  irrigation: '/irrigation',
  resources: '/resources',
  inventory: '/inventory',
  equipment: '/equipment',
  weather: '/weather',
  gis: '/gis',
  analytics: '/analytics',
} as const

export const APP_ROUTE_LABELS: Record<(typeof APP_ROUTES)[keyof typeof APP_ROUTES], string> = {
  [APP_ROUTES.dashboard]: 'Overview',
  [APP_ROUTES.farms]: 'Farm management',
  [APP_ROUTES.crops]: 'Crop lifecycle',
  [APP_ROUTES.irrigation]: 'Irrigation scheduling',
  [APP_ROUTES.resources]: 'Resource planning',
  [APP_ROUTES.inventory]: 'Inventory management',
  [APP_ROUTES.equipment]: 'Equipment management',
  [APP_ROUTES.weather]: 'Weather monitoring',
  [APP_ROUTES.gis]: 'GIS farm mapping',
  [APP_ROUTES.analytics]: 'Agricultural analytics',
}
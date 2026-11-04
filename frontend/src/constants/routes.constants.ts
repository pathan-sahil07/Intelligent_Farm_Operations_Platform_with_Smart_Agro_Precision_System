export const APP_ROUTES = {
  dashboard: '/',
  login: '/login',
  signup: '/signup',
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
  [APP_ROUTES.login]: 'Login',
  [APP_ROUTES.signup]: 'Sign up',
  [APP_ROUTES.farms]: 'Farm management',
  [APP_ROUTES.crops]: 'Crop lifecycle',
  [APP_ROUTES.irrigation]: 'Irrigation',
  [APP_ROUTES.resources]: 'Resource planning',
  [APP_ROUTES.inventory]: 'Inventory',
  [APP_ROUTES.equipment]: 'Equipment',
  [APP_ROUTES.weather]: 'Weather',
  [APP_ROUTES.gis]: 'GIS Farm Mapping',
  [APP_ROUTES.analytics]: 'Analytics',
}
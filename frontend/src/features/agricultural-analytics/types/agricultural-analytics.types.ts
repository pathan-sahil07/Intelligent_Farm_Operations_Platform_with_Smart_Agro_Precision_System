export interface YieldDataPoint {
  season: string
  yieldTons: number
}

export interface ResourceUseDataPoint {
  month: string
  waterKgal: number
  fertilizerTons: number
  labourHours: number
}

export interface ProfitabilityDataPoint {
  category: string
  revenue: number
  expenses: number
  net: number
}

export interface AnalyticsSummary {
  totalYieldTons: number
  waterUsedKgal: number
  operatingExpenses: number
  estimatedNet: number
}

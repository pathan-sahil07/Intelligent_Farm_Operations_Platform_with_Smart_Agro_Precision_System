import type {
  AnalyticsSummary,
  ProfitabilityDataPoint,
  ResourceUseDataPoint,
  YieldDataPoint,
} from '../types/agricultural-analytics.types'

export const analyticsSummary: AnalyticsSummary = {
  totalYieldTons: 84.6,
  waterUsedKgal: 216.4,
  operatingExpenses: 38250,
  estimatedNet: 54700,
}

export const yieldData: YieldDataPoint[] = [
  { season: '2022', yieldTons: 58 },
  { season: '2023', yieldTons: 64 },
  { season: '2024', yieldTons: 71 },
  { season: '2025', yieldTons: 78 },
  { season: '2026', yieldTons: 84.6 },
]

export const resourceUseData: ResourceUseDataPoint[] = [
  { month: 'Jun', waterKgal: 38, fertilizerTons: 5.2, labourHours: 310 },
  { month: 'Jul', waterKgal: 44, fertilizerTons: 4.8, labourHours: 360 },
  { month: 'Aug', waterKgal: 46, fertilizerTons: 3.6, labourHours: 390 },
  { month: 'Sep', waterKgal: 35, fertilizerTons: 2.9, labourHours: 420 },
  { month: 'Oct', waterKgal: 29, fertilizerTons: 2.1, labourHours: 445 },
]

export const profitabilityData: ProfitabilityDataPoint[] = [
  { category: 'Produce', revenue: 62200, expenses: 24800, net: 37400 },
  { category: 'Orchard', revenue: 30500, expenses: 17300, net: 13200 },
  { category: 'Other', revenue: 14100, expenses: 10000, net: 4100 },
]

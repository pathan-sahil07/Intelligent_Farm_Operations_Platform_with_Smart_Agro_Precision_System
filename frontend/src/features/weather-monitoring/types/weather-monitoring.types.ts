export interface WeatherSnapshot {
  location: string
  observedAt: string
  temperatureC: number
  condition: string
  humidityPercent: number
  windKph: number
  rainfallMm: number
}

export interface ForecastDay {
  id: string
  day: string
  condition: string
  highC: number
  lowC: number
  rainChancePercent: number
}

export interface FarmingWeatherAlert {
  id: string
  title: string
  detail: string
  level: 'Planning note' | 'Watch'
}

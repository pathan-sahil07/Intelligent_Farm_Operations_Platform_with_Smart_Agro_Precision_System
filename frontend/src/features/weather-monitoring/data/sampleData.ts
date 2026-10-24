import type { FarmingWeatherAlert, ForecastDay, WeatherSnapshot } from '../types/weather-monitoring.types'

export const weatherSnapshot: WeatherSnapshot = {
  location: 'Central Valley, California',
  observedAt: 'Sample snapshot · Oct 23, 2026',
  temperatureC: 21,
  condition: 'Partly cloudy',
  humidityPercent: 48,
  windKph: 11,
  rainfallMm: 0,
}

export const forecastDays: ForecastDay[] = [
  { id: 'd-01', day: 'Fri, Oct 24', condition: 'Mostly sunny', highC: 24, lowC: 12, rainChancePercent: 5 },
  { id: 'd-02', day: 'Sat, Oct 25', condition: 'Partly cloudy', highC: 23, lowC: 13, rainChancePercent: 10 },
  { id: 'd-03', day: 'Sun, Oct 26', condition: 'Light showers', highC: 19, lowC: 11, rainChancePercent: 55 },
  { id: 'd-04', day: 'Mon, Oct 27', condition: 'Cloudy', highC: 18, lowC: 10, rainChancePercent: 25 },
  { id: 'd-05', day: 'Tue, Oct 28', condition: 'Sunny', highC: 22, lowC: 12, rainChancePercent: 0 },
]

export const farmingWeatherAlerts: FarmingWeatherAlert[] = [
  { id: 'a-01', title: 'Rain possible Sunday', detail: 'Check field access and planned irrigation before work is dispatched.', level: 'Watch' },
  { id: 'a-02', title: 'Dry conditions in this sample', detail: 'Review soil moisture locally before increasing watering.', level: 'Planning note' },
]

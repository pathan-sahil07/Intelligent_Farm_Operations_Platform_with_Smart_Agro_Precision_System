import { CloudSun, Droplets, Wind } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { forecastDays, farmingWeatherAlerts, weatherSnapshot } from '../data/sampleData'
import type { FarmingWeatherAlert, ForecastDay } from '../types/weather-monitoring.types'

function WeatherMonitoringPage() {
  return (
    <>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Operations / Weather</p>
          <h1 className="page-title">Weather for field planning</h1>
          <p className="page-description">Review forecast-style cards and general farming notes for the sample farm location.</p>
        </div>
        <span className="tag neutral">Sample data · no live provider</span>
      </div>
      <div className="notice warning">
        <CloudSun aria-hidden="true" size={15} />
        <span>Weather values below are illustrative sample data. No weather API, station, or live forecast integration is connected.</span>
      </div>
      <div className="section-heading"><div><h2>Current conditions</h2><p>{weatherSnapshot.location} · {weatherSnapshot.observedAt}</p></div></div>
      <Card className="weather-current">
        <div>
          <span className="tag"><CloudSun aria-hidden="true" size={12} /> {weatherSnapshot.condition}</span>
          <p className="weather-temp">{weatherSnapshot.temperatureC}°</p>
          <p className="panel-subtitle">Illustrative temperature in °C</p>
        </div>
        <div className="weather-detail-grid">
          <div><span>Humidity</span><strong>{weatherSnapshot.humidityPercent}%</strong></div>
          <div><span>Wind</span><strong>{weatherSnapshot.windKph} km/h</strong></div>
          <div><span>Rainfall</span><strong>{weatherSnapshot.rainfallMm} mm</strong></div>
          <div><span>Location</span><strong>Demo farm</strong></div>
        </div>
      </Card>
      <div className="content-grid two">
        <section>
          <div className="section-heading"><div><h2>Five-day outlook</h2><p>Sample forecast card data</p></div></div>
          <Card>
            <ul className="forecast-list">
              {forecastDays.map((day: ForecastDay) => (
                <li className="forecast-day" key={day.id}>
                  <strong>{day.day}</strong>
                  <span>{day.condition}</span>
                  <span className="forecast-temp">{day.highC}° / {day.lowC}°C</span>
                  <span className="muted">{day.rainChancePercent}% rain</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
        <section>
          <div className="section-heading"><div><h2>Farming alerts</h2><p>General planning reminders, not live warnings</p></div></div>
          <Card>
            <ul className="recommendation-list">
              {farmingWeatherAlerts.map((alert: FarmingWeatherAlert) => (
                <li className="weather-alert" key={alert.id}>
                  <span className={`tag ${alert.level === 'Watch' ? 'warning' : 'neutral'}`}>{alert.level}</span>
                  <strong>{alert.title}</strong>
                  <p>{alert.detail}</p>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
      <div className="notice" style={{ marginTop: 20 }}>
        <Wind aria-hidden="true" size={15} />
        <span>Check official local forecasts and on-farm conditions before making safety, irrigation, or crop-protection decisions.</span>
        <Droplets aria-hidden="true" size={14} />
      </div>
    </>
  )
}

export { WeatherMonitoringPage }

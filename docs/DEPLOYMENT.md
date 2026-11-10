# Deployment

## Environment variables (backend)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | yes | PostgreSQL/PostGIS connection |
| `JWT_SECRET` | yes | 32+ characters; startup fails otherwise |
| `JWT_EXPIRATION_MINUTES` | no (120) | token lifetime |
| `CORS_ALLOWED_ORIGINS` | yes in production | comma-separated browser origins |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | first run | creates the first administrator if the email is unused |
| `WEATHER_PROVIDER_URL` | no | Open-Meteo-compatible forecast endpoint |
| `AI_SERVICE_URL` | no | Python assistant (`http://ai:8000` in Compose) |
| `NOTIFICATIONS_CRON` | no (`0 0 6 * * *`) | daily notification generation |
| `DOCUMENTS_DIRECTORY` | yes | writable folder for land-document uploads |

Frontend: `VITE_API_URL` (default `/api`, same origin through nginx or the Vite proxy).

## Database

Flyway runs V1–V6 at startup. PostGIS is required (V6 adds a trigger that keeps plot area in sync with the boundary). Back up the `farm-db` volume; the app never drops data.

## Weather

Forecasts come from the configured provider and are never invented: if the provider is unreachable the API returns 503, and a farm without coordinates returns 409. Alert thresholds (code constants in `WeatherService`):

| Alert | Warning | Severe |
|---|---|---|
| Heavy rain (mm/day) | ≥ 30 | ≥ 60 |
| High wind (km/h) | ≥ 40 | ≥ 60 |
| Heat (°C max) | ≥ 38 | ≥ 42 |
| Frost (°C min) | ≤ 2 | ≤ -2 |

Irrigation advice: SKIP if soil moisture ≥ 70% or rain ≥ 5 mm / probability ≥ 70%; DELAY if ≥ 10 mm tomorrow; otherwise IRRIGATE.

## Production checklist

- Terminate TLS in front of nginx and set `CORS_ALLOWED_ORIGINS` to the real origin.
- Rotate `JWT_SECRET` to invalidate all sessions.
- Do not expose port 5432 or 8000 publicly (Compose binds them to localhost).
- Change the bootstrap admin password after first login and remove `ADMIN_PASSWORD` from the environment.

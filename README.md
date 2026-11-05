# Intelligent_Farm_Operations_Platform_with_Smart_Agro_Precision_System
Intelligent Farm Operations Platform with Smart Agro Precision System

## Architecture

React/TypeScript/Vite is backed by a modular Spring Boot monolith. PostgreSQL
stores farm, crop, irrigation, harvest, plot, worker, soil-test, and
land-document data. The Gemini/RAG assistant remains an isolated Python
service under `backend/models/aimodel`.

## Run locally

1. Create a PostgreSQL database and copy `backend/.env.example` to
   `backend/.env`, replacing placeholder credentials.
2. Start the API with `cd backend && mvn spring-boot:run`.
3. Start the UI with `cd frontend && npm install && npm run dev`.

Vite proxies `/api` to Spring Boot on port 8080. The main REST modules are
`/api/farms`, `/api/crops`, `/api/irrigation`, and `/api/harvests`; farm assets
are available under the nested farm routes documented in `backend/README.md`.

## Verification

```sh
cd backend && mvn clean test && mvn package
cd frontend && npm run build
```

Set `DOCUMENTS_DIRECTORY` to a writable directory for land-document uploads.
Never put Gemini credentials in frontend code.
# Intelligent Farm Operations Platform

The platform is a React/Vite frontend, Java 21/Spring Boot business API, PostgreSQL/PostGIS database, and optional Python/Gemini RAG assistant.

## Run locally

1. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` when using the assistant.
2. Start PostgreSQL/PostGIS with `docker compose up database -d`.
3. Build and start the API with `cd backend && mvn spring-boot:run`.
4. Start the frontend with `cd frontend && npm install && npm run dev`.
5. Open the Vite URL (normally `http://localhost:5173`).

For the complete container stack:

```bash
mvn -f backend/pom.xml package -DskipTests
docker compose up --build
```

The API is available at `http://localhost:8080`, Swagger UI at `/api/swagger-ui`, health at `/actuator/health`, and the frontend at `http://localhost:5173`.

Flyway owns schema creation. The PostGIS image is required because migration `V3__postgis_and_operational_modules.sql` creates the spatial extension and indexes. Hibernate runs in `validate` mode and never recreates production tables.

## Implemented API areas

Existing farm, crop, irrigation, harvest, plot, worker, soil-test, and document APIs remain under `/api`. Operational APIs are available under `/api/inventory`, `/api/equipment`, `/api/resources`, `/api/weather`, `/api/gis`, and `/api/analytics/overview`.

The Gemini assistant remains an independent FastAPI service under `backend/models/aimodel`; its credentials are server-side and its `/chat` response includes retrieved source chunks.

If PostgreSQL is not installed locally, use the isolated in-memory demo profile:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=demo
```

The demo profile is for local UI/API development only. Production and Docker use PostgreSQL/PostGIS with Flyway.

## Configuration

`DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DOCUMENTS_DIRECTORY`, `WEATHER_PROVIDER_URL`, and `GEMINI_API_KEY` are environment variables. Never commit real values.

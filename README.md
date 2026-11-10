# Intelligent Farm Operations Platform

React + TypeScript frontend, Spring Boot 3 (Java 21) API, PostgreSQL/PostGIS, and an optional Python/Gemini assistant.

**Modules:** Farm management · Crop lifecycle · Irrigation · Resource planning · Inventory · Equipment · Weather · GIS (Leaflet + PostGIS) · Analytics with CSV export · Notifications · Audit log · Users, roles and permissions.

## Security model

- JWT login (BCrypt passwords). Roles: `ADMIN`, `FARM_OWNER`, `FARM_MANAGER`, `AGRONOMIST`, `FIELD_WORKER`.
- Permissions are loaded from the database on each request and enforced with `@PreAuthorize`. Admins can edit them under *Roles & permissions*.
- Farm-level isolation: non-admins only see farms they own or are assigned to. Legacy rows with no farm are admin-only.
- Self-registration only creates `FARM_OWNER` or `FIELD_WORKER`. The first admin comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- The app refuses to start without a `JWT_SECRET` of 32+ characters (outside the demo/test profiles).

## Run with Docker

```sh
cp .env.example .env     # set POSTGRES_PASSWORD, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up --build
```

UI: http://localhost:5173 · API: http://localhost:8080 · Swagger: http://localhost:8080/api/swagger-ui

## Run for development

```sh
docker compose up database -d
cd backend && cp .env.example .env   # then export its values, or set them in your IDE
mvn spring-boot:run
cd frontend && npm install && npm run dev   # proxies /api to localhost:8080
```

## Tests

```sh
cd backend && mvn clean verify     # unit tests (Mockito)
cd frontend && npm run lint && npm run build && npm test
```

## Documentation

- [docs/API_CONTRACT.md](docs/API_CONTRACT.md): endpoints, roles and the permission matrix
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): environment variables, weather rules, production notes
- [docs/TESTING_REPORT.md](docs/TESTING_REPORT.md): what was run, what was not, known limitations
- [AUDIT.md](AUDIT.md): the phase-1 audit of the original repository

Never put credentials in frontend code or commit `.env` files.

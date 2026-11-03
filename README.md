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

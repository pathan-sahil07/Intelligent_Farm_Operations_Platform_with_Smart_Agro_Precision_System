## Spring Boot backend

The canonical backend is this lowercase `backend/` directory. Spring Boot is
the production API and owns farm management, crop operations, irrigation,
harvest, plot, worker, soil-test, and land-document modules. PostgreSQL is
configured with `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD`;
Flyway applies crop-operation migrations and Hibernate updates farm entities.

```sh
cp .env.example .env
mvn spring-boot:run
```

The API listens on `http://localhost:8080` and exposes module routes under
`/api` such as `/api/farms`, `/api/crops`, and `/api/irrigation`.
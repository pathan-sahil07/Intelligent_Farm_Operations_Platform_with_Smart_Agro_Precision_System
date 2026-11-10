# Testing report and limitations

## Verified in the build environment

| Check | Result |
|---|---|
| Frontend `tsc -b` | pass |
| Frontend `npm run lint` | pass |
| Frontend `npm run build` | pass (code-split, 17 lazy routes) |
| Frontend `vitest` | 23 tests in 6 files pass: route guards by role, axios error normalization, permission map, DataTable/EmptyState, login validation/submit/error, Crops page (list, read-only role, API failure) |

## NOT verified here: read before relying on the backend

The build environment could not reach Maven Central, so **the backend has never been compiled or run by me**. Only a syntax-only `javac` parse was done. Before release run:

```sh
cd backend && mvn clean verify
```

Backend unit tests were written (JWT, farm access, auth, weather alerts, irrigation rules, analytics, GIS, inventory, equipment, tasks) but **have not been executed**. Expect to fix compile or test errors on first run.

Also untested:
- Flyway V4–V6 on real PostGIS (no database available).
- GIS and analytics native SQL (PostGIS functions). They will not work on the H2 `demo` profile.
- No Testcontainers/MockMvc integration tests; endpoint-level role enforcement is unit-tested only at the service level.
- End-to-end browser testing of the UI against a running backend.
- Docker images were not built.
- Changes were not pushed to GitHub (no push access); the repo is delivered as an archive with local commits.

## Known limitations

- UI permission gating uses a static role map; the server is authoritative, so custom permission edits apply to the API immediately but UI buttons only after a release.
- Plot boundaries are drawn by clicking vertices (no leaflet-draw editing of existing shapes).
- Weather depends on an external provider; there is no caching or rate limiting.
- No email/SMS delivery for notifications (in-app only).
- Self-registration cannot create managers or agronomists; an admin assigns those roles.
- Existing legacy crop/irrigation/harvest rows without a farm are visible to admins only until assigned.

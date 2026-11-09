# API Contract (single source of truth for backend and frontend)

Base path `/api`. JSON. Auth header `Authorization: Bearer <jwt>` on everything except `/api/auth/login`, `/api/auth/register`, `/actuator/health`, `/api/docs/**`, `/api/swagger-ui/**`.

Errors (all statuses incl. 401/403): `{ "timestamp", "status", "error", "message" }` where `message` is a string, or a `{field: message}` map for validation (400). 401 = missing/invalid token, 403 = authenticated but not allowed (incl. farm not accessible), 404 = not found OR farm not visible when leaking existence matters, 409 = conflict (e.g. irrigation overlap, duplicates).
Paged endpoints accept `page` (0-based), `size`, `sort` and return Spring `Page` JSON (`content,totalElements,totalPages,number,size`).
Legacy modules (crops, irrigation, harvests) keep **snake_case** JSON. All new payloads are **camelCase**. Dates ISO `yyyy-MM-dd`, times `HH:mm[:ss]`, timestamps ISO-8601.

## Roles and permissions
Roles: `ADMIN, FARM_OWNER, FARM_MANAGER, AGRONOMIST, FIELD_WORKER`.
Permission codes: `FARM_READ FARM_WRITE FARM_DELETE FARM_ASSIGN CROP_READ CROP_WRITE IRRIGATION_READ IRRIGATION_WRITE IRRIGATION_UPDATE INVENTORY_READ INVENTORY_WRITE EQUIPMENT_READ EQUIPMENT_WRITE RESOURCE_READ RESOURCE_WRITE TASK_READ TASK_WRITE TASK_UPDATE WEATHER_READ GIS_READ GIS_WRITE ANALYTICS_READ USER_MANAGE ROLE_MANAGE AUDIT_READ`.
Seed (table `role_permissions`):
- ADMIN: all.
- FARM_OWNER and FARM_MANAGER: everything except `USER_MANAGE ROLE_MANAGE AUDIT_READ` (manager also lacks `FARM_DELETE`).
- AGRONOMIST: `FARM_READ CROP_READ CROP_WRITE IRRIGATION_READ IRRIGATION_WRITE IRRIGATION_UPDATE INVENTORY_READ WEATHER_READ GIS_READ ANALYTICS_READ TASK_READ`.
- FIELD_WORKER: `FARM_READ CROP_READ IRRIGATION_READ IRRIGATION_UPDATE INVENTORY_READ EQUIPMENT_READ WEATHER_READ GIS_READ TASK_READ TASK_UPDATE`.
Everyone may read/mark own notifications and read/update own profile.
JWT authorities = permission codes (loaded from DB per request so admin edits apply immediately) plus `ROLE_<role>`.

Farm-level access (every endpoint touching farm data, enforced server side): ADMIN sees all farms; a user sees farms where `farms.owner_id = userId` or a row exists in `farm_worker(farm_id,user_id)` (used for managers, agronomists and workers alike). Write endpoints need the permission AND farm access. `FARM_DELETE` additionally requires owner or ADMIN. Assigning workers (`FARM_ASSIGN`) requires owner, ADMIN or an assigned FARM_MANAGER.

Shared Java APIs (package `com.farmverse.farm`):
- `security.FarmAccessService` (bean name `farmAccess`): `boolean canRead(Long farmId)`, `boolean canWrite(Long farmId)` (= has access), `void requireAccess(Long farmId)` (throws `AccessDeniedException`), `Set<Long> accessibleFarmIds()`, `boolean isOwnerOrAdmin(Long farmId)`.
- `security.CurrentUser`: `static AppUserPrincipal get()`; principal has `getId() getEmail() getRole() isAdmin()`.
- `audit.AuditService.log(String action, String entityType, Long entityId, String details)` (uses current user; safe when none).
- `notification.NotificationService`: `notifyFarm(Long farmId, String type, String title, String message, String link, String dedupeKey)` (owner + all assigned users, skips if a notification with same user+dedupeKey exists), `notifyUser(Long userId, ...same...)`.
Flyway: `V4__security_audit_notifications.sql` (backend-A: users, role_permissions, permissions, roles, audit_log, notifications) and `V5__module_extensions.sql` (backend-B: module tables/columns). Existing V1-V3 must not be edited.

## Auth and users
- `POST /auth/register {fullName,email,password(min 8),phone?,role?}` -> 201 `AuthResponse`. role only `FARM_OWNER` (default) or `FIELD_WORKER`; anything else -> 400.
- `POST /auth/login {email,password}` -> `AuthResponse {token, tokenType:"Bearer", expiresIn(seconds), user}`; inactive user -> 403.
- `GET /auth/me` -> `User`.
- `User {id, fullName, email, phone, role, active, createdAt}`.
- `GET /users?q=&role=&page&size` (USER_MANAGE) -> Page<User>.
- `GET /users/lookup?q=` (FARM_ASSIGN) -> `[{id,fullName,email,role}]` max 20, active only.
- `PATCH /users/{id}/active {active}` and `PATCH /users/{id}/role {role}` (USER_MANAGE; cannot deactivate or demote self).
- `PUT /users/me {fullName,phone}`, `POST /users/me/password {currentPassword,newPassword}`.
- `GET /roles` -> `[{name,description,permissions:[code]}]`; `GET /permissions` -> `[{code,description}]` (ROLE_MANAGE or USER_MANAGE); `PUT /roles/{name}/permissions {permissions:[code]}` (ROLE_MANAGE; ADMIN role is immutable).
- `GET /audit?entityType=&page&size` (AUDIT_READ) -> Page<`{id,userId,userEmail,action,entityType,entityId,details,createdAt}`>.

## Farms, plots, workers (existing endpoints, now secured)
Existing routes under `/farms`, `/plots`, `/soil-tests`, `/documents` stay. Changes: list returns only accessible farms; create sets `ownerId` = caller (ADMIN may pass another); update/delete/plots/workers/documents/soil tests check access/permissions. `GET /farms/{id}/dashboard` -> `{farm, plotCount, plottedAcres, activeCrops, upcomingHarvests:[{cropId,name,expectedHarvestDate}], pendingIrrigation, lowStockItems, equipmentDueMaintenance, openTasks}`.

## Crops (snake_case)
- `GET /crops?farmId=&status=&q=`; `POST /crops {name,variety,farm_id,plot_id?,field_name,area_acres,planting_date,expected_harvest_date,growth_stage,notes}`; `PUT /crops/{id}`; `DELETE /crops/{id}`; `PATCH /crops/{id}/stage {growth_stage}`; `POST /crops/{id}/harvest {harvest_date,quantity_kg,quality,notes}`. Crop JSON adds `farm_id`, `plot_id`. Perms CROP_READ/CROP_WRITE.
- `GET /harvests?farmId=&from=&to=`.
- `GET|POST /crops/{id}/health {recordDate,status(HEALTHY|STRESSED|DISEASED|PEST),issue,notes}` -> `{id,cropId,recordDate,status,issue,notes,recordedBy,createdAt}`.
- `GET|POST /crops/{id}/activities {activityType(FERTILIZER|PESTICIDE|OTHER),activityDate,productName,inventoryItemId?,quantity,unit,notes}`; if `inventoryItemId` set, stock is consumed in the same transaction (insufficient -> 400) and a CONSUMPTION inventory transaction is recorded with `cropId`.

## Irrigation (snake_case)
- `GET /irrigation?farmId=&status=&from=&to=`; `POST /irrigation {crop_id, plot_id?, scheduled_date, scheduled_time, water_liters, method, notes}` -> 409 when the same crop or plot already has a non-skipped schedule on that date within 60 minutes of the time; `PUT /irrigation/{id}`; `DELETE /irrigation/{id}`; `PATCH /irrigation/{id}/status {status}` (IRRIGATION_UPDATE allowed). JSON adds `farm_id`, `plot_id`.
- `GET /irrigation/recommendations?farmId=` -> `[{cropId,cropName,plotId,date,recommendation:"IRRIGATE"|"SKIP"|"DELAY",reason,rainMm,rainProbability,tempMaxC}]` computed from the real forecast and latest soil moisture; 503 if weather unavailable.
- `GET|POST /plots/{plotId}/soil-moisture {readingDate,moisturePercent(0-100),source}`.

## Resources, tasks, labour
- `GET /resources?farmId=` , `POST`, `PUT /{id}`, `DELETE /{id}`, `PATCH /{id}/consume?quantity=` (existing, `farmId` now required and checked) `{id,farmId,name,category,unit,plannedQuantity,consumedQuantity,cost,season}`; `GET /resources/utilization?farmId=` -> `[{category,planned,consumed,utilizationPercent,cost}]`.
- Tasks `/tasks`: `GET ?farmId=&status=&assignedTo=&page&size`, `POST`, `PUT /{id}`, `PATCH /{id}/status {status}`, `DELETE`. Task `{id,farmId,title,description,taskType,assignedTo,assignedToName,plotId,cropId,equipmentId,dueDate,status(OPEN|IN_PROGRESS|DONE|CANCELLED),estimatedCost,actualCost,createdAt}`. Assigning notifies the assignee (TASK). Workers with TASK_UPDATE may change status only on tasks assigned to them.
- Labour `/labour`: `GET ?farmId=&from=&to=`, `POST {farmId,userId,workDate,hours,hourlyRate,taskId?,notes}`, `DELETE /{id}`; response adds `cost` (hours*rate) and `userName`.

## Inventory
- `GET /inventory?farmId=&category=&lowStock=` ; `POST`; `PUT /{id}`; `DELETE /{id}`; item `{id,farmId,name,category(SEED|FERTILIZER|PESTICIDE|CONSUMABLE|OTHER),unit,quantity,reorderLevel,unitCost,expiryDate,supplierId,lowStock(boolean)}`.
- `POST /inventory/{id}/transactions {transactionType(PURCHASE|CONSUMPTION|TRANSFER),quantity,unitCost?,supplierId?,cropId?,notes}`; `GET /inventory/{id}/transactions`; `GET /inventory/transactions?farmId=&type=&from=&to=&page&size` (history); `GET /inventory/purchases?farmId=` ; `GET /inventory/low-stock?farmId=`. Crossing below reorder level notifies (LOW_STOCK).
- Suppliers `/suppliers`: `GET ?farmId=`, `POST {farmId,name,contactPerson,phone,email,address}`, `PUT /{id}`, `DELETE /{id}`.

## Equipment
- `GET /equipment?farmId=&status=&category=`; `POST`; `PUT /{id}`; `DELETE /{id}`; `{id,farmId,name,category,identifier,status(AVAILABLE|IN_USE|MAINTENANCE|RETIRED),purchaseDate,purchaseCost,operatingHours,allocatedToUserId,allocatedToTaskId,nextMaintenanceDate}`.
- `POST /equipment/{id}/allocate {userId?,taskId?}` (must be AVAILABLE, else 409) -> status IN_USE; `POST /equipment/{id}/release`; `POST /equipment/{id}/hours {hours,usageDate,notes}` adds to `operatingHours`.
- `GET|POST /equipment/{id}/maintenance {scheduledDate,maintenanceType(SERVICE|REPAIR|INSPECTION),cost,notes}`; `PATCH /equipment/maintenance/{id}/complete {completedDate,cost?}`; `GET /equipment/maintenance/due?farmId=&days=14`.

## Weather (Open-Meteo by default, URL configurable, never fabricated)
- `GET /weather?latitude=&longitude=` (compat, raw provider JSON).
- `GET /weather/farms/{farmId}` -> `{farmId,latitude,longitude,source,current:{time,temperatureC,humidityPercent,windSpeedKmh,precipitationMm,weatherCode},forecast:[{date,tempMaxC,tempMinC,precipitationMm,precipitationProbability,windMaxKmh}],alerts:[{type:"HEAVY_RAIN"|"HIGH_WIND"|"HEAT"|"FROST",severity,date,message}]}`; 503 if provider unconfigured/unreachable, 409 if farm has no coordinates. Alerts also create WEATHER notifications (deduped per farm/day/type).

## GIS (PostGIS)
- `GET /gis/farms` -> GeoJSON FeatureCollection of accessible farms (Point; props `id,name,totalAreaAcres`).
- `GET /gis/farms/{farmId}/plots` -> FeatureCollection (Polygon or null geometry; props `id,name,areaAcres,computedAreaAcres,soilType`).
- `PUT /gis/plots/{plotId}/boundary {geometry:<GeoJSON Polygon>}` validates (ST_IsValid, within SRID 4326), stores, returns the feature with `computedAreaAcres` (ST_Area on geography); `DELETE /gis/plots/{plotId}/boundary`.
- `PUT /gis/farms/{farmId}/location {latitude,longitude}` updates lat/long and the `location` geometry.

## Analytics (ANALYTICS_READ; all take `farmId?` (omit = all accessible), `from?`, `to?`)
- `/analytics/overview` (keeps legacy keys `totalFarms totalPlots activeCrops harvestRecords irrigationSchedules inventoryItems totalHarvestKg completedIrrigation`, adds `totalWaterLiters operationalCost lowStockCount openTasks`).
- `/analytics/production` -> `{byCrop:[{crop,quantityKg,records}],byMonth:[{month,quantityKg}]}`
- `/analytics/irrigation` -> `{byDay:[{date,liters}],byCrop:[{crop,liters}],statusCounts:{Scheduled,Completed,Skipped}}`
- `/analytics/inventory` -> `{byCategory:[{category,itemCount,stockValue}],lowStock:[{id,name,quantity,reorderLevel,unit}],consumptionByMonth:[{month,quantity}]}`
- `/analytics/equipment` -> `{items:[{id,name,category,status,operatingHours,maintenanceCost}]}`
- `/analytics/resources` -> `{byCategory:[{category,planned,consumed,cost}],labourHours,labourCost}`
- `/analytics/costs` -> `{byCategory:[{category,amount}],total}` (categories: Resources, Maintenance, Inventory purchases, Labour, Tasks)
- `/analytics/export?report=production|irrigation|inventory|equipment|resources|costs` -> `text/csv` download.

## Notifications (own only)
`GET /notifications?unreadOnly=&page&size` -> Page<`{id,type(IRRIGATION|WEATHER|LOW_STOCK|MAINTENANCE|HARVEST|TASK|ACTIVITY),title,message,link,read,createdAt}`>; `GET /notifications/unread-count` -> `{count}`; `PATCH /notifications/{id}/read`; `POST /notifications/read-all`; `POST /notifications/refresh` runs the generators for the caller's accessible farms now (also run by a daily `@Scheduled` job): irrigation due today, harvests due within 7 days, low stock, maintenance due within 7 days, overdue/assigned tasks.

## Assistant
`POST /assistant/chat {message}` (any authenticated user) -> proxied to the Python RAG service (`AI_SERVICE_URL`, default `http://localhost:8000`) `POST /chat` and returned as-is; 503 if unreachable.

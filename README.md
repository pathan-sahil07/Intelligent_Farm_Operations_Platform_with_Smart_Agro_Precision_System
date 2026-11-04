# Intelligent Farm Operations Platform with Smart Agro Precision System

An integrated precision agricultural management platform with a dynamic crop lifecycle landing experience, bilingual authentication, Neon PostgreSQL persistence, and farm operations modules.

---

## 🚀 How to Run the Project (प्रोजेक्ट कैसे चलाएं)

### Option 1: Single Command (सबसे आसान तरीका)
प्रोजेक्ट की रूट डायरेक्टरी में सिर्फ एक कमांड चलाएं। यह बैकएंड और फ्रंटएंड दोनों को अपने आप शुरू कर देगा:

```bash
./start.sh
```

---

### Option 2: Running in Separate Terminals (अलग-अलग टर्मिनल में)

**Terminal 1 — Java Spring Boot Backend (Port 8080):**
```bash
set -a; source .env; set +a; ./backend-java/mvnw -f backend-java/pom.xml spring-boot:run
```

**Terminal 2 — React Vite Frontend (Port 5173):**
```bash
npm --prefix frontend run dev
```

---

### Option 3: VS Code "Run and Debug" (VS Code में)
1. VS Code के **Run and Debug** पैनल (या `Cmd+Shift+D`) में जाएं।
2. **`Spring Boot-FarmOperationsApplication`** सिलेक्ट करके Play (▶️) बटन दबाएं। (यह `.env` को अपने आप लोड कर लेता है)।
3. टर्मिनल में फ्रंटएंड चलाएं:
   ```bash
   npm --prefix frontend run dev
   ```

---

## 🌐 Application URLs

* **Frontend Web App:** [http://localhost:5173](http://localhost:5173)
* **Backend REST API:** [http://localhost:8080](http://localhost:8080)
* **Database:** Neon PostgreSQL Cloud (AWS US-East-2)

---

## 🌾 Features & Architecture

* **Authentication:**
  - 7-Stage dynamic SVG crop lifecycle journey animation
  - Bilingual interface (English / हिन्दी)
  - PBKDF2 cryptographic password hashing
  - Session tokens with CSRF protection (`X-CSRF-Token`)
  - Neon PostgreSQL tables (`accounts`, `sessions`) with Flyway migrations
* **Farm Operations Modules:**
  - Farm Management (`/farms`)
  - Crop Lifecycle Tracking (`/crops`)
  - Precision Irrigation Scheduling (`/irrigation`)
  - Resource Planning (`/resources`)
  - Inventory Tracking (`/inventory`)
  - Equipment Management (`/equipment`)
  - Real-time Weather Forecast (`/weather`)
  - Interactive GIS Farm Mapping (`/gis` with Leaflet)
  - Agricultural Financial Analytics (`/analytics` with Recharts)

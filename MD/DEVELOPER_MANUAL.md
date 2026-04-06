# DRMS Developer Manual

## Document Status

- Project: Department Record Management System (DRMS)
- Audience: Developers, maintainers, DevOps engineers
- Stage: Final consolidated manual for current implementation state
- Last updated: April 4, 2026

---

## 1. System Overview

DRMS is a full-stack web application for department-level academic operations. It supports role-based workflows for students, staff, and admins, including authentication, project and achievement management, event operations, faculty activities, announcements, exports, and profile management.

The system currently runs as:

- Frontend: React SPA built with Vite
- Backend: Express API (Node.js, ESM)
- Database: PostgreSQL with SQL migration files
- Deployment model: reverse-proxy based (Nginx + Node backend)

---

## 2. Technology Stack

### Backend

- Node.js 18+
- Express 5.1
- PostgreSQL driver: pg 8.16.3
- Auth: JWT + session token header (x-session-token)
- Validation: Joi
- File upload: Multer + file-type + UUID naming
- Security middleware: Helmet, CORS
- Logging: Winston with request correlation
- Tests: Vitest (+ coverage and JUnit output)

### Frontend

- React 18.3.1
- React Router DOM 6.14.1
- Styling: Tailwind CSS + DaisyUI
- Build/dev server: Vite 4.5
- Data/export libs: XLSX, FileSaver, jsPDF

---

## 3. Repository Layout

```text
Department-Record-Management-System/
|-- backend/
|   |-- migrations/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |   `-- server.js
|   |-- package.json
|   `-- requirements.txt
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- pages/
|   |   `-- utils/
|   |-- package.json
|   `-- vite.config.js
|-- MD/
|-- Jenkinsfile
|-- nginx.conf.example
`-- README.md
```

---

## 4. Backend Architecture

### 4.1 API Entry and Global Middleware

Primary backend entry:

- backend/src/server.js

Core startup behavior:

1. Loads environment configuration.
2. Configures trust proxy and security middleware.
3. Registers request logging with correlation IDs.
4. Configures CORS based on ENABLE_CORS and CORS_ORIGINS.
5. Verifies DB connectivity and schema version table presence.
6. Verifies file storage path and permissions.
7. Starts API server.

Important operational endpoints:

- GET /health: uptime + DB/pool health summary
- GET /pool-stats: admin-only detailed pool statistics

### 4.2 Route Modules (Current)

Mounted route modules include:

- /api/auth
- /api/projects
- /api/achievements
- /api/hackathons
- /api/events (public)
- /api/events-admin (staff/admin)
- /api/staff
- /api/admin
- /api/student/profile
- /api/students
- /api/staff-batch
- /api/data-uploads
- /api/announcements
- /api/faculty-participations
- /api/faculty-research
- /api/faculty-consultancy
- /api/activity-coordinators
- /api (bulk export routes)

### 4.3 Authentication Model

Current auth behavior is hybrid token-based:

- Authorization: Bearer <jwt>
- Session continuity: x-session-token header
- Frontend persists both tokens in localStorage
- 401 response handling clears auth state and redirects to /login

### 4.4 File Handling

File handling is centralized in backend/src/config/upload.js with these protections:

- File storage path verification on startup
- Runtime read/write permission checks
- File size cap via FILE_SIZE_LIMIT_MB
- Route-aware filtering for proof/certificate/project file fields
- Content-based unsafe file rejection (magic bytes + header pattern scan)
- UUID-based filename generation

Protected file serving is routed via:

- GET /api/files/:filename

This endpoint supports either:

- Authorization header token
- token query parameter for browser-native file embedding

---

## 5. Frontend Architecture

### 5.1 Client and Environment

Frontend uses Vite and reads API configuration from:

- VITE_API_BASE_URL (defaults to http://localhost:5000/api if not set)

API access is handled in frontend/src/api/axiosClient.js (fetch-based client wrapper), including:

- Automatic auth headers
- Session token propagation
- Unified 401 redirect behavior
- Upload request helpers with user-facing error mapping

### 5.2 Routing and Role UX

Pages are segmented by role and function under frontend/src/pages and its subfolders.

Current repository memory indicates:

- Student login/OTP redirects now resolve to /
- /student/* remains as a student-only alias that redirects to /
- Legacy StudentDashboard page was removed to avoid dual dashboard UIs

---

## 6. Database and Migration Workflow

Migrations are SQL-first and mandatory.

Current migration files:

- 001_initial_schema.sql
- 002_otp_attempts.sql
- 003_schema_fixes.sql
- 004_student_profiles.sql
- 005_missing_tables.sql
- 006_hackathons.sql
- 007_hackathon_progress_workflow.sql
- 008_activity_types_lookup.sql
- 009_achievement_activity_types_seed.sql

Rules in current implementation:

- No schema mutation at runtime from application code
- Deployments must apply migration scripts explicitly
- schema_version table is used for migration visibility

---

## 7. Local Development Setup

## 7.1 Prerequisites

- Node.js 18+
- npm 8+
- PostgreSQL 12+
- Working SMTP credentials for OTP and notification mail

## 7.2 Install Dependencies

From project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 7.3 Database Setup

Create and migrate database (example using postgres user):

```bash
psql -U postgres -c "CREATE DATABASE drms_db;"

psql -U postgres -d drms_db -f backend/migrations/001_initial_schema.sql
psql -U postgres -d drms_db -f backend/migrations/002_otp_attempts.sql
psql -U postgres -d drms_db -f backend/migrations/003_schema_fixes.sql
psql -U postgres -d drms_db -f backend/migrations/004_student_profiles.sql
psql -U postgres -d drms_db -f backend/migrations/005_missing_tables.sql
psql -U postgres -d drms_db -f backend/migrations/006_hackathons.sql
psql -U postgres -d drms_db -f backend/migrations/007_hackathon_progress_workflow.sql
psql -U postgres -d drms_db -f backend/migrations/008_activity_types_lookup.sql
psql -U postgres -d drms_db -f backend/migrations/009_achievement_activity_types_seed.sql
```

## 7.4 Environment Configuration

Backend minimum required variables:

- DB_USER
- DB_PASS
- DB_HOST
- DB_PORT
- DB_NAME
- JWT_SECRET
- EMAIL_USER
- EMAIL_PASS
- PORT
- NODE_ENV

Backend recommended variables:

- FILE_STORAGE_PATH
- FILE_SIZE_LIMIT_MB
- CORS_ORIGINS
- ENABLE_CORS
- DB_POOL_MAX
- DB_POOL_MIN
- DB_IDLE_TIMEOUT_MS
- DB_CONNECTION_TIMEOUT_MS
- DB_QUERY_TIMEOUT_MS
- DB_STATEMENT_TIMEOUT_MS
- ADMIN_EMAILS

Frontend variables:

- VITE_API_BASE_URL
- VITE_APP_ENV
- VITE_DEBUG

## 7.5 Run Services

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Default local endpoints:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## 8. Test and Quality Workflow

Backend scripts:

- npm test
- npm run test:watch
- npm run test:coverage

The Jenkins pipeline currently executes coverage and publishes:

- JUnit report: backend/test-results/junit.xml
- Coverage HTML report: backend/coverage/index.html

Recommended minimum before merge:

1. Run backend tests.
2. Validate a full login and role-based flow in frontend.
3. Validate one upload path and one export path.
4. Confirm /health endpoint returns DB connected state.

---

## 9. CI/CD and Deployment

## 9.1 Jenkins Pipeline Behavior

Current Jenkinsfile stages:

1. Checkout
2. Install Dependencies (backend and frontend in parallel)
3. Backend Tests (coverage + reports)
4. Frontend Build
5. Prepare Backend Artifact
6. Deploy Backend (PM2 reload)
7. Deploy Frontend
8. Basic Validation (health/smoke checks)

Notable CI environment assumptions:

- JWT secret injected by Jenkins credentials
- Test uploads path under /tmp
- NODE_ENV=test during CI tests

## 9.2 Nginx Reverse Proxy Pattern

Provided in nginx.conf.example:

- TLS termination and HTTP->HTTPS redirect
- /api proxied to backend app
- CORS headers can be managed by Nginx in production
- Frontend static files served from Vite build output
- upload/export aliases shown as optional direct-serve patterns

Production note:

- If Nginx handles cross-origin concerns, set backend ENABLE_CORS=false.

---

## 10. Security and Operational Controls

Current security controls include:

- Helmet headers on backend
- JWT verification for protected APIs
- Session-token header checks in request flow
- Upload content scanning and blocked extension policy
- Path traversal prevention for file-serving endpoint
- Structured request/error logs with trace IDs
- Database pool guardrails and health introspection

Operational checks:

- Monitor /health and /pool-stats
- Watch for trace_id in frontend-reported backend errors
- Track uploads/exports storage usage and cleanup policy

---

## 11. Known Implementation Notes (Present Stage)

Current repository notes highlight these important realities:

1. Hackathon progress upload requires migration 007. Without it, old constraints may trigger server errors.
2. Bulk export behavior was stabilized around missing faculty_participations academic_year column assumptions.
3. Leaderboard endpoint/UI role handling was hardened for category and authorization logic.
4. Optional student profile fields may be sent as empty strings and should remain validator-compatible.
5. Auth image path handling was adjusted to support BASE_URL deployment paths and mobile reliability.

Treat these as regression-sensitive areas during future refactors.

---

## 12. Developer Runbook (Quick Commands)

```bash
# Backend
cd backend
npm run dev
npm run test
npm run test:coverage

# Frontend
cd frontend
npm run dev
npm run build
npm run preview

# Health check
curl http://localhost:5000/health

# Apply one migration manually
psql -U postgres -d drms_db -f backend/migrations/009_achievement_activity_types_seed.sql
```

---

## 13. Current Completion Snapshot

As of this manual revision, DRMS has:

- Stable role-based authentication and session-aware request handling
- Feature-complete core modules for projects, achievements, events, faculty activity tracking, and announcements
- Migration-driven schema management up to migration 009
- CI pipeline with backend automated testing and frontend production build
- Production proxy template and health-check endpoints for operations

Future work should continue from this baseline by extending migrations, adding endpoint-level integration tests, and tightening deployment observability.

---

## 14. Reference Documents

For deeper details, see:

- MD/QUICKSTART.md
- MD/ENV_SETUP.md
- backend/MIGRATION_QUICK_START.md
- backend/migrations/README.md
- MD/SESSION_BASED_LOGIN_DOCS.md
- MD/SECURITY_GUIDELINES.md
- nginx.conf.example
- Jenkinsfile

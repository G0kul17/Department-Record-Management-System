# Product Audit Checklist: Hidden Production Concepts (DRMS Evaluation)

This report evaluates the current Department Resource Management System (DRMS) codebase against critical, often overlooked production requirements.

## 1. Integer Overflow Protection
- **Status**: ⚠️ **At Risk**
- **Evaluation**: The backend uses JavaScript `Number()` to parse IDs from URL parameters (e.g., `Number(id)` in `publicRecordController.js`). While safe for standard 32-bit integers, if PostgreSQL generates sequences exceeding `2^53 - 1` (the JS max safe integer), JavaScript will lose precision, leading to data corruption.
- **Recommendation**: Rely on the `pg` driver's native handling (which returns BIGINTs as strings) and avoid casting large DB identifiers to JS Numbers.

## 2. API Idempotency
- **Status**: ❌ **Missing**
- **Evaluation**: Creation endpoints (like `POST /api/faculty-participations`) lack idempotency keys. If a client's network connection drops and they retry the POST request, the backend will cheerfully create duplicate records.
- **Recommendation**: Require an `Idempotency-Key` header on all `POST`/`PUT` requests and cache the response against this key for 24 hours.

## 3. Mandatory Backend Validation
- **Status**: ❌ **Incomplete**
- **Evaluation**: While some manual regex checks exist (e.g., for passwords in `authController.js`), the backend heavily relies on naive destructuring of `req.body`. There is no robust validation pipeline.
- **Recommendation**: Integrate **Zod** or **Joi** at the router/middleware level to strictly enforce schemas for every single incoming request payload.

## 4. Third-Party Script Monitoring
- **Status**: ⚠️ **Needs Improvement**
- **Evaluation**: The backend sets a Content Security Policy (via Helmet), which is great. However, it currently allows `'unsafe-inline'` and `'unsafe-eval'` for scripts. If any third-party script is injected, it has unrestricted access to the DOM.
- **Recommendation**: Harden the CSP by removing `'unsafe-inline'` and enforcing script nonces or strict hashing for all frontend scripts.

## 5. Clock Skew Alignment
- **Status**: ⚠️ **Unverified**
- **Evaluation**: The system relies on the Node.js server time for JWT expiration and OTP timeouts. If the backend server's clock drifts relative to the PostgreSQL server, OTP expiry logic (`expires_at`) could fail sporadically.
- **Recommendation**: Ensure the application logic uses database server time (`SELECT NOW()`) for critical time-based operations, or sync all environments tightly via NTP.

## 6. Presigned URL Implementation
- **Status**: ❌ **Missing**
- **Evaluation**: Currently, DRMS serves static files via an Express static/authenticated route (`/api/files/:filename`) using local disk storage. 
- **Recommendation**: If migrating to AWS S3 or Cloudflare R2, abandon the Express file proxy and generate temporary, time-limited Presigned URLs for direct, secure client downloads.

## 7. Cache Stampede Mitigation
- **Status**: ❌ **Missing**
- **Evaluation**: The system currently issues raw PostgreSQL queries for every API hit without a caching layer. If a specific "Public Share Link" goes viral, hundreds of simultaneous queries will hit the DB for the exact same record, causing CPU spikes.
- **Recommendation**: Introduce **Redis** to cache public records. Use a locking mechanism (like `redlock`) when refreshing stale cache items to prevent cache stampedes.

## 8. Connection Pool Optimization
- **Status**: ✅ **Implemented Successfully**
- **Evaluation**: The backend correctly utilizes the `pg.Pool` class in `config/db.js` with environment-aware min/max limits, idle timeouts, and connection timeouts. This prevents connection exhaustion.
- **Recommendation**: Maintain current implementation. Monitor pool metrics via the existing `/pool-stats` endpoint.

## 9. Webhook Retry Logic
- **Status**: ➖ **N/A (Not Yet Applicable)**
- **Evaluation**: DRMS does not currently appear to consume external webhooks (e.g., from payment gateways). 
- **Recommendation**: When third-party integrations are added, ensure webhook handlers are idempotent and return HTTP 200 immediately, deferring processing to a background worker queue.

## 10. Serverless Database Proxying
- **Status**: ➖ **N/A (Not Yet Applicable)**
- **Evaluation**: DRMS operates on a long-running Node.js/Express server (not AWS Lambda or Vercel Serverless Functions). Therefore, the existing connection pool in `db.js` is perfectly adequate.
- **Recommendation**: If the architecture ever shifts to serverless, implement a proxy like **PgBouncer** or **Supabase Connection Pooling** to avoid exhausting Postgres connections during cold starts.

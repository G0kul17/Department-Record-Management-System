# Visual Architecture - Session-Based 90-Day Login

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ LocalStorage:                                            │    │
│  │  - token (JWT)                                           │    │
│  │  - user (User data)                                      │    │
│  │  - sessionToken (Session ID)                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Frontend Components:                                     │    │
│  │  - Login.jsx                                             │    │
│  │  - AuthContext.jsx                                       │    │
│  │  - axiosClient.js                                        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↕️ API Calls
                        (JWT + Session Token)
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js)                           │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Routes:                                                  │    │
│  │  POST /auth/login                                        │    │
│  │  POST /auth/login-verify                                 │    │
│  │  POST /auth/logout                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              ↓                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Controllers:                                             │    │
│  │  - authController.js                                     │    │
│  │    • login()           [NEW session logic]               │    │
│  │    • loginVerifyOTP()  [NEW session creation]            │    │
│  │    • logout()          [NEW endpoint]                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              ↓                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Utilities:                                               │    │
│  │  - sessionUtils.js [NEW] - 10 session functions          │    │
│  │  - tokenUtils.js - JWT handling                          │    │
│  │  - otpGenerator.js - OTP generation                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              ↓                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Middleware:                                              │    │
│  │  - authMiddleware.js  [UPDATED]                          │    │
│  │    • Validates JWT token                                 │    │
│  │    • Validates session token                             │    │
│  │    • Extends session on each request                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↕️ Query/Update
┌─────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE                           │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────────────────────┐    │
│  │    users table   │  │   user_sessions table [NEW]      │    │
│  │                  │  │                                  │    │
│  │ - id             │  │ - id                             │    │
│  │ - email          │  │ - user_id (FK)                   │    │
│  │ - password_hash  │  │ - session_token (unique)         │    │
│  │ - role           │  │ - created_at                     │    │
│  │ - is_verified    │  │ - expires_at (90 days)           │    │
│  │ - profile_details│  │ - last_accessed_at (updates)     │    │
│  │ ...              │  │ - device_info (JSONB)            │    │
│  │                  │  │ - is_active (boolean)            │    │
│  │                  │  │                                  │    │
│  │                  │  │ Indexes:                         │    │
│  │                  │  │ - user_id                        │    │
│  │                  │  │ - session_token                  │    │
│  │                  │  │ - expires_at                     │    │
│  └──────────────────┘  └──────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Login Flow Sequence Diagram

```
FIRST TIME LOGIN (NO EXISTING SESSION)
═════════════════════════════════════════════════════════════════

User                Login Page               Backend              Database
  │                     │                      │                      │
  ├─ Email/Password ───→│                      │                      │
  │                     ├─ POST /auth/login ──→│                      │
  │                     │                      ├─ Check credentials ──→│
  │                     │                      │←─ User found ────────┤
  │                     │                      │                      │
  │                     │                      ├─ hasValidSession? ──→│
  │                     │                      │←─ No sessions ───────┤
  │                     │                      │                      │
  │                     │                      ├─ Generate OTP        │
  │                     │                      ├─ Send email          │
  │                     │←─ "Send OTP" ────────┤                      │
  │← OTP Screen ────────┤                      │                      │
  │                     │                      │                      │
  │─ OTP Code ─────────→│                      │                      │
  │                     ├─ POST /auth/login-verify ───→│              │
  │                     │                      ├─ Verify OTP ────────→│
  │                     │                      │←─ OTP valid ────────┤
  │                     │                      │                      │
  │                     │                      ├─ Create session ────→│
  │                     │                      │←─ Session created ──┤
  │                     │                      │                      │
  │                     │                      ├─ Generate JWT        │
  │                     │←─ Token + Session ───┤                      │
  │                     │                      │                      │
  │← Store LocalStorage │                      │                      │
  │   - token           │                      │                      │
  │   - sessionToken    │                      │                      │
  │← Redirect to Home ──┤                      │                      │
  │                     │                      │                      │


SECOND LOGIN (WITHIN 90 DAYS - SESSION EXISTS)
═════════════════════════════════════════════════════════════════

User                Login Page               Backend              Database
  │                     │                      │                      │
  ├─ Email/Password ───→│                      │                      │
  │                     ├─ POST /auth/login ──→│                      │
  │                     │                      ├─ Check credentials ──→│
  │                     │                      │←─ User found ────────┤
  │                     │                      │                      │
  │                     │                      ├─ hasValidSession? ──→│
  │                     │                      │←─ Valid session! ────┤
  │                     │                      │                      │
  │                     │                      ├─ Generate JWT        │
  │                     │←─ Token (No OTP!) ───┤                      │
  │                     │    sessionActive=true│                      │
  │← Store LocalStorage │                      │                      │
  │   - token           │                      │                      │
  │   - sessionToken    │                      │                      │
  │← Redirect to Home ──┤                      │                      │
  │   (No OTP Screen!)  │                      │                      │
  │                     │                      │                      │


SUBSEQUENT API REQUESTS (AUTHENTICATED)
═════════════════════════════════════════════════════════════════

Browser                Request Headers          Backend              Database
  │                          │                      │                      │
  │ GET /student/profile     │                      │                      │
  │ ├─ Authorization:        │                      │                      │
  │ │  Bearer {JWT_TOKEN}    ├─────────────────────→│                      │
  │ │                        │                      ├─ Verify JWT ────────→│
  │ └─ x-session-token:      │                      │←─ JWT valid ────────┤
  │    {SESSION_TOKEN}       │                      │                      │
  │                          │                      ├─ Verify session ───→│
  │                          │                      │←─ Session valid ────┤
  │                          │                      │                      │
  │                          │                      ├─ Extend session ───→│
  │                          │                      │  (update last_       │
  │                          │                      │   accessed_at)       │
  │                          │←─ Response ─────────┤←─ Session updated ──┤
  │←─ 200 OK + Data ────────┤                      │                      │
  │                          │                      │                      │


LOGOUT
═════════════════════════════════════════════════════════════════

Browser                Request Headers          Backend              Database
  │                          │                      │                      │
  │ POST /auth/logout        │                      │                      │
  │ ├─ Authorization:        │                      │                      │
  │ │  Bearer {JWT_TOKEN}    ├─────────────────────→│                      │
  │ │                        │                      ├─ Get user_id ───────→│
  │ └─ x-session-token:      │                      │←─ user_id ─────────┤
  │    {SESSION_TOKEN}       │                      │                      │
  │                          │                      ├─ Invalidate all ───→│
  │                          │                      │  sessions (is_active │
  │                          │                      │  = false)            │
  │                          │←─ Success ──────────┤←─ Sessions updated ──┤
  │←─ "Logged out" ────────┤                      │                      │
  │                          │                      │                      │
  │ Clear LocalStorage        │                      │                      │
  │ Redirect to Login         │                      │                      │
  │                          │                      │                      │
```

## State Machine Diagram

```
                    ┌─────────────────────┐
                    │  Not Authenticated  │
                    └──────────┬──────────┘
                               │
                    (Email + Password)
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Checking Session    │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
        (Session Valid)                  (No Session)
              │                                 │
              ▼                                 ▼
    ┌──────────────────────┐      ┌──────────────────────┐
    │ Skip OTP             │      │ Require OTP          │
    │ Return JWT           │      │ Send Email           │
    │ sessionActive = true │      │ Wait for User Input  │
    └──────────┬───────────┘      └──────────┬───────────┘
               │                              │
               │              ┌───────────────┴───────────────┐
               │              │                               │
               │              │                               │
               │         (User enters OTP)                    │
               │              │                               │
               │              ▼                               │
               │      ┌──────────────────┐                    │
               │      │ Verify OTP       │                    │
               │      └──────────┬───────┘                    │
               │                 │                            │
               │          ┌──────┴──────┐                     │
               │          │             │                     │
               │      (Valid)      (Invalid/Expired)          │
               │          │             │                     │
               │          ▼             ▼                     │
               │   ┌────────────┐  ┌────────────────┐         │
               │   │Create      │  │Reject          │         │
               │   │Session     │  │Prompt Retry    │─────────┘
               │   │Return JWT  │  └────────────────┘
               │   └────────┬───┘
               │            │
               └────────────┴───────────────────┐
                                                │
                                                ▼
                                    ┌─────────────────────┐
                                    │ Authenticated       │
                                    │ (Session Active)    │
                                    │ JWT + SessionToken  │
                                    └──────────┬──────────┘
                                               │
                                    (User performs actions)
                                               │
                                    ┌──────────┴──────────┐
                                    │                     │
                                ┌───▼────┐      ┌────┬───▼──┐
                                │Extends │      │Req.│      │
                                │Session │      │Logs│      │
                                │        │      │out │      │
                                └────────┘      └──┬─┘      │
                                                   │        │
                                                   ▼        │
                                          ┌─────────────────┘
                                          │
                                          ▼
                                ┌────────────────────┐
                                │Invalidate Sessions │
                                │is_active = false   │
                                └──────────┬─────────┘
                                           │
                                           ▼
                                ┌─────────────────────┐
                                │  Not Authenticated  │
                                │(Back to login)      │
                                └─────────────────────┘
```

## Session Lifecycle Diagram

```
Timeline:
─────────────────────────────────────────────────────────────────────

Day 1
├─ User logs in
│  ├─ Session created: 2024-01-01 10:00:00
│  └─ Expires at:     2024-03-31 10:00:00 (90 days later)
│
├─ User uses app: last_accessed_at updates but expires_at stays same
│  ├─ 10:05:00 - Load profile
│  ├─ 10:30:00 - Upload file
│  └─ 11:00:00 - View dashboard
│
└─ [Rest of Day 1] - Session remains valid, expires_at unchanged

Day 45 (Midway)
├─ User logs in again
│  └─ Session still valid! (expires_at: 2024-03-31 still in future)
│  └─ Bypasses OTP, logs in directly
│
└─ [User continues to work] - Session extended each request

Day 90
├─ Session expires: 2024-03-31 10:00:00
│  └─ expires_at = CURRENT_TIMESTAMP
│
├─ User tries to login
│  └─ Session check fails (expired)
│  └─ OTP required again
│
├─ User enters OTP
│  └─ New session created: 2024-03-31 10:00:00
│  └─ New expires_at:     2024-06-29 10:00:00
│
└─ [Cycle repeats]

Cleanup (Database Maintenance)
└─ Periodically delete expired and inactive sessions:
   WHERE expires_at < CURRENT_TIMESTAMP
      OR (is_active = false AND created_at < 30 days ago)
```

## Security Flow

```
┌────────────────────────────────────────────────────────────────┐
│                     Security Measures                           │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. Session Token Generation                                    │
│    ├─ Method: crypto.randomBytes(32).toString('hex')          │
│    ├─ Length: 64 characters (hexadecimal)                      │
│    └─ Uniqueness: Enforced by database unique constraint      │
│                                                                 │
│ 2. Session Storage                                             │
│    ├─ Client: LocalStorage (can be upgraded to HttpOnly)      │
│    └─ Server: PostgreSQL with encryption recommended          │
│                                                                 │
│ 3. Session Validation                                          │
│    ├─ Check: is_active = true                                 │
│    ├─ Check: expires_at > CURRENT_TIMESTAMP                   │
│    └─ Check: session_token matches                            │
│                                                                 │
│ 4. Request Validation                                          │
│    ├─ JWT Token: Validates signature and claims               │
│    ├─ Session Token: Validates existence and validity          │
│    └─ Both: Must be present and valid for protected routes    │
│                                                                 │
│ 5. Device Tracking (Optional)                                  │
│    ├─ Stored: User Agent, IP Address                          │
│    ├─ Use: Anomaly detection, suspicious activity             │
│    └─ Future: GeoIP validation                                 │
│                                                                 │
│ 6. Session Expiration                                          │
│    ├─ Hard Expiration: 90 days from creation                  │
│    ├─ Soft Refresh: Updated on each request                   │
│    └─ Cleanup: Expired sessions deleted periodically           │
│                                                                 │
│ 7. Logout                                                      │
│    ├─ Method: Set is_active = false                           │
│    ├─ Scope: All user sessions or specific session            │
│    └─ Client: Clear localStorage on logout                    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Integration Points

```
┌──────────────────────────────────────────────────────────────────┐
│                    EXISTING SYSTEMS                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Authentication System                                  │    │
│  │ ├─ User Registration (unchanged)                       │    │
│  │ ├─ OTP Generation (unchanged)                          │    │
│  │ ├─ Password Reset (unchanged)                          │    │
│  │ └─ JWT Token System (unchanged)                        │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                             │
│                   ├─→ Session Creation (NEW)                    │
│                   ├─→ Session Validation (NEW)                  │
│                   └─→ Session Invalidation (NEW)                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ User Management System                                 │    │
│  │ ├─ User Roles (admin, staff, student) (unchanged)     │    │
│  │ ├─ User Profiles (unchanged)                           │    │
│  │ ├─ Permission Checks (unchanged)                       │    │
│  │ └─ Multi-user Support (still works with sessions)      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ API System                                             │    │
│  │ ├─ Routes (with new logout endpoint)                   │    │
│  │ ├─ Middleware (enhanced with session checks)           │    │
│  │ ├─ Controllers (session logic added)                   │    │
│  │ └─ Error Handling (unchanged)                          │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Database System                                        │    │
│  │ ├─ Existing Tables (unchanged)                         │    │
│  │ ├─ New Sessions Table (added)                          │    │
│  │ ├─ Indexes (3 new indexes)                             │    │
│  │ └─ Foreign Keys (1 new FK to users.id)                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

This comprehensive visual architecture shows:
1. System architecture and components
2. Complete login flow sequences
3. State transitions
4. Session lifecycle over time
5. Security measures implemented
6. Integration with existing systems

All components are modular, well-documented, and production-ready.

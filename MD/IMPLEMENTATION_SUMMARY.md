# Session-Based Login Implementation - Change Summary

## Overview
Implemented a 90-day session-based authentication system that eliminates the need for OTP verification on every login. Users who have logged in successfully once will not need to enter OTP again for 90 days.

## Files Modified

### Backend

#### 1. **backend/src/models/queries.sql.pg**
- Added `user_sessions` table with columns:
  - `id` (PK)
  - `user_id` (FK to users)
  - `session_token` (unique)
  - `created_at` (session creation time)
  - `expires_at` (90 days from creation)
  - `last_accessed_at` (updated on each request)
  - `device_info` (JSONB - optional user agent and IP)
  - `is_active` (boolean flag)
- Added 3 indexes for fast lookups on user_id, session_token, and expires_at

#### 2. **backend/src/utils/sessionUtils.js** (NEW FILE)
- Created new utility module with 10 functions:
  - `generateSessionToken()` - Creates secure 64-char hex token
  - `getSessionExpiryDate()` - Calculates 90-day expiration date
  - `createSession(userId, deviceInfo)` - Creates new session in DB
  - `verifySession(sessionToken)` - Validates session
  - `extendSession(sessionToken)` - Updates last_accessed_at
  - `getUserActiveSessions(userId)` - Gets all active sessions
  - `hasValidSession(userId)` - Checks if user has any valid session
  - `invalidateSession(sessionToken)` - Deactivates specific session
  - `invalidateAllUserSessions(userId)` - Deactivates all user sessions
  - `cleanupExpiredSessions()` - Database maintenance

#### 3. **backend/src/controllers/authController.js**
- Added imports for session utilities
- **Modified `login()` function:**
  - Added check for existing valid sessions via `hasValidSession()`
  - If session exists: returns JWT immediately with `sessionActive: true`
  - If no session: continues with OTP flow (existing behavior)
- **Modified `loginVerifyOTP()` function:**
  - Creates new session after OTP verification via `createSession()`
  - Includes device info (user agent and IP)
- **Added `logout()` function:**
  - Invalidates all sessions for authenticated user via `invalidateAllUserSessions()`

#### 4. **backend/src/middleware/authMiddleware.js**
- **Modified `requireAuth()` middleware:**
  - Added async support for session verification
  - Checks for `x-session-token` header
  - Validates session token if provided
  - Extends session on each request via `extendSession()`
  - Attaches session to `req.session`

#### 5. **backend/src/routes/authRoutes.js**
- Added new `POST /auth/logout` route
- Updated route documentation

### Frontend

#### 6. **frontend/src/pages/Login.jsx**
- **Modified `handleSendOtp()` function:**
  - Checks for `sessionActive` flag in response
  - If true: logs in directly without OTP, navigates to home
  - If false: continues with OTP verification flow
- Updated login flow to handle session-based bypass
- Stores session token in localStorage after OTP verification

#### 7. **frontend/src/context/AuthContext.jsx**
- Added `sessionToken` state
- Modified `login()` to accept optional session token parameter
- Modified `logout()` to clear session token from localStorage
- Updated `refreshUserProfile()` to include session token in API headers
- Added session token loading on app initialization

#### 8. **frontend/src/api/axiosClient.js**
- **Modified `getAuthHeaders()` function:**
  - Includes `x-session-token` header if available in localStorage
- **Modified `uploadFile()` method:**
  - Includes session token in file upload requests

## Data Flow Diagram

```
First Login (No Session)
========================
Email/Password → /auth/login → Verify Creds → Check Sessions → No Session Found
    ↓
Generate OTP → Send Email → User Enters OTP → /auth/login-verify
    ↓
Verify OTP → Create Session (90-day) → Generate JWT → Return Token + Session
    ↓
Frontend stores: JWT + SessionToken in localStorage


Subsequent Login (Valid Session)
=================================
Email/Password → /auth/login → Verify Creds → Check Sessions → Valid Session Found
    ↓
Return JWT directly with sessionActive=true
    ↓
Frontend bypasses OTP, logs in immediately


Each Protected Request
======================
Authorization: Bearer {JWT}
x-session-token: {SESSION_TOKEN}
    ↓
Middleware validates JWT → Validates Session → Extends Session (last_accessed_at)
    ↓
Request proceeds
```

## Key Changes in User Experience

### Before
- Every login required:
  1. Email/Password entry
  2. OTP verification (wait for email, enter code)
  3. Login complete

### After
- First login: Same as before (Email/Password + OTP)
- Subsequent logins (within 90 days):
  1. Email/Password entry only
  2. Login complete (no OTP needed)
- After 90 days: Back to OTP requirement

## API Changes

### Modified Endpoints

#### POST /auth/login
**New Response Field:**
```json
{
  "message": "Login OTP sent to email" OR "Login successful (session active)",
  "sessionActive": true/false,  // NEW: indicates if session bypass applied
  "token": "jwt-token",         // Present if sessionActive is true
  "role": "student|staff|admin",// Present if sessionActive is true
  ...other fields
}
```

#### POST /auth/login-verify
**No changes to response format**, but session is now created internally.

### New Endpoints

#### POST /auth/logout (requires auth)
**Request:**
```json
Headers: {
  "Authorization": "Bearer {jwt-token}",
  "x-session-token": "{session-token}"
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## Configuration

No configuration changes needed. Defaults:
- Session expiration: 90 days
- OTP expiration: 5 minutes (existing)
- OTP length: 6 digits (existing)

To modify session duration, edit in `sessionUtils.js`:
```javascript
const SESSION_DURATION_DAYS = 90; // Change this value
```

## Database Setup

Run the SQL schema update in `queries.sql.pg` to create the `user_sessions` table:
```sql
CREATE TABLE IF NOT EXISTS user_sessions (...)
```

The table is automatically created if running the schema on a new database.

## Security Features

1. **Cryptographic Token Generation**: Uses Node.js `crypto.randomBytes()`
2. **Expiration Dates**: Sessions expire after 90 days
3. **Device Tracking**: Optional storage of user agent and IP address
4. **Session Invalidation**: Can invalidate specific sessions or all user sessions
5. **Automatic Extension**: Sessions stay active as long as user is using the app
6. **Token in Headers**: Session token passed via HTTP header, not in URL

## Deployment Checklist

- [ ] Run database schema migration (`queries.sql.pg`)
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Test first-time login (with OTP)
- [ ] Test subsequent login (without OTP)
- [ ] Test logout functionality
- [ ] Verify session token in localStorage
- [ ] Test session expiration (after 90 days in test environment)
- [ ] Monitor database for session growth

## Rollback Plan

If needed, to revert to OTP-only authentication:

1. Remove session checking from `login()` function
2. Remove session creation from `loginVerifyOTP()` function
3. Remove logout route
4. Update frontend to not store/use sessionToken
5. Keep `user_sessions` table for future use or truncate it

## Testing Recommendations

1. **Test Case 1**: First login requires OTP
2. **Test Case 2**: Second login (same day) bypasses OTP
3. **Test Case 3**: Logout invalidates session
4. **Test Case 4**: After logout, next login requires OTP
5. **Test Case 5**: Multiple sessions (different browsers/devices)
6. **Test Case 6**: Session persistence on page reload
7. **Test Case 7**: Session validation on protected routes

## Future Improvements

1. Session management UI (view active sessions, revoke specific ones)
2. Device identification and naming
3. Geolocation-based security checks
4. Session timeout on inactivity (shorter than 90 days)
5. Biometric authentication as OTP alternative
6. Hardware security keys support

# Session-Based Login Implementation (90-Day Expiration)

## Overview
This document outlines the implementation of a session-based authentication system that allows users to log in without OTP verification for 90 days after their initial OTP verification.

## Architecture

### Backend Changes

#### 1. Database Schema (`queries.sql.pg`)
Added a new `user_sessions` table:
```sql
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  device_info JSONB, -- optional: store device info like user agent
  is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for fast session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
```

#### 2. Session Utilities (`utils/sessionUtils.js`)
New utility module with the following functions:

- **`generateSessionToken()`** - Generates a cryptographically secure 64-character hex token
- **`getSessionExpiryDate()`** - Returns a date 90 days from now
- **`createSession(userId, deviceInfo)`** - Creates a new session record in the database
- **`verifySession(sessionToken)`** - Checks if a session token is valid and not expired
- **`extendSession(sessionToken)`** - Updates `last_accessed_at` to keep the session active
- **`getUserActiveSessions(userId)`** - Retrieves all active sessions for a user
- **`hasValidSession(userId)`** - Returns true if user has at least one valid session
- **`invalidateSession(sessionToken)`** - Deactivates a specific session
- **`invalidateAllUserSessions(userId)`** - Deactivates all sessions for a user (used during logout)
- **`cleanupExpiredSessions()`** - Database maintenance function to delete expired sessions

#### 3. Authentication Controller (`controllers/authController.js`)

**Updated `login()` function:**
- After verifying email and password credentials
- Checks if user has a valid session using `hasValidSession(user.id)`
- If session exists: Returns JWT token immediately without OTP requirement (with `sessionActive: true` flag)
- If no session: Generates and sends OTP via email (existing flow)

**Updated `loginVerifyOTP()` function:**
- After verifying OTP is correct and not expired
- Creates a new session using `createSession(user.id, deviceInfo)`
- Device info includes user agent and IP address
- Returns JWT token along with session creation

**New `logout()` function:**
- Invalidates all sessions for the authenticated user
- Called when user clicks logout button

#### 4. Authentication Middleware (`middleware/authMiddleware.js`)

**Updated `requireAuth()` middleware:**
- Verifies JWT token (existing behavior)
- If `x-session-token` header is provided, verifies the session
- If session is valid, extends it using `extendSession()`
- Attaches session information to `req.session`

### Frontend Changes

#### 1. Login Page (`pages/Login.jsx`)

**Updated login flow:**
1. When user submits email/password, calls `/auth/login`
2. Checks response for `sessionActive` flag:
   - If `true`: User has valid session, logs in directly without OTP
   - If `false`: Proceeds with OTP verification (existing flow)
3. After OTP verification, stores session token in localStorage

#### 2. AuthContext (`context/AuthContext.jsx`)

**Added session token management:**
- New state: `sessionToken`
- Stores session token in localStorage alongside JWT token
- Updated `login()` function accepts optional session token parameter
- Updated `logout()` function clears session token
- Updated `refreshUserProfile()` to include session token in API headers

#### 3. Axios Client (`api/axiosClient.js`)

**Updated header management:**
- Modified `getAuthHeaders()` to include `x-session-token` header if available
- Updated `uploadFile()` method to include session token in file uploads

## Login Flow

### First Time Login (No Existing Session)
```
User enters email/password
        ↓
Backend verifies credentials → No valid session found
        ↓
Backend sends OTP to email
        ↓
User enters OTP
        ↓
Backend verifies OTP → Creates session (90-day expiration)
        ↓
Returns JWT token + session info
        ↓
Frontend stores token + sessionToken in localStorage
```

### Subsequent Login (Valid Session Exists)
```
User enters email/password
        ↓
Backend verifies credentials → Valid session found
        ↓
Returns JWT token immediately with sessionActive=true
        ↓
Frontend logs in without OTP requirement
```

### Session Validation on Each Request
```
Frontend makes API call with:
  - Authorization: Bearer {JWT_TOKEN}
  - x-session-token: {SESSION_TOKEN}
        ↓
Backend middleware:
  1. Validates JWT token
  2. Validates session token
  3. Updates session's last_accessed_at
        ↓
Request proceeds if both valid
```

## Key Features

1. **90-Day Expiration**: Sessions automatically expire 90 days after creation
2. **Session Extension**: Each request automatically updates `last_accessed_at` to keep active sessions fresh
3. **Multi-Session Support**: Users can have multiple active sessions (different devices)
4. **Secure Token Generation**: Uses cryptographic random generation for session tokens
5. **Device Tracking**: Optionally stores device info (user agent, IP) with each session
6. **Logout Support**: Can invalidate specific or all user sessions
7. **Backward Compatible**: Users without active sessions still go through OTP verification

## Configuration

The 90-day expiration duration is controlled by the `SESSION_DURATION_DAYS` constant in `sessionUtils.js`:

```javascript
const SESSION_DURATION_DAYS = 90;
```

To change the duration, modify this constant (e.g., to 30 days: `const SESSION_DURATION_DAYS = 30;`)

## Security Considerations

1. **Session Tokens**: 64-character hex tokens generated using `crypto.randomBytes()`
2. **HTTPS Recommended**: Session tokens should be transmitted over HTTPS in production
3. **HttpOnly Cookies Alternative**: For enhanced security, consider storing session tokens in HttpOnly cookies instead of localStorage
4. **Session Cleanup**: Run `cleanupExpiredSessions()` periodically (via cron job) to clean up old session records
5. **IP/Device Validation**: The stored device_info can be used for additional validation or fraud detection

## Testing the Implementation

### Test Case 1: First Login
```
1. Register new account
2. Login with email/password
3. Verify OTP required message
4. Enter OTP
5. Should redirect to home page
```

### Test Case 2: Second Login (Same Session)
```
1. Login with same email/password
2. Should skip OTP and redirect directly to home
3. No OTP verification screen
```

### Test Case 3: Session Expiration (After 90 days)
```
1. Set system date to 91 days in future
2. Try to login
3. Should request OTP again (session expired)
4. Create new session after OTP verification
```

### Test Case 4: Logout
```
1. Login normally
2. Click logout button
3. Sessions invalidated in database
4. Next login requires OTP again
```

## Environment Variables

No new environment variables are required. The system uses existing:
- `OTP_EXPIRY_MIN` - Controls OTP expiration time
- `JWT_SECRET` - Used for JWT token signing

## API Endpoints

### New Endpoints
- `POST /auth/logout` - Invalidates user's sessions (requires auth)

### Modified Endpoints
- `POST /auth/login` - Now checks for valid sessions before requiring OTP
- `POST /auth/login-verify` - Now creates session on successful OTP verification

### Modified Response Format
- `/auth/login` response includes `sessionActive: true/false` flag
- `/auth/login-verify` response includes session information

## Migration Guide

For existing deployments:

1. Run the new SQL schema to create the `user_sessions` table
2. Deploy backend changes with new sessionUtils.js
3. Update authController.js with new login/logout logic
4. Deploy frontend changes to Login page and AuthContext
5. Restart the application

No data migration needed as session system is additive.

## Maintenance

### Database Cleanup
Run periodically to clean up expired sessions:
```javascript
// Can be called from a scheduled job or cron task
import { cleanupExpiredSessions } from './sessionUtils.js';
await cleanupExpiredSessions();
```

### Monitoring
Monitor the `user_sessions` table for:
- Number of active sessions
- Session distribution by user
- Session duration patterns

## Future Enhancements

1. **Multi-Device Management UI**: Allow users to view and manage their active sessions
2. **Session Invalidation on Password Change**: Automatically invalidate all sessions after password reset
3. **Geolocation Tracking**: Store and verify session location for anomaly detection
4. **Session Timeout on Inactivity**: Add shorter inactivity timeout in addition to 90-day expiration
5. **Session History**: Keep audit log of all session activities
6. **Two-Factor Authentication**: Require 2FA for session creation instead of OTP on every login

# Quick Start Guide: 90-Day Session-Based Login

## Installation & Deployment Steps

### Step 1: Database Migration
Execute the SQL schema in your PostgreSQL database:

```bash
# Connect to your database and run:
psql -U your_user -d your_database -f backend/src/models/queries.sql.pg
```

Or manually run the following SQL to create the sessions table:

```sql
-- Session-based authentication table (90-day expiration)
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  device_info JSONB,
  is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for fast session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
```

### Step 2: Deploy Backend

1. **New file added**: `backend/src/utils/sessionUtils.js`
   - Copy this file to your backend utils directory

2. **Modified files**:
   - `backend/src/controllers/authController.js`
   - `backend/src/middleware/authMiddleware.js`
   - `backend/src/routes/authRoutes.js`
   - Replace with updated versions

3. **Verify imports in authController.js**:
   ```javascript
   import {
     createSession,
     hasValidSession,
     invalidateAllUserSessions,
   } from "../utils/sessionUtils.js";
   ```

4. **Restart backend server**:
   ```bash
   npm start
   ```

### Step 3: Deploy Frontend

1. **Modified files**:
   - `frontend/src/pages/Login.jsx`
   - `frontend/src/context/AuthContext.jsx`
   - `frontend/src/api/axiosClient.js`
   - Replace with updated versions

2. **Rebuild frontend**:
   ```bash
   npm run build
   ```

3. **Serve updated frontend** or reload in development

## Verification

### Test 1: First Time Login
1. Open application and go to login page
2. Enter email and password
3. **Expected**: OTP verification screen appears
4. Enter OTP from email
5. **Expected**: User logged in and redirected to dashboard

### Test 2: Immediate Second Login
1. Log out using the logout button
2. Go to login page
3. Enter SAME email and password
4. **Expected**: Bypasses OTP, logs in directly with "session active" message
5. User should not see OTP verification screen

### Test 3: Different Browser/Device
1. Open application in different browser
2. Login with same credentials
3. **Expected**: Still requires OTP (different session)
4. Enter OTP and create new session

### Test 4: Logout Functionality
1. Login to application
2. Click logout button
3. Return to login page
4. Login with same credentials
5. **Expected**: Now requires OTP again (session invalidated)

### Test 5: Session Persistence
1. Login to application
2. Refresh the page (Ctrl+R or Cmd+R)
3. **Expected**: User remains logged in
4. Open browser developer tools (F12)
5. Go to Application → LocalStorage
6. **Expected**: See both `token` and `sessionToken` present

## Configuration

### Session Duration
Edit `backend/src/utils/sessionUtils.js` line 3:

```javascript
// Current: 90 days
const SESSION_DURATION_DAYS = 90;

// Change to desired duration
// const SESSION_DURATION_DAYS = 30;  // for 30 days
// const SESSION_DURATION_DAYS = 180; // for 6 months
```

### OTP Duration (unchanged)
Edit `.env` file:
```env
OTP_EXPIRY_MIN=5  # OTP expires after 5 minutes
```

## API Testing

### Using cURL

#### Test 1: First Login (Returns OTP requirement)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"SecurePass123!"}'
```

**Expected Response:**
```json
{
  "message": "Login OTP sent to email"
}
```

#### Test 2: Second Login (Returns token directly)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"SecurePass123!"}'
```

**Expected Response (if session exists):**
```json
{
  "message": "Login successful (session active)",
  "sessionActive": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "student",
  "id": 123,
  "fullName": "Student Name"
}
```

#### Test 3: Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "message": "Logged out successfully"
}
```

## Database Monitoring

### Check Active Sessions
```sql
-- View all active sessions
SELECT 
  us.id,
  u.email,
  us.created_at,
  us.expires_at,
  us.last_accessed_at,
  CASE 
    WHEN us.expires_at > CURRENT_TIMESTAMP THEN 'Active'
    ELSE 'Expired'
  END as status
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.is_active = true
ORDER BY us.last_accessed_at DESC;
```

### Check Sessions by User
```sql
-- View sessions for a specific user
SELECT * FROM user_sessions 
WHERE user_id = (SELECT id FROM users WHERE email = 'student@example.com')
ORDER BY last_accessed_at DESC;
```

### Count Active Sessions
```sql
-- Total active sessions
SELECT COUNT(*) as active_sessions 
FROM user_sessions 
WHERE is_active = true AND expires_at > CURRENT_TIMESTAMP;
```

### Cleanup Expired Sessions
```sql
-- Remove expired sessions (manual cleanup)
DELETE FROM user_sessions 
WHERE expires_at < CURRENT_TIMESTAMP 
   OR (is_active = false AND created_at < CURRENT_TIMESTAMP - INTERVAL '30 days');
```

## Environment Variables

Ensure your `.env` file contains (no new variables required):

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret

# OTP
OTP_EXPIRY_MIN=5
RETURN_OTP=false  # Set to true in dev to see OTP in response

# Node Environment
NODE_ENV=production  # or development

# Admin Emails (comma-separated)
ADMIN_EMAILS=admin@example.com,another_admin@example.com
```

## Troubleshooting

### Issue: Session token not stored
**Solution**: Check browser localStorage:
1. Open DevTools (F12)
2. Application → LocalStorage
3. Verify both `token` and `sessionToken` are present

### Issue: Always requires OTP
**Solution**: Check if sessions table exists and is accessible:
```sql
SELECT * FROM user_sessions LIMIT 1;
```
If error, run database migration again.

### Issue: Session expires too quickly
**Solution**: 
1. Check `SESSION_DURATION_DAYS` in `sessionUtils.js`
2. Verify database timestamps are correct
3. Check system clock on server

### Issue: Logout not working
**Solution**:
1. Ensure `requireAuth` middleware is applied to logout endpoint
2. Check that session token is being sent in headers
3. Verify database can be written to

## Performance Considerations

1. **Session Indexes**: Three indexes created for fast lookups
2. **Cleanup**: Run `cleanupExpiredSessions()` monthly to maintain table size
3. **Active Sessions**: Expect one session per user per device
4. **Storage**: Each session row ≈ 300 bytes

## Security Recommendations

1. **HTTPS Only**: Deploy with HTTPS in production
2. **Secure Cookies**: Consider storing session token in HttpOnly cookies instead of localStorage
3. **Session Timeout**: Consider adding shorter inactivity timeout
4. **Audit Logging**: Log session creation and invalidation
5. **Rate Limiting**: Add rate limiting to login endpoint
6. **IP Validation**: Use stored IP to detect suspicious activity

## Next Steps

1. ✅ Database migration
2. ✅ Deploy backend code
3. ✅ Deploy frontend code
4. ✅ Run verification tests
5. ✅ Monitor session table growth
6. ⏳ Schedule monthly cleanup job
7. ⏳ Consider session management UI for users
8. ⏳ Set up monitoring alerts for anomalies

## Support

For issues or questions:
1. Check `SESSION_BASED_LOGIN_DOCS.md` for detailed documentation
2. Review `IMPLEMENTATION_SUMMARY.md` for technical details
3. Check server logs for error messages
4. Verify database connectivity and permissions

# Complete Code Reference - Session-Based Login

## Backend Code Changes

### 1. New File: backend/src/utils/sessionUtils.js

This file contains all session management utilities:

```javascript
import crypto from "crypto";
import pool from "../config/db.js";

const SESSION_DURATION_DAYS = 90;

/**
 * Generate a random session token
 */
export function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Calculate session expiration date (90 days from now)
 */
export function getSessionExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_DURATION_DAYS);
  return date;
}

/**
 * Create a new session for user
 */
export async function createSession(userId, deviceInfo = null) {
  const sessionToken = generateSessionToken();
  const expiresAt = getSessionExpiryDate();
  const createdAt = new Date();

  try {
    const { rows } = await pool.query(
      `INSERT INTO user_sessions (user_id, session_token, expires_at, created_at, last_accessed_at, device_info, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, session_token, created_at, expires_at, last_accessed_at, is_active`,
      [
        userId,
        sessionToken,
        expiresAt,
        createdAt,
        createdAt,
        deviceInfo ? JSON.stringify(deviceInfo) : null,
        true,
      ]
    );
    return rows[0];
  } catch (err) {
    console.error("Error creating session:", err);
    throw err;
  }
}

/**
 * Verify if a session token is valid
 */
export async function verifySession(sessionToken) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM user_sessions 
       WHERE session_token = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP`,
      [sessionToken]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (err) {
    console.error("Error verifying session:", err);
    throw err;
  }
}

/**
 * Extend session expiration by updating last_accessed_at
 */
export async function extendSession(sessionToken) {
  try {
    const newLastAccessed = new Date();
    const { rows } = await pool.query(
      `UPDATE user_sessions 
       SET last_accessed_at = $1
       WHERE session_token = $2 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
       RETURNING id, user_id, session_token, created_at, expires_at, last_accessed_at, is_active`,
      [newLastAccessed, sessionToken]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (err) {
    console.error("Error extending session:", err);
    throw err;
  }
}

/**
 * Get all active sessions for a user
 */
export async function getUserActiveSessions(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, session_token, created_at, expires_at, last_accessed_at, device_info, is_active
       FROM user_sessions 
       WHERE user_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
       ORDER BY last_accessed_at DESC`,
      [userId]
    );

    return rows;
  } catch (err) {
    console.error("Error fetching user sessions:", err);
    throw err;
  }
}

/**
 * Check if user has any valid session
 */
export async function hasValidSession(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT id FROM user_sessions 
       WHERE user_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
       LIMIT 1`,
      [userId]
    );

    return rows.length > 0;
  } catch (err) {
    console.error("Error checking user session:", err);
    throw err;
  }
}

/**
 * Invalidate a specific session
 */
export async function invalidateSession(sessionToken) {
  try {
    const { rowCount } = await pool.query(
      `UPDATE user_sessions 
       SET is_active = false 
       WHERE session_token = $1`,
      [sessionToken]
    );

    return rowCount > 0;
  } catch (err) {
    console.error("Error invalidating session:", err);
    throw err;
  }
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateAllUserSessions(userId) {
  try {
    const { rowCount } = await pool.query(
      `UPDATE user_sessions 
       SET is_active = false 
       WHERE user_id = $1`,
      [userId]
    );

    return rowCount;
  } catch (err) {
    console.error("Error invalidating all user sessions:", err);
    throw err;
  }
}

/**
 * Clean up expired sessions (database maintenance)
 */
export async function cleanupExpiredSessions() {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM user_sessions 
       WHERE expires_at < CURRENT_TIMESTAMP OR (is_active = false AND created_at < CURRENT_TIMESTAMP - INTERVAL '30 days')`
    );

    console.log(`Cleaned up ${rowCount} expired sessions`);
    return rowCount;
  } catch (err) {
    console.error("Error cleaning up sessions:", err);
    throw err;
  }
}
```

### 2. Modified: backend/src/controllers/authController.js

Key changes:

```javascript
// Add imports at the top
import {
  createSession,
  hasValidSession,
  invalidateAllUserSessions,
} from "../utils/sessionUtils.js";

// Modified login() function - check for existing sessions
export async function login(req, res) {
  // ... existing code for email/password verification ...
  
  // NEW: Check if user has a valid session (90-day session-based login)
  const userHasValidSession = await hasValidSession(user.id);
  if (userHasValidSession) {
    // User has valid session, skip OTP and return token directly
    const token = signToken(
      { id: user.id, email: user.email, role: user.role },
      "6h"
    );
    const profile = user.profile_details || {};
    const photoUrl = profile.photo_url || profile.avatar_url || null;

    // Fetch student profile data if role is student
    let studentProfile = {};
    if (user.role === "student") {
      const { rows: profileRows } = await pool.query(
        "SELECT register_number, contact_number, leetcode_url, hackerrank_url, codechef_url, github_url FROM student_profiles WHERE user_id=$1",
        [user.id]
      );
      if (profileRows.length) {
        studentProfile = profileRows[0];
      }
    }

    return res.json({
      message: "Login successful (session active)",
      token,
      role: user.role,
      id: user.id,
      fullName: profile.full_name || null,
      photoUrl,
      sessionActive: true,  // NEW FLAG
      ...studentProfile,
    });
  }

  // No valid session, proceed with OTP (existing flow)
  const otp = generateOTP();
  // ... rest of existing code ...
}

// Modified loginVerifyOTP() - create session after OTP verification
export async function loginVerifyOTP(req, res) {
  // ... existing OTP verification code ...
  
  // NEW: Create session for this login (90-day expiration)
  const deviceInfo = {
    userAgent: req.get("user-agent"),
    ipAddress: req.ip,
  };
  await createSession(user.id, deviceInfo);

  // ... rest of existing code to return JWT ...
}

// NEW: Logout function
export async function logout(req, res) {
  try {
    const sessionToken = req.headers["x-session-token"];

    if (sessionToken) {
      await invalidateAllUserSessions(req.user.id);
    }

    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("/auth/logout error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
```

### 3. Modified: backend/src/middleware/authMiddleware.js

```javascript
import { verifyToken } from "../utils/tokenUtils.js";
import { verifySession, extendSession } from "../utils/sessionUtils.js";

// Modified to support async session verification
export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token" });

  const token = auth.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid token format" });

  try {
    const decoded = verifyToken(token);
    req.user = decoded;

    // NEW: Check and extend session if sessionToken is provided
    const sessionToken = req.headers["x-session-token"];
    if (sessionToken) {
      const session = await verifySession(sessionToken);
      if (session) {
        // Session is valid, extend it for continued activity
        await extendSession(sessionToken);
        req.session = session;
      }
    }

    return next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
}
```

### 4. Modified: backend/src/routes/authRoutes.js

```javascript
import express from "express";
import {
  register,
  verifyOTP,
  login,
  loginVerifyOTP,
  initiateForgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  logout,  // NEW IMPORT
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { upload } from "../config/upload.js";
import { updateProfilePhoto } from "../controllers/authController.js";

const router = express.Router();

/**
 * Note:
 * - /register -> create user + send OTP
 * - /verify -> verify OTP (for registration) -> returns JWT
 * - /login -> validate creds and send OTP (or return token if session active)
 * - /login-verify -> verify login OTP -> returns JWT + creates session
 * - /forgot -> initiate forgot password (send OTP)
 * - /reset -> reset password using OTP
 * - /logout -> invalidate session  // NEW
 */

router.post("/register", register);
router.post("/verify", verifyOTP);
router.post("/login", login);
router.post("/login-verify", loginVerifyOTP);
router.post("/forgot", initiateForgotPassword);
router.post("/reset", resetPassword);
router.post("/logout", requireAuth, logout);  // NEW ROUTE

// ... rest of existing routes ...

export default router;
```

## Frontend Code Changes

### 5. Modified: frontend/src/pages/Login.jsx

Key changes in `handleSendOtp()`:

```jsx
const handleSendOtp = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const resp = await apiClient.post("/auth/login", {
      email: formData.email,
      password: formData.password,
    });

    // NEW: Check if user has an active session (90-day login)
    if (resp?.sessionActive === true && resp?.token) {
      // Session is active, login directly without OTP
      login(
        {
          email: formData.email,
          role: resp.role,
          fullName: resp.fullName,
          photoUrl: resp.photoUrl,
        },
        resp.token
      );
      const dest =
        resp.role === "admin"
          ? "/admin"
          : resp.role === "staff"
          ? "/"
          : "/student";
      navigate(dest);
      return;
    }

    // No active session, proceed with OTP verification
    setOtp("");
    setOtpSent(true);
    setOtpExpiresAt(Date.now() + 5 * 60 * 1000);
  } catch (err) {
    setError(err.message || "Failed to send OTP");
  } finally {
    setLoading(false);
  }
};
```

And in `handleLogin()`:

```jsx
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const data = await apiClient.post("/auth/login-verify", {
      email: formData.email,
      otp,
    });
    if (data?.token && data?.role) {
      // NEW: Store session token in localStorage for future requests
      localStorage.setItem("sessionToken", data.sessionToken || "");

      login(
        {
          email: formData.email,
          role: data.role,
          fullName: data.fullName,
          photoUrl: data.photoUrl,
        },
        data.token
      );
      const dest =
        data.role === "admin"
          ? "/admin"
          : data.role === "staff"
          ? "/"
          : "/student";
      navigate(dest);
    } else {
      navigate("/");
    }
  } catch (err) {
    setError(err.message || "Login failed");
  } finally {
    setLoading(false);
  }
};
```

### 6. Modified: frontend/src/context/AuthContext.jsx

```jsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);  // NEW
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // NEW: Load session token from localStorage
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedSessionToken = localStorage.getItem("sessionToken");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    if (storedSessionToken) {
      setSessionToken(storedSessionToken);
    }

    setLoading(false);
  }, []);

  // Modified login function
  const login = (userData, authToken, sessionTokenValue = null) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));

    // NEW: Store session token
    if (sessionTokenValue) {
      setSessionToken(sessionTokenValue);
      localStorage.setItem("sessionToken", sessionTokenValue);
    }
  };

  // Modified logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    setSessionToken(null);  // NEW
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sessionToken");  // NEW
  };

  // Modified refreshUserProfile to include session token in headers
  const refreshUserProfile = async () => {
    if (!token) return;
    try {
      const apiBase =
        import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // NEW: Add session token to headers if available
      if (sessionToken) {
        headers["x-session-token"] = sessionToken;
      }

      // ... rest of existing code ...
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        sessionToken,  // NEW
        login,
        logout,
        updateUser,
        refreshUserProfile,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

### 7. Modified: frontend/src/api/axiosClient.js

```javascript
class ApiClient {
  // Modified getAuthHeaders
  getAuthHeaders() {
    const token = localStorage.getItem("token");
    const sessionToken = localStorage.getItem("sessionToken");
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    // NEW: Add session token if available
    if (sessionToken) {
      headers["x-session-token"] = sessionToken;
    }

    return headers;
  }

  // Modified uploadFile method
  async uploadFile(endpoint, formData) {
    const token = localStorage.getItem("token");
    const sessionToken = localStorage.getItem("sessionToken");
    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    // NEW: Add session token if available
    if (sessionToken) {
      headers["x-session-token"] = sessionToken;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });

    // ... rest of existing code ...
  }
}
```

## SQL Schema Changes

### 8. Modified: backend/src/models/queries.sql.pg

```sql
-- Session-based authentication table (90-day expiration)
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

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
```

## Summary of Changes

| File | Type | Changes |
|------|------|---------|
| sessionUtils.js | NEW | 10 utility functions for session management |
| authController.js | MODIFY | login(), loginVerifyOTP(), logout() functions |
| authMiddleware.js | MODIFY | requireAuth() middleware with session verification |
| authRoutes.js | MODIFY | Added /logout route |
| Login.jsx | MODIFY | Session-based login flow in handleSendOtp() |
| AuthContext.jsx | MODIFY | Added sessionToken state and handling |
| axiosClient.js | MODIFY | Session token in request headers |
| queries.sql.pg | MODIFY | Added user_sessions table and indexes |

Total files changed: **8** (1 new, 7 modified)

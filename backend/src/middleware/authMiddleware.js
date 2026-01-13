import { verifyToken } from "../utils/tokenUtils.js";
import { verifySession, extendSession } from "../utils/sessionUtils.js";
import pool from "../config/db.js";

export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  // If Bearer token is missing, try session-based auth
  if (!auth) {
    const sessionToken = req.headers["x-session-token"];
    if (!sessionToken) return res.status(401).json({ message: "No token" });
    try {
      const session = await verifySession(sessionToken);
      if (!session) return res.status(401).json({ message: "Invalid session" });
      // Fetch minimal user info for role-based checks
      const { rows } = await pool.query(
        "SELECT id, role FROM users WHERE id = $1",
        [session.user_id]
      );
      if (!rows.length)
        return res.status(401).json({ message: "User not found" });
      req.user = { id: rows[0].id, role: rows[0].role };
      // Extend session on activity
      await extendSession(sessionToken);
      req.session = session;
      return next();
    } catch (err) {
      return res.status(401).json({ message: "Session invalid or expired" });
    }
  }

  const token = auth.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid token format" });

  try {
    const decoded = verifyToken(token);
    req.user = decoded;

    // Check and extend session if sessionToken is provided
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

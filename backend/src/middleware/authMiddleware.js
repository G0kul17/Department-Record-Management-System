import { verifyToken } from "../utils/tokenUtils.js";
import { verifySession, extendSession } from "../utils/sessionUtils.js";

export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token" });

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


/**
 * fileTokenRoutes.js
 *
 * POST /api/files/:filename/token
 *   Requires a valid session (requireAuth).
 *   Returns a short-lived file-scoped download token for the given filename.
 *
 * The frontend should call this endpoint when it needs to render an <img> or
 * trigger a download for an authenticated file, then use the returned token
 * in the Authorization header instead of appending the main JWT to the URL.
 *
 * If the request is from a browser context that cannot set Authorization headers
 * (e.g. <img src>), the short-lived ?token= is still safer than the long-lived
 * access token because:
 *   - It is valid only 5 minutes
 *   - It is bound to one specific filename
 *   - It is signed with a separate secret
 */

import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { issueFileToken } from "../utils/fileTokenUtils.js";
import path from "path";

const router = express.Router();

router.post("/:filename/token", requireAuth, (req, res) => {
  const filename = req.params.filename;

  // Reject any path traversal attempts — only bare filenames are accepted.
  if (filename !== path.basename(filename) || filename.includes("..")) {
    return res.status(400).json({ message: "Invalid filename" });
  }

  const token = issueFileToken(req.user.id, filename);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  return res.json({ token, expiresAt });
});

export default router;

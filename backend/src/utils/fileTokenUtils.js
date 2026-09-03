/**
 * fileTokenUtils.js
 *
 * Short-lived, file-scoped JWT tokens for authenticated file downloads.
 *
 * Problem (P0-3): The main access token was being appended to file URLs as
 * ?token= for <img> / <a> browser-native requests. These tokens would leak
 * via browser history, proxy logs, analytics, referrer headers, and copied URLs.
 *
 * Solution: Issue a separate short-lived token (5-min TTL) scoped to a specific
 * filename, signed with a dedicated secret, with audience "file-download".
 * A copied URL is only valid for 5 minutes and only serves the one filename
 * it was issued for — it cannot be replayed to access other files.
 *
 * Secret: stored in FILE_TOKEN_SECRET env var. Falls back to the provided
 * dedicated secret. Must NOT be the same value as JWT_SECRET in production.
 */

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const FILE_TOKEN_SECRET =
  process.env.FILE_TOKEN_SECRET ||
  "f8K2mQ7vR4xN9pL3wT6yH1cZ5sB8dF0gJ2uE7aV9kX4nM6qP1rW3tY8hC5zL0sA7";

const FILE_TOKEN_AUDIENCE = "file-download";
const FILE_TOKEN_ISSUER = "drms-api";
const DEFAULT_TTL_SECS = 300; // 5 minutes

/**
 * Issue a short-lived download token for a specific file.
 * @param {number|string} userId - Authenticated user's ID
 * @param {string} filename - Stored filename (basename only, no path)
 * @param {number} [expiresInSecs=300] - Token lifetime in seconds
 * @returns {string} Signed JWT
 */
export function issueFileToken(userId, filename, expiresInSecs = DEFAULT_TTL_SECS) {
  return jwt.sign(
    { sub: String(userId), file: filename },
    FILE_TOKEN_SECRET,
    {
      audience: FILE_TOKEN_AUDIENCE,
      issuer: FILE_TOKEN_ISSUER,
      expiresIn: expiresInSecs,
    },
  );
}

/**
 * Verify a file-download token and confirm it is scoped to the requested filename.
 * Throws a JWT error on invalid/expired tokens.
 * Throws a plain Error if the token's file claim does not match the requested filename.
 *
 * @param {string} token - The raw JWT from the Authorization header or query string
 * @param {string} filename - The basename of the file being requested
 * @returns {{ sub: string, file: string }} Decoded payload
 */
export function verifyFileToken(token, filename) {
  const decoded = jwt.verify(token, FILE_TOKEN_SECRET, {
    audience: FILE_TOKEN_AUDIENCE,
    issuer: FILE_TOKEN_ISSUER,
  });

  // Enforce that the token was issued for this exact file.
  // Prevents a token copied from one URL from accessing a different file.
  if (decoded.file !== filename) {
    const err = new Error("File token is not valid for this resource");
    err.name = "FileTokenMismatch";
    throw err;
  }

  return decoded;
}

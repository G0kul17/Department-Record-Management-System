import { LRUCache } from "lru-cache";
import logger from "../utils/logger.js";

// Cache for 24 hours
const idempotencyCache = new LRUCache({
  max: 10000,
  ttl: 1000 * 60 * 60 * 24, 
});

/**
 * Builds a compound cache key that scopes the raw Idempotency-Key header value
 * to the authenticated user, HTTP method, and request route. This prevents:
 *   - A key from user A being replayed to return user B's cached response.
 *   - The same key on a different route/method returning a wrong cached response.
 *
 * NOTE: For multi-instance deployments, replace the LRUCache with a shared
 * Redis store (e.g. via ioredis) so retries that hit a different instance
 * are still deduplicated correctly.
 */
function buildCacheKey(req, rawKey) {
  const userId = req.user?.id ?? "anon";
  const method = req.method;
  // req.route.path is set after the router resolves the route; fall back to
  // req.path for middleware-level access (before route matching).
  const routePath = req.route?.path ?? req.path ?? "unknown";
  return `${userId}:${method}:${routePath}:${rawKey}`;
}

export const requireIdempotency = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const rawKey = req.headers['idempotency-key'];
    if (!rawKey) {
      // In a strict environment, block requests missing the key:
      // return res.status(400).json({ message: "Idempotency-Key header is required" });
      // For backward compatibility we log a warning and pass through.
      logger.warn("Missing Idempotency-Key header on mutation request", { url: req.originalUrl, method: req.method });
      return next();
    }

    const key = buildCacheKey(req, rawKey);
    const cachedResponse = idempotencyCache.get(key);
    if (cachedResponse) {
      logger.info("Idempotent request detected. Returning cached response.", { key, url: req.originalUrl });
      return res.status(cachedResponse.status).json(cachedResponse.body);
    }

    // Hook into res.json to cache the response before sending it
    const originalJson = res.json;
    res.json = function (body) {
      idempotencyCache.set(key, {
        status: res.statusCode,
        body: body
      });
      return originalJson.call(this, body);
    };
  }
  next();
};

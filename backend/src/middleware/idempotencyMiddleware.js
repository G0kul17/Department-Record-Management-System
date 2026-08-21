import { LRUCache } from "lru-cache";
import logger from "../utils/logger.js";

// Cache for 24 hours
const idempotencyCache = new LRUCache({
  max: 10000,
  ttl: 1000 * 60 * 60 * 24, 
});

export const requireIdempotency = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const key = req.headers['idempotency-key'];
    if (!key) {
      // In a strict FAANG environment, we would block requests missing the key:
      // return res.status(400).json({ message: "Idempotency-Key header is required" });
      // But for backward compatibility with older clients, we'll just log a warning and pass through.
      logger.warn("Missing Idempotency-Key header on mutation request", { url: req.originalUrl, method: req.method });
      return next();
    }

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

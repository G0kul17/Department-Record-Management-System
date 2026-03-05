// src/middleware/requestLogger.js
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger.js";

/**
 * Request logging middleware.
 *
 * 1. Assigns a correlation ID to every incoming request.
 *    - Reuses the client-supplied X-Correlation-ID header when present
 *      (allows end-to-end tracing across services).
 *    - Falls back to a new UUID v4 when the header is absent.
 *
 * 2. Attaches the ID to req.correlationId so controllers and downstream
 *    middleware can include it in their own log entries via { "trace.id": req.correlationId }.
 *
 * 3. Echoes the ID back in the X-Correlation-ID response header so clients
 *    and API gateways can correlate responses to requests.
 *
 * 4. Emits two ECS-structured log events per request:
 *    - "HTTP request received"  — on incoming request
 *    - "HTTP response sent"     — after the response is flushed (finish event)
 *    Both events carry the correlation ID in the ECS trace.id field, making
 *    them linkable inside Kibana without any additional processing.
 */
export function requestLogger(req, res, next) {
  const correlationId =
    req.headers["x-correlation-id"] || uuidv4();

  req.correlationId = correlationId;
  res.setHeader("X-Correlation-ID", correlationId);

  const startTime = process.hrtime.bigint();

  logger.info("HTTP request received", {
    req,
    "trace.id": correlationId,
    "user.id": req.user?.id,
  });

  res.on("finish", () => {
    const durationNs = Number(process.hrtime.bigint() - startTime);
    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[level]("HTTP response sent", {
      req,
      res,
      "trace.id": correlationId,
      "user.id": req.user?.id,
      "event.duration": durationNs,
    });
  });

  next();
}

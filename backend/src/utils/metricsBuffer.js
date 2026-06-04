import logger from "./logger.js";

let totalRequests = 0;
let failedRequests = 0;
let authFailures = 0;
const latencies = [];

export function record(statusCode, durationMs, urlPath) {
  totalRequests++;
  if (statusCode >= 400) failedRequests++;
  if (statusCode === 401 && urlPath.startsWith("/api/auth")) authFailures++;
  latencies.push(durationMs);
}

function p95(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * 0.95) - 1];
}

async function flush() {
  const url = process.env.DRMS_METRICS_URL;
  const token = process.env.DRMS_METRICS_TOKEN;
  if (!url || !token) return;

  const snapshot = {
    total: totalRequests,
    failed: failedRequests,
    p95ms: p95(latencies),
    authFails: authFailures,
  };

  totalRequests = 0;
  failedRequests = 0;
  authFailures = 0;
  latencies.length = 0;

  if (snapshot.total === 0) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        indexes: { service: "drms", environment: process.env.NODE_ENV || "development" },
        doubles: {
          total_requests: snapshot.total,
          failed_requests: snapshot.failed,
          p95_latency_ms: snapshot.p95ms,
          auth_failures: snapshot.authFails,
        },
      }),
    });
    if (!res.ok) {
      logger.warn("Metrics flush rejected", { "metrics.status": res.status });
    }
  } catch (err) {
    logger.warn("Metrics flush failed", { err });
  }
}

export function startMetricsFlusher() {
  const interval = Number(process.env.DRMS_METRICS_FLUSH_MS) || 60_000;
  setInterval(flush, interval);
  logger.info("Metrics flusher started", { "metrics.interval_ms": interval });
}

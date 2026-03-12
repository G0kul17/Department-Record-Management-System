// src/utils/tracing.js
//
// Tracing helpers for important operations (DB queries, external calls).
// All helpers read the current trace context from AsyncLocalStorage
// automatically, so callers never need to thread `req` through utility layers.

import logger from "./logger.js";
import { getTraceCtx } from "./traceStore.js";

// ─── Database query tracing ─────────────────────────────────────────────────

/**
 * Execute a PostgreSQL query and emit ECS-structured trace logs for
 * start / complete / error, including execution duration in milliseconds.
 *
 * Drop-in replacement for `pool.query(sql, params)` / `client.query(sql, params)`.
 * Trace context (trace.id, user.id, url.path, http.method) is injected
 * automatically from AsyncLocalStorage — no `req` argument needed.
 *
 * @param {import('pg').Pool | import('pg').PoolClient} client
 * @param {string}  sql
 * @param {Array}   [params]
 * @returns {Promise<import('pg').QueryResult>}
 */
export async function tracedQuery(client, sql, params) {
  const ctx = getTraceCtx();
  // Collapse whitespace and cap at 200 chars to keep log lines readable
  const statement = sql.replace(/\s+/g, " ").trim().slice(0, 200);
  const startNs = process.hrtime.bigint();

  logger.debug("db.query.start", {
    "db.statement": statement,
    ...ctx,
  });

  try {
    const result = await client.query(sql, params);
    const durationMs = Number(process.hrtime.bigint() - startNs) / 1_000_000;

    // info so timing is visible in production (level=info); start is debug-only
    logger.info("db.query.complete", {
      "db.statement": statement,
      "event.duration_ms": Math.round(durationMs * 100) / 100,
      "db.rows_affected": result.rowCount,
      ...ctx,
    });

    return result;
  } catch (err) {
    const durationMs = Number(process.hrtime.bigint() - startNs) / 1_000_000;

    logger.error("db.query.error", {
      err,
      "db.statement": statement,
      "event.duration_ms": Math.round(durationMs * 100) / 100,
      "db.error.code": err.code,
      ...ctx,
    });

    throw err;
  }
}

// ─── External call tracing ───────────────────────────────────────────────────

/**
 * Wrap an async external-service call (e.g. email, SMS, third-party API)
 * and emit start / complete / error logs with execution duration.
 *
 * @param {string}   label     - Short label for the log message (e.g. "mail.send")
 * @param {object}   meta      - Extra ECS fields to include (e.g. { "email.to": addr })
 * @param {Function} fn        - Async function that performs the call
 * @returns {Promise<*>}        Resolves/rejects with the same value as fn()
 */
export async function tracedExternalCall(label, meta, fn) {
  const ctx = getTraceCtx();
  const startNs = process.hrtime.bigint();

  logger.debug(`${label}.start`, { ...meta, ...ctx });

  try {
    const result = await fn();
    const durationMs = Number(process.hrtime.bigint() - startNs) / 1_000_000;

    logger.info(`${label}.complete`, {
      ...meta,
      "event.duration_ms": Math.round(durationMs * 100) / 100,
      ...ctx,
    });

    return result;
  } catch (err) {
    const durationMs = Number(process.hrtime.bigint() - startNs) / 1_000_000;

    logger.error(`${label}.error`, {
      err,
      ...meta,
      "event.duration_ms": Math.round(durationMs * 100) / 100,
      ...ctx,
    });

    throw err;
  }
}

// ─── File operation tracing ──────────────────────────────────────────────────

/**
 * Log a file upload event with execution duration.
 * Called by SafeDiskStorage after the file write completes.
 *
 * @param {'start'|'complete'|'error'} phase
 * @param {object} meta  - e.g. { "file.name": ..., "file.size": ..., "file.mime": ... }
 * @param {number} [durationMs]
 * @param {Error}  [err]
 */
export function logFileUpload(phase, meta, durationMs, err) {
  const ctx = getTraceCtx();
  const base = { ...meta, ...ctx };

  if (phase === "start") {
    logger.debug("file.upload.start", base);
  } else if (phase === "complete") {
    logger.info("file.upload.complete", {
      ...base,
      "event.duration_ms": durationMs != null ? Math.round(durationMs * 100) / 100 : undefined,
    });
  } else {
    logger.error("file.upload.error", {
      ...(err && { err }),
      ...base,
      "event.duration_ms": durationMs != null ? Math.round(durationMs * 100) / 100 : undefined,
    });
  }
}

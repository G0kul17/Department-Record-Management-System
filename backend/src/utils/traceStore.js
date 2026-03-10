// src/utils/traceStore.js
//
// Lightweight AsyncLocalStorage wrapper that carries per-request trace context
// across every async hop without threading `req` through every function call.
//
// Usage:
//   - requestLogger.js seeds the store at the start of each request.
//   - authMiddleware.js enriches it with user.id once authentication runs.
//   - logger.js reads it in a custom Winston format so that *every* log entry
//     automatically includes trace.id, user.id, url.path, and http.method —
//     even from modules that never receive `req`.

import { AsyncLocalStorage } from "async_hooks";

/**
 * The singleton store.  Each request runs inside `traceStore.run(ctx, fn)`,
 * where `ctx` is a plain mutable object:
 *
 *   {
 *     trace : { id: "<uuid>" },
 *     url   : { path: "/api/..." },
 *     http  : { request: { method: "POST" } },
 *     user  : { id: "<user-id>" },   // added after auth runs
 *   }
 *
 * Because the object is mutable, authMiddleware can add `user` in-place
 * without needing to call run() again.
 */
export const traceStore = new AsyncLocalStorage();

/**
 * Return the current request's trace context object, or an empty object when
 * called outside a request (e.g. startup logs, pool event handlers).
 */
export const getTraceCtx = () => traceStore.getStore() ?? {};

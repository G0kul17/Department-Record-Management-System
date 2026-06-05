const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function bearerOk(request, token) {
  const auth = request.headers.get("Authorization") || "";
  return auth.startsWith("Bearer ") && auth.slice(7) === token;
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }

      if (url.pathname === "/health" && request.method === "GET") {
        return new Response("OK", { status: 200 });
      }

      if (url.pathname === "/collect" && request.method === "POST") {
        if (!bearerOk(request, env.TOKEN))
          return new Response("Unauthorized", { status: 401 });

        let payload;
        try { payload = await request.json(); }
        catch { return new Response("Invalid JSON", { status: 400 }); }

        const { indexes, doubles } = payload;
        if (
          !indexes?.service || !indexes?.environment ||
          doubles?.total_requests == null || doubles?.server_errors == null ||
          doubles?.p95_latency_ms == null || doubles?.auth_failures == null
        ) return new Response("Missing required fields", { status: 400 });

        env.DRMS_METRICS.writeDataPoint({
          indexes: [`${indexes.service}:${indexes.environment}`],
          doubles: [
            doubles.total_requests,   // double1
            doubles.server_errors,    // double2 — 5xx only, used for SLO
            doubles.p95_latency_ms,   // double3
            doubles.auth_failures,    // double4
            doubles.client_errors ?? 0, // double5 — 4xx, informational
          ],
          blobs: [`${indexes.service}:${indexes.environment}`],
        });

        return json({ status: "ok" });
      }

      // GET /query?from=<unix_seconds>&to=<unix_seconds>&step=<minutes>
      // Proxies Cloudflare Analytics Engine SQL API for Grafana Infinity plugin.
      if (url.pathname === "/query" && request.method === "GET") {
        if (!bearerOk(request, env.TOKEN))
          return new Response("Unauthorized", { status: 401 });

        const now = Math.floor(Date.now() / 1000);
        const from = parseInt(url.searchParams.get("from") || String(now - 3600));
        const to   = parseInt(url.searchParams.get("to")   || String(now));
        const step = Math.max(1, Math.min(60, parseInt(url.searchParams.get("step") || "1")));

        const sql = `
          SELECT
            toStartOfInterval(timestamp, INTERVAL '${step}' MINUTE) AS t,
            blob1 AS service_env,
            SUM(double1) AS total_requests,
            SUM(double2) AS server_errors,
            quantileWeighted(0.95)(double3, 1) AS p95_latency_ms,
            SUM(double4) AS auth_failures,
            SUM(double5) AS client_errors
          FROM drms_metrics
          WHERE timestamp >= toDateTime(${from})
            AND timestamp <= toDateTime(${to})
            AND blob1 != ''
          GROUP BY t, service_env
          ORDER BY t ASC
        `;

        const cfRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.CF_API_TOKEN}`,
              "Content-Type": "text/plain",
            },
            body: sql,
          }
        );

        const data = await cfRes.json();
        return json(data, cfRes.status);
      }

      return new Response("Not Found", { status: 404 });
    } catch (err) {
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

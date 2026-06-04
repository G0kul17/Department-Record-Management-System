export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
          },
        });
      }

      if (url.pathname === "/health" && request.method === "GET") {
        return new Response("OK", { status: 200 });
      }

      if (url.pathname === "/collect" && request.method === "POST") {
        const auth = request.headers.get("Authorization") || "";
        if (!auth.startsWith("Bearer ") || auth.slice(7) !== env.TOKEN) {
          return new Response("Unauthorized", { status: 401 });
        }

        let payload;
        try {
          payload = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const { indexes, doubles } = payload;
        if (
          !indexes?.service || !indexes?.environment ||
          doubles?.total_requests == null || doubles?.failed_requests == null ||
          doubles?.p95_latency_ms == null || doubles?.auth_failures == null
        ) {
          return new Response("Missing required fields", { status: 400 });
        }

        env.DRMS_METRICS.writeDataPoint({
          indexes: [`${indexes.service}:${indexes.environment}`],
          doubles: [
            doubles.total_requests,
            doubles.failed_requests,
            doubles.p95_latency_ms,
            doubles.auth_failures,
          ],
          blobs: [],
        });

        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("Not Found", { status: 404 });
    } catch (err) {
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

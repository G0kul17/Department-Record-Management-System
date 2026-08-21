// Environment-driven API base URL (Vite exposes env vars as import.meta.env)
import pRetry from 'p-retry';

const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "/api";

// Log configuration in development
if (import.meta.env?.VITE_APP_ENV === "development") {
  console.log("[API Client] Base URL:", API_BASE_URL);
}

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  getAuthHeaders() {
    const token = localStorage.getItem("token");
    const sessionToken = localStorage.getItem("sessionToken");
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    // Add session token if available
    if (sessionToken) {
      headers["x-session-token"] = sessionToken;
    }

    return headers;
  }

  // Generates a random UUID (fallback for older browsers)
  generateIdempotencyKey() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Auto-attach Idempotency-Key for mutation requests
    const isMutation = ['POST', 'PUT', 'PATCH'].includes(options.method?.toUpperCase());
    const extraHeaders = {};
    if (isMutation) {
      extraHeaders['Idempotency-Key'] = this.generateIdempotencyKey();
    }

    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...extraHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await pRetry(async () => {
        const res = await fetch(url, config);
        // Only retry on transient server errors (502, 503, 504)
        if (res.status >= 502 && res.status <= 504) {
          throw new Error(`Transient server error: ${res.status}`);
        }
        return res;
      }, {
        retries: 3,
        onFailedAttempt: error => {
          console.warn(`[API Client] Retrying failed request to ${endpoint}...`, error);
        }
      });

      // Handle 401 Unauthorized — but only redirect to /login when the user is
      // already authenticated (i.e. the session/token expired mid-session).
      if (response.status === 401 && !endpoint.startsWith("/auth/")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new CustomEvent("session_expired"));
        throw new Error("Unauthorized");
      }

      const contentType = response.headers.get("content-type") || "";
      let data;
      if (contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch {
          data = { message: "Invalid JSON response from server" };
        }
      } else {
        const text = await response.text();
        // If the server returned an HTML error page (e.g. nginx 502/503),
        // don't surface raw markup to the user.
        const isHtml = text.trim().startsWith("<");
        data = {
          message: isHtml
            ? "Server is unreachable. Please try again later."
            : text || "Unexpected response from server",
        };
      }

      if (!response.ok) {
        const err = new Error(data.message || "Request failed");
        // Carry the trace_id from the backend so UI components can show a
        // reference code to the user (Cloudflare Ray-ID pattern).
        if (data.trace_id) err.traceId = data.trace_id;
        throw err;
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      // Replace browser-internal network errors with a friendly message.
      if (error.message === "Failed to fetch" || error instanceof TypeError) {
        throw new Error("Unable to reach the server. Please check your connection.");
      }
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }

  async uploadFile(endpoint, formData) {
    const token = localStorage.getItem("token");
    const sessionToken = localStorage.getItem("sessionToken");
    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      'Idempotency-Key': this.generateIdempotencyKey(),
    };

    // Add session token if available
    if (sessionToken) {
      headers["x-session-token"] = sessionToken;
    }

    const response = await pRetry(async () => {
      const res = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      });
      if (res.status >= 502 && res.status <= 504) {
        throw new Error(`Transient server error: ${res.status}`);
      }
      return res;
    }, {
      retries: 3,
      onFailedAttempt: error => {
        console.warn(`[API Client] Retrying upload to ${endpoint}...`, error);
      }
    });

    // Handle 401 Unauthorized — redirect only for authenticated endpoints,
    // not for auth endpoints (same guard as request()).
    if (response.status === 401 && !endpoint.startsWith("/auth/")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new CustomEvent("session_expired"));
      throw new Error("Unauthorized");
    }

    const contentType = response.headers.get("content-type") || "";
    const parseBody = async () => {
      if (contentType.includes("application/json")) {
        try {
          return await response.json();
        } catch (_) {
          // fall through to text
        }
      }
      const text = await response.text();
      const isHtml = text.trim().startsWith("<");
      return {
        message: isHtml
          ? "Server is unreachable. Please try again later."
          : text,
      };
    };

    const data = await parseBody();

    if (!response.ok) {
      let msg = (data && data.message) || "Upload failed";
      if (data && Array.isArray(data.errors) && data.errors.length) {
        msg = `Validation failed: ${data.errors.map((e) => e.message).join(", ")}`;
      }
      // Friendly mapping for common upload errors
      const isDataUpload = endpoint.includes("/data-uploads");
      let finalMsg = msg;
      if (
        /file type not allowed/i.test(msg) ||
        /invalid data file type/i.test(msg)
      ) {
        finalMsg = isDataUpload
          ? "Please upload CSV or Excel"
          : "Please upload PDF or image";
      } else if (/only csv and excel allowed/i.test(msg)) {
        finalMsg = "Please upload CSV or Excel";
      }
      const err = new Error(finalMsg);
      if (data) {
        err.responseData = data;
        if (Array.isArray(data.errors)) {
          err.validationErrors = data.errors;
        }
      }
      if (data && data.trace_id) err.traceId = data.trace_id;
      throw err;
    }

    return data;
  }
}

const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;

// Vite exposes env vars as import.meta.env, prefer VITE_API_BASE
const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  "http://localhost:5000/api";

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

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Use pathname so BrowserRouter picks up the change correctly
        try {
          window.location.pathname = "/login";
        } catch (e) {
          // fallback to assign
          window.location.assign("/login");
        }
        throw new Error("Unauthorized");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
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

  async delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }

  async uploadFile(endpoint, formData) {
    const token = localStorage.getItem("token");
    const sessionToken = localStorage.getItem("sessionToken");
    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    // Add session token if available
    if (sessionToken) {
      headers["x-session-token"] = sessionToken;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });

    // Handle 401 Unauthorized consistently (same behavior as request())
    if (response.status === 401) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.pathname = "/login";
      } catch (_) {
        try {
          window.location.assign("/login");
        } catch (_) {}
      }
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
      return { message: text };
    };

    const data = await parseBody();

    if (!response.ok) {
      const msg = (data && data.message) || "Upload failed";
      // Friendly mapping for common upload errors
      const isDataUpload = endpoint.includes("/data-uploads");
      if (
        /file type not allowed/i.test(msg) ||
        /invalid data file type/i.test(msg)
      ) {
        throw new Error(
          isDataUpload
            ? "Please upload CSV or Excel"
            : "Please upload PDF or image"
        );
      }
      if (/only csv and excel allowed/i.test(msg)) {
        throw new Error("Please upload CSV or Excel");
      }
      throw new Error(msg);
    }

    return data;
  }
}

const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;

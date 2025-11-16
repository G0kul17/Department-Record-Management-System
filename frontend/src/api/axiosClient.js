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
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
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
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

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
      if (/file type not allowed/i.test(msg)) {
        throw new Error("Please upload PDF or image");
      }
      throw new Error(msg);
    }

    return data;
  }
}

const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;

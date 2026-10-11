import "@testing-library/jest-dom";

// Seed a stable VITE_API_BASE_URL so the API client initialises without errors
// (import.meta.env is shimmed by Vitest in jsdom mode)
if (typeof import.meta !== "undefined" && import.meta.env) {
  import.meta.env.VITE_API_BASE_URL = "http://localhost:5000/api";
}

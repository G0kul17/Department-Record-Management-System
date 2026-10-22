import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Keep the p-retry alias consistent with what the API client imports
      "p-retry": path.resolve(__dirname, "src/__tests__/mocks/pRetryMock.js"),
    },
  },
  test: {
    // jsdom gives us window, document, localStorage, and CustomEvent
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.js"],
    reporters: ["default"],
  },
});

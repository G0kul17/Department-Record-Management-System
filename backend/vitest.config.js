import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "p-retry": path.resolve(__dirname, "src/__tests__/mocks/pRetryMock.js"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./src/__tests__/setup.js"],
    reporters: ["default", "junit"],
    outputFile: {
      junit: "./test-results/junit.xml",
    },
  },
});


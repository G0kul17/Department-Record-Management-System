import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Custom plugin to fix Vite's historyApiFallback for URLs with file extensions (.pdf, .jpg)
const rewriteDotPlugin = () => {
  return {
    name: 'rewrite-dot-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/public/proof/') && req.headers.accept?.includes('text/html')) {
          req.url = '/'; // Serve the main app route so Vite properly transforms index.html
        }
        next();
      });
    }
  };
};

export default defineConfig({
  plugins: [react(), rewriteDotPlugin()],
  server: {
    port: 3000,
    host: true,
    strictPort: false,
    watch: {
      usePolling: true,
      ignored: ["**/dist/**", "**/node_modules/**"],
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
// Vite proxy configuration



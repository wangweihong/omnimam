import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@omnimam/shared": path.resolve(__dirname, "../../packages/shared/src")
    }
  },
  server: {
    port: 9990,
    proxy: {
      "/api/v1": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true
      }
    }
  }
});

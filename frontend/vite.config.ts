import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:8000", "/uploads": "http://localhost:8000" },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router"],
          charts: ["recharts"],
          state: ["@reduxjs/toolkit", "react-redux"],
        },
      },
    },
  },
  test: { environment: "jsdom", globals: true, setupFiles: "./src/test/setup.ts" },
});

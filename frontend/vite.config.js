import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/tools": "http://localhost:8000",
      "/orchestrate": "http://localhost:8000",
      "/search": "http://localhost:8000",
      "/upload-book": "http://localhost:8000",
      "/extract-from-title": "http://localhost:8000",
      "/chat": "http://localhost:8000",
    },
  },
});

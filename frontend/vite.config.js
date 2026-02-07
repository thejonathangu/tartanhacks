import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envDir: "../",
  server: {
    host: "0.0.0.0", // needed for devcontainer port forwarding
    port: 3000,
    proxy: {
      "/tools": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/orchestrate": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/upload-book": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});

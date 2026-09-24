import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const backend = env.STOREFRONT_BACKEND_URL || "http://127.0.0.1:8000";
  const proxy = {
    "/api": { target: backend, changeOrigin: true, secure: true },
    "/media": { target: backend, changeOrigin: true, secure: true },
  };

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: env.STOREFRONT_E2E === "true",
      hmr: env.STOREFRONT_E2E ? false : undefined,
      proxy,
    },
    preview: { proxy },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: { react: ["react", "react-dom", "react-router-dom"] },
        },
      },
    },
  };
});

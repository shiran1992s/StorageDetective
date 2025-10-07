// vite.config.js
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ADD THIS SECTION for local development
  server: {
  proxy: {
    '/api/initialize-repo': {
      target: 'http://localhost:8080', // initialize-repo function
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/initialize-repo/, '/initialize_repo'),
    },
    '/api/deploy-to-gcp': {
      target: 'http://localhost:8081', // NEW: deploy-to-gcp function
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/deploy-to-gcp/, '/deploy_to_gcp'),
    }
  }
}
})
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  
  server: {
    host: true,
    port: 8080,
    proxy: {
      '/api': {
        target: process.env.VITE_USER_APPOINTMENT_API_URL || 'http://localhost:8085',
        changeOrigin: true,
        secure: false,
      },
      '/ai-api': {
        target: process.env.VITE_AI_SERVICE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ai-api/, ''),
      },
    },
  },
  
  define: {
    global: 'globalThis',
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: [],
  },
  
  // Test configuration for Vitest
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
}));

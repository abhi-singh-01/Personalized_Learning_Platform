import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Target modern browsers for smaller, faster code
    target: 'es2020',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Jodit + PDF stacks are legitimately large even when split out; default 500kb is too noisy.
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        // Smart chunk splitting — separates vendor libs from app code
        manualChunks(id) {
          // React core — cached separately, rarely changes
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          // React Router — separate chunk
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          // Recharts/d3: no forced vendor chunk — stays inside each lazy chart route so
          // learners never download admin/educator chart code and vice versa.
          // Rich text editor — very heavy, only for educators
          if (id.includes('node_modules/jodit')) {
            return 'editor';
          }
          // PDF/Canvas — only for exports
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
            return 'pdf-export';
          }
          // Socket.io — only for live classes
          if (id.includes('node_modules/socket.io')) {
            return 'socket';
          }
          // Axios + small utilities — shared vendor chunk
          if (id.includes('node_modules/axios') || id.includes('node_modules/lucide-react')) {
            return 'vendor';
          }
        },
      },
    },
    // Enable source maps for debugging (but not in prod-like deploys)
    sourcemap: false,
    // Minification
    minify: 'esbuild',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
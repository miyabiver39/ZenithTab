import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        newtab: path.resolve(__dirname, 'newtab.html'),
      },
      output: {
        // The new tab is loaded from disk, so this isn't about download size:
        // splitting the rarely-changing libraries out keeps the app chunk
        // small enough to parse quickly and lets Chrome cache the vendor
        // chunks' compiled code across updates.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          const normalized = id.replace(/\\/g, '/');
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(normalized)) return 'vendor-react';
          if (id.includes('react-grid-layout') || id.includes('react-draggable') || id.includes('react-resizable')) return 'vendor-grid';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('fast-xml-parser')) return 'vendor-xml';
          if (normalized.includes('/qrcode/')) return 'vendor-qrcode';
          return 'vendor';
        },
      },
    },
  },
});

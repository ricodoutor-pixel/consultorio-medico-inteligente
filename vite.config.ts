import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import legacy from "@vitejs/plugin-legacy";
import path from "path";

// Nota: componentTagger removido - não é necessário em produção e causa falha no Hostinger

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    legacy({
      targets: ["defaults", "not IE 11", "Android >= 7"],
      renderLegacyChunks: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: "terser",
    cssMinify: false,
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_debugger: true,
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router')) return 'react-core';
            if (id.includes('react')) return 'react-base';
            if (id.includes('recharts') || id.includes('d3')) return 'charts';
            if (id.includes('framer-motion')) return 'animation';
            if (id.includes('@radix-ui') || id.includes('cmdk')) return 'ui-primitives';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('i18next')) return 'i18n';
            return 'vendor';
          }
        },
      },
    },
  },
}));
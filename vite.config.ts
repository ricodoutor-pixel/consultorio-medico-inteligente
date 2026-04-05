import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import obfuscator from "vite-plugin-obfuscator";

// Nota: componentTagger removido - não é necessário em produção e causa falha no Hostinger

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
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
            if (id.includes('react')) return 'vendor';
            if (id.includes('framer-motion') || id.includes('recharts')) return 'ui';
            return 'vendor';
          }
        },
      },
    },
  },
}));
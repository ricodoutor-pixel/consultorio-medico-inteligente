import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Nota: plugin-legacy removido - incompatível com Rolldown (sandbox).
// Para suporte a navegadores antigos no Hostinger, configure ali separadamente.

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
    // Em produção, Terser estava quebrando o bundle do Recharts no Hostinger
    // (erro runtime: "u is not a function" no chunk charts-*.js), resultando em tela preta.
    // Esbuild mantém a minificação sem corromper esse chunk.
    minify: "esbuild",
    cssMinify: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return;
          // CRÍTICO: manter React + React-DOM + Scheduler + React-Router no MESMO chunk.
          // Separar react/react-dom causa "Cannot set properties of undefined (setting 'Children')"
          // em produção pois react-dom executa antes do react ser definido.
          if (
            /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|react-is|use-sync-external-store)[\\/]/.test(id)
          ) {
            return 'react-vendor';
          }
          if (id.includes('recharts') || id.includes('d3')) return 'charts';
          if (id.includes('framer-motion')) return 'animation';
          if (id.includes('@radix-ui') || id.includes('cmdk')) return 'ui-primitives';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('i18next')) return 'i18n';
          return 'vendor';
        },
      },
    },
  },
}));
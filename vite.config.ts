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
  // CRÍTICO: keepNames preserva nomes de funções/classes durante minify.
  // Sem isso, o Recharts (que usa padrão factory) quebra com "_ is not a function"
  // em produção — causando tela preta no Hostinger.
  esbuild: {
    keepNames: true,
    // Remove console.log/debug em produção (mantém warn/error para Sentry).
    // Previne vazamento de logs internos (financeiro, triage, anti-clone) via DevTools.
    pure: mode === "production" ? ["console.log", "console.debug", "console.info", "console.trace"] : [],
    drop: mode === "production" ? ["debugger"] : [],
  },
  build: {
    minify: "esbuild",
    cssMinify: "esbuild",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return;
          // CRÍTICO: manter React + React-DOM + Scheduler + React-Router no MESMO chunk "vendor".
          // Separar react/react-dom em chunk separado causa circular reference com rolldown/vite7
          // e "Cannot set properties of undefined" em produção.
          if (
            /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|react-is|use-sync-external-store)[\\/]/.test(id)
          ) {
            return 'vendor'; // tudo junto no vendor, sem react-vendor separado
          }
          // Recharts/D3 NÃO devem ficar em chunk separado — caem junto do vendor
          // para evitar ordem de execução cross-chunk que estava quebrando produção.
          if (id.includes('framer-motion')) return 'animation';
          if (id.includes('@radix-ui') || id.includes('cmdk')) return 'ui-primitives';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('i18next')) return 'i18n';
          if (id.includes('lucide-react')) return 'lucide';
          if (id.includes('date-fns')) return 'date-fns';
          if (id.includes('@hookform') || id.includes('react-hook-form') || id.includes('zod')) return 'forms';
          if (id.includes('embla-carousel')) return 'carousel';
          return 'vendor';
        },
      },
    },
  },
}));
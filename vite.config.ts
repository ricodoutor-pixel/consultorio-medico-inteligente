import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Nota: plugin-legacy removido - incompatível com Rolldown (sandbox).
// Para suporte a navegadores antigos no Hostinger, configure ali separadamente.

import legacy from "@vitejs/plugin-legacy";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11', 'ios >= 13', 'safari >= 13'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    }),
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

          // 1. React Core + Router (deve ficar junto no vendor)
          if (
            /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|react-is|use-sync-external-store)[\\/]/.test(id)
          ) {
            return 'vendor';
          }

          // 2. Gráficos & Visualização
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) return 'charts';

          // 3. PDFs, Excel & Documentos pesados
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('xlsx') || id.includes('pdfmake') || id.includes('canvg')) {
            return 'pdf-excel';
          }

          // 4. Pagamentos & Gateways
          if (id.includes('stripe') || id.includes('mercadopago') || id.includes('@stripe')) {
            return 'payment-gateways';
          }

          // 5. Analytics, Telemetria & Sentry
          if (id.includes('@sentry') || id.includes('posthog') || id.includes('mixpanel')) {
            return 'sentry-analytics';
          }

          // 6. Câmera, Scanners & Mídia
          if (id.includes('@zxing') || id.includes('qrcode') || id.includes('jsqr') || id.includes('webrtc')) {
            return 'scanner-media';
          }

          // 7. Mapas & Geolocalização
          if (id.includes('leaflet') || id.includes('react-simple-maps') || id.includes('topojson')) return 'maps';

          // 8. Animações Lottie & Framer
          if (id.includes('lottie-react') || id.includes('lottie-web')) return 'lottie';
          if (id.includes('framer-motion')) return 'animation';

          // 9. Componentes UI Primitives & Ícones
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

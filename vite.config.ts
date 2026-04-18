import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import obfuscator from "vite-plugin-obfuscator";

// Nota: componentTagger removido - não é necessário em produção e causa falha no Hostinger

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://shmbwdjuddvquszwkvuq.supabase.co";
  const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ";

  return {
  base: "/",
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
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
    target: ["es2020", "chrome88", "edge88", "firefox78", "safari14"],
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
};
});
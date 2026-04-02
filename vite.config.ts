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
    base: "/",
    minify: "terser",
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
        manualChunks: undefined,
      },
    },
  },
}));
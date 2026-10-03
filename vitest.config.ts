import { defineConfig } from "vitest/config";
import path from "node:path";

// Testes unitários rodam apenas em src/. Os arquivos em supabase/tests/ são
// testes de integração escritos para o runtime Deno (`deno test`) e dependem de
// credenciais reais — não devem ser coletados pelo Vitest/CI comum.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", "dist/**", "supabase/**"],
    environment: "node",
  },
});

import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Testes unitários rodam apenas em src/. Os arquivos em supabase/tests/ são
// testes de integração escritos para o runtime Deno (`deno test`) e dependem de
// credenciais reais — não devem ser coletados pelo Vitest/CI comum.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", "dist/**", "supabase/**"],
    environment: "node",
  },
});

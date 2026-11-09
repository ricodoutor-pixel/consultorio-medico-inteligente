import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync("drizzle/migrations/0014_protect_catalog_and_experience_reads.sql", "utf8");
describe("catalog and experience access boundaries", () => {
  for (const table of ["strains_library", "strain_images", "verdinho_knowledge", "user_experiences"]) {
    it(`revokes anonymous SELECT on ${table} and retains server access`, () => {
      expect(sql).toMatch(new RegExp(`REVOKE SELECT ON [^;]*public\\.${table}[^;]* FROM anon, PUBLIC;`));
      expect(sql).toMatch(new RegExp(`GRANT ALL ON [^;]*public\\.${table}[^;]* TO service_role;`));
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    });
  }
  it("limits experience reads to the owner rather than all signed-in accounts", () => {
    expect(sql).toContain('DROP POLICY IF EXISTS "Authenticated users can view experiences"');
    expect(sql).toContain('ON public.user_experiences FOR SELECT TO authenticated USING (auth.uid() = user_id)');
  });
});
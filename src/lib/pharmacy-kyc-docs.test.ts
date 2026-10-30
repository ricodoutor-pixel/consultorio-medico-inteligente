import { describe, it, expect } from "vitest";
import { VENDOR_CATEGORY_DOCS, docsForCategory, normalizeVendorCategory } from "./pharmacy-kyc-docs";

describe("Shopping partner categories", () => {
  it("has exactly farmácia, importador and associação", () => {
    expect(Object.keys(VENDOR_CATEGORY_DOCS).sort()).toEqual(["associacao", "farmacia", "importador"]);
  });
  it("associação requires estatuto and ata, not alvará", () => {
    expect(VENDOR_CATEGORY_DOCS.associacao.required).toContain("estatuto_social");
    expect(VENDOR_CATEGORY_DOCS.associacao.required).toContain("ata_diretoria");
    expect(docsForCategory("associacao")).not.toContain("alvara_sanitario");
  });
  it("importador requires ANVISA import authorization", () => {
    expect(VENDOR_CATEGORY_DOCS.importador.required).toContain("afe_importacao");
  });
  it("unknown category falls back to farmácia", () => {
    expect(normalizeVendorCategory("xyz")).toBe("farmacia");
    expect(normalizeVendorCategory("associacao")).toBe("associacao");
  });
});

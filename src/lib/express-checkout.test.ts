import { describe, expect, it } from "vitest";
import fs from "node:fs";
import {
  isValidCpf,
  normalizeWhatsapp,
  validateExpressInput,
} from "../../supabase/functions/_shared/express-checkout";

const ok = {
  full_name: "Maria da Silva",
  whatsapp: "(11) 98765-4321",
  cpf: "529.982.247-25",
  email: "Maria@Example.com",
  product: "orientacao_tecnica",
  accepted: { terms: true, privacy: true, telemedicine: true },
};

describe("Checkout expresso: validação dos 4 campos e aceites", () => {
  it("valida dígitos do CPF", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });
  it("WhatsApp recebe DDI +55 por padrão", () => {
    expect(normalizeWhatsapp("(11) 98765-4321")).toBe("5511987654321");
    expect(normalizeWhatsapp("+55 11 98765-4321")).toBe("5511987654321");
    expect(normalizeWhatsapp("1234")).toBeNull();
  });
  it("normaliza e aceita o formulário completo", () => {
    const r = validateExpressInput(ok);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toMatchObject({ cpf: "52998224725", email: "maria@example.com", whatsapp: "5511987654321" });
  });
  it("exige nome e sobrenome, e-mail válido e os três aceites", () => {
    expect(validateExpressInput({ ...ok, full_name: "Maria" }).ok).toBe(false);
    expect(validateExpressInput({ ...ok, email: "maria@" }).ok).toBe(false);
    expect(validateExpressInput({ ...ok, accepted: { terms: true, privacy: true, telemedicine: false } }).ok).toBe(false);
    expect(validateExpressInput({ ...ok, product: "emergencia" }).ok).toBe(false);
  });
});

describe("Checkout expresso: sem /login nem /cadastro e sem sequestro de conta", () => {
  const fn = fs.readFileSync("supabase/functions/checkout-express/index.ts", "utf8");
  it("conta existente (CPF ou e-mail) nunca recebe sessão a partir dos dados digitados", () => {
    expect(fn).toMatch(/cpfOwner\) return json\(\{ status: "existing_account" \}\)/);
    expect(fn).toMatch(/already\|registered\|exists[^\n]*existing_account/);
    // o token de sessão só sai depois de criar a conta nova
    expect(fn.indexOf("generateLink")).toBeGreaterThan(fn.indexOf("createUser"));
  });
  it("grava o aceite (versão, IP) só pelo servidor e limita tentativas", () => {
    expect(fn).toContain("checkout_consents");
    expect(fn).toContain("terms_version: EXPRESS_TERMS_VERSION");
    expect(fn).toContain("checkout_express_ip");
    expect(fn).toContain("checkout_express_cpf");
    const mig = fs.readFileSync("drizzle/migrations/0063_checkout_consents.sql", "utf8");
    expect(mig).toMatch(/REVOKE ALL ON public\.checkout_consents FROM anon, authenticated/);
    expect(mig).not.toMatch(/FOR (INSERT|UPDATE|DELETE|ALL)/);
  });
  it("a Orientação e a consulta não mandam visitantes para /login antes do Pix", () => {
    const ot = fs.readFileSync("src/pages/OrientacaoTecnicaAgente.tsx", "utf8");
    const gen = ot.slice(ot.indexOf("const generateCheckout"), ot.indexOf("const startCheckout"));
    expect(gen).not.toContain("/login");
    expect(ot).toContain("<ExpressCheckoutForm");
    const consulta = fs.readFileSync("src/pages/ConsultaMedica.tsx", "utf8");
    expect(consulta).not.toMatch(/navigate\(`\/login/);
    expect(consulta).toContain("<ExpressCheckoutForm");
  });
  it("a tela de login não anuncia chave mestra a visitantes", () => {
    const login = fs.readFileSync("src/pages/Login.tsx", "utf8");
    expect(login).not.toMatch(/Chave Mestra Ativa|Acesso Universal|Acesso total concedido/);
  });
});

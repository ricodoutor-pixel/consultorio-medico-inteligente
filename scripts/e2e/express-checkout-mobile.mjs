// E2E (celular, sem login): /pagar/orientacao-tecnica -> 4 campos + aceites -> "Pagar com Pix" -> QR na mesma tela.
// Nunca gera Pix real: as funções checkout-express, auth/verify, mp-checkout e ot-edilson-web são simuladas.
// Uso: npm run build && npx vite preview --port 4173   (outro terminal)
//      node scripts/e2e/express-checkout-mobile.mjs [http://localhost:4173]
import puppeteer from "puppeteer";

const BASE = process.argv[2] || "http://localhost:4173";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = Math.floor(Date.now() / 1000) + 3600;
const user = { id: "00000000-0000-4000-8000-0000000e2e01", aud: "authenticated", role: "authenticated", email: "e2e@example.com", user_metadata: { origem_cadastro: "checkout_expresso" }, app_metadata: {} };
const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, role: "authenticated", aud: "authenticated", email: user.email, exp })}.sig`;
const PNG_1PX = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const calls = [];
const visited = [];
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.emulate({
  viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
await page.setRequestInterception(true);
const reply = (req, body, status = 200) => req.respond({
  status, contentType: "application/json",
  headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" },
  body: JSON.stringify(body),
});
page.on("request", (req) => {
  const url = req.url();
  if (req.method() === "OPTIONS" && url.includes("supabase.co")) return reply(req, {});
  if (url.includes("/functions/v1/checkout-express")) { calls.push(["checkout-express", JSON.parse(req.postData() || "{}")]); return reply(req, { status: "created", token_hash: "e2e-token" }); }
  if (url.includes("/auth/v1/verify")) { calls.push(["verify"]); return reply(req, { access_token: jwt, token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "e2e-refresh", user }); }
  if (url.includes("/auth/v1/user")) return reply(req, user);
  if (url.includes("/functions/v1/mp-checkout")) { calls.push(["mp-checkout", JSON.parse(req.postData() || "{}")]); return reply(req, { external_reference: "OT-E2E-1", payment_id: "e2e-1", qr_code: "00020126E2E-PIX-COPIA-E-COLA", qr_code_base64: PNG_1PX, amount: 30, description: "Orientação Técnica" }); }
  if (url.includes("/functions/v1/ot-edilson-web")) return reply(req, { state: "awaiting_payment", order: { status: "awaiting_payment" } });
  if (url.includes("/functions/v1/")) return reply(req, {});
  return req.continue();
});
page.on("framenavigated", (f) => { if (f === page.mainFrame()) visited.push(f.url()); });

const fail = async (msg) => { await page.screenshot({ path: "e2e-express-checkout-fail.png" }); console.error("FALHOU:", msg); await browser.close(); process.exit(1); };

await page.goto(`${BASE}/pagar/orientacao-tecnica?utm_source=whatsapp`, { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForSelector('[data-testid="express-checkout"]', { timeout: 30000 }).catch(() => fail("formulário expresso não apareceu"));
const pixTop = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("com Pix"));
  return Math.round(b.getBoundingClientRect().top + window.scrollY);
});

await page.type("#xc-name", "Paciente Teste E2E");
await page.click("#xc-whats", { clickCount: 3 });
await page.type("#xc-whats", "11987654321");
await page.type("#xc-cpf", "52998224725");
await page.type("#xc-email", "e2e@example.com");
// a página re-renderiza (status/realtime): clica pelo DOM atual para não usar nó desanexado
for (const label of ["Aceito os Termos de Uso e a Política de Privacidade", "Aceito o Termo de Consentimento para Telemedicina"]) {
  await page.waitForSelector(`[aria-label="${label}"]`);
  await page.evaluate((l) => document.querySelector(`[aria-label="${l}"]`).click(), label);
}
const checked = await page.$$eval('[data-testid="express-checkout"] [role="checkbox"]', (els) => els.map((e) => e.getAttribute("data-state")));
if (checked.some((s) => s !== "checked")) await fail(`aceites não marcados: ${checked}`);

const payBtn = await page.waitForSelector('xpath/.//button[contains(., "com Pix")]');
const box = await payBtn.boundingBox();
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("com Pix")).click());

await page.waitForFunction(
  () => [...document.querySelectorAll("img")].some((i) => i.src.startsWith("data:image/png;base64")),
  { timeout: 30000 },
).catch(() => fail("QR do Pix não apareceu na tela"));
await page.screenshot({ path: "e2e-express-checkout-ok.png" });

const bad = visited.filter((u) => /\/login|\/cadastro/.test(u));
if (bad.length) await fail(`passou por ${bad.join(", ")}`);
const xc = calls.find((c) => c[0] === "checkout-express")?.[1];
if (!xc || xc.cpf !== "52998224725" || xc.whatsapp !== "5511987654321" || !xc.accepted?.telemedicine) await fail("dados enviados ao checkout-express incorretos");
if (xc.attribution?.utm_source !== "whatsapp") await fail("utm_source não foi preservado");
if (!calls.some((c) => c[0] === "mp-checkout" && c[1].payment_method === "pix")) await fail("mp-checkout (Pix) não foi chamado");

console.log("OK: QR do Pix na mesma tela, sem /login nem /cadastro.");
void box;
console.log("Botão Pix a", pixTop, "px do topo da página (tela 844 px). Caminho:", visited.map((u) => new URL(u).pathname).join(" -> "));
await browser.close();

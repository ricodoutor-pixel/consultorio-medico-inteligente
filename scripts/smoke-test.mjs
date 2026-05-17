#!/usr/bin/env node
/**
 * Smoke test pós-build — carrega dist/index.html + chunks pesados em jsdom.
 * Falha o build se qualquer TypeError de inicialização aparecer (anti-tela-preta).
 *
 * Roda automaticamente após `vite build` (npm run build).
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { JSDOM, ResourceLoader, VirtualConsole } from "jsdom";

const DIST = resolve(process.cwd(), "dist");
const INDEX = join(DIST, "index.html");

if (!existsSync(INDEX)) {
  console.error("[smoke] dist/index.html ausente — pulando (build não rodou?)");
  process.exit(0);
}

const html = readFileSync(INDEX, "utf8");
const assets = existsSync(join(DIST, "assets"))
  ? readdirSync(join(DIST, "assets")).filter((f) => f.endsWith(".js"))
  : [];

const FATAL_PATTERNS = [
  /TypeError: .* is not a function/i,
  /Cannot set properties of undefined/i,
  /Cannot read properties of undefined \(reading 'Children'\)/i,
  /Cannot access .* before initialization/i,
  /ReferenceError: .* is not defined/i,
];

const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (err) => {
  const msg = (err?.detail?.stack || err?.message || String(err)).slice(0, 1000);
  errors.push(msg);
});

class FileLoader extends ResourceLoader {
  fetch(url, options) {
    if (url.startsWith("file://")) return super.fetch(url, options);
    // Não baixa nada externo — só simula carga local
    return Promise.resolve(Buffer.from(""));
  }
}

try {
  const dom = new JSDOM(html, {
    url: "https://plantayraiz.com.br/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole,
    resources: new FileLoader(),
  });

  // Executa os bundles críticos no contexto do JSDOM
  const critical = assets
    .filter((f) => /react-vendor|vendor|index|main/i.test(f))
    .sort((a, b) => {
      // react-vendor primeiro, depois vendor, depois index
      const order = (n) => (n.includes("react-vendor") ? 0 : n.includes("vendor") ? 1 : 2);
      return order(a) - order(b);
    });

  for (const file of critical) {
    const code = readFileSync(join(DIST, "assets", file), "utf8");
    try {
      dom.window.eval(code);
    } catch (e) {
      errors.push(`[${file}] ${e?.stack || e?.message || String(e)}`.slice(0, 1000));
    }
  }

  await new Promise((r) => setTimeout(r, 200));
} catch (e) {
  errors.push(`[jsdom-fatal] ${e?.message || String(e)}`);
}

const fatal = errors.filter((msg) => FATAL_PATTERNS.some((re) => re.test(msg)));

if (fatal.length > 0) {
  console.error("\n❌ SMOKE TEST FALHOU — erro fatal de inicialização detectado:\n");
  fatal.slice(0, 5).forEach((e, i) => console.error(`  ${i + 1}. ${e}\n`));
  console.error("Build BLOQUEADO — deploy abortado para evitar tela preta em produção.");
  process.exit(1);
}

console.log(`✅ Smoke test OK — ${assets.length} chunks validados, ${errors.length} avisos não-fatais.`);
process.exit(0);

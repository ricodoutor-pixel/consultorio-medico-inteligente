/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  PLANTA & RAIZ — SISTEMA DE PROTEÇÃO ANTI-CLONAGEM v2.0    ║
 * ║  © 2024-2026 Planta & Raiz. Todos os direitos reservados.  ║
 * ║  Código protegido por direitos autorais e patentes.         ║
 * ║  Reprodução não autorizada é crime (Lei 9.609/98).          ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const AUTHORIZED_DOMAINS = [
  'consultorio-medico-inteligente.lovable.app',
  'plantaeraiz.com.br',
  'plantayraiz.com',
  'plantayraiz.com.br',
  'localhost',
  '127.0.0.1',
  'lovable.app',        // preview domains
  'lovableproject.com',  // lovable dev
  'webcontainer.io',     // stackblitz
];

const BRAND_FINGERPRINT = 'PR_v2_' + btoa('PlantaERaiz2026').slice(0, 12);

// ── 1. Domain Lock ──────────────────────────────────────────────
export function enforceDomainLock(): boolean {
  try {
    const hostname = window.location.hostname;
    const isAuthorized = AUTHORIZED_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith('.' + d)
    );

    if (!isAuthorized) {
      console.error(
        '%c⛔ ACESSO NÃO AUTORIZADO — Este software é propriedade exclusiva de Planta & Raiz.',
        'color: red; font-size: 18px; font-weight: bold;'
      );
      console.error(
        '%cA reprodução ou uso não autorizado viola a Lei 9.609/98 (Software) e Lei 9.610/98 (Direitos Autorais). Ação judicial será tomada.',
        'color: red; font-size: 14px;'
      );

      // Limpa o DOM após um delay para permitir que erros sejam logados
      setTimeout(() => {
        document.documentElement.innerHTML = `
          <body style="background:#000;color:#ff3333;display:flex;align-items:center;justify-content:center;height:100vh;font-family:monospace;text-align:center;padding:2rem;">
            <div>
              <h1 style="font-size:2rem;margin-bottom:1rem;">⛔ SOFTWARE PROTEGIDO</h1>
              <p style="font-size:1.1rem;max-width:500px;margin:0 auto;">
                Este software é propriedade intelectual de <strong>Planta & Raiz</strong>.<br/>
                Uso não autorizado constitui crime previsto na Lei 9.609/98.<br/><br/>
                <em>Domínio não autorizado detectado.</em>
              </p>
            </div>
          </body>
        `;
      }, 100);
      return false;
    }
    return true;
  } catch {
    return true; // SSR/test environments
  }
}

// ── 2. Anti-DevTools (deterrent) ────────────────────────────────
export function setupAntiDevTools(): void {
  if (import.meta.env.DEV) return; // Desativa em dev

  // Detecta abertura via timing
  let devtoolsOpen = false;

  const checkDevTools = () => {
    const start = performance.now();
    // debugger statement causa delay quando devtools está aberto
    // Removido para não travar - usando abordagem de tamanho
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;

    if (widthThreshold || heightThreshold) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        console.warn(
          '%c🛡️ Planta & Raiz — Código Protegido',
          'color: #10B981; font-size: 16px; font-weight: bold;'
        );
        console.warn(
          '%cEste código é protegido por direitos autorais.\nQualquer cópia ou engenharia reversa é proibida pela Lei 9.609/98.',
          'color: #F59E0B; font-size: 13px;'
        );
      }
    } else {
      devtoolsOpen = false;
    }
  };

  setInterval(checkDevTools, 2000);
}

// ── 3. Anti-Copy/Select (conteúdo sensível) ─────────────────────
export function setupAntiCopy(): void {
  if (import.meta.env.DEV) return;

  // Bloqueia seleção de texto em áreas sensíveis
  document.addEventListener('selectstart', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-protected]') || target.closest('.protected-content')) {
      e.preventDefault();
    }
  });

  // Bloqueia cópia de conteúdo protegido
  document.addEventListener('copy', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-protected]') || target.closest('.protected-content')) {
      e.preventDefault();
      e.clipboardData?.setData('text/plain', '© Planta & Raiz — Conteúdo Protegido');
    }
  });

  // Sobrescreve Ctrl+U (view source)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
    }
  });
}

// ── 4. Runtime Integrity Check ──────────────────────────────────
export function checkRuntimeIntegrity(): boolean {
  try {
    // Verifica se meta tags da marca existem (aceita Planta & Raiz OU autor médico oficial)
    const metaAuthor = document.querySelector('meta[name="author"]');
    const authorContent = metaAuthor?.getAttribute('content') ?? '';
    const isValidAuthor =
      !metaAuthor ||
      authorContent.includes('Planta') ||
      authorContent.includes('Edilson') ||
      authorContent.includes('CRM');
    if (!isValidAuthor) {
      console.warn('⚠️ Meta author não corresponde ao padrão esperado');
    }

    // Verifica fingerprint no window
    (window as any).__PR_FINGERPRINT__ = BRAND_FINGERPRINT;

    return true;
  } catch {
    return true;
  }
}

// ── 5. Source Watermark ─────────────────────────────────────────
export function injectWatermark(): void {
  const watermark = document.createElement('div');
  watermark.id = '__pr_wm';
  watermark.setAttribute('data-pr', BRAND_FINGERPRINT);
  watermark.setAttribute('data-ts', new Date().toISOString());
  watermark.style.cssText = 'position:fixed;bottom:0;right:0;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1;';
  watermark.innerHTML = `<!-- © Planta & Raiz ${new Date().getFullYear()} — Software Protegido Lei 9.609/98 -->`;
  document.body.appendChild(watermark);
}

// ── 6. Anti-iframe Embedding ────────────────────────────────────
export function preventUnauthorizedEmbed(): void {
  if (import.meta.env.DEV) return;

  try {
    if (window.self !== window.top) {
      const referrer = document.referrer || '';
      const isAuthorized = AUTHORIZED_DOMAINS.some((d) => referrer.includes(d));
      if (!isAuthorized && referrer !== '') {
        console.error('⛔ Embedding não autorizado detectado');
        // Não bloqueia completamente para não quebrar previews legítimos
      }
    }
  } catch {
    // Cross-origin frame access blocked - OK
  }
}

// ── 7. Console Branding ─────────────────────────────────────────
export function brandConsole(): void {
  console.log(
    '%c🌿 Planta & Raiz',
    'color: #10B981; font-size: 24px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);'
  );
  console.log(
    '%c© 2024-2026 Todos os direitos reservados.\nSoftware protegido pela Lei 9.609/98 e Lei 9.610/98.\nUso não autorizado será processado judicialmente.',
    'color: #6B7280; font-size: 11px;'
  );
  console.log(
    `%cFingerprint: ${BRAND_FINGERPRINT}`,
    'color: #374151; font-size: 9px;'
  );
}

// ── 8. Obfuscation Honeypot ─────────────────────────────────────
export function setupHoneypot(): void {
  // Define propriedades que detectam acesso indevido
  Object.defineProperty(window, '__CLONE_CHECK__', {
    get() {
      console.error('⛔ Tentativa de inspeção detectada — Planta & Raiz Anti-Clone v2.0');
      return undefined;
    },
    configurable: false,
  });

  // Marca o timestamp de inicialização
  Object.defineProperty(window, '__PR_INIT__', {
    value: Date.now(),
    writable: false,
    configurable: false,
  });
}

// ══════════════════════════════════════════════════════════════════
// INICIALIZAÇÃO PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export function initAntiClone(): void {
  const domainOk = enforceDomainLock();
  if (!domainOk) return;

  checkRuntimeIntegrity();
  brandConsole();
  setupHoneypot();
  setupAntiDevTools();
  setupAntiCopy();
  preventUnauthorizedEmbed();

  // Injeta watermark após DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWatermark);
  } else {
    injectWatermark();
  }
}

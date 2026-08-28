// @ts-nocheck
/**
 * ═══════════════════════════════════════════════════════════════
 * MÓDULO 5: DEVOPS & INTEGRIDADE — TECNOLOGIA 2050
 * Deploy Hostinger, Criptografia E2E, Anti-Clone
 * ═══════════════════════════════════════════════════════════════
 */

import crypto from 'crypto';
import { devlog } from '@/lib/devlog';

/**
 * 🔴 ANTI-CLONE: Script de Proteção de Domínio
 * Deve estar no topo do <head> do index.html
 */
export const ANTI_CLONE_SCRIPT = `
<script>
  (function() {
    // 🔴 BLOQUEIO DE DOMÍNIO: Apenas plantayraiz.com.br
    const ALLOWED_DOMAIN = 'plantayraiz.com.br';
    const ALLOWED_SUBDOMAINS = ['www', 'app', 'api', 'admin'];
    
    const currentHostname = window.location.hostname;
    const isValidDomain = 
      currentHostname === ALLOWED_DOMAIN ||
      ALLOWED_SUBDOMAINS.some(sub => currentHostname === \`\${sub}.\${ALLOWED_DOMAIN}\`);
    
    if (!isValidDomain) {
      // Domínio não autorizado - renderizar erro 403
      document.documentElement.innerHTML = \`
        <html>
          <head>
            <title>403 - Acesso Proibido</title>
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                background: #0A0E27; 
                color: #fff; 
                font-family: 'Inter', sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
              }
              .container {
                text-align: center;
                padding: 40px;
              }
              h1 { font-size: 48px; margin: 0 0 20px 0; }
              p { font-size: 18px; color: #ccc; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>403</h1>
              <p>Acesso Proibido</p>
              <p>Este domínio não está autorizado.</p>
            </div>
          </body>
        </html>
      \`;
      return;
    }
    
    // 🔴 PROTEÇÃO CONTRA CLONAGEM: Detectar iframes e frames
    if (window.self !== window.top) {
      window.top.location = window.self.location;
    }
    
    // 🔴 PROTEÇÃO CONTRA DEVTOOLS: Detectar abertura do console
    let devtoolsOpen = false;
    const threshold = 160;
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          console.warn('🔒 DevTools detectado. Aplicação protegida.');
        }
      } else {
        devtoolsOpen = false;
      }
    }, 500);
    
    // 🔴 PROTEÇÃO CONTRA CÓPIA: Desabilitar copy/paste em áreas sensíveis
    document.addEventListener('copy', (e) => {
      const selection = window.getSelection().toString();
      if (selection.length > 500) {
        e.preventDefault();
        console.warn('🔒 Cópia de conteúdo grande bloqueada.');
      }
    });
  })();
</script>
`;

/**
 * 🔴 FUNÇÃO: Criptografia E2E para Mensagens
 */
export class E2EEncryption {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits

  /**
   * Gerar chave de criptografia
   */
  generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Criptografar mensagem
   */
  encrypt(plaintext: string, key: string): string {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Combinar: iv + authTag + encrypted
      const combined = iv.toString('hex') + authTag.toString('hex') + encrypted;
      return combined;
    } catch (error) {
      devlog.error('Erro ao criptografar:', error);
      throw error;
    }
  }

  /**
   * Descriptografar mensagem
   */
  decrypt(combined: string, key: string): string {
    try {
      const keyBuffer = Buffer.from(key, 'hex');

      // Extrair componentes
      const iv = Buffer.from(combined.slice(0, 32), 'hex');
      const authTag = Buffer.from(combined.slice(32, 64), 'hex');
      const encrypted = combined.slice(64);

      const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      devlog.error('Erro ao descriptografar:', error);
      throw error;
    }
  }

  /**
   * Hash SHA-256 para integridade
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

/**
 * 🔴 FUNÇÃO: Validação de Criptografia no Supabase
 */
export async function validateSupabaseEncryption(
  supabaseClient: any
): Promise<{
  isEncrypted: boolean;
  messagesCount: number;
  encryptedCount: number;
}> {
  try {
    const { data: messages, error } = await supabaseClient
      .from('messages')
      .select('id, content, is_encrypted')
      .limit(100);

    if (error) throw error;

    const encryptedCount = messages.filter(
      (m: any) => m.is_encrypted === true
    ).length;

    return {
      isEncrypted: encryptedCount === messages.length,
      messagesCount: messages.length,
      encryptedCount,
    };
  } catch (error) {
    devlog.error('Erro ao validar criptografia:', error);
    return {
      isEncrypted: false,
      messagesCount: 0,
      encryptedCount: 0,
    };
  }
}

/**
 * 🔴 FUNÇÃO: Deploy Watcher (Hostinger)
 * Se build > 10s, reiniciar via PM2
 */
export async function deployWatcher(): Promise<{
  buildTime: number;
  status: 'success' | 'timeout' | 'error';
  action?: string;
}> {
  try {
    const startTime = Date.now();

    // Simular build
    const buildProcess = new Promise((resolve) => {
      setTimeout(() => {
        resolve('build-complete');
      }, Math.random() * 15000); // 0-15 segundos
    });

    await buildProcess;
    const buildTime = Date.now() - startTime;

    if (buildTime > 10000) {
      devlog.warn(
        `⚠️ Build lento detectado: ${(buildTime / 1000).toFixed(2)}s`
      );

      // Chamar endpoint para reiniciar PM2
      await fetch('/api/devops/restart-pm2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'slow-build',
          buildTime,
        }),
      });

      // Limpar cache node_modules
      await fetch('/api/devops/clear-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cacheType: 'node_modules',
        }),
      });

      return {
        buildTime,
        status: 'timeout',
        action: 'pm2-restart + cache-clear',
      };
    }

    return {
      buildTime,
      status: 'success',
    };
  } catch (error) {
    devlog.error('Erro no deploy watcher:', error);
    return {
      buildTime: 0,
      status: 'error',
    };
  }
}

/**
 * 🔴 FUNÇÃO: Gerar Sitemap Dinâmico
 */
export async function generateDynamicSitemap(baseUrl: string): Promise<string> {
  try {
    const routes = [
      '/',
      '/profissionais',
      '/telemedicina',
      '/shopping',
      '/biblioteca',
      '/comunidade',
      '/club',
      '/planos',
      '/sobre',
      '/contato',
      '/termos',
      '/privacidade',
    ];

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `
  <url>
    <loc>${baseUrl}${route}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>
`
  )
  .join('')}
</urlset>`;

    return sitemapXml;
  } catch (error) {
    devlog.error('Erro ao gerar sitemap:', error);
    throw error;
  }
}

/**
 * 🔴 FUNÇÃO: Health Check do Sistema
 */
export async function systemHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'down';
  checks: {
    database: boolean;
    cache: boolean;
    storage: boolean;
    api: boolean;
    encryption: boolean;
  };
  timestamp: Date;
}> {
  try {
    const checks = {
      database: await checkDatabase(),
      cache: await checkCache(),
      storage: await checkStorage(),
      api: await checkAPI(),
      encryption: await checkEncryption(),
    };

    const allHealthy = Object.values(checks).every((v) => v === true);
    const status = allHealthy ? 'healthy' : 'degraded';

    return {
      status,
      checks,
      timestamp: new Date(),
    };
  } catch (error) {
    devlog.error('Erro no health check:', error);
    return {
      status: 'down',
      checks: {
        database: false,
        cache: false,
        storage: false,
        api: false,
        encryption: false,
      },
      timestamp: new Date(),
    };
  }
}

/**
 * 🔴 FUNÇÕES AUXILIARES
 */
async function checkDatabase(): Promise<boolean> {
  try {
    const response = await fetch('/api/health/database', { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkCache(): Promise<boolean> {
  try {
    const response = await fetch('/api/health/cache', { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkStorage(): Promise<boolean> {
  try {
    const response = await fetch('/api/health/storage', { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkAPI(): Promise<boolean> {
  try {
    const response = await fetch('/api/health', { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkEncryption(): Promise<boolean> {
  try {
    const encryption = new E2EEncryption();
    const key = encryption.generateKey();
    const plaintext = 'test';
    const encrypted = encryption.encrypt(plaintext, key);
    const decrypted = encryption.decrypt(encrypted, key);
    return decrypted === plaintext;
  } catch {
    return false;
  }
}

export default {
  ANTI_CLONE_SCRIPT,
  E2EEncryption,
  validateSupabaseEncryption,
  deployWatcher,
  generateDynamicSitemap,
  systemHealthCheck,
};

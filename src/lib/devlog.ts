// src/lib/devlog.ts
// Debug logger — silenciado automaticamente em produção (Vite define import.meta.env.DEV)
// Para alertas operacionais (SRE, financeiro, crítico) usar src/lib/logger.ts
const isDev = import.meta.env.DEV;

export const devlog = {
  log:   (...args: unknown[]): void => { if (isDev) console.log(...args); },
  warn:  (...args: unknown[]): void => { if (isDev) console.warn(...args); },
  info:  (...args: unknown[]): void => { if (isDev) console.info(...args); },
  // errors sempre aparecem — são sinalizadores críticos mesmo em produção
  error: (...args: unknown[]): void => { console.error(...args); },
};

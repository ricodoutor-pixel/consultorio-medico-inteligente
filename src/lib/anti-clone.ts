/**
 * src/lib/anti-clone.ts
 * Neutralizado para total conformidade com crawlers de busca e políticas do Google Ads.
 * Elimina qualquer inspeção de dimensões de tela (outerWidth/innerWidth), timers de devtools,
 * manipulação de DOM baseada em domínio ou bloqueios de ambiente headless.
 * Garante renderização 100% uniforme e estática para usuários e Googlebot.
 */

export function enforceDomainLock(): boolean {
  return true;
}

export function setupAntiDevTools(): void {
  // Desativado: sem inspeção de dimensões ou timers
}

export function setupAntiCopy(): void {
  // Desativado: preserva comportamento padrão do navegador
}

export function checkRuntimeIntegrity(): boolean {
  return true;
}

export function injectWatermark(): void {
  // Desativado
}

export function preventUnauthorizedEmbed(): void {
  // Desativado
}

export function brandConsole(): void {
  // Desativado
}

export function setupHoneypot(): void {
  // Desativado
}

export function initAntiClone(): void {
  // Desativado: 100% neutro para garantir indexação uniforme e sem cloaking
}

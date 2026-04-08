import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSchemaOrgByRoute, generateSchemaOrgTags } from '@/lib/schema-org';
import { getPinterestConfig, generatePinterestTags } from '@/lib/pinterest-tags';

/**
 * Componente que gerencia Schema.org JSON-LD e Pinterest tags
 * Deve ser incluído no App.tsx dentro do ThemeProvider
 */
export function SearchEngineOptimization() {
  const location = useLocation();

  useEffect(() => {
    // Obter Schema.org baseado na rota
    const schemas = getSchemaOrgByRoute(location.pathname);
    const schemaHtml = generateSchemaOrgTags(schemas);

    // Obter Pinterest config baseado na rota
    const pinterestConfig = getPinterestConfig(location.pathname);
    const pinterestHtml = generatePinterestTags(pinterestConfig);

    // Remover tags antigas
    const head = document.head;
    const oldSchemaTags = head.querySelectorAll('script[type="application/ld+json"]');
    const oldPinterestTags = head.querySelectorAll('meta[property^="pinterest:"], meta[name="pinterest-rich-pin"]');

    oldSchemaTags.forEach((tag) => tag.remove());
    oldPinterestTags.forEach((tag) => tag.remove());

    // Criar template para Schema.org
    const schemaTemplate = document.createElement('template');
    schemaTemplate.innerHTML = schemaHtml;
    const schemaFragment = schemaTemplate.content;
    head.appendChild(schemaFragment);

    // Criar template para Pinterest
    const pinterestTemplate = document.createElement('template');
    pinterestTemplate.innerHTML = pinterestHtml;
    const pinterestFragment = pinterestTemplate.content;
    head.appendChild(pinterestFragment);
  }, [location.pathname]);

  return null; // Este componente não renderiza nada visível
}

/**
 * Hook para usar Schema.org config em componentes
 */
export function useSchemaOrg() {
  const location = useLocation();
  return getSchemaOrgByRoute(location.pathname);
}

/**
 * Hook para usar Pinterest config em componentes
 */
export function usePinterest() {
  const location = useLocation();
  return getPinterestConfig(location.pathname);
}

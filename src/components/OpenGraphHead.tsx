import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getOpenGraphConfig, updateOpenGraphTags } from '@/lib/open-graph';

/**
 * Componente que gerencia Open Graph tags dinamicamente
 * Deve ser incluído no App.tsx dentro do ThemeProvider
 */
export function OpenGraphHead() {
  const [location] = useLocation();

  useEffect(() => {
    // Obtém configuração baseada na rota atual
    const config = getOpenGraphConfig(location);

    // Atualiza tags no head
    updateOpenGraphTags(config);

    // Atualiza título da página
    document.title = config.title;
  }, [location]);

  return null; // Este componente não renderiza nada visível
}

/**
 * Hook para usar Open Graph config em componentes
 */
export function useOpenGraph() {
  const [location] = useLocation();
  return getOpenGraphConfig(location);
}

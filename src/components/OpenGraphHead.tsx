import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getOpenGraphConfig, updateOpenGraphTags } from '@/lib/open-graph-complete';

export function OpenGraphHead() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Páginas individuais dos médicos gerenciam seus próprios títulos e meta tags SEO específicos
    if (pathname.startsWith('/profissionais/') && pathname !== '/profissionais') {
      return;
    }
    const config = getOpenGraphConfig(pathname);
    updateOpenGraphTags(config);
    document.title = config.title;
  }, [pathname]);

  return null;
}

export function useOpenGraph() {
  const { pathname } = useLocation();
  return getOpenGraphConfig(pathname);
}

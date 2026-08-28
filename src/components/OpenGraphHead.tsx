import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getOpenGraphConfig, updateOpenGraphTags } from '@/lib/open-graph-complete';

export function OpenGraphHead() {
  const { pathname } = useLocation();

  useEffect(() => {
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

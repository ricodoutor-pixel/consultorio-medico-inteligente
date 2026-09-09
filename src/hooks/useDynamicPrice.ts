import { useState, useEffect } from 'react';

/**
 * Detecta o país do visitante para preço internacional.
 * IMPORTANTE: a chamada tem timeout de 3s + AbortController. Sem isso,
 * visitantes em redes lentas ou países onde o ipapi.co responde devagar
 * (ex.: Bolívia) ficavam com a tela presa aguardando a resposta.
 */
export function useDynamicPrice() {
  const [price, setPrice] = useState({ value: 30, currency: 'BRL', symbol: 'R$' });
  const [isInternational, setIsInternational] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3000);

    async function checkLocation() {
      try {
        const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (data?.country_code && data.country_code !== 'BR') {
          setPrice({ value: 10, currency: 'USD', symbol: 'US$' });
          setIsInternational(true);
        }
      } catch {
        // Falha/timeout na geolocalização nunca deve afetar a renderização.
      } finally {
        window.clearTimeout(timer);
      }
    }
    checkLocation();

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return { ...price, isInternational };
}

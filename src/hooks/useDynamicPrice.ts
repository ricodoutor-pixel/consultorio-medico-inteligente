import { useState, useEffect } from 'react';

export function useDynamicPrice() {
  const [price, setPrice] = useState({ value: 30, currency: 'BRL', symbol: 'R$' });
  const [isInternational, setIsInternational] = useState(false);

  useEffect(() => {
    async function checkLocation() {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code !== 'BR') {
          setPrice({ value: 10, currency: 'USD', symbol: 'US$' });
          setIsInternational(true);
        }
      } catch (error) {
        console.error('Error detecting location:', error);
      }
    }
    checkLocation();
  }, []);

  return { ...price, isInternational };
}

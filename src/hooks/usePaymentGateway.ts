import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export type PaymentGateway = 'mercadopago';

/**
 * Hook usado para Orientação Técnica e demais cobranças diretas.
 * Decisão de produto (2026-08-03): Stripe DESATIVADO na plataforma.
 * 100% dos pagamentos (orientações, consultas, marketplace e assinaturas)
 * são processados via Mercado Pago (PIX, cartão e boleto).
 */
export const usePaymentGateway = () => {
  const [currency, setCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [price, setPrice] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const [countryCode, setCountryCode] = useState<string>('BR');

  useEffect(() => {
    const detectIP = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        if (data.country_code !== 'BR') {
          setCurrency('USD');
          setPrice(10);
          setCountryCode(data.country_code);
        } else {
          setCurrency('BRL');
          setPrice(30);
          setCountryCode('BR');
        }
      } catch (error) {
        console.error('Error detecting IP:', error);
        setCurrency('BRL');
        setPrice(30);
        setCountryCode('BR');
      } finally {
        setLoading(false);
      }
    };

    detectIP();
  }, []);

  const createPayment = async (params: {
    appointmentId?: string;
    doctorName?: string;
    patientEmail?: string;
    description?: string;
  }) => {
    // Mercado Pago para 100% dos pagamentos da plataforma.
    const { data, error } = await supabase.functions.invoke('mp-checkout', {
      body: {
        appointmentId: params.appointmentId,
        sku: params.appointmentId ? undefined : 'orientacao_tecnica',
      },
    });

    if (error) throw error;
    return data;
  };

  return {
    gateway: 'mercadopago' as const,
    currency,
    price,
    loading,
    countryCode,
    createPayment,
  };
};

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
  // A cobrança é sempre liquidada em BRL pelo Mercado Pago.
  // O valor exibido DEVE ser igual ao valor cobrado (evita cobrança indevida).
  const [currency] = useState<'BRL'>('BRL');
  const [price] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const [countryCode, setCountryCode] = useState<string>('BR');

  useEffect(() => {
    // Timeout de 3s: em redes lentas/países onde o ipapi.co demora,
    // o estado `loading` ficava travado e o botão de pagamento nunca aparecia.
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3000);

    const detectIP = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        const data = response.ok ? await response.json() : null;
        if (data?.country_code) setCountryCode(String(data.country_code));
      } catch {
        setCountryCode('BR');
      } finally {
        window.clearTimeout(timer);
        setLoading(false);
      }
    };

    detectIP();

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
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

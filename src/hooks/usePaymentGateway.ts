import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export type PaymentGateway = 'mercadopago' | 'stripe';

/**
 * Hook usado APENAS para Orientação Técnica do Dr. Edilson.
 * Decisão de produto (2026-05-14): orientações técnicas processam SEMPRE via Stripe
 * (BR R$30 e Internacional US$10) para reduzir taxas de transação e centralizar
 * a auditoria financeira na carteira Stripe da Lovable.
 *
 * Demais fluxos (consultas, marketplace, club) seguem usando Mercado Pago.
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
    doctorName: string;
    patientEmail: string;
    description: string;
  }) => {
    // Stripe para 100% das orientações técnicas (BR + Internacional)
    const { data, error } = await supabase.functions.invoke('create-stripe-payment', {
      body: {
        ...params,
        amount: price,
        currency,
        countryCode,
      },
    });

    if (error) throw error;
    return data;
  };

  return {
    gateway: 'stripe' as const,
    currency,
    price,
    loading,
    countryCode,
    createPayment,
  };
};

import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export type PaymentGateway = 'mercadopago' | 'stripe';

export const usePaymentGateway = () => {
  const [gateway, setGateway] = useState<PaymentGateway>('mercadopago');
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
          setGateway('stripe');
          setCurrency('USD');
          setPrice(10);
          setCountryCode(data.country_code);
        } else {
          setGateway('mercadopago');
          setCurrency('BRL');
          setPrice(30);
          setCountryCode('BR');
        }
      } catch (error) {
        console.error('Error detecting IP:', error);
        // Default to Brazil/Mercado Pago if detection fails
        setGateway('mercadopago');
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
    const functionName = gateway === 'mercadopago' ? 'create-payment' : 'create-stripe-payment';
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        ...params,
        amount: price,
        currency: currency,
      },
    });

    if (error) throw error;
    return data;
  };

  return {
    gateway,
    currency,
    price,
    loading,
    countryCode,
    createPayment
  };
};

/**
 * usePrescriptionCart — Hook for one-click prescription checkout
 */
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  product_name: string;
  quantity: number;
  dosage?: string;
  unit_price?: number;
}

interface PrescriptionCart {
  id: string;
  cart_token: string;
  items: CartItem[];
  total_amount: number;
  discount_percent: number;
  status: string;
  expires_at: string;
}

export function usePrescriptionCart() {
  const [cart, setCart] = useState<PrescriptionCart | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createCartFromPrescription = useCallback(async (
    prescriptionId: string,
    doctorId: string,
    patientId: string,
    items: CartItem[]
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("prescription-to-cart", {
        body: {
          prescription_id: prescriptionId,
          doctor_id: doctorId,
          patient_id: patientId,
          items,
        },
      });

      if (error) throw error;

      toast({
        title: "Carrinho criado!",
        description: `Link enviado ao paciente. Total: R$ ${data.total_amount?.toFixed(2)}`,
      });

      return data;
    } catch (err) {
      toast({ title: "Erro ao criar carrinho", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadCartByToken = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("prescription-to-cart", {
        body: { action: "get_cart", cart_token: token },
      });

      if (error) throw error;
      setCart(data.cart as PrescriptionCart);
      return data.cart;
    } catch (err) {
      toast({ title: "Carrinho não encontrado", description: "O link pode ter expirado.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { cart, loading, createCartFromPrescription, loadCartByToken };
}

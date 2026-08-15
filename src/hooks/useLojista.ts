import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LojistaProfile {
  id: string;
  role: string; // 'lojista' ou 'dispensario'
  company_name?: string;
  is_verified?: boolean;
}

export interface DashboardMetrics {
  demand: any[];
  terpenes: any[];
  orders: any[];
  products: any[];
}

export function useLojista() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<LojistaProfile | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({ demand: [], terpenes: [], orders: [], products: [] });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    loadLojistaData();
  }, []);

  const loadLojistaData = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setAuthError("Não autenticado");
        setLoading(false);
        return;
      }
      setSession({ user });

      // Validação de Role na tabela profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles' as any)
        .select('id, role, company_name, is_verified')
        .eq('id', user.id)
        .single();

      const prof = profileData as any;
      if (profileError || !prof || (prof.role !== 'lojista' && prof.role !== 'dispensario')) {
        setAuthError("Acesso Negado: Seu perfil não é de lojista.");
        setLoading(false);
        return;
      }
      
      setProfile(prof);

      // Busca dados reais em paralelo usando Promisses
      const [productsRes, ordersRes] = await Promise.all([
        (supabase as any).from('products').select('*').eq('dispensary_id', user.id).order('created_at', { ascending: false }),
        (supabase as any).from('b2b_orders').select('*').eq('lojista_id', user.id).order('created_at', { ascending: false })
      ]);

      setMetrics({
        products: productsRes.data || [],
        orders: ordersRes.data || [],
        demand: [],
        terpenes: []
      });

    } catch (e: any) {
      console.error(e);
      setAuthError("Erro interno ao carregar painel.");
    } finally {
      setLoading(false);
    }
  };

  // Função para adicionar produto
  const addProduct = async (productData: any) => {
    if (!session?.user?.id) throw new Error("Usuário não logado");

    const { data, error } = await supabase
      .from('products' as any)
      .insert([{
        ...productData,
        dispensary_id: session.user.id, // Vínculo rígido de RLS
        is_active: false, // Produto novo passa por curadoria
      }])
      .select()
      .single();

    if (error) throw error;

    // Atualiza o estado local sem precisar recarregar tudo
    setMetrics(prev => ({
      ...prev,
      products: [data, ...prev.products]
    }));

    return data;
  };

  return { session, profile, metrics, loading, authError, addProduct };
}

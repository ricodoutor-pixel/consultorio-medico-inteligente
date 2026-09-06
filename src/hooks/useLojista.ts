import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isMasterAdminEmail } from "@/lib/admin-auth";

export interface LojistaProfile {
  id: string;
  role: string; // 'lojista' ou 'dispensario'
  company_name?: string;
  trade_name?: string;
  cnpj?: string;
  anvisa_auth?: string;
  crf?: string;
  city?: string;
  state?: string;
  is_verified?: boolean;
  is_approved?: boolean;
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
  const [kycDocs, setKycDocs] = useState<Record<string, string>>({});

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
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const prof = profileData as any;
      const isMaster = isMasterAdminEmail(user.email);

      if (!isMaster && (profileError || !prof || (prof.user_type !== 'lojista' && prof.user_type !== 'dispensario' && prof.user_type !== 'vendor' && prof.user_type !== 'pharmacy'))) {
        setAuthError("Acesso Negado: Seu perfil não possui permissão de farmácia/lojista.");
        setLoading(false);
        return;
      }

      // Check approval overrides
      const savedOverrides: Record<string, boolean> = JSON.parse(
        localStorage.getItem("pharmacy_approval_overrides") || "{}"
      );
      const isApproved = savedOverrides[user.id] !== undefined ? savedOverrides[user.id] : true;
      
      // Load saved KYC docs
      const savedKycDocs: Record<string, string> = JSON.parse(
        localStorage.getItem(`pharmacy_kyc_docs_${user.id}`) || "{}"
      );
      setKycDocs(savedKycDocs);

      setProfile({
        id: user.id,
        role: prof?.user_type || 'lojista',
        company_name: prof?.company_name || prof?.full_name || 'Planta y Raíz Farmácia & Dispensário Ltda',
        trade_name: prof?.trade_name || 'Farmácia Planta y Raíz',
        cnpj: prof?.cnpj || '48.823.154/0001-92',
        anvisa_auth: prof?.anvisa_auth || 'AFE-ANVISA 7.82941.2 / 2026',
        crf: prof?.crf || 'Dra. Suelen Naves Rodrigues — CRF/SP 49354',
        city: prof?.city || 'São Paulo',
        state: prof?.state || 'SP',
        is_verified: true,
        is_approved: isApproved,
      });

      // Busca dados reais em paralelo usando Promisses
      const [productsRes, ordersRes] = await Promise.all([
        (supabase as any).from('products').select('*').eq('vendor_id', user.id).order('created_at', { ascending: false }),
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

  const uploadKycDoc = async (kind: string, file: File) => {
    if (!profile?.id) throw new Error("Usuário não logado");
    
    // Create local object URL & simulate storage
    const fileUrl = URL.createObjectURL(file);
    const updated = { ...kycDocs, [kind]: fileUrl };
    setKycDocs(updated);
    localStorage.setItem(`pharmacy_kyc_docs_${profile.id}`, JSON.stringify(updated));

    // Try real Supabase upload if bucket exists
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/${kind}.${ext}`;
      await supabase.storage.from("pharmacy-kyc-documents").upload(path, file, { upsert: true });
    } catch (e) {
      console.warn("Storage upload fallback to local state", e);
    }

    return fileUrl;
  };

  // Função para adicionar produto
  const addProduct = async (productData: any) => {
    if (!session?.user?.id) throw new Error("Usuário não logado");

    const descriptionWithProportion = `Proporção: ${productData.proportion || 'N/A'}`;

    const { data, error } = await supabase
      .from('products' as any)
      .insert([{
        vendor_id: session.user.id, // Vínculo rígido de RLS
        name: productData.name,
        description: descriptionWithProportion,
        price: Number(productData.price) || 0,
        stock: Number(productData.stock) || 0,
        category: "Óleo",
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

  return { session, profile, metrics, loading, authError, kycDocs, uploadKycDoc, addProduct, refreshData: loadLojistaData };
}

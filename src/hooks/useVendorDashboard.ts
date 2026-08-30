import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const MASTER_EMAIL = "contato@plantayraiz.com.br";

export interface VendorRecord {
  id: string;
  user_id: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  store_name: string | null;
  cnpj: string | null;
  responsavel_tecnico: string | null;
  crf_numero: string | null;
  crf_uf: string | null;
  anvisa_afe: string | null;
  anvisa_ae: string | null;
  logo_url: string | null;
  store_logo_url: string | null;
  fachada_foto_url: string | null;
  telefone_whatsapp: string | null;
  endereco_completo: any;
  is_kyc_approved: boolean;
  kyc_status: string | null;
  max_showcase_products: number | null;
  pix_key: string | null;
  created_at: string;
}

export interface VendorProduct {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  category: string;
  concentration: string | null;
  price: number;
  stock_quantity: number;
  is_showcase: boolean;
  is_approved_by_admin: boolean;
  image_url: string | null;
  requires_prescription: boolean;
  created_at: string;
}

export interface InboxItem {
  id: string;
  vendor_id: string;
  patient_id: string;
  patient_name: string;
  patient_whatsapp: string | null;
  prescription_id: string | null;
  prescription_pdf_url: string;
  regulatory_hash: string;
  order_id: string | null;
  delivery_address: any;
  dispatch_mode: "automatic_1click" | "manual_upload";
  status: string;
  tracking_code: string | null;
  motivo_recusa: string | null;
  created_at: string;
}

export interface SplitItem {
  id: string;
  order_id: string;
  total_item_amount: number;
  platform_fee_5pct: number;
  vendor_net_95pct: number;
  payout_status: string;
  created_at: string;
}

export function useVendorDashboard() {
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isMaster, setIsMaster] = useState(false);
  const [vendor, setVendor] = useState<VendorRecord | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [splits, setSplits] = useState<SplitItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAuthError("Você precisa estar logado com a conta da farmácia.");
        return;
      }
      const master = (user.email || "").toLowerCase() === MASTER_EMAIL;
      setIsMaster(master);

      let query = (supabase as any).from("vendors").select("*").order("created_at", { ascending: true });
      query = master ? query.limit(1) : query.eq("user_id", user.id).limit(1);
      const { data: vendorRows, error: vendorErr } = await query;
      if (vendorErr) throw vendorErr;

      const v = (vendorRows || [])[0] as VendorRecord | undefined;
      if (!v) {
        setAuthError("Nenhuma farmácia vinculada a esta conta. Conclua o credenciamento.");
        return;
      }
      setVendor(v);

      const [prodRes, inboxRes, splitRes] = await Promise.all([
        (supabase as any).from("vendor_products").select("*").eq("vendor_id", v.id).order("created_at", { ascending: false }),
        (supabase as any).from("pharmacy_prescriptions_inbox").select("*").eq("vendor_id", v.id).order("created_at", { ascending: false }),
        (supabase as any).from("vendor_sales_splits").select("*").eq("vendor_id", v.id).order("created_at", { ascending: false }),
      ]);

      setProducts((prodRes.data || []) as VendorProduct[]);
      setInbox((inboxRes.data || []) as InboxItem[]);
      setSplits((splitRes.data || []) as SplitItem[]);
    } catch (e: any) {
      setAuthError(e?.message || "Erro ao carregar o painel da farmácia.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime na caixa de receitas
  useEffect(() => {
    if (!vendor?.id) return;
    const channel = supabase
      .channel(`vendor:${vendor.id}:inbox`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pharmacy_prescriptions_inbox", filter: `vendor_id=eq.${vendor.id}` },
        () => { load(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [vendor?.id, load]);

  const saveProduct = async (form: Partial<VendorProduct> & { id?: string }) => {
    if (!vendor) throw new Error("Farmácia não carregada");
    const payload = {
      vendor_id: vendor.id,
      name: form.name,
      description: form.description ?? null,
      category: form.category || "oleo_cbd",
      concentration: form.concentration ?? null,
      price: Number(form.price) || 0,
      stock_quantity: Number(form.stock_quantity) || 0,
      image_url: form.image_url || null,
      requires_prescription: form.requires_prescription ?? true,
    };
    const q = form.id
      ? (supabase as any).from("vendor_products").update(payload).eq("id", form.id).select("*").single()
      : (supabase as any).from("vendor_products").insert(payload).select("*").single();
    const { data, error } = await q;
    if (error) throw error;
    await load();
    return data as VendorProduct;
  };

  const toggleShowcase = async (productId: string, value: boolean) => {
    const { error } = await (supabase as any)
      .from("vendor_products")
      .update({ is_showcase: value })
      .eq("id", productId);
    if (error) throw error;
    await load();
  };

  const updateInboxStatus = async (
    id: string,
    status: string,
    extra: { tracking_code?: string | null; motivo_recusa?: string | null } = {}
  ) => {
    const { error } = await (supabase as any)
      .from("pharmacy_prescriptions_inbox")
      .update({ status, ...extra })
      .eq("id", id);
    if (error) throw error;
    await load();
  };

  const showcaseCount = products.filter((p) => p.is_showcase).length;
  const showcaseLimit = vendor?.max_showcase_products ?? 10;

  const grossMonth = splits
    .filter((s) => new Date(s.created_at).getMonth() === new Date().getMonth())
    .reduce((sum, s) => sum + Number(s.total_item_amount || 0), 0);
  const grossToday = splits
    .filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + Number(s.total_item_amount || 0), 0);
  const netPending = splits
    .filter((s) => s.payout_status !== "paid")
    .reduce((sum, s) => sum + Number(s.vendor_net_95pct || 0), 0);
  const platformFee = splits.reduce((sum, s) => sum + Number(s.platform_fee_5pct || 0), 0);
  const awaitingDispensation = inbox.filter((i) => ["recebida", "em_analise_farmaceutica"].includes(i.status)).length;
  const inSeparation = inbox.filter((i) => ["aprovada_dispensacao", "medicamento_separado"].includes(i.status)).length;

  return {
    loading,
    authError,
    isMaster,
    vendor,
    products,
    inbox,
    splits,
    metrics: { grossMonth, grossToday, netPending, platformFee, awaitingDispensation, inSeparation },
    showcaseCount,
    showcaseLimit,
    reload: load,
    saveProduct,
    toggleShowcase,
    updateInboxStatus,
  };
}

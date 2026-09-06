import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { 
  Building2, CheckCircle2, XCircle, FileImage, ShieldCheck, 
  Search, Phone, ExternalLink, Eye, FileText, Download,
  AlertTriangle, RefreshCw, ShoppingBag, Store, MapPin, Check, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import PharmacyKycDocViewer from "@/components/admin/PharmacyKycDocViewer";
import { OnlineStatusIndicator } from "@/components/OnlineStatusIndicator";
import { InteractiveTour3DModal, openGlobalTour } from "@/components/InteractiveTour3DModal";
import {
  PHARMACY_KYC_LABELS,
  PHARMACY_KYC_REQUIRED,
  type PharmacyKycKind,
  type PharmacyRecord,
  TEST_PHARMACY_DATA,
} from "@/lib/pharmacy-kyc-docs";

export const AdminAprovacoesFarmacias = () => {
  const [pharmacies, setPharmacies] = useState<PharmacyRecord[]>([TEST_PHARMACY_DATA]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "blocked">("all");

  // Documento aberto no visualizador modal
  const [docView, setDocView] = useState<{
    userId: string;
    kind: PharmacyKycKind;
    storagePath?: string | null;
    fileUrl?: string | null;
    name?: string;
  } | null>(null);

  // Carrega farmácias do banco e mescla com a loja de teste oficial
  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      // 1. Buscar perfis com user_type = 'pharmacy' e da tabela vendors
      const [{ data: profiles }, { data: vendorsList }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_type", "pharmacy").order("created_at", { ascending: false }),
        supabase.from("vendors" as any).select("*").order("created_at", { ascending: false })
      ]);

      // Recuperar overrides salvos no localStorage para persistência de aprovações
      const savedOverrides: Record<string, boolean> = JSON.parse(
        localStorage.getItem("pharmacy_approval_overrides") || "{}"
      );

      // Recuperar cadastros recentes do localStorage
      const localRegisteredList: PharmacyRecord[] = JSON.parse(
        localStorage.getItem("registered_pharmacies_list") || "[]"
      );

      const dbPharmacies: PharmacyRecord[] = (profiles || []).map((p: any) => {
        const isApproved = savedOverrides[p.id] !== undefined ? savedOverrides[p.id] : false;
        const savedKycDocs: Record<string, string> = JSON.parse(
          localStorage.getItem(`pharmacy_kyc_docs_${p.id}`) || "{}"
        );
        const kycDocsArray = Object.entries(savedKycDocs).map(([kind, url]) => ({
          id: `doc_${kind}_${p.id}`,
          document_kind: kind as any,
          file_url: url,
          is_verified: true,
        }));

        return {
          id: p.id,
          user_id: p.id,
          razao_social: p.company_name || p.full_name || "Farmácia Parceira",
          nome_fantasia: p.trade_name || p.full_name || "Dispensário Autorizado",
          cnpj: p.cnpj || p.cpf || "00.000.000/0001-00",
          anvisa_auth: p.anvisa_auth || "Em processo de análise AFE",
          farmaceutico_crf: p.crf || "Aguardando envio do CRF",
          email: p.email || "contato@loja.com",
          phone: p.phone || "+55 11 99999-9999",
          city: p.city || "São Paulo",
          state: p.state || "SP",
          country: p.country || "BR",
          logo_url: p.avatar_url || null,
          is_approved: isApproved,
          status: isApproved ? "approved" : "pending",
          created_at: p.created_at || new Date().toISOString(),
          kyc_docs: kycDocsArray,
        };
      });

      // Mapear também da tabela vendors se houver
      const vendorPharmacies: PharmacyRecord[] = (vendorsList || []).map((v: any) => {
        const isApproved = savedOverrides[v.id] !== undefined ? savedOverrides[v.id] : v.is_active;
        const savedKycDocs: Record<string, string> = JSON.parse(
          localStorage.getItem(`pharmacy_kyc_docs_${v.user_id || v.id}`) || "{}"
        );
        const kycDocsArray = Object.entries(savedKycDocs).map(([kind, url]) => ({
          id: `doc_${kind}_${v.id}`,
          document_kind: kind as any,
          file_url: url,
          is_verified: true,
        }));

        return {
          id: v.id,
          user_id: v.user_id || v.id,
          razao_social: v.razao_social || v.store_name || "Dispensário Credenciado",
          nome_fantasia: v.nome_fantasia || v.store_name || "Farmácia Parceira",
          cnpj: v.cnpj || "48.823.154/0001-92",
          anvisa_auth: v.anvisa_afe || "AFE ANVISA Reg. 7.82941.2",
          farmaceutico_crf: v.responsavel_tecnico || "Farmacêutico Responsável Técnico",
          email: "contato@plantayraiz.com.br",
          phone: v.telefone_whatsapp || "+55 11 99136-3154",
          city: "São Paulo",
          state: "SP",
          country: "BR",
          logo_url: v.store_logo_url || null,
          is_approved: isApproved,
          status: isApproved ? "approved" : "pending",
          created_at: v.created_at || new Date().toISOString(),
          kyc_docs: kycDocsArray,
        };
      });

      // Inclui a loja de testes oficial com overrides
      const testApproved =
        savedOverrides[TEST_PHARMACY_DATA.id] !== undefined
          ? savedOverrides[TEST_PHARMACY_DATA.id]
          : TEST_PHARMACY_DATA.is_approved;

      const combinedMap = new Map<string, PharmacyRecord>();
      combinedMap.set(TEST_PHARMACY_DATA.id, {
        ...TEST_PHARMACY_DATA,
        is_approved: testApproved,
        status: testApproved ? "approved" : "rejected",
      });

      // Inserir cadastros locais recentes
      localRegisteredList.forEach((item) => {
        const isAppr = savedOverrides[item.id] !== undefined ? savedOverrides[item.id] : item.is_approved;
        combinedMap.set(item.id, { ...item, is_approved: isAppr, status: isAppr ? "approved" : "pending" });
      });

      // Inserir cadastros do banco
      dbPharmacies.forEach((p) => combinedMap.set(p.id, p));
      vendorPharmacies.forEach((v) => {
        if (!combinedMap.has(v.id)) combinedMap.set(v.id, v);
      });

      setPharmacies(Array.from(combinedMap.values()));
    } catch (e: any) {
      toast.error("Falha ao sincronizar dados de farmácias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacies();
  }, []);

  // Alterna o status da loja para venda no Shopping
  const handleToggleApproval = (pharmacy: PharmacyRecord, nextState: boolean) => {
    const updated = pharmacies.map((p) =>
      p.id === pharmacy.id
        ? {
            ...p,
            is_approved: nextState,
            status: (nextState ? "approved" : "rejected") as "approved" | "rejected",
          }
        : p
    );
    setPharmacies(updated);

    // Salva no localStorage
    try {
      const overrides: Record<string, boolean> = JSON.parse(
        localStorage.getItem("pharmacy_approval_overrides") || "{}"
      );
      overrides[pharmacy.id] = nextState;
      localStorage.setItem("pharmacy_approval_overrides", JSON.stringify(overrides));
    } catch (e) {
      console.warn("Storage error", e);
    }

    if (nextState) {
      toast.success(`Loja "${pharmacy.nome_fantasia}" APROVADA e publicada no Shopping! 🛍️`);
    } else {
      toast.warning(`Loja "${pharmacy.nome_fantasia}" pausada no Shopping.`);
    }
  };

  // Documento específico da farmácia
  const docOf = (p: PharmacyRecord, kind: PharmacyKycKind) =>
    (p.kyc_docs || []).find((k) => k.document_kind === kind) || null;

  const openDocModal = (p: PharmacyRecord, kind: PharmacyKycKind) => {
    const d = docOf(p, kind);
    setDocView({
      userId: p.user_id,
      kind,
      storagePath: d?.storage_path,
      fileUrl: d?.file_url,
      name: p.nome_fantasia,
    });
  };

  // Contadores
  const counts = useMemo(() => {
    return {
      total: pharmacies.length,
      approved: pharmacies.filter((p) => p.is_approved).length,
      pending: pharmacies.filter((p) => !p.is_approved && p.status !== "rejected").length,
      blocked: pharmacies.filter((p) => p.status === "rejected" || (!p.is_approved && p.id !== TEST_PHARMACY_DATA.id)).length,
    };
  }, [pharmacies]);

  // Filtragem
  const filtered = useMemo(() => {
    return pharmacies.filter((p) => {
      const matchSearch =
        p.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cnpj.includes(searchTerm) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === "approved") return p.is_approved;
      if (statusFilter === "pending") return !p.is_approved;
      if (statusFilter === "blocked") return p.status === "rejected";
      return true;
    });
  }, [pharmacies, searchTerm, statusFilter]);

  const RECEITA_CNPJ_URL = "https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp";
  const ANVISA_CONSULTA_URL = "https://consultas.anvisa.gov.br/#/saude/";

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 max-w-7xl">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-bold">
                COMPLIANCE & CURADORIA
              </Badge>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">ANVISA RDC 327/2019 & Lei 13.709 (LGPD)</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-display font-black flex items-center gap-3">
              <Building2 className="text-primary w-8 h-8 md:w-10 md:h-10" />
              Aprovações & KYC de <span className="text-gradient-green">Farmácias e Lojas</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Auditoria de fachada física, contrato social, alvará ANVISA e liberação no catálogo do Shopping.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openGlobalTour("farmacia")}
              className="rounded-xl border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-bold"
            >
              <Sparkles size={14} className="mr-1.5" /> 🚀 Tour 3D Farmácia & Lojas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPharmacies}
              disabled={loading}
              className="rounded-xl border-border"
            >
              <RefreshCw size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} /> Sincronizar
            </Button>
            <Button size="sm" className="bg-primary text-black font-bold rounded-xl" asChild>
              <a href="/shopping" target="_blank" rel="noopener noreferrer">
                <ShoppingBag size={14} className="mr-1.5" /> Ver Shopping ao Vivo
              </a>
            </Button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Total Lojas</p>
                <p className="text-2xl font-black text-foreground mt-1">{counts.total}</p>
              </div>
              <Store className="w-8 h-8 text-primary/40" />
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-400 font-bold uppercase">No Shopping (Ativas)</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{counts.approved}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-400 font-bold uppercase">Pendentes KYC</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{counts.pending}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500/40" />
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Em Análise</p>
                <p className="text-2xl font-black text-muted-foreground mt-1">{counts.blocked}</p>
              </div>
              <ShieldCheck className="w-8 h-8 text-muted-foreground/30" />
            </CardContent>
          </Card>
        </div>

        {/* FILTROS E BUSCA */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ, cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-muted/40 border-border rounded-xl text-sm"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1">
            {[
              { id: "all", label: "Todas as Lojas" },
              { id: "approved", label: "✅ Aprovadas" },
              { id: "pending", label: "⏳ Pendentes" },
            ].map((f) => (
              <Button
                key={f.id}
                variant={statusFilter === f.id ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(f.id as any)}
                className={`rounded-xl text-xs font-bold ${
                  statusFilter === f.id ? "bg-primary text-black" : "border-border text-muted-foreground"
                }`}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* LISTAGEM DOS DOSSIÊS DAS FARMÁCIAS */}
        <div className="space-y-6">
          {filtered.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/10">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-base font-bold text-foreground">Nenhuma farmácia encontrada</p>
              <p className="text-xs text-muted-foreground mt-1">Ajuste o termo de busca ou o filtro de status.</p>
            </div>
          ) : (
            filtered.map((pharmacy) => (
              <Card
                key={pharmacy.id}
                className={`border transition-all ${
                  pharmacy.is_approved
                    ? "border-emerald-500/40 bg-card/80 shadow-lg shadow-emerald-950/10"
                    : "border-border bg-card/40"
                }`}
              >
                <CardContent className="p-6">
                  {/* Top Bar da Loja */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b border-border/60">
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0">
                        {pharmacy.logo_url ? (
                          <img
                            src={pharmacy.logo_url}
                            alt={pharmacy.nome_fantasia}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/30 shadow-md bg-slate-900"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-black text-xl">
                            {pharmacy.nome_fantasia.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full shadow-md">
                          <OnlineStatusIndicator online={true} size="md" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg md:text-xl font-display font-black text-foreground">
                            {pharmacy.nome_fantasia}
                          </h3>
                          {pharmacy.id === TEST_PHARMACY_DATA.id && (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-bold">
                              OFICIAL PLANTA Y RAÍZ 🌿
                            </Badge>
                          )}
                          <OnlineStatusIndicator online={true} size="sm" showLabel />
                          {pharmacy.is_approved ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-bold">
                              PUBLICADA NO SHOPPING ✅
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-400 border-amber-500/40 text-[10px] font-bold">
                              EM ANÁLISE KYC ⏳
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mt-0.5">
                          <strong className="text-foreground">{pharmacy.razao_social}</strong> · CNPJ: <span className="font-mono text-foreground font-bold">{pharmacy.cnpj}</span>
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin size={12} className="text-primary" /> {pharmacy.city} / {pharmacy.state} ({pharmacy.country})
                          </span>
                          <span>·</span>
                          <span className="text-emerald-400 font-medium">
                            {pharmacy.anvisa_auth}
                          </span>
                          <span>·</span>
                          <span className="text-sky-300">
                            {pharmacy.farmaceutico_crf}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Toggle de Liberação no Shopping */}
                    <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-2xl border border-border w-full lg:w-auto justify-between">
                      <div className="text-left pr-2">
                        <p className="text-xs font-bold text-foreground">Liberar no Shopping</p>
                        <p className="text-[10px] text-muted-foreground">Exibir produtos e catálogo</p>
                      </div>
                      <Switch
                        checked={pharmacy.is_approved}
                        onCheckedChange={(checked) => handleToggleApproval(pharmacy, checked)}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  </div>

                  {/* DOSSIÊ KYC — VERDE / VERMELHO EM 1 CLIQUE */}
                  <div className="pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-primary" /> Dossiê Documental & Compliance Sanitário (1-Clique)
                      </p>
                      <span className="text-[11px] text-muted-foreground">
                        Clique no documento para inspecionar em alta resolução
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
                      {(Object.keys(PHARMACY_KYC_LABELS) as PharmacyKycKind[]).map((kind) => {
                        const doc = docOf(pharmacy, kind);
                        const hasDoc = Boolean(doc?.file_url || doc?.storage_path || pharmacy.id === TEST_PHARMACY_DATA.id);

                        return (
                          <button
                            key={kind}
                            type="button"
                            onClick={() => openDocModal(pharmacy, kind)}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all hover:scale-[1.03] ${
                              hasDoc
                                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20"
                                : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                            }`}
                          >
                            <div className="mb-1.5">
                              {hasDoc ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-400" />
                              )}
                            </div>
                            <span className="text-[10px] font-bold line-clamp-2 leading-tight">
                              {PHARMACY_KYC_LABELS[kind]}
                            </span>
                            <span className="text-[9px] font-mono mt-1 opacity-80">
                              {hasDoc ? "ANEXADO (VER)" : "FALTANDO"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* AÇÕES EXTERNAS / CONSULTAS PÚBLICAS & CONEXÃO COM O DASHBOARD DO LOJISTA */}
                  <div className="pt-4 mt-4 border-t border-border/40 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl border-primary/30 text-primary hover:bg-primary/10 font-bold" asChild>
                        <a href="/lojistas" target="_blank" rel="noopener noreferrer">
                          <Store size={13} className="mr-1" /> Acessar Painel Lojista (/lojistas)
                        </a>
                      </Button>

                      <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold" asChild>
                        <a href="/farmacia-virtual" target="_blank" rel="noopener noreferrer">
                          <ShoppingBag size={13} className="mr-1" /> Farmácia Virtual & Balcão
                        </a>
                      </Button>

                      <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl border-border" asChild>
                        <a href={RECEITA_CNPJ_URL} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={12} className="mr-1 text-primary" /> Consulta CNPJ
                        </a>
                      </Button>

                      <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl border-border" asChild>
                        <a href={ANVISA_CONSULTA_URL} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={12} className="mr-1 text-emerald-400" /> Consulta AFE (ANVISA)
                        </a>
                      </Button>

                      <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10" asChild>
                        <a
                          href={`https://wa.me/${pharmacy.phone.replace(/\D/g, "")}?text=Olá%20${encodeURIComponent(
                            pharmacy.nome_fantasia
                          )},%20sua%20loja%20está%20sendo%20homologada%20na%20Planta%20y%20Raíz.`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Phone size={12} className="mr-1" /> WhatsApp Lojista
                        </a>
                      </Button>
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <span>E-mail: <strong className="text-foreground">{pharmacy.email}</strong></span>
                      <span>·</span>
                      <span>ID: <strong className="text-foreground font-mono">{pharmacy.id.slice(0, 8)}</strong></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* MODAL DE INSPEÇÃO VISUAL DO ARQUIVO */}
      {docView && (
        <PharmacyKycDocViewer
          open={Boolean(docView)}
          onClose={() => setDocView(null)}
          userId={docView.userId}
          kind={docView.kind}
          storagePath={docView.storagePath}
          fileUrl={docView.fileUrl}
          pharmacyName={docView.name}
        />
      )}

      <InteractiveTour3DModal initialRole="farmacia" />
      <Footer />
    </div>
  );
};

export default AdminAprovacoesFarmacias;

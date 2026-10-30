import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, UploadCloud, CheckCircle2, ShieldCheck, FileText, 
  MapPin, Phone, Mail, Store, AlertTriangle, ArrowRight, Loader2,
  Check, Sparkles, Clock, ExternalLink
} from "lucide-react";
import { PHARMACY_KYC_LABELS, type PharmacyKycKind, TEST_PHARMACY_DATA, PHARMACY_KYC_BUCKET, VENDOR_CATEGORY_DOCS, VENDOR_CATEGORY_LABELS, docsForCategory, normalizeVendorCategory, type VendorCategory } from "@/lib/pharmacy-kyc-docs";

const CATEGORY_INFO: Record<VendorCategory, { emoji: string; desc: string }> = {
  farmacia: { emoji: "💊", desc: "Farmácias e drogarias com AFE e farmacêutico RT" },
  importador: { emoji: "🌎", desc: "Empresas importadoras de produtos canabinoides (RDC 660)" },
  associacao: { emoji: "🤝", desc: "Associações de pacientes e cultivo medicinal" },
};

export default function CadastroFarmacia() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [protocolNumber, setProtocolNumber] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [category, setCategory] = useState<VendorCategory>(() =>
    normalizeVendorCategory(new URLSearchParams(window.location.search).get("categoria")),
  );
  const [authUserId, setAuthUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthUserId(data.user?.id ?? null));
  }, []);

  // Form Fields
  const [formData, setFormData] = useState({
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    email: "",
    phone: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    city: "São Paulo",
    state: "SP",
    farmaceutico_nome: "",
    farmaceutico_crf: "",
    farmaceutico_crf_uf: "SP",
    anvisa_auth: "",
    pix_key: "",
  });

  // Uploaded Files State
  const [uploadedFiles, setUploadedFiles] = useState<Partial<Record<PharmacyKycKind, { file?: File; previewUrl?: string; name?: string }>>>({});


  // CEP Auto-fill
  const handleCepBlur = async () => {
    const cleanCep = formData.cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }));
          toast({
            title: "Endereço localizado!",
            description: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
          });
        }
      } catch (e) {
        console.warn("Erro ao buscar CEP", e);
      }
    }
  };

  const handleFileChange = (kind: PharmacyKycKind, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setUploadedFiles((prev) => ({
      ...prev,
      [kind]: { file, previewUrl, name: file.name },
    }));
    toast({
      title: "Arquivo Anexado",
      description: `${PHARMACY_KYC_LABELS[kind]}: ${file.name}`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedTerms) {
      toast({
        title: "Termos Obrigatórios",
        description: "Você deve aceitar os termos de responsabilidade técnica e repasse.",
        variant: "destructive",
      });
      return;
    }

    const missing = VENDOR_CATEGORY_DOCS[category].required.filter((k) => !uploadedFiles[k]?.file);
    if (missing.length) {
      toast({
        title: "Faltam documentos obrigatórios",
        description: missing.map((k) => PHARMACY_KYC_LABELS[k]).join(" · "),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const prefix = category === "farmacia" ? "FARMA" : category === "importador" ? "IMPORT" : "ASSOC";
    const protocol = `${prefix}-${Date.now().toString().slice(-6)}`;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Entre na sua conta para enviar o cadastro.");

      // 1. Enviar documentos para o armazenamento seguro
      const kycDocuments: Record<string, string> = {};
      for (const kind of docsForCategory(category)) {
        const file = uploadedFiles[kind]?.file;
        if (!file) continue;
        const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
        const path = `${user.id}/${kind}.${ext}`;
        const { error: upErr } = await supabase.storage.from(PHARMACY_KYC_BUCKET).upload(path, file, { upsert: true });
        if (upErr) throw new Error(`Falha ao enviar "${PHARMACY_KYC_LABELS[kind]}": ${upErr.message}`);
        kycDocuments[kind] = path;
      }

      const isPharmacy = category === "farmacia";
      const responsavel = isPharmacy
        ? `${formData.farmaceutico_nome} — CRF/${formData.farmaceutico_crf_uf} ${formData.farmaceutico_crf}`
        : formData.farmaceutico_nome;
      const payload = {
        user_id: user.id,
        vendor_category: category,
        store_name: formData.nome_fantasia || formData.razao_social,
        store_description: `${VENDOR_CATEGORY_LABELS[category]} credenciada · Responsável: ${responsavel}${formData.anvisa_auth ? ` · ANVISA: ${formData.anvisa_auth}` : ""}`,
        razao_social: formData.razao_social,
        nome_fantasia: formData.nome_fantasia,
        cnpj: formData.cnpj,
        responsavel_tecnico: responsavel,
        crf_numero: isPharmacy ? formData.farmaceutico_crf : null,
        crf_uf: isPharmacy ? formData.farmaceutico_crf_uf : null,
        anvisa_afe: formData.anvisa_auth || null,
        telefone_whatsapp: formData.phone,
        pix_key: formData.pix_key,
        shipping_origin_cep: formData.cep,
        endereco_completo: {
          cep: formData.cep, logradouro: formData.logradouro, numero: formData.numero,
          bairro: formData.bairro, cidade: formData.city, uf: formData.state, email: formData.email,
        },
        kyc_documents: kycDocuments,
        contrato_social_url: kycDocuments.contrato_social_pdf || kycDocuments.estatuto_social || null,
        crf_doc_url: kycDocuments.crf_responsavel || null,
        afe_doc_url: kycDocuments.alvara_sanitario || kycDocuments.afe_importacao || kycDocuments.autorizacao_judicial || null,
      };

      // 2. Gravar cadastro (fica pausado até a aprovação do admin)
      const { data: existing } = await supabase.from("vendors").select("id").eq("user_id", user.id).maybeSingle();
      const { error: dbErr } = existing
        ? await supabase.from("vendors").update(payload).eq("id", existing.id)
        : await supabase.from("vendors").insert({ ...payload, is_active: false });
      if (dbErr) throw new Error(dbErr.message);

      await supabase.from("profiles").update({
        company_name: formData.razao_social,
        trade_name: formData.nome_fantasia,
        cnpj: formData.cnpj,
        city: formData.city,
        state: formData.state,
        phone: formData.phone,
        user_type: "pharmacy",
      } as any).eq("id", user.id);

      setProtocolNumber(protocol);
      setIsSubmitting(false);
      setSubmitted(true);
      toast({
        title: `✓ Cadastro de ${VENDOR_CATEGORY_LABELS[category]} enviado!`,
        description: `Protocolo ${protocol}. O compliance analisará seus documentos.`,
      });
    } catch (err: any) {
      console.error(err);
      setIsSubmitting(false);
      toast({
        title: "Erro no envio",
        description: err?.message || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-28 md:py-32 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <Building2 size={32} />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold">
              ANVISA RDC 327/2019 · CRF ATIVO
            </Badge>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-3">
            Credenciamento de <span className="text-gradient-green">Farmácias & Lojas</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Venda produtos canabinoides e receba receitas médicas em 1-clique com repasse automático de <strong>95% via Pix</strong>.
          </p>
        </div>

        {submitted ? (
          /* TELA DE CONFIRMAÇÃO */
          <Card className="border-emerald-500/40 bg-card/90 shadow-2xl p-6 sm:p-10 text-center">
            <CardContent className="space-y-6 pt-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/50">
                <CheckCircle2 size={48} />
              </div>

              <div className="space-y-2">
                <Badge className="bg-emerald-500 text-black font-black text-xs px-3 py-1">
                  PROTOCOLO: {protocolNumber}
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Solicitação de Credenciamento Recebida!
                </h2>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                  Os dados da sua farmácia e os <strong>documentos regulatórios KYC</strong> foram protocolados com sucesso na esteira de compliance da Planta y Raíz.
                </p>
              </div>

              {/* Resumo do Cadastro */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-muted/40 border border-border text-left text-xs max-w-2xl mx-auto">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Farmácia:</span>
                  <strong className="text-foreground">{formData.nome_fantasia || formData.razao_social}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">CNPJ:</span>
                  <strong className="text-foreground font-mono">{formData.cnpj}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Farmacêutico RT:</span>
                  <strong className="text-emerald-400">{formData.farmaceutico_nome} (CRF-{formData.farmaceutico_crf_uf})</strong>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg">
                  <Link to="/lojistas">
                    <Store size={18} className="mr-2" /> Acessar Painel do Lojista
                  </Link>
                </Button>

                <Button asChild variant="outline" size="lg" className="rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold">
                  <Link to="/admin/kyc-lojas">
                    <ShieldCheck size={18} className="mr-2" /> Acompanhar em /admin/kyc-lojas
                  </Link>
                </Button>

                <Button asChild variant="ghost" size="lg" className="rounded-xl">
                  <Link to="/">Voltar ao Início</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : authUserId === null ? (
          <Card className="border-border bg-card/60 p-6 text-center">
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm text-muted-foreground">
                Para enviar o cadastro com segurança, entre ou crie sua conta. Depois você volta direto para este formulário.
              </p>
              <Button asChild size="lg" className="rounded-xl">
                <Link to={`/login?type=farmacia&redirect=${encodeURIComponent(`/cadastro-farmacia?categoria=${category}`)}`}>
                  Entrar / Criar conta <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* FORMULÁRIO COMPLETO */
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 0. CATEGORIA */}
            <Card className="border-border bg-card/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                  <Store className="text-primary w-5 h-5" /> Qual é o seu tipo de parceiro?
                </CardTitle>
                <CardDescription className="text-xs">
                  Todos aparecem no Shopping. Só muda a lista de documentos pedida.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(Object.keys(VENDOR_CATEGORY_LABELS) as VendorCategory[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      aria-pressed={category === c}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        category === c ? "border-primary bg-primary/10" : "border-border bg-muted/30 hover:border-primary/50"
                      }`}
                    >
                      <div className="text-2xl mb-1">{CATEGORY_INFO[c].emoji}</div>
                      <div className="font-bold text-sm text-foreground">{VENDOR_CATEGORY_LABELS[c]}</div>
                      <div className="text-[11px] text-muted-foreground">{CATEGORY_INFO[c].desc}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 1. DADOS DA EMPRESA */}
            <Card className="border-border bg-card/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                  <Building2 className="text-primary w-5 h-5" /> 1. Dados Cadastrais — {VENDOR_CATEGORY_LABELS[category]}
                </CardTitle>
                <CardDescription className="text-xs">
                  Informações fiscais e de identificação jurídica perante a Receita Federal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Razão Social *</Label>
                    <Input
                      required
                      placeholder="Ex: Farmácia Botânica & Vida Ltda"
                      value={formData.razao_social}
                      onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                      className="rounded-xl bg-muted/30 border-border text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Nome Fantasia (Exibição no Shopping) *</Label>
                    <Input
                      required
                      placeholder="Ex: Farmácia Planta y Raíz Jardins"
                      value={formData.nome_fantasia}
                      onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                      className="rounded-xl bg-muted/30 border-border text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">CNPJ *</Label>
                    <Input
                      required
                      placeholder="00.000.000/0001-00"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      className="rounded-xl bg-muted/30 border-border font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">E-mail Comercial (Login) *</Label>
                    <Input
                      required
                      type="email"
                      placeholder="contato@farmacia.com.br"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="rounded-xl bg-muted/30 border-border text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold">Telefone / WhatsApp Comercial (com DDD) *</Label>
                    <Input
                      required
                      placeholder="(11) 99136-3154"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="rounded-xl bg-muted/30 border-border text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. LOCALIZAÇÃO E ENDEREÇO */}
            <Card className="border-border bg-card/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                  <MapPin className="text-primary w-5 h-5" /> 2. Endereço da Loja Física / Dispensário
                </CardTitle>
                <CardDescription className="text-xs">
                  Localização para cálculo de frete e rastreamento satélite de entregas aos pacientes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">CEP *</Label>
                    <Input
                      required
                      placeholder="01310-100"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      onBlur={handleCepBlur}
                      className="rounded-xl bg-muted/30 border-border font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold">Logradouro / Avenida *</Label>
                    <Input
                      required
                      placeholder="Av. Paulista"
                      value={formData.logradouro}
                      onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                      className="rounded-xl bg-muted/30 border-border text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Número *</Label>
                    <Input
                      required
                      placeholder="1106"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      className="rounded-xl bg-muted/30 border-border text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Bairro *</Label>
                    <Input
                      required
                      placeholder="Bela Vista"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      className="rounded-xl bg-muted/30 border-border text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Cidade *</Label>
                      <Input
                        required
                        placeholder="São Paulo"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="rounded-xl bg-muted/30 border-border text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">UF *</Label>
                      <Input
                        required
                        maxLength={2}
                        placeholder="SP"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                        className="rounded-xl bg-muted/30 border-border text-sm font-bold text-center"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. RESPONSÁVEL TÉCNICO & REGULATÓRIO */}
            <Card className="border-border bg-card/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                  <ShieldCheck className="text-emerald-400 w-5 h-5" /> 3. {category === "farmacia" ? "Responsabilidade Técnica & ANVISA" : category === "importador" ? "Responsável Legal & Autorização ANVISA" : "Presidente / Diretora & Autorizações"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {category === "farmacia"
                    ? "Dados do Farmacêutico RT responsável e autorização de funcionamento sanitário."
                    : category === "importador"
                      ? "Responsável legal da importadora e autorização ANVISA para importação."
                      : "Nome de quem representa a associação e, se houver, a autorização judicial ou da ANVISA."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold">{category === "farmacia" ? "Nome Completo do Farmacêutico RT *" : category === "importador" ? "Nome Completo do Responsável Legal *" : "Nome Completo da Presidente / Diretora *"}</Label>
                    <Input
                      required
                      placeholder="Nome completo"
                      value={formData.farmaceutico_nome}
                      onChange={(e) => setFormData({ ...formData, farmaceutico_nome: e.target.value })}
                      className="rounded-xl bg-muted/30 border-border text-sm"
                    />
                  </div>

                  {category === "farmacia" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">CRF *</Label>
                      <Input
                        required
                        placeholder="49354"
                        value={formData.farmaceutico_crf}
                        onChange={(e) => setFormData({ ...formData, farmaceutico_crf: e.target.value })}
                        className="rounded-xl bg-muted/30 border-border text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">UF CRF *</Label>
                      <Input
                        required
                        maxLength={2}
                        placeholder="SP"
                        value={formData.farmaceutico_crf_uf}
                        onChange={(e) => setFormData({ ...formData, farmaceutico_crf_uf: e.target.value.toUpperCase() })}
                        className="rounded-xl bg-muted/30 border-border text-sm font-bold text-center"
                      />
                    </div>
                  </div>
                  )}

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold">{category === "farmacia" ? "Autorização de Funcionamento ANVISA (AFE) *" : category === "importador" ? "Nº AFE / Autorização ANVISA de Importação *" : "Nº da Autorização Judicial / ANVISA (se houver)"}</Label>
                    <Input
                      required={category !== "associacao"}
                      placeholder="Ex: AFE-ANVISA 7.82941.2 / 2026"
                      value={formData.anvisa_auth}
                      onChange={(e) => setFormData({ ...formData, anvisa_auth: e.target.value })}
                      className="rounded-xl bg-muted/30 border-border text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Chave Pix para Repasses *</Label>
                    <Input
                      required
                      placeholder="CNPJ, Chave Aleatória ou E-mail"
                      value={formData.pix_key}
                      onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                      className="rounded-xl bg-muted/30 border-border text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. UPLOAD DOS 7 DOCUMENTOS KYC */}
            <Card className="border-border bg-card/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                  <UploadCloud className="text-primary w-5 h-5" /> 4. Documentos — {VENDOR_CATEGORY_LABELS[category]}
                </CardTitle>
                <CardDescription className="text-xs">
                  Anexe os documentos marcados como obrigatórios. Os opcionais ajudam a aprovar mais rápido. Aceita foto ou PDF.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docsForCategory(category).map((kind) => {
                    const uploaded = uploadedFiles[kind] || {};
                    const isRequired = VENDOR_CATEGORY_DOCS[category].required.includes(kind);
                    const isAttached = Boolean(uploaded.name || uploaded.previewUrl);

                    return (
                      <div
                        key={kind}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          isAttached
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                            : "bg-muted/30 border-dashed border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">
                              {PHARMACY_KYC_LABELS[kind]}
                            </span>
                            {isAttached ? (
                              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-bold">
                                <Check size={11} className="mr-1" /> Anexado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground border-border text-[10px]">
                                {isRequired ? "Obrigatório" : "Opcional"}
                              </Badge>
                            )}
                          </div>
                          {isAttached && (
                            <p className="text-[10px] text-emerald-400 truncate font-mono">
                              📄 {uploaded.name || "Arquivo pronto"}
                            </p>
                          )}
                        </div>

                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileChange(kind, file);
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant={isAttached ? "outline" : "default"}
                            className={`w-full text-xs h-8 rounded-xl font-bold pointer-events-none ${
                              isAttached
                                ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                                : "bg-primary text-black hover:bg-primary/90"
                            }`}
                          >
                            <UploadCloud size={14} className="mr-1.5" />
                            {isAttached ? "Substituir Arquivo" : "Selecionar Arquivo"}
                          </Button>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 5. TERMOS & SUBMIT */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms-check"
                  checked={agreedTerms}
                  onCheckedChange={(c) => setAgreedTerms(Boolean(c))}
                  className="mt-1"
                />
                <label htmlFor="terms-check" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  Declaro que as informações e documentos enviados são autênticos e conferem com as normas da <strong>ANVISA RDC 327/2019</strong>, <strong>RDC 660/2022</strong> e Conselho Regional de Farmácia. Concordo com a taxa de intermediação de 5% sobre produtos faturados no marketplace da <strong>Planta y Raíz Ltda (CNPJ 58.283.475/0001-00)</strong>.
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || !agreedTerms}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base md:text-lg h-14 rounded-2xl shadow-xl shadow-emerald-950/40 gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Protocolando Credenciamento & Enviando Documentos...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    Concluir Cadastro & Enviar para Auditoria KYC
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}

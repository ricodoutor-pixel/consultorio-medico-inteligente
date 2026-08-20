import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { SERVICE_MENU, SERVICES, PREMIUM_SUGGESTED_PRICE, FIXED_SERVICE_NOTICE, formatBRL } from "@/lib/pricing";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Upload, UserPlus, ArrowRight, ShieldCheck, AlertTriangle, Lock, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { KYC_BUCKET, KYC_LABELS, type KycKind } from "@/lib/kyc-docs";

import { categories, COUNCIL_CONFIG } from "@/data/professionals";
import { motion } from "framer-motion";
import {
  DocumentType,
  formatCPFInput,
  formatRNEInput,
  validateDocument,
  getDocumentPlaceholder,
  getDocumentLabel,
} from "@/lib/document-validators";
import {
  trackMedicalSignupStarted,
  trackKYCSubmissionAttempt,
  trackKYCValidationFailed,
  trackKYCValidationSuccess,
} from "@/lib/analytics";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

type Country = "BR" | "BO";

const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

// Departamentos de Bolivia
const BO_DEPTS = [
  { code: "LP", name: "La Paz" },
  { code: "SC", name: "Santa Cruz" },
  { code: "CB", name: "Cochabamba" },
  { code: "OR", name: "Oruro" },
  { code: "PT", name: "Potosí" },
  { code: "CH", name: "Chuquisaca" },
  { code: "TJ", name: "Tarija" },
  { code: "BE", name: "Beni" },
  { code: "PD", name: "Pando" },
];

// Principales ciudades de Bolivia (cobertura para teleconsulta)
const BO_CITIES = [
  "La Paz","El Alto","Santa Cruz de la Sierra","Cochabamba","Sucre","Oruro",
  "Potosí","Tarija","Trinidad","Cobija","Quillacollo","Sacaba","Montero",
  "Warnes","Yacuiba","Riberalta","Camiri","Villa Tunari","Viacha","Llallagua",
];

// i18n simples (PT / ES)
const STRINGS = {
  BR: {
    title: "Cadastro de",
    titleHl: "Profissional",
    subtitle: "Atenda pacientes de todo o Brasil com preços populares. Preencha o formulário e aguarde a verificação KYC.",
    country: "País de atuação *",
    nome: "Nome Completo *",
    nomePh: "Seu nome completo",
    email: "E-mail *",
    phone: "Telefone / WhatsApp *",
    phonePh: "(11) 99999-9999",
    category: "Categoria *",
    categoryPh: "Selecione a categoria",
    kyc: "Verificação KYC (Know Your Customer)",
    docType: "Tipo de Documento *",
    registry: "Registro Profissional (CRM / COREN / CRF / CRP) *",
    registryPh: "123456",
    registryUF: "UF do Registro *",
    value: "Valor por Orientação Técnica (R$) *",
    cityUF: "Cidade / UF",
    cityUFPh: "São Paulo / SP",
    attType: "Tipo de Atendimento",
    avail: "Disponibilidade",
    availPh: "Ex: Seg-Sex 9h-17h",
    plan: "Plano de Assinatura",
    bio: "Resumo de Atuação (bio) *",
    bioPh: "Descreva sua experiência, especialidades e abordagem...",
    photo: "Foto de Perfil",
    docs: "Documentos (opcional)",
    submit: "Enviar Cadastro & Iniciar Verificação KYC",
    submitting: "Verificando dados...",
    lgpd: "Autorizo o tratamento dos meus dados pessoais conforme a LGPD e concordo com os Termos de Uso e Política de Privacidade da plataforma Planta & Raiz.",
    chat: "Chat", video: "Vídeo", both: "Chat + Vídeo",
  },
  BO: {
    title: "Registro de",
    titleHl: "Profesional",
    subtitle: "Atienda pacientes en toda Bolivia. Complete el formulario y espere la verificación KYC (Colegio Médico).",
    country: "País donde atenderá *",
    nome: "Nombre Completo *",
    nomePh: "Su nombre completo",
    email: "Correo electrónico *",
    phone: "Teléfono / WhatsApp *",
    phonePh: "+591 7 1234567",
    category: "Categoría *",
    categoryPh: "Seleccione la categoría",
    kyc: "Verificación KYC (Colegio Médico de Bolivia)",
    docType: "Tipo de Documento *",
    registry: "Matrícula Profesional (Colegio Médico / SEDES) *",
    registryPh: "Ej: 12345",
    registryUF: "Departamento de la Matrícula *",
    value: "Valor por Orientación Técnica (Bs / USD) *",
    cityUF: "Ciudad",
    cityUFPh: "Seleccione la ciudad",
    attType: "Tipo de Atención",
    avail: "Disponibilidad",
    availPh: "Ej: Lun-Vie 9h-17h",
    plan: "Plan de Suscripción",
    bio: "Resumen de Actuación (bio) *",
    bioPh: "Describa su experiencia, especialidades y abordaje...",
    photo: "Foto de Perfil",
    docs: "Documentos (opcional)",
    submit: "Enviar Registro & Iniciar Verificación KYC",
    submitting: "Verificando datos...",
    lgpd: "Autorizo el tratamiento de mis datos personales conforme a la Ley N° 1581 de Bolivia y acepto los Términos de Uso y Política de Privacidad de la plataforma Planta & Raíz.",
    chat: "Chat", video: "Video", both: "Chat + Video",
  },
} as const;

const CadastroProfissional = () => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [country, setCountry] = useState<Country>("BR");
  const t = STRINGS[country];

  // Track funnel start
  useEffect(() => { trackMedicalSignupStarted(); }, []);
  const [documentType, setDocumentType] = useState<DocumentType>("cpf");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentValidation, setDocumentValidation] = useState<{ valid: boolean; message: string } | null>(null);
  const [form, setForm] = useState({
    nomeCompleto: "",
    email: "",
    password: "",
    passwordConfirm: "",
    telefone: "",
    categoria: "",
    pricePremium: String(PREMIUM_SUGGESTED_PRICE),
    pixKey: "",
    pixType: "cpf",
    resumoAtuacao: "",
    registroProfissional: "",
    crmUF: "SP",
    cidadeUF: "",
    atendimento: "chat",
    disponibilidade: "",
    plano: "basic",
    dateOfBirth: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    uf: "",
  });

  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [savedCredentials, setSavedCredentials] = useState<{ email: string; password: string } | null>(null);

  // KYC uploads (frente/verso obrigatórios + CPF, endereço, selfie)
  const [kycFiles, setKycFiles] = useState<Partial<Record<KycKind, File | null>>>({
    crm_front: null, crm_back: null, id_front: null, id_back: null,
    cpf_doc: null, address_proof: null, selfie: null, icp_brasil: null
  });
  const MAX_KYC_BYTES = 5 * 1024 * 1024; // 5MB
  const isCuidadorSel = form.categoria === "Cuidadores de Idosos";
  const [cepLoading, setCepLoading] = useState(false);

  /** ViaCEP — preenche logradouro, bairro, cidade e UF automaticamente */
  const handleCep = async (raw: string) => {
    const masked = raw.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
    handleChange("cep", masked);
    const digits = masked.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data?.erro) {
        toast({ title: "CEP não encontrado", variant: "destructive" });
        return;
      }
      setForm((p) => ({
        ...p,
        logradouro: data.logradouro || p.logradouro,
        bairro: data.bairro || p.bairro,
        cidadeUF: data.localidade ? `${data.localidade}` : p.cidadeUF,
        crmUF: data.uf || p.crmUF,
        uf: data.uf || "",
      }));
      toast({ title: "Endereço preenchido automaticamente", description: `${data.logradouro || ""} — ${data.localidade}/${data.uf}` });
    } catch {
      toast({ title: "Não foi possível consultar o CEP", variant: "destructive" });
    } finally {
      setCepLoading(false);
    }
  };

  const handleKycFile = (kind: KycKind) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f && f.size > MAX_KYC_BYTES) {
      toast({ title: "Arquivo muito grande", description: "Máximo 5MB (JPG/PNG/PDF).", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setKycFiles((p) => ({ ...p, [kind]: f }));
  };


  // Cuando cambia el país, ajustar tipos de documento y departamento por defecto
  useEffect(() => {
    if (country === "BO") {
      setDocumentType("ci");
      setDocumentNumber("");
      setDocumentValidation(null);
      setForm((p) => ({ ...p, crmUF: "LP", cidadeUF: "" }));
    } else {
      setDocumentType("cpf");
      setDocumentNumber("");
      setDocumentValidation(null);
      setForm((p) => ({ ...p, crmUF: "SP", cidadeUF: "" }));
    }
  }, [country]);

  const docOptions = useMemo(() => {
    if (country === "BO") {
      return [
        { value: "ci", label: "🇧🇴 Cédula de Identidad (CI)" },
        { value: "passport", label: "🌎 Pasaporte" },
      ];
    }
    return [
      { value: "cpf", label: "🇧🇷 CPF (Brasileiro)" },
      { value: "passport", label: "🌎 Passaporte (Estrangeiro)" },
      { value: "rne", label: "🌎 RNE (Estrangeiro Residente)" },
    ];
  }, [country]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDocumentChange = (value: string) => {
    let formatted = value;
    if (documentType === "cpf") formatted = formatCPFInput(value);
    else if (documentType === "rne") formatted = formatRNEInput(value);
    else if (documentType === "ci") formatted = value.toUpperCase().replace(/[^0-9A-Z-]/g, "").slice(0, 13);
    else formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);

    setDocumentNumber(formatted);

    const cleaned = formatted.replace(/[\s.\-/]/g, "");
    if (cleaned.length >= 5) {
      setDocumentValidation(validateDocument(documentType, formatted));
    } else {
      setDocumentValidation(null);
    }
  };

  const handleDocumentTypeChange = (type: DocumentType) => {
    setDocumentType(type);
    setDocumentNumber("");
    setDocumentValidation(null);
  };

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const phoneIsValid = (phone: string): boolean => {
    if (!phone) return false;
    try {
      return isValidPhoneNumber(phone);
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nomeCompleto || !form.email || !form.telefone || !form.categoria) {
      toast({ title: country === "BO" ? "Complete todos los campos obligatorios" : "Preencha todos os campos obrigatórios (Nome, E-mail, Telefone, Categoria)", variant: "destructive" });
      return;
    }
    // Auto-fill sensible defaults if optional price/pix fields were left blank
    if (!form.pricePremium) form.pricePremium = String(PREMIUM_SUGGESTED_PRICE);
    if (!form.pixKey) form.pixKey = form.telefone;
    if (!form.resumoAtuacao) form.resumoAtuacao = "Médico Prescritor atuante em Medicina Canabinoide e Saúde Integral.";

    if (form.password.length < 8) {
      toast({ title: country === "BO" ? "Contraseña muy corta (mín. 8)" : "Senha muito curta (mín. 8 caracteres)", variant: "destructive" });
      return;
    }
    if (form.password !== form.passwordConfirm) {
      toast({ title: country === "BO" ? "Las contraseñas no coinciden" : "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (form.nomeCompleto.length < 3 || form.nomeCompleto.length > 100) {
      toast({ title: "Nome inválido", description: "3 a 100 caracteres.", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast({ title: country === "BO" ? "Correo inválido" : "E-mail inválido", variant: "destructive" });
      return;
    }
    if (!phoneIsValid(form.telefone)) {
      toast({
        title: country === "BO" ? "Teléfono inválido" : "Telefone inválido",
        description: country === "BO" ? "Use formato +591 7 1234567" : "Insira um telefone válido com DDD (ex: 54 99364-6065).",
        variant: "destructive",
      });
      return;
    }
    if (form.resumoAtuacao.length > 500) {
      toast({ title: "Resumo muito longo", description: "Máximo 500 caracteres.", variant: "destructive" });
      return;
    }
    if (!documentNumber) {
      toast({
        title: country === "BO" ? "Documento obligatorio" : "Documento obrigatório",
        description: country === "BO" ? "Informe su CI o Pasaporte." : "Informe seu CPF, Passaporte ou RNE.",
        variant: "destructive",
      });
      return;
    }
    if (documentValidation && !documentValidation.valid) {
      trackKYCValidationFailed(
        documentType === "cpf" ? "CPF_INVALID" : documentType === "rne" ? "RNE_INVALID" : documentType === "ci" ? "CI_INVALID" : "PASSPORT_INVALID",
        documentValidation.message
      );
      toast({ title: country === "BO" ? "Documento inválido" : "Documento inválido", description: documentValidation.message, variant: "destructive" });
      return;
    }
    const isCuidador = form.categoria === "Cuidadores de Idosos";
    if (!isCuidador && !form.registroProfissional) {
      trackKYCValidationFailed("CRM_MISSING", "Registro profissional não informado");
      toast({
        title: country === "BO" ? "Matrícula obligatoria" : "Registro profissional obrigatório",
        description: country === "BO" ? "Informe su matrícula del Colegio Médico." : "Informe seu registro de conselho (ex: CRM).",
        variant: "destructive",
      });
      return;
    }
    if (!lgpdConsent) {
      toast({ title: country === "BO" ? "Acepte los términos para continuar" : "Aceite os termos para continuar", variant: "destructive" });
      return;
    }
    if (!form.dateOfBirth) {
      toast({ title: "Informe a data de nascimento", variant: "destructive" });
      return;
    }
    if (country !== "BO" && form.cep.replace(/\D/g, "").length !== 8) {
      toast({ title: "CEP inválido", description: "Informe o CEP completo para preenchimento automático do endereço.", variant: "destructive" });
      return;
    }
    if (!kycFiles["cpf_doc"] || !kycFiles["address_proof"]) {
      toast({
        title: "Documentos Incompletos",
        description: "Anexe o documento do CPF e o comprovante de endereço (CEP).",
        variant: "destructive",
      });
      return;
    }

    // 🔐 KYC Rigoroso: Documentos obrigatórios (frente e verso)
    if (!isCuidador) {
      if (!kycFiles["crm_front"] || !kycFiles["crm_back"] || !kycFiles["icp_brasil"]) {
          toast({
            title: country === "BO" ? "Documentos Incompletos" : "Documentos Incompletos",
            description: country === "BO"
              ? "Obligatorio enviar el FRENTE y DORSO de su Matrícula Médica y Firma Digital."
              : "Obrigatório enviar a FRENTE, o VERSO do seu registro, e a Assinatura ICP-Brasil.",
            variant: "destructive",
          });
        return;
      }
    } else {
      if (!kycFiles["id_front"] || !kycFiles["id_back"]) {
        toast({
          title: country === "BO" ? "Documentos Incompletos" : "Documentos Incompletos",
          description: country === "BO"
            ? "Obligatorio enviar el FRENTE y DORSO de su CI."
            : "Obrigatório enviar a FRENTE e o VERSO do seu RG/CNH.",
          variant: "destructive",
        });
        return;
      }
    }

    trackKYCSubmissionAttempt(documentType);
    setLoading(true);

    try {
      // 1) Create Supabase auth user with password (real persistence)
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard-medico`,
          data: {
            full_name: form.nomeCompleto,
            role: "doctor",
            country,
            phone: form.telefone,
          },
        },
      });
      if (signUpErr) throw signUpErr;
      const userId = signUpData.user?.id;
      if (!userId) throw new Error("Falha ao criar usuário");

      // 2) Upsert profile (id = auth user id)
      const { error: profErr } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: form.nomeCompleto,
        phone: form.telefone,
        cpf: documentType === "cpf" ? documentNumber : null,
        date_of_birth: form.dateOfBirth || null,
        country,
        city: form.cidadeUF || null,
        region: form.uf || form.crmUF || null,
        cep: form.cep || null,
        address_street: form.logradouro || null,
        address_number: form.numero || null,
        address_complement: form.complemento || null,
        neighborhood: form.bairro || null,
        user_type: "doctor",
        signup_role: "doctor",
        avatar_url: fotoPreview,
        pix_key: form.pixKey,
        pix_type: form.pixType,
      } as any);
      if (profErr) console.error("[profile upsert]", profErr);


      // 3) Insert doctor record (status: pending verification)
      const { error: docErr } = await supabase.from("doctors").insert({
        user_id: userId,
        crm: isCuidador ? `CUIDADOR-${documentNumber.slice(-6)}` : form.registroProfissional,
        crm_state: form.crmUF,
        specialty: form.categoria,
        bio: form.resumoAtuacao,
        // Valores 1–4 padronizados pela plataforma; Premium definido pelo profissional.
        consultation_price: SERVICES.consulta_chat.price,
        price_video_chat: Math.min(2000, Math.max(100, Number(form.pricePremium) || PREMIUM_SUGGESTED_PRICE)),
        price_chat_only: SERVICES.consulta_chat.price,
        price_return: SERVICES.retorno_consulta.price,
        is_approved_by_admin: false,
        approval_status: 'pending',
        document_type: documentType,
        country,
        city: form.cidadeUF || null,
        is_verified: false,
        is_online: false,
        is_available: false,
        kyc_status: "pending",
        plan_tier: form.plano,
      });
      if (docErr) console.error("[doctor insert]", docErr);

      // 4) Upload KYC (bucket privado real) + registro em doctor_kyc_documents
      const uploads: Promise<unknown>[] = [];
      const kycRows: any[] = [];
      for (const kind of Object.keys(kycFiles) as KycKind[]) {
        const file = kycFiles[kind];
        if (!file) continue;
        const ext = (file.name.split(".").pop() || "bin").toLowerCase().slice(0, 5);
        const path = `${userId}/${kind}.${ext}`;
        kycRows.push({
          doctor_user_id: userId,
          document_kind: kind,
          storage_path: path,
          verification_status: "pending",
        });
        uploads.push(
          supabase.storage
            .from(KYC_BUCKET)
            .upload(path, file, { upsert: true, contentType: file.type || undefined })
            .then(({ error }) => {
              if (error) throw error;
            })
            .catch((err) => {
              console.error("[kyc upload]", kind, err);
              throw new Error(`Falha ao fazer upload de ${KYC_LABELS[kind]}`);
            })
        );
      }

      try {
        await Promise.all(uploads);
        if (kycRows.length) {
          const { error: kycErr } = await supabase
            .from("doctor_kyc_documents" as any)
            .upsert(kycRows, { onConflict: "doctor_user_id,document_kind" });
          if (kycErr) console.error("[kyc rows]", kycErr);
        }
      } catch (err: any) {
        toast({ title: "Erro no Upload", description: err?.message || "Ocorreu um erro ao salvar os documentos. Tente novamente.", variant: "destructive" });
        setLoading(false);
        return;
      }


      // 5) Disparo WhatsApp (Enf. Brisa) — não bloqueante
      try {
        await supabase.functions.invoke("send-doctor-welcome-whatsapp", {
          body: {
            phone: form.telefone,
            fullName: form.nomeCompleto,
            email: form.email.trim().toLowerCase(),
            country,
          },
        });
      } catch (waErr) {
        console.warn("[whatsapp welcome] falhou:", waErr);
      }

      setSavedCredentials({ email: form.email.trim().toLowerCase(), password: form.password });
      setLoading(false);
      setSubmitted(true);
      trackKYCValidationSuccess(documentType);
      toast({
        title: country === "BO" ? "¡Registro guardado!" : "Cadastro salvo com sucesso!",
        description: country === "BO"
          ? "Sus credenciales fueron creadas y enviadas por WhatsApp."
          : "Suas credenciais foram enviadas para seu WhatsApp.",
      });
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || String(err);
      const friendly = /already registered|already exists/i.test(msg)
        ? (country === "BO" ? "Este correo ya está registrado. Inicie sesión." : "Este e-mail já está cadastrado. Faça login.")
        : msg;
      toast({ title: country === "BO" ? "Error al guardar" : "Erro ao salvar cadastro", description: friendly, variant: "destructive" });
    }
  };

  if (submitted) {
    const isBO = country === "BO";
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <section className="pt-24 pb-16 md:pt-32">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <CheckCircle2 size={64} className="text-primary mx-auto mb-6" />
              <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4">
                {isBO ? "¡Registro " : "Cadastro "}<span className="text-gradient-green">{isBO ? "Enviado!" : "Enviado!"}</span>
              </h1>
              <p className="text-muted-foreground text-lg mb-2">
                {isBO ? "Su registro fue recibido con estado " : "Seu cadastro foi recebido com status "}
                <strong className="text-primary">{isBO ? "PENDIENTE DE VERIFICACIÓN KYC" : "PENDENTE DE VERIFICAÇÃO KYC"}</strong>.
              </p>
              
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-4 text-emerald-700 dark:text-emerald-400">
                <p className="font-bold mb-1 flex items-center justify-center gap-2">
                  <Lock size={16} />
                  Verificação em Duas Etapas
                </p>
                <p className="text-sm">
                  Enviamos um e-mail de boas-vindas com um link de acesso. Por favor, confirme o recebimento para ativar completamente as comunicações da sua conta.
                  <br/>
                  <span className="text-xs opacity-80">(Caso feche esta janela, você continuará tendo acesso ao painel, mas o e-mail servirá como lembrete).</span>
                </p>
              </div>

              <p className="text-muted-foreground mb-4">
                {isBO
                  ? "El sistema está validando automáticamente su matrícula con el Colegio Médico de Bolivia."
                  : "O sistema está validando automaticamente seu CRM junto ao conselho médico e verificando seus documentos."}
              </p>
              {savedCredentials && (
                <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary mb-6 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock size={18} className="text-primary" />
                    <span className="font-black text-sm text-foreground">
                      {isBO ? "🔐 Sus credenciales de acceso (guárdelas)" : "🔐 Suas credenciais de acesso (guarde agora)"}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2 bg-background/60 rounded-lg px-3 py-2">
                      <code className="text-foreground break-all">{savedCredentials.email}</code>
                      <button type="button" onClick={() => { navigator.clipboard.writeText(savedCredentials.email); toast({ title: "E-mail copiado" }); }} className="text-primary"><Copy size={14} /></button>
                    </div>
                    <div className="flex items-center justify-between gap-2 bg-background/60 rounded-lg px-3 py-2">
                      <code className="text-foreground break-all">{savedCredentials.password}</code>
                      <button type="button" onClick={() => { navigator.clipboard.writeText(savedCredentials.password); toast({ title: "Senha copiada" }); }} className="text-primary"><Copy size={14} /></button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {isBO ? "Acceda en /login. Esta es la única vez que mostraremos su contraseña." : "Acesse em /login. Esta é a única vez que mostramos sua senha."}
                  </p>
                </div>
              )}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border mb-8 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={18} className="text-primary" />
                  <span className="font-bold text-sm text-foreground">{isBO ? "Etapas de la Verificación KYC:" : "Etapas da Verificação KYC:"}</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>✅ {isBO ? "Validación del formato del documento" : "Validação do formato do documento"} ({documentType.toUpperCase()})</li>
                  <li>✅ {isBO ? "Cuenta creada — puede iniciar sesión ahora" : "Conta criada — você já pode logar agora"}</li>
                  <li>⏳ {isBO ? "Consulta al Colegio Médico / SEDES" : "Validação CRM junto ao Conselho Federal de Medicina"}</li>
                  <li>⏳ {isBO ? "Liberación del Dashboard Médico (≤ 24h)" : "Liberação do Dashboard Médico (≤ 24h)"}</li>
                </ul>
              </div>

              {/* Botão Principal — Entrar direto no Consultório Virtual */}
              <div className="flex flex-col gap-3 justify-center items-center mb-6 w-full">
                <Button className="w-full text-lg py-6 font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:scale-[1.02] shadow-xl rounded-2xl glow-green" asChild>
                  <a href="/consultorio">
                    🚀 {isBO ? "Ir al Consultorio Virtual Ahora" : "Entrar Direto no Consultório Virtual"} <ArrowRight size={20} className="ml-2" />
                  </a>
                </Button>
              </div>

              <div className="flex gap-3 justify-center flex-wrap">
                <Button variant="outline" className="font-bold border-border rounded-2xl" asChild>
                  <a href="/login">{isBO ? "Iniciar Sesión" : "Fazer Login"}</a>
                </Button>
                <Button variant="outline" className="font-bold border-border rounded-2xl" asChild>
                  <a href="/profissionais">{isBO ? "Ver Profesionales" : "Ver Profissionais"}</a>
                </Button>
                <Button variant="outline" className="font-bold border-border rounded-2xl" asChild>
                  <a href="https://wa.me/5511991363154?text=Olá!%20Enviei%20meu%20cadastro%20de%20profissional" target="_blank" rel="noopener noreferrer">
                    {isBO ? "Hablar con Soporte" : "Falar com Suporte"}
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const isBO = country === "BO";
  const regionOptions = isBO ? BO_DEPTS.map((d) => ({ v: d.code, l: `${d.code} — ${d.name}` })) : UF_OPTIONS.map((u) => ({ v: u, l: u }));

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div className="text-center mb-10" initial="hidden" animate="visible" variants={fadeUp}>
            <UserPlus size={40} className="text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4">
              {t.title} <span className="text-gradient-green">{t.titleHl}</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t.subtitle}</p>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="border-border">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* País de atuação */}
                  <div className="space-y-2 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                    <Label htmlFor="country" className="font-bold">{t.country}</Label>
                    <Select value={country} onValueChange={(v) => setCountry(v as Country)}>
                      <SelectTrigger id="country">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BR">🇧🇷 Brasil (CFM / CRM)</SelectItem>
                        <SelectItem value="BO">🇧🇴 Bolivia (Colegio Médico / SEDES)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      {isBO
                        ? "El formulario se adapta a la normativa boliviana: CI, matrícula del Colegio Médico y departamentos."
                        : "El formulário se adapta à normativa brasileira: CPF, CRM e UFs."}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeCompleto">{t.nome}</Label>
                      <Input id="nomeCompleto" placeholder={t.nomePh} value={form.nomeCompleto} onChange={(e) => handleChange("nomeCompleto", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t.email}</Label>
                      <Input id="email" type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => handleChange("email", e.target.value)} required />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">{country === "BO" ? "Contraseña (mín. 8) *" : "Senha de acesso (mín. 8) *"}</Label>
                      <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" value={form.password} onChange={(e) => handleChange("password", e.target.value)} required minLength={8} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordConfirm">{country === "BO" ? "Confirmar contraseña *" : "Confirmar senha *"}</Label>
                      <Input id="passwordConfirm" type="password" autoComplete="new-password" placeholder="••••••••" value={form.passwordConfirm} onChange={(e) => handleChange("passwordConfirm", e.target.value)} required minLength={8} />
                    </div>
                  </div>

                  {/* 🗓️ Nascimento + 📍 Endereço com CEP automático */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Data de nascimento *</Label>
                      <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(e) => handleChange("dateOfBirth", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP * {cepLoading && <span className="text-[10px] text-muted-foreground">buscando…</span>}</Label>
                      <Input id="cep" inputMode="numeric" placeholder="00000-000" value={form.cep} onChange={(e) => handleCep(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numero">Número *</Label>
                      <Input id="numero" placeholder="123" value={form.numero} onChange={(e) => handleChange("numero", e.target.value)} required />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logradouro">Logradouro</Label>
                      <Input id="logradouro" value={form.logradouro} onChange={(e) => handleChange("logradouro", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input id="bairro" value={form.bairro} onChange={(e) => handleChange("bairro", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input id="complemento" placeholder="Sala / Apto" value={form.complemento} onChange={(e) => handleChange("complemento", e.target.value)} />
                    </div>
                  </div>


                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">{t.phone}</Label>
                      <PhoneInput
                        id="telefone"
                        international
                        defaultCountry={country === "BO" ? "BO" : "BR"}
                        placeholder={t.phonePh}
                        value={form.telefone}
                        onChange={(v) => handleChange("telefone", v || "")}
                        className="phone-input-custom"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoria">{t.category}</Label>
                      <Select value={form.categoria} onValueChange={(v) => handleChange("categoria", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t.categoryPh} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* KYC Section */}
                  <div className="p-4 rounded-2xl bg-muted/10 border border-primary/20 space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-primary" />
                      <span className="font-bold text-sm text-foreground">{t.kyc}</span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t.docType}</Label>
                        <Select value={documentType} onValueChange={(v) => handleDocumentTypeChange(v as DocumentType)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {docOptions.map((d) => (
                              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="documentNumber">{getDocumentLabel(documentType)} *</Label>
                        <Input
                          id="documentNumber"
                          placeholder={getDocumentPlaceholder(documentType)}
                          value={documentNumber}
                          onChange={(e) => handleDocumentChange(e.target.value)}
                          required
                        />
                        {documentValidation && (
                          <p className={`text-xs flex items-center gap-1 ${documentValidation.valid ? "text-primary" : "text-destructive"}`}>
                            {documentValidation.valid ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                            {documentValidation.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {form.categoria === "Cuidadores de Idosos" ? (
                      <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                        <p className="text-xs text-foreground font-bold mb-1">👴 Cuidador de Idosos</p>
                        <p className="text-[11px] text-muted-foreground">
                          {isBO
                            ? "Para esta categoría no se requiere matrícula profesional. La verificación se hace solo con el documento."
                            : "Para esta categoria não é necessário registro em conselho profissional. A verificação é feita exclusivamente pelo CPF informado acima."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="registroProfissional">
                            {isBO ? t.registry : (COUNCIL_CONFIG[form.categoria]?.councilLabel
                              ? `${COUNCIL_CONFIG[form.categoria].councilLabel} — Número do Registro *`
                              : t.registry)}
                          </Label>
                          {COUNCIL_CONFIG[form.categoria]?.councilFull && !isBO && (
                            <p className="text-[11px] text-muted-foreground -mt-1">
                              {COUNCIL_CONFIG[form.categoria].councilFull}
                            </p>
                          )}
                          <Input
                            id="registroProfissional"
                            placeholder={isBO ? t.registryPh : (COUNCIL_CONFIG[form.categoria]?.councilPlaceholder ?? t.registryPh)}
                            value={form.registroProfissional}
                            onChange={(e) => handleChange("registroProfissional", e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="crmUF">{t.registryUF}</Label>
                          <Select value={form.crmUF} onValueChange={(v) => handleChange("crmUF", v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {regionOptions.map((opt) => (
                                <SelectItem key={opt.v} value={opt.v}>{opt.l}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Área de atuação / especialidade dinâmica */}
                        {COUNCIL_CONFIG[form.categoria]?.specialtyLabel && (
                          <div className="sm:col-span-2 space-y-2">
                            <Label htmlFor="specialty">{COUNCIL_CONFIG[form.categoria].specialtyLabel}</Label>
                            <Input
                              id="specialty"
                              placeholder={COUNCIL_CONFIG[form.categoria].specialtyPlaceholder}
                              value={(form as any).specialty || ""}
                              onChange={(e) => handleChange("specialty", e.target.value)}
                            />
                            {COUNCIL_CONFIG[form.categoria].areas.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {COUNCIL_CONFIG[form.categoria].areas.map((area) => (
                                  <button
                                    key={area}
                                    type="button"
                                    onClick={() => handleChange("specialty", area)}
                                    className="text-[10px] px-2 py-0.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                                  >
                                    {area}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground">
                      🔒 {isBO
                        ? "Sus datos se verifican con el Colegio Médico de Bolivia / SEDES. Todos los intentos quedan registrados (Ley N° 1581)."
                        : "Seus dados são verificados automaticamente junto ao conselho profissional (compliance ANVISA/CFM/LGPD)."}
                    </p>

                    {/* 🔐 KYC Uploads (frente/verso obrigatórios) */}
                    <div className="mt-4 space-y-3 border rounded-lg p-3 bg-muted/30">
                      <p className="text-sm font-medium">
                        {isBO ? "Documentos obligatorios (frente y dorso)" : "Documentos obrigatórios (frente e verso)"}
                      </p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {!isCuidadorSel && (
                          <>
                            <div className="space-y-1">
                              <Label className="text-xs">
                                {isBO ? "Matrícula — frente" : (COUNCIL_CONFIG[form.categoria]?.docFrentLabel ?? "CRM — frente")}
                              </Label>
                              <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("crm_front")} required />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">
                                {isBO ? "Matrícula — dorso" : (COUNCIL_CONFIG[form.categoria]?.docFrentLabel?.replace("frente","verso") ?? "CRM — verso")}
                              </Label>
                              <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("crm_back")} required />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <Label className="text-xs">Assinatura Digital (ICP-Brasil) — Imagem</Label>
                              <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("icp_brasil")} required />
                            </div>
                          </>
                        )}
                        <div className="space-y-1">
                          <Label className="text-xs">{isBO ? "CI — frente" : "RG/CNH — frente"}</Label>
                          <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("id_front")} required />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{isBO ? "CI — dorso" : "RG/CNH — verso"}</Label>
                          <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("id_back")} required />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{KYC_LABELS.cpf_doc} *</Label>
                          <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("cpf_doc")} required />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{KYC_LABELS.address_proof} *</Label>
                          <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("address_proof")} required />
                        </div>

                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        JPG/PNG/PDF · máx 5MB por arquivo · legível e sem cortes.
                      </p>
                    </div>
                  </div>


                  <div className="rounded-2xl border border-border bg-card/50 p-4 space-y-2">
                    <p className="text-xs font-black text-foreground">Tabela oficial de serviços da plataforma</p>
                    {SERVICE_MENU.filter((sv) => sv.fixed).map((sv, i) => (
                      <div key={sv.sku} className="flex items-center justify-between gap-3 text-xs border-b border-border/50 last:border-0 py-1.5">
                        <span className="text-muted-foreground">
                          {i + 1}. <span className="text-foreground font-bold">{sv.name}</span> · {sv.duration} ·{" "}
                          {sv.prescription ? "com receita digital" : "sem receita"}
                        </span>
                        <span className="font-black text-primary whitespace-nowrap">{formatBRL(sv.price)}</span>
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground">{FIXED_SERVICE_NOTICE}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pricePremium">Consulta Premium (Vídeo + Chat) — R$ *</Label>
                      <Input id="pricePremium" type="number" min="100" max="2000" step="1" placeholder="180" value={form.pricePremium} onChange={(e) => handleChange("pricePremium", e.target.value)} required />
                      <p className="text-[10px] text-muted-foreground">Único serviço com valor livre (sugerido R$ 180). Mínimo R$ 100.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cidadeUF">{t.cityUF}</Label>
                      {isBO ? (
                        <Select value={form.cidadeUF} onValueChange={(v) => handleChange("cidadeUF", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder={t.cityUFPh} />
                          </SelectTrigger>
                          <SelectContent>
                            {BO_CITIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input id="cidadeUF" placeholder={t.cityUFPh} value={form.cidadeUF} onChange={(e) => handleChange("cidadeUF", e.target.value)} />
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="atendimento">{t.attType}</Label>
                      <Select value={form.atendimento} onValueChange={(v) => handleChange("atendimento", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chat">{t.chat}</SelectItem>
                          <SelectItem value="video">{t.video}</SelectItem>
                          <SelectItem value="ambos">{t.both}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="disponibilidade">{t.avail}</Label>
                      <Input id="disponibilidade" placeholder={t.availPh} value={form.disponibilidade} onChange={(e) => handleChange("disponibilidade", e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plano">{t.plan}</Label>
                    <Select value={form.plano} onValueChange={(v) => handleChange("plano", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">
                          <span className="flex items-center gap-2">VIP — {isBO ? "USD 19/mes" : "R$ 99/mês"} (Taxa Zero) <Badge className="bg-primary/15 text-primary text-[8px] px-1.5 py-0">{isBO ? "MÁS POPULAR" : "MAIS POPULAR"}</Badge></span>
                        </SelectItem>
                        <SelectItem value="professional">{isBO ? "Profesional — USD 59/mes" : "Profissional — R$ 299/mês"}</SelectItem>
                        <SelectItem value="premium">Premium — {isBO ? "USD 119/mes" : "R$ 599/mês"}</SelectItem>
                        <SelectItem value="enterprise">Enterprise — {isBO ? "USD 299/mes" : "R$ 1.500/mês"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="pixType">{country === "BO" ? "Tipo de Cuenta (Banco) *" : "Tipo de Chave PIX *"}</Label>
                          <Select value={form.pixType} onValueChange={(v) => handleChange("pixType", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {country === "BO" ? (
                                <>
                                  <SelectItem value="banco_union">Banco Unión</SelectItem>
                                  <SelectItem value="bnb">BNB</SelectItem>
                                  <SelectItem value="bcp">BCP</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="cpf">CPF / CNPJ</SelectItem>
                                  <SelectItem value="email">E-mail</SelectItem>
                                  <SelectItem value="phone">Celular</SelectItem>
                                  <SelectItem value="random">Chave Aleatória</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pixKey">{country === "BO" ? "Número de Cuenta *" : "Chave PIX *"}</Label>
                          <Input id="pixKey" placeholder={country === "BO" ? "12345678" : "Sua chave PIX"} value={form.pixKey} onChange={(e) => handleChange("pixKey", e.target.value)} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                    <Label htmlFor="resumoAtuacao">{t.bio}</Label>
                    <Textarea id="resumoAtuacao" placeholder={t.bioPh} rows={4} value={form.resumoAtuacao} onChange={(e) => handleChange("resumoAtuacao", e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label>{t.photo}</Label>
                    <div className="flex items-center gap-4">
                      {fotoPreview ? (
                        <img src={fotoPreview} alt="Preview" className="w-16 h-16 rounded-2xl object-cover border border-border" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                          <Upload size={20} className="text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <Input id="foto" type="file" accept="image/*" onChange={handleFoto} className="max-w-[250px]" />
                        <p className="text-xs text-muted-foreground mt-1">JPG / PNG, até 2MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.docs}</Label>
                    <Input type="file" accept=".pdf,.jpg,.png" className="max-w-[300px]" />
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/30 border border-border">
                    <Checkbox
                      id="lgpd"
                      checked={lgpdConsent}
                      onCheckedChange={(v) => setLgpdConsent(v === true)}
                    />
                    <label htmlFor="lgpd" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                      {t.lgpd}
                    </label>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" disabled={loading} className="w-full font-black bg-primary text-primary-foreground text-lg h-12 rounded-2xl">
                      {loading ? t.submitting : t.submit}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CadastroProfissional;




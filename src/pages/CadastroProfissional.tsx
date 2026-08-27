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
import { CheckCircle2, Upload, UserPlus, ArrowRight, ShieldCheck, AlertTriangle, Lock, Copy, Globe, CreditCard, DollarSign, Bitcoin, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { KYC_BUCKET, KYC_LABELS, type KycKind } from "@/lib/kyc-docs";
import { categories, COUNCIL_CONFIG } from "@/data/professionals";
import { motion } from "framer-motion";
import * as Flags from "country-flag-icons/react/3x2";
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

export const CountryFlag = ({
  code,
  className = "w-5 h-3.5 rounded-sm object-cover shadow-sm shrink-0 border border-slate-700/50 inline-block align-middle",
}: {
  code: string;
  className?: string;
}) => {
  const FlagComponent = (Flags as Record<string, any>)[code?.toUpperCase()];
  if (!FlagComponent) return <span className="text-xs">🌐</span>;
  return <FlagComponent className={className} title={code} />;
};

export const COUNTRIES = [
  // América Latina
  { code: "BR", name: "Brasil", flag: "BR", council: "CFM / CRM", lang: "PT", currency: "R$ (BRL)", regionLabel: "UF", defaultUF: "SP", defaultDoc: "cpf" as DocumentType },
  { code: "BO", name: "Bolívia", flag: "BO", council: "Colegio Médico / SEDES", lang: "ES", currency: "Bs / USD", regionLabel: "Departamento", defaultUF: "LP", defaultDoc: "ci" as DocumentType },
  { code: "AR", name: "Argentina", flag: "AR", council: "MSAL / Colegios Médicos", lang: "ES", currency: "ARS / USD", regionLabel: "Provincia", defaultUF: "BA", defaultDoc: "passport" as DocumentType },
  { code: "CL", name: "Chile", flag: "CL", council: "Colegio Médico (Colmed)", lang: "ES", currency: "CLP / USD", regionLabel: "Región", defaultUF: "RM", defaultDoc: "passport" as DocumentType },
  { code: "CO", name: "Colômbia", flag: "CO", council: "Colegio Médico Colombiano", lang: "ES", currency: "COP / USD", regionLabel: "Departamento", defaultUF: "DC", defaultDoc: "passport" as DocumentType },
  { code: "PE", name: "Peru", flag: "PE", council: "Colegio Médico del Perú (CMP)", lang: "ES", currency: "PEN / USD", regionLabel: "Departamento", defaultUF: "LIM", defaultDoc: "passport" as DocumentType },
  { code: "UY", name: "Uruguai", flag: "UY", council: "Colegio Médico del Uruguay (CMU)", lang: "ES", currency: "UYU / USD", regionLabel: "Departamento", defaultUF: "MO", defaultDoc: "passport" as DocumentType },
  { code: "PY", name: "Paraguai", flag: "PY", council: "Círculo Paraguayo de Médicos", lang: "ES", currency: "PYG / USD", regionLabel: "Departamento", defaultUF: "ASU", defaultDoc: "passport" as DocumentType },
  { code: "EC", name: "Equador", flag: "EC", council: "Federación Médica Ecuatoriana", lang: "ES", currency: "USD", regionLabel: "Provincia", defaultUF: "P", defaultDoc: "passport" as DocumentType },
  { code: "MX", name: "México", flag: "MX", council: "CONACEM / SSA", lang: "ES", currency: "MXN / USD", regionLabel: "Estado", defaultUF: "CMX", defaultDoc: "passport" as DocumentType },
  // América do Norte
  { code: "US", name: "Estados Unidos", flag: "US", council: "State Medical Board / AMA", lang: "EN", currency: "USD ($)", regionLabel: "State", defaultUF: "FL", defaultDoc: "passport" as DocumentType },
  { code: "CA", name: "Canadá", flag: "CA", council: "RCPSC / CMA", lang: "EN", currency: "CAD / USD", regionLabel: "Province", defaultUF: "ON", defaultDoc: "passport" as DocumentType },
  // Europa
  { code: "PT", name: "Portugal", flag: "PT", council: "Ordem dos Médicos (OM)", lang: "PT", currency: "EUR (€)", regionLabel: "Distrito", defaultUF: "LIS", defaultDoc: "passport" as DocumentType },
  { code: "ES", name: "Espanha", flag: "ES", council: "CGCOM / Colegios Oficiales", lang: "ES", currency: "EUR (€)", regionLabel: "Provincia", defaultUF: "MAD", defaultDoc: "passport" as DocumentType },
  { code: "NL", name: "Holanda (Amsterdã)", flag: "NL", council: "BIG-register / KNMG", lang: "EN", currency: "EUR (€)", regionLabel: "Provincie", defaultUF: "NH", defaultDoc: "passport" as DocumentType },
  // Ásia
  { code: "CN", name: "China", flag: "CN", council: "Chinese Medical Doctor Association (CMDA)", lang: "EN", currency: "CNY / USD", regionLabel: "Province", defaultUF: "BJ", defaultDoc: "passport" as DocumentType },
  { code: "JP", name: "Japão", flag: "JP", council: "Japan Medical Association (JMA)", lang: "EN", currency: "JPY / USD", regionLabel: "Prefecture", defaultUF: "TOK", defaultDoc: "passport" as DocumentType },
] as const;

export type CountryCode = typeof COUNTRIES[number]["code"];
export type LangCode = "PT" | "ES" | "EN";

const STRINGS: Record<LangCode, Record<string, string>> = {
  PT: {
    title: "Cadastro de",
    titleHl: "Profissional de Saúde",
    subtitle: "Atenda pacientes em escala global com tecnologia de ponta. Preencha o formulário e aguarde a verificação KYC.",
    country: "País de Atuação *",
    countryHelp: "Ao selecionar o país, o sistema ajusta automaticamente o idioma, documentos de conselho e formas de pagamento.",
    nome: "Nome Completo *",
    nomePh: "Seu nome completo",
    email: "E-mail Profissional *",
    phone: "Telefone / WhatsApp com DDI *",
    phonePh: "+55 11 99999-9999",
    category: "Categoria Profissional *",
    categoryPh: "Selecione sua categoria",
    kyc: "Verificação KYC (Know Your Customer) & Compliance",
    docType: "Tipo de Documento Principal *",
    registry: "Registro no Conselho Profissional *",
    registryPh: "Ex: 123456",
    registryUF: "Estado / UF do Registro *",
    cityUF: "Cidade / Província",
    cityUFPh: "São Paulo / SP",
    attType: "Tipo de Atendimento",
    avail: "Disponibilidade de Horários",
    availPh: "Ex: Seg-Sex 9h-18h",
    plan: "Plano de Assinatura Profissional",
    bio: "Resumo de Atuação e Especialidades (Bio) *",
    bioPh: "Descreva sua formação, anos de experiência clínica e abordagem canabinoide...",
    submit: "Enviar Cadastro & Iniciar Verificação KYC",
    submitting: "Processando e criptografando dados...",
    lgpd: "Autorizo o tratamento dos meus dados pessoais conforme a LGPD/GDPR e concordo com os Termos de Uso e Política de Privacidade da plataforma Planta & Raiz.",
    chat: "Chat Clínico", video: "Teleconsulta por Vídeo", both: "Chat + Vídeo HD",
    intlNotice: "Profissional Internacional: para atuar e prescrever em nossa rede, anexe a cópia do Passaporte e a comprovação de permanência ou registro internacional.",
    passportSignLabel: "Foto do Passaporte (Página com Foto e Assinatura) *",
    stayStampLabel: "Carimbo de Permanência / Visto no Brasil ou Licença Internacional *",
    paymentsTitle: "Formas de Pagamento Integradas:",
    paymentMP: "Mercado Pago (Brasil)",
    paymentStripe: "Stripe (Internacional)",
    paymentBTC: "Bitcoin & Cripto (Universal)",
  },
  ES: {
    title: "Registro de",
    titleHl: "Profesional de la Salud",
    subtitle: "Atienda pacientes a nivel global con tecnología de vanguardia. Complete el formulario y espere la verificación KYC.",
    country: "País donde atenderá *",
    countryHelp: "Al seleccionar el país, el sistema ajusta automáticamente el idioma, los documentos del colegio médico y los métodos de pago.",
    nome: "Nombre Completo *",
    nomePh: "Su nombre completo",
    email: "Correo Electrónico Profesional *",
    phone: "Teléfono / WhatsApp con código de país *",
    phonePh: "+591 7 1234567",
    category: "Categoría Profesional *",
    categoryPh: "Seleccione su categoría",
    kyc: "Verificación KYC (Know Your Customer) & Compliance",
    docType: "Tipo de Documento Principal *",
    registry: "Matrícula / Registro Profesional *",
    registryPh: "Ej: 12345",
    registryUF: "Departamento / Provincia del Registro *",
    cityUF: "Ciudad",
    cityUFPh: "Seleccione o escriba su ciudad",
    attType: "Modalidad de Atención",
    avail: "Disponibilidad",
    availPh: "Ej: Lun-Vie 9h-18h",
    plan: "Plan de Suscripción Profesional",
    bio: "Resumen de Actuación y Especialidades (Bio) *",
    bioPh: "Describa su experiencia clínica, especialidades y enfoque cannabinoide...",
    submit: "Enviar Registro & Iniciar Verificación KYC",
    submitting: "Procesando y cifrando datos...",
    lgpd: "Autorizo el tratamiento de mis datos personales conforme a la normativa de protección de datos y acepto los Términos de Uso y Política de Privacidad de Planta & Raíz.",
    chat: "Chat Clínico", video: "Videoconsulta", both: "Chat + Video HD",
    intlNotice: "Profesional Internacional: para atender y prescribir en nuestra red, adjunte copia de su Pasaporte y comprobante de permanencia o licencia internacional.",
    passportSignLabel: "Foto del Pasaporte (Página con Foto y Firma) *",
    stayStampLabel: "Sello de Permanencia / Visa o Licencia Médica Internacional *",
    paymentsTitle: "Métodos de Pago Integrados:",
    paymentMP: "Mercado Pago (Brasil)",
    paymentStripe: "Stripe (Internacional)",
    paymentBTC: "Bitcoin & Cripto (Universal)",
  },
  EN: {
    title: "Healthcare",
    titleHl: "Professional Registration",
    subtitle: "Provide consultations globally with advanced telemedicine technology. Complete the form for KYC verification.",
    country: "Country of Practice *",
    countryHelp: "Selecting your country automatically configures language, medical board requirements, and payment gateways.",
    nome: "Full Name *",
    nomePh: "Your full legal name",
    email: "Professional Email *",
    phone: "Phone / WhatsApp with Country Code *",
    phonePh: "+1 (555) 000-0000",
    category: "Professional Category *",
    categoryPh: "Select your category",
    kyc: "KYC Verification & Medical Compliance",
    docType: "Primary Identity Document *",
    registry: "Medical License / Board Registration Number *",
    registryPh: "Ex: MD-123456",
    registryUF: "State / Province / District *",
    cityUF: "City",
    cityUFPh: "City name",
    attType: "Consultation Mode",
    avail: "Availability",
    availPh: "Ex: Mon-Fri 9am-5pm EST",
    plan: "Professional Subscription Plan",
    bio: "Professional Summary & Specialties (Bio) *",
    bioPh: "Describe your clinical experience, board certifications, and cannabinoid medicine expertise...",
    submit: "Submit Registration & Start KYC Verification",
    submitting: "Encrypting and submitting data...",
    lgpd: "I authorize the processing of my personal data under GDPR/LGPD regulations and agree to the Terms of Service and Privacy Policy of Planta & Raíz.",
    chat: "Clinical Chat", video: "HD Video Consultation", both: "Chat + HD Video",
    intlNotice: "International Practitioner: attach your Passport (photo & signature page) and proof of stay, visa, or international medical license.",
    passportSignLabel: "Passport Photo (Photo & Signature Page) *",
    stayStampLabel: "Stay Stamp / Visa in Brazil or International Medical License *",
    paymentsTitle: "Integrated Payment Gateways:",
    paymentMP: "Mercado Pago (Brazil)",
    paymentStripe: "Stripe (International Credit Cards)",
    paymentBTC: "Bitcoin & Crypto (Universal)",
  },
};

const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

const CadastroProfissional = () => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [country, setCountry] = useState<CountryCode>("BR");

  // Lookup country metadata
  const currentCountryConfig = useMemo(() => {
    return COUNTRIES.find((c) => c.code === country) || COUNTRIES[0];
  }, [country]);

  // Active language
  const [lang, setLang] = useState<LangCode>(currentCountryConfig.lang as LangCode);
  const t = STRINGS[lang] || STRINGS.PT;

  // Auto-switch language on country change
  useEffect(() => {
    setLang(currentCountryConfig.lang as LangCode);
  }, [country, currentCountryConfig]);

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
    categoria: "Médicos Prescritores",
    pricePremium: String(PREMIUM_SUGGESTED_PRICE),
    pixKey: "",
    pixType: "cpf",
    resumoAtuacao: "",
    registroProfissional: "",
    crmUF: "SP",
    cidadeUF: "",
    atendimento: "ambos",
    disponibilidade: "",
    plano: "free",
    dateOfBirth: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    uf: "",
    specialty: "",
  });

  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [savedCredentials, setSavedCredentials] = useState<{ email: string; password: string } | null>(null);

  // KYC uploads
  const [kycFiles, setKycFiles] = useState<Partial<Record<KycKind, File | null>>>({
    crm_front: null,
    crm_back: null,
    id_front: null,
    id_back: null,
    cpf_doc: null,
    address_proof: null,
    selfie: null,
    icp_brasil: null,
    passport_signature: null,
    stay_stamp: null,
    intl_license: null,
  });

  const MAX_KYC_BYTES = 10 * 1024 * 1024; // 10MB
  const isCuidadorSel = form.categoria === "Cuidadores de Idosos";
  const isInternational = country !== "BR";
  const [cepLoading, setCepLoading] = useState(false);

  /** ViaCEP — preenche logradouro, bairro, cidade e UF automaticamente no Brasil */
  const handleCep = async (raw: string) => {
    if (isInternational) {
      handleChange("cep", raw);
      return;
    }
    const masked = raw.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
    handleChange("cep", masked);
    const digits = masked.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data?.erro) {
        toast({ title: "CEP não encontrado", description: "Verifique os números digitados.", variant: "destructive" });
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
      toast({ title: "Endereço preenchido automaticamente! 📍", description: `${data.logradouro || ""} — ${data.localidade}/${data.uf}` });
    } catch {
      toast({ title: "Não foi possível consultar o CEP", variant: "destructive" });
    } finally {
      setCepLoading(false);
    }
  };

  const handleKycFile = (kind: KycKind) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f && f.size > MAX_KYC_BYTES) {
      toast({ title: "Arquivo muito grande", description: "Máximo 10MB (JPG/PNG/PDF).", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setKycFiles((p) => ({ ...p, [kind]: f }));
  };

  // Adjust document types when country changes
  useEffect(() => {
    setDocumentType(currentCountryConfig.defaultDoc);
    setDocumentNumber("");
    setDocumentValidation(null);
    setForm((p) => ({
      ...p,
      crmUF: currentCountryConfig.defaultUF,
      cidadeUF: "",
    }));
  }, [country, currentCountryConfig]);

  const docOptions = useMemo(() => {
    if (country === "BR") {
      return [
        { value: "cpf", label: "CPF (Brasileiro)", flag: "BR" },
        { value: "passport", label: "Passaporte (Estrangeiro / Internacional)", flag: "US" },
        { value: "rne", label: "RNE (Estrangeiro Residente)", flag: "BR" },
      ];
    }
    if (country === "BO") {
      return [
        { value: "ci", label: "Cédula de Identidad (CI)", flag: "BO" },
        { value: "passport", label: "Pasaporte Internacional", flag: "US" },
      ];
    }
    return [
      { value: "passport", label: `${t.passportSignLabel.split("(")[0].trim()}`, flag: currentCountryConfig.code },
      { value: "ci", label: `${currentCountryConfig.name} ID Nacional`, flag: currentCountryConfig.code },
      { value: "rne", label: "RNE / Visa de Residencia", flag: "BR" },
    ];
  }, [country, currentCountryConfig, t]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDocumentChange = (value: string) => {
    let formatted = value;
    if (documentType === "cpf") formatted = formatCPFInput(value);
    else if (documentType === "rne") formatted = formatRNEInput(value);
    else if (documentType === "ci") formatted = value.toUpperCase().replace(/[^0-9A-Z-]/g, "").slice(0, 15);
    else formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);

    setDocumentNumber(formatted);

    const cleaned = formatted.replace(/[\s.\-/]/g, "");
    if (cleaned.length >= 4) {
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
      toast({ title: t.subtitle, description: "Preencha todos os campos obrigatórios marcados com *.", variant: "destructive" });
      return;
    }

    if (!form.pricePremium) form.pricePremium = String(PREMIUM_SUGGESTED_PRICE);
    if (!form.pixKey) form.pixKey = form.telefone;
    if (!form.resumoAtuacao) form.resumoAtuacao = `${form.categoria} atuante em Saúde Integrativa e Medicina Canabinoide.`;

    if (form.password.length < 8) {
      toast({ title: "Senha muito curta", description: "Use no mínimo 8 caracteres para segurança.", variant: "destructive" });
      return;
    }
    if (form.password !== form.passwordConfirm) {
      toast({ title: "Senhas não coincidem", description: "A confirmação de senha deve ser idêntica.", variant: "destructive" });
      return;
    }
    if (form.nomeCompleto.length < 3 || form.nomeCompleto.length > 120) {
      toast({ title: "Nome inválido", description: "Informe seu nome completo (3 a 120 caracteres).", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast({ title: "E-mail inválido", description: "Informe um endereço de e-mail corporativo ou pessoal válido.", variant: "destructive" });
      return;
    }
    if (!phoneIsValid(form.telefone)) {
      toast({
        title: "Telefone / WhatsApp inválido",
        description: "Insira o número completo com código de país e DDD.",
        variant: "destructive",
      });
      return;
    }
    if (!documentNumber) {
      toast({
        title: "Documento obrigatório",
        description: "Informe o número do seu documento de identificação.",
        variant: "destructive",
      });
      return;
    }
    if (documentValidation && !documentValidation.valid) {
      trackKYCValidationFailed(documentType, documentValidation.message);
      toast({ title: "Documento inválido", description: documentValidation.message, variant: "destructive" });
      return;
    }

    const isCuidador = form.categoria === "Cuidadores de Idosos";
    if (!isCuidador && !form.registroProfissional) {
      trackKYCValidationFailed("COUNCIL_MISSING", "Registro profissional obrigatório");
      toast({
        title: "Registro Profissional obrigatório",
        description: `Informe seu número de registro (${COUNCIL_CONFIG[form.categoria]?.councilLabel || currentCountryConfig.council}).`,
        variant: "destructive",
      });
      return;
    }
    if (!lgpdConsent) {
      toast({ title: "Termos e Privacidade", description: "Aceite os termos para continuar com o cadastro.", variant: "destructive" });
      return;
    }
    if (!form.dateOfBirth) {
      toast({ title: "Data de nascimento obrigatória", variant: "destructive" });
      return;
    }

    // Validação de Documentos KYC
    if (isInternational) {
      if (!kycFiles["passport_signature"] && !kycFiles["id_front"]) {
        toast({
          title: "Documentos Internacionais Incompletos",
          description: "Anexe a foto do seu Passaporte (com foto e assinatura) ou ID Nacional.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!kycFiles["cpf_doc"] && !kycFiles["id_front"]) {
        toast({
          title: "Documentos Incompletos",
          description: "Anexe o documento do CPF ou RG/CNH.",
          variant: "destructive",
        });
        return;
      }
      if (!isCuidador && (!kycFiles["crm_front"] || !kycFiles["icp_brasil"])) {
        toast({
          title: "Documentos Incompletos",
          description: "Obrigatório enviar a FRENTE do seu registro profissional e Assinatura Digital ICP-Brasil.",
          variant: "destructive",
        });
        return;
      }
    }

    trackKYCSubmissionAttempt(documentType);
    setLoading(true);

    try {
      // 1) Criar usuário no Supabase Auth
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
            language: lang,
          },
        },
      });
      if (signUpErr) throw signUpErr;
      const userId = signUpData.user?.id;
      if (!userId) throw new Error("Falha ao criar usuário");

      // 2) Registrar perfil e dados do profissional via RPC
      const { error: rpcErr } = await supabase.rpc("register_new_doctor", {
        p_user_id: userId,
        p_full_name: form.nomeCompleto,
        p_phone: form.telefone,
        p_cpf: documentType === "cpf" ? documentNumber : null,
        p_country: country,
        p_city: form.cidadeUF || null,
        p_region: form.uf || form.crmUF || null,
        p_crm: isCuidador ? `CUIDADOR-${documentNumber.slice(-6)}` : form.registroProfissional,
        p_crm_state: form.crmUF || 'SP',
        p_specialty: form.specialty || form.categoria,
        p_bio: form.resumoAtuacao || '',
        p_document_type: documentType,
        p_plan_tier: form.plano || 'free',
        p_price_video_chat: Math.min(2000, Math.max(100, Number(form.pricePremium) || PREMIUM_SUGGESTED_PRICE)),
        p_avatar_url: fotoPreview || null,
        p_pix_key: form.pixKey || null,
        p_pix_type: form.pixType || null
      });

      if (rpcErr) {
        console.warn("[register_new_doctor rpc]", rpcErr);
      }

      // 3) Upload de Documentos KYC
      const uploads: Promise<unknown>[] = [];
      const kycRows: any[] = [];
      for (const kind of Object.keys(kycFiles) as KycKind[]) {
        const file = kycFiles[kind];
        if (!file) continue;
        const ext = (file.name.split(".").pop() || "bin").toLowerCase().slice(0, 5);
        
        // Assinatura ICP-Brasil vai para bucket 'avatars'
        if (kind === "icp_brasil") {
          const path = `documents/${userId}/signature_${Date.now()}.${ext}`;
          uploads.push(
            supabase.storage
              .from('avatars')
              .upload(path, file, { upsert: true, contentType: file.type || undefined })
              .then(async ({ error, data }) => {
                if (error) throw error;
                if (data?.path) {
                  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(data.path);
                  if (publicUrlData?.publicUrl) {
                    await supabase.from("doctors").update({ signature_url: publicUrlData.publicUrl }).eq("user_id", userId);
                  }
                }
              })
              .catch((err) => {
                console.error("[signature upload]", err);
              })
          );
          continue;
        }

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
            .catch((err) => {
              console.error("[kyc upload]", kind, err);
            })
        );
      }

      try {
        await Promise.all(uploads);
        if (kycRows.length) {
          await supabase
            .from("doctor_kyc_documents" as any)
            .upsert(kycRows, { onConflict: "doctor_user_id,document_kind" });
        }
      } catch (err: any) {
        console.warn("[upload warning]", err);
      }

      // 4) Notificação não-bloqueante no WhatsApp
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
        console.warn("[whatsapp welcome]", waErr);
      }

      setSavedCredentials({ email: form.email.trim().toLowerCase(), password: form.password });
      setLoading(false);
      setSubmitted(true);
      trackKYCValidationSuccess(documentType);
      toast({
        title: "Cadastro Concluído com Sucesso! 🌿",
        description: "Seus dados foram enviados para validação KYC.",
      });
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || String(err);
      const friendly = /already registered|already exists/i.test(msg)
        ? "Este e-mail já está cadastrado. Faça login para acessar."
        : msg;
      toast({ title: "Erro ao salvar cadastro", description: friendly, variant: "destructive" });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <section className="pt-24 pb-16 md:pt-32">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <CheckCircle2 size={64} className="text-primary mx-auto mb-6" />
              <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4">
                Cadastro <span className="text-gradient-green">Recebido!</span>
              </h1>
              <p className="text-muted-foreground text-lg mb-2">
                Seu perfil profissional está com status{" "}
                <strong className="text-primary">PENDENTE DE VERIFICAÇÃO KYC</strong>.
              </p>
              
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-4 text-emerald-700 dark:text-emerald-400">
                <p className="font-bold mb-1 flex items-center justify-center gap-2">
                  <Lock size={16} />
                  Acesso Imediato ao Consultório Virtual
                </p>
                <p className="text-sm">
                  Enviamos um e-mail com as diretrizes da plataforma. Suas credenciais foram geradas com sucesso.
                </p>
              </div>

              {savedCredentials && (
                <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary mb-6 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock size={18} className="text-primary" />
                    <span className="font-black text-sm text-foreground">
                      🔐 Suas credenciais de acesso (guarde agora)
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
                </div>
              )}

              <div className="flex flex-col gap-3 justify-center items-center mb-6 w-full">
                <Button className="w-full text-lg py-6 font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:scale-[1.02] shadow-xl rounded-2xl glow-green" asChild>
                  <a href="/consultorio">
                    🚀 Entrar Direto no Consultório Virtual <ArrowRight size={20} className="ml-2" />
                  </a>
                </Button>
              </div>

              <div className="flex gap-3 justify-center flex-wrap">
                <Button variant="outline" className="font-bold border-border rounded-2xl" asChild>
                  <a href="/login">Fazer Login</a>
                </Button>
                <Button variant="outline" className="font-bold border-border rounded-2xl" asChild>
                  <a href="/profissionais">Ver Profissionais</a>
                </Button>
                <Button variant="outline" className="font-bold border-border rounded-2xl" asChild>
                  <a href="https://wa.me/5511991363154?text=Olá!%20Enviei%20meu%20cadastro%20de%20profissional" target="_blank" rel="noopener noreferrer">
                    Falar com Suporte
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

  const categoryCouncil = COUNCIL_CONFIG[form.categoria] || {
    councilLabel: currentCountryConfig.council,
    councilFull: `${currentCountryConfig.council} (${currentCountryConfig.name})`,
    councilPlaceholder: "Número do Registro",
    docFrentLabel: "Registro Profissional — Frente",
    specialtyLabel: "Especialidade / Área de Atuação",
    specialtyPlaceholder: "Ex: Clínica Geral, Cannabis Medicinal",
    areas: ["Clínica Geral", "Cannabis Medicinal", "Saúde Integrativa"],
  };

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

            {/* Language & International Bar */}
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Globe size={14} className="text-primary" /> Idioma:
              </span>
              {(["PT", "ES", "EN"] as LangCode[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                    lang === l ? "bg-primary text-black" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CountryFlag code={l === "PT" ? "BR" : l === "ES" ? "ES" : "US"} className="w-4 h-3 rounded-sm object-cover" />
                  {l === "PT" ? "Português" : l === "ES" ? "Español" : "English"}
                </button>
              ))}
            </div>
          </motion.div>

          {/* CARD DE SEGURANÇA JURÍDICA & RESPALDO AO PROFISSIONAL DE SAÚDE */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-6">
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-card to-background p-5 md:p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base text-foreground flex items-center gap-2">
                      Segurança Jurídica & Respaldo Profissional
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[9px] font-mono">
                        100% REGULAMENTADO
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Conformidade estrita com CFM Res. 2.314/2022, ANVISA RDC 660/2022 e LGPD
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-background/50 border border-border/60 space-y-1">
                  <div className="flex items-center gap-2 text-foreground font-bold">
                    <Lock size={14} className="text-emerald-400 shrink-0" />
                    <span>Prontuário Eletrônico (PEP) Blindado</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Histórico clínico imutável com <strong>integridade criptográfica SHA-512</strong> e proteção absoluta de dados confidenciais do paciente.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-background/50 border border-border/60 space-y-1">
                  <div className="flex items-center gap-2 text-foreground font-bold">
                    <CheckCircle2 size={14} className="text-primary shrink-0" />
                    <span>Software Registrado no INPI</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Tecnologia e algoritmos clínicos registrados sob o <strong>Processo INPI nº 512026007103-8</strong> (Lei nº 9.609/1998).
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="border-border">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* 🌍 País de Atuação Expandido com Bandeiras SVG */}
                  <div className="space-y-3 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="country" className="font-bold flex items-center gap-2 text-foreground">
                        <Globe size={16} className="text-primary" />
                        {t.country}
                      </Label>
                      <Badge variant="outline" className="text-[11px] font-bold text-primary border-primary/30">
                        {currentCountryConfig.currency}
                      </Badge>
                    </div>

                    <Select value={country} onValueChange={(v) => setCountry(v as CountryCode)}>
                      <SelectTrigger id="country" className="h-12 bg-muted border-border font-bold text-sm">
                        <div className="flex items-center gap-2.5">
                          <CountryFlag code={currentCountryConfig.code} className="w-5 h-3.5 rounded-sm object-cover shadow-sm border border-slate-700/50" />
                          <span className="font-bold text-primary">{currentCountryConfig.code}</span>
                          <span className="text-muted-foreground">—</span>
                          <span className="text-foreground">{currentCountryConfig.name}</span>
                          <span className="text-muted-foreground text-xs font-normal">({currentCountryConfig.council})</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="max-h-80 bg-slate-900 text-slate-100 border-slate-700">
                        <div className="p-2 text-[10px] font-bold text-primary uppercase tracking-wider">América Latina</div>
                        {COUNTRIES.filter(c => ["BR","BO","AR","CL","CO","PE","UY","PY","EC","MX"].includes(c.code)).map((c) => (
                          <SelectItem key={c.code} value={c.code} className="hover:bg-slate-800 cursor-pointer py-2.5">
                            <div className="flex items-center gap-2.5">
                              <CountryFlag code={c.code} className="w-5 h-3.5 rounded-sm object-cover shadow-sm border border-slate-700/50" />
                              <span className="font-bold text-primary">{c.code}</span>
                              <span className="text-muted-foreground">—</span>
                              <span className="font-medium">{c.name}</span>
                              <span className="text-muted-foreground text-xs">({c.council})</span>
                            </div>
                          </SelectItem>
                        ))}

                        <div className="p-2 text-[10px] font-bold text-primary uppercase tracking-wider border-t border-slate-800 mt-1">América do Norte</div>
                        {COUNTRIES.filter(c => ["US","CA"].includes(c.code)).map((c) => (
                          <SelectItem key={c.code} value={c.code} className="hover:bg-slate-800 cursor-pointer py-2.5">
                            <div className="flex items-center gap-2.5">
                              <CountryFlag code={c.code} className="w-5 h-3.5 rounded-sm object-cover shadow-sm border border-slate-700/50" />
                              <span className="font-bold text-primary">{c.code}</span>
                              <span className="text-muted-foreground">—</span>
                              <span className="font-medium">{c.name}</span>
                              <span className="text-muted-foreground text-xs">({c.council})</span>
                            </div>
                          </SelectItem>
                        ))}

                        <div className="p-2 text-[10px] font-bold text-primary uppercase tracking-wider border-t border-slate-800 mt-1">Europa</div>
                        {COUNTRIES.filter(c => ["PT","ES","NL"].includes(c.code)).map((c) => (
                          <SelectItem key={c.code} value={c.code} className="hover:bg-slate-800 cursor-pointer py-2.5">
                            <div className="flex items-center gap-2.5">
                              <CountryFlag code={c.code} className="w-5 h-3.5 rounded-sm object-cover shadow-sm border border-slate-700/50" />
                              <span className="font-bold text-primary">{c.code}</span>
                              <span className="text-muted-foreground">—</span>
                              <span className="font-medium">{c.name}</span>
                              <span className="text-muted-foreground text-xs">({c.council})</span>
                            </div>
                          </SelectItem>
                        ))}

                        <div className="p-2 text-[10px] font-bold text-primary uppercase tracking-wider border-t border-slate-800 mt-1">Ásia</div>
                        {COUNTRIES.filter(c => ["CN","JP"].includes(c.code)).map((c) => (
                          <SelectItem key={c.code} value={c.code} className="hover:bg-slate-800 cursor-pointer py-2.5">
                            <div className="flex items-center gap-2.5">
                              <CountryFlag code={c.code} className="w-5 h-3.5 rounded-sm object-cover shadow-sm border border-slate-700/50" />
                              <span className="font-bold text-primary">{c.code}</span>
                              <span className="text-muted-foreground">—</span>
                              <span className="font-medium">{c.name}</span>
                              <span className="text-muted-foreground text-xs">({c.council})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {isInternational ? t.intlNotice : t.countryHelp}
                    </p>

                    {/* Gateways Reconhecidos */}
                    <div className="pt-2 border-t border-border/40 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <CreditCard size={13} className="text-primary" /> {t.paymentsTitle}
                      </span>
                      <span className="bg-muted px-2 py-0.5 rounded text-emerald-400 font-medium flex items-center gap-1">
                        <CountryFlag code="BR" className="w-3.5 h-2.5 rounded-xs" /> {t.paymentMP}
                      </span>
                      <span className="bg-muted px-2 py-0.5 rounded text-sky-400 font-medium flex items-center gap-1">
                        <CountryFlag code="US" className="w-3.5 h-2.5 rounded-xs" /> {t.paymentStripe}
                      </span>
                      <span className="bg-muted px-2 py-0.5 rounded text-amber-400 font-medium flex items-center gap-1">
                        <Bitcoin size={12} /> {t.paymentBTC}
                      </span>
                    </div>
                  </div>

                  {/* Nome e E-mail */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeCompleto" className="text-xs font-bold text-muted-foreground">{t.nome}</Label>
                      <Input id="nomeCompleto" placeholder={t.nomePh} value={form.nomeCompleto} onChange={(e) => handleChange("nomeCompleto", e.target.value)} className="bg-muted border-border" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-bold text-muted-foreground">{t.email}</Label>
                      <Input id="email" type="email" placeholder="doutor@clinica.com" value={form.email} onChange={(e) => handleChange("email", e.target.value)} className="bg-muted border-border" required />
                    </div>
                  </div>

                  {/* Senha e Confirmação */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-xs font-bold text-muted-foreground">Senha de acesso (mín. 8) *</Label>
                      <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" value={form.password} onChange={(e) => handleChange("password", e.target.value)} className="bg-muted border-border" required minLength={8} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordConfirm" className="text-xs font-bold text-muted-foreground">Confirmar senha *</Label>
                      <Input id="passwordConfirm" type="password" autoComplete="new-password" placeholder="••••••••" value={form.passwordConfirm} onChange={(e) => handleChange("passwordConfirm", e.target.value)} className="bg-muted border-border" required minLength={8} />
                    </div>
                  </div>

                  {/* 📍 Endereço com CEP Automático */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="text-xs font-bold text-muted-foreground">Data de nascimento *</Label>
                      <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(e) => handleChange("dateOfBirth", e.target.value)} className="bg-muted border-border" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cep" className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                        <span>{country === "BR" ? "CEP *" : "Código Postal / Zip *"}</span>
                        {cepLoading && <span className="text-[10px] text-primary animate-pulse">Consultando...</span>}
                      </Label>
                      <Input id="cep" placeholder={country === "BR" ? "00000-000" : "Zipcode"} value={form.cep} onChange={(e) => handleCep(e.target.value)} className="bg-muted border-border font-mono" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numero" className="text-xs font-bold text-muted-foreground">Número *</Label>
                      <Input id="numero" placeholder="123" value={form.numero} onChange={(e) => handleChange("numero", e.target.value)} className="bg-muted border-border" required />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logradouro" className="text-xs font-bold text-muted-foreground">Logradouro / Rua</Label>
                      <Input id="logradouro" placeholder="Av. Paulista" value={form.logradouro} onChange={(e) => handleChange("logradouro", e.target.value)} className="bg-muted border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bairro" className="text-xs font-bold text-muted-foreground">Bairro / Distrito</Label>
                      <Input id="bairro" placeholder="Bela Vista" value={form.bairro} onChange={(e) => handleChange("bairro", e.target.value)} className="bg-muted border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complemento" className="text-xs font-bold text-muted-foreground">Complemento</Label>
                      <Input id="complemento" placeholder="Sala / Conjunto" value={form.complemento} onChange={(e) => handleChange("complemento", e.target.value)} className="bg-muted border-border" />
                    </div>
                  </div>

                  {/* 📞 Telefone & Categoria Profissional */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone" className="text-xs font-bold text-muted-foreground">{t.phone}</Label>
                      <PhoneInput
                        id="telefone"
                        international
                        defaultCountry={country as any}
                        placeholder={t.phonePh}
                        value={form.telefone}
                        onChange={(v) => handleChange("telefone", v || "")}
                        className="phone-input-custom"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categoria" className="text-xs font-bold text-muted-foreground">{t.category}</Label>
                      <Select value={form.categoria} onValueChange={(v) => handleChange("categoria", v)}>
                        <SelectTrigger className="h-11 bg-muted border-border">
                          <SelectValue placeholder={t.categoryPh} />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 text-slate-100 border-slate-700">
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat} className="hover:bg-slate-800 cursor-pointer">
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 🛡️ KYC & Documentos de Compliance */}
                  <div className="p-5 rounded-2xl bg-muted/10 border border-primary/20 space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={20} className="text-primary" />
                      <span className="font-bold text-sm text-foreground">{t.kyc}</span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground">{t.docType}</Label>
                        <Select value={documentType} onValueChange={(v) => handleDocumentTypeChange(v as DocumentType)}>
                          <SelectTrigger className="bg-muted border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 text-slate-100 border-slate-700">
                            {docOptions.map((d) => (
                              <SelectItem key={d.value} value={d.value} className="hover:bg-slate-800">
                                <div className="flex items-center gap-2">
                                  <CountryFlag code={d.flag} className="w-4 h-3 rounded-sm object-cover" />
                                  <span>{d.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="documentNumber" className="text-xs font-bold text-muted-foreground">
                          {getDocumentLabel(documentType)} *
                        </Label>
                        <Input
                          id="documentNumber"
                          placeholder={getDocumentPlaceholder(documentType)}
                          value={documentNumber}
                          onChange={(e) => handleDocumentChange(e.target.value)}
                          className="bg-muted border-border font-mono"
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

                    {/* Campos de Conselho Dinâmico */}
                    {!isCuidadorSel && (
                      <div className="grid sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <Label htmlFor="registroProfissional" className="text-xs font-bold text-muted-foreground">
                            {categoryCouncil.councilLabel} ({currentCountryConfig.name}) — {t.registry}
                          </Label>
                          <Input
                            id="registroProfissional"
                            placeholder={categoryCouncil.councilPlaceholder}
                            value={form.registroProfissional}
                            onChange={(e) => handleChange("registroProfissional", e.target.value)}
                            className="bg-muted border-border font-mono"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="crmUF" className="text-xs font-bold text-muted-foreground">
                            {currentCountryConfig.regionLabel} do Registro *
                          </Label>
                          {country === "BR" ? (
                            <Select value={form.crmUF} onValueChange={(v) => handleChange("crmUF", v)}>
                              <SelectTrigger className="bg-muted border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 text-slate-100 border-slate-700">
                                {UF_OPTIONS.map((u) => (
                                  <SelectItem key={u} value={u} className="hover:bg-slate-800">{u}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id="crmUF"
                              placeholder={currentCountryConfig.defaultUF}
                              value={form.crmUF}
                              onChange={(e) => handleChange("crmUF", e.target.value)}
                              className="bg-muted border-border"
                              required
                            />
                          )}
                        </div>

                        {/* Especialidade / Sub-área */}
                        <div className="sm:col-span-2 space-y-2">
                          <Label htmlFor="specialty" className="text-xs font-bold text-muted-foreground">
                            {categoryCouncil.specialtyLabel}
                          </Label>
                          <Input
                            id="specialty"
                            placeholder={categoryCouncil.specialtyPlaceholder}
                            value={form.specialty}
                            onChange={(e) => handleChange("specialty", e.target.value)}
                            className="bg-muted border-border"
                          />
                          {categoryCouncil.areas && categoryCouncil.areas.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {categoryCouncil.areas.map((area) => (
                                <button
                                  key={area}
                                  type="button"
                                  onClick={() => handleChange("specialty", area)}
                                  className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-colors ${
                                    form.specialty === area
                                      ? "bg-primary text-black border-primary font-bold"
                                      : "border-primary/30 text-primary hover:bg-primary/10"
                                  }`}
                                >
                                  {area}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 🔐 Uploads de Documentos (Frente / Verso / Passaporte / Carimbo) */}
                    <div className="mt-4 space-y-3 border rounded-xl p-4 bg-muted/20">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Upload size={14} className="text-primary" /> Anexo de Documentos Comprobatórios (Frente & Verso)
                      </p>

                      <div className="grid sm:grid-cols-2 gap-3">
                        {isInternational ? (
                          <>
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-muted-foreground">{t.passportSignLabel}</Label>
                              <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("passport_signature")} className="bg-muted border-border text-xs" required />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-muted-foreground">{t.stayStampLabel}</Label>
                              <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("stay_stamp")} className="bg-muted border-border text-xs" required />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-muted-foreground">Registro Médico / License ({currentCountryConfig.name}) *</Label>
                              <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("crm_front")} className="bg-muted border-border text-xs" required />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-muted-foreground">Comprovante de Endereço / Residência *</Label>
                              <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("address_proof")} className="bg-muted border-border text-xs" required />
                            </div>
                          </>
                        ) : (
                          <>
                            {!isCuidadorSel && (
                              <>
                                <div className="space-y-1">
                                  <Label className="text-xs font-bold text-muted-foreground">{categoryCouncil.docFrentLabel} *</Label>
                                  <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("crm_front")} className="bg-muted border-border text-xs" required />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs font-bold text-muted-foreground">{categoryCouncil.docFrentLabel.replace("frente","verso").replace("Frente","Verso")} *</Label>
                                  <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("crm_back")} className="bg-muted border-border text-xs" required />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                  <Label className="text-xs font-bold text-muted-foreground">Assinatura Digital (ICP-Brasil) — Imagem *</Label>
                                  <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("icp_brasil")} className="bg-muted border-border text-xs" required />
                                </div>
                              </>
                            )}
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-muted-foreground">{KYC_LABELS.cpf_doc} *</Label>
                              <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("cpf_doc")} className="bg-muted border-border text-xs" required />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-muted-foreground">{KYC_LABELS.address_proof} *</Label>
                              <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("address_proof")} className="bg-muted border-border text-xs" required />
                            </div>
                          </>
                        )}
                      </div>

                      <p className="text-[10px] text-muted-foreground">
                        Formatos aceitos: JPG, PNG ou PDF (máx. 10MB por documento). Verificação criptográfica auditável.
                      </p>
                    </div>
                  </div>

                  {/* Resumo / Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="resumoAtuacao" className="text-xs font-bold text-muted-foreground">{t.bio}</Label>
                    <Textarea
                      id="resumoAtuacao"
                      placeholder={t.bioPh}
                      value={form.resumoAtuacao}
                      onChange={(e) => handleChange("resumoAtuacao", e.target.value)}
                      className="bg-muted border-border"
                      rows={3}
                    />
                  </div>

                  {/* Consulta Premium e Modalidades */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pricePremium" className="text-xs font-bold text-muted-foreground">
                        Consulta Premium ({currentCountryConfig.currency}) *
                      </Label>
                      <Input
                        id="pricePremium"
                        type="number"
                        min="50"
                        max="3000"
                        value={form.pricePremium}
                        onChange={(e) => handleChange("pricePremium", e.target.value)}
                        className="bg-muted border-border"
                        required
                      />
                      <p className="text-[10px] text-muted-foreground">Valor sugerido: R$ 180 / USD 40.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="atendimento" className="text-xs font-bold text-muted-foreground">{t.attType}</Label>
                      <Select value={form.atendimento} onValueChange={(v) => handleChange("atendimento", v)}>
                        <SelectTrigger className="bg-muted border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 text-slate-100 border-slate-700">
                          <SelectItem value="chat" className="hover:bg-slate-800">{t.chat}</SelectItem>
                          <SelectItem value="video" className="hover:bg-slate-800">{t.video}</SelectItem>
                          <SelectItem value="ambos" className="hover:bg-slate-800">{t.both}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Plano de Adesão */}
                  <div className="space-y-2">
                    <Label htmlFor="plano" className="text-xs font-bold text-muted-foreground">{t.plan}</Label>
                    <Select value={form.plano} onValueChange={(v) => handleChange("plano", v)}>
                      <SelectTrigger className="bg-muted border-border h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 text-slate-100 border-slate-700">
                        <SelectItem value="free" className="hover:bg-slate-800">
                          <span className="flex items-center gap-2 font-bold">Free — Gratuito (Paga apenas taxa por consulta) <Badge className="bg-muted text-muted-foreground text-[9px]">INICIANTE</Badge></span>
                        </SelectItem>
                        <SelectItem value="basic" className="hover:bg-slate-800">
                          <span className="flex items-center gap-2 font-bold">VIP — R$ 99/mês (Taxa Zero + Destaque) <Badge className="bg-primary text-black text-[9px]">MAIS POPULAR</Badge></span>
                        </SelectItem>
                        <SelectItem value="professional" className="hover:bg-slate-800">Profissional — R$ 299/mês (Dashboard Completo)</SelectItem>
                        <SelectItem value="premium" className="hover:bg-slate-800">Premium — R$ 599/mês (Selo VIP + Prioridade na Busca)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Termos de Consentimento */}
                  <div className="flex items-start space-x-3 p-4 rounded-xl bg-muted/20 border border-border">
                    <Checkbox
                      id="lgpd"
                      checked={lgpdConsent}
                      onCheckedChange={(checked) => setLgpdConsent(!!checked)}
                      className="mt-1"
                    />
                    <label htmlFor="lgpd" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      {t.lgpd}
                    </label>
                  </div>

                  {/* Botão de Submissão */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full text-base py-6 font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:scale-[1.01] shadow-xl rounded-2xl glow-green"
                  >
                    {loading ? t.submitting : t.submit}
                  </Button>
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

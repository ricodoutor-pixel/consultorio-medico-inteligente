import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { trackPixelEvent } from "@/hooks/useFacebookPixel";
import { linkReferralOnSignup, getReferralCode } from "@/hooks/useReferralTracking";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { validateCPF, validateCNPJ, formatCPF, formatCNPJ } from "@/lib/validators";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Stethoscope, Building2, Leaf, Users, CheckCircle2, ArrowRight, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, Gift, Globe, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InteractiveTour3DModal, openGlobalTour } from "@/components/InteractiveTour3DModal";
import * as Flags from "country-flag-icons/react/3x2";
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
  { code: "BR", name: "Brasil", lang: "PT", regionLabel: "UF", defaultDoc: "CPF" },
  { code: "BO", name: "Bolívia", lang: "ES", regionLabel: "Departamento", defaultDoc: "CI" },
  { code: "AR", name: "Argentina", lang: "ES", regionLabel: "Provincia", defaultDoc: "DNI / Pasaporte" },
  { code: "CL", name: "Chile", lang: "ES", regionLabel: "Región", defaultDoc: "RUT / Pasaporte" },
  { code: "CO", name: "Colômbia", lang: "ES", regionLabel: "Departamento", defaultDoc: "Cédula / Pasaporte" },
  { code: "PE", name: "Peru", lang: "ES", regionLabel: "Departamento", defaultDoc: "DNI / Pasaporte" },
  { code: "UY", name: "Uruguai", lang: "ES", regionLabel: "Departamento", defaultDoc: "CI / Pasaporte" },
  { code: "PY", name: "Paraguai", lang: "ES", regionLabel: "Departamento", defaultDoc: "CI / Pasaporte" },
  { code: "EC", name: "Equador", lang: "ES", regionLabel: "Provincia", defaultDoc: "Cédula / Pasaporte" },
  { code: "MX", name: "México", lang: "ES", regionLabel: "Estado", defaultDoc: "CURP / Pasaporte" },
  // América do Norte
  { code: "US", name: "Estados Unidos", lang: "EN", regionLabel: "State", defaultDoc: "SSN / Passport / ID" },
  { code: "CA", name: "Canadá", lang: "EN", regionLabel: "Province", defaultDoc: "SIN / Passport" },
  // Europa
  { code: "PT", name: "Portugal", lang: "PT", regionLabel: "Distrito", defaultDoc: "NIF / Cartão de Cidadão" },
  { code: "ES", name: "Espanha", lang: "ES", regionLabel: "Provincia", defaultDoc: "DNI / NIE / Pasaporte" },
  { code: "NL", name: "Holanda (Amsterdã)", lang: "EN", regionLabel: "Provincie", defaultDoc: "BSN / Passport" },
  // Ásia
  { code: "CN", name: "China", lang: "EN", regionLabel: "Province", defaultDoc: "National ID / Passport" },
  { code: "JP", name: "Japão", lang: "EN", regionLabel: "Prefecture", defaultDoc: "My Number / Passport" },
] as const;

export type CountryCode = typeof COUNTRIES[number]["code"];
export type LangCode = "PT" | "ES" | "EN";

type UserType = "paciente" | "medico" | "farmacia" | null;

const STRINGS: Record<LangCode, Record<string, string>> = {
  PT: {
    createAccount: "CRIAR CONTA",
    heroTitle: "Faça parte da",
    heroTitleHl: "Planta & Raiz",
    heroSubtitle: "Crie sua conta para acessar consultas, telemedicina e toda a plataforma internacional.",
    alreadyHaveAccount: "Já tem conta? Faça login",
    languageLabel: "Idioma:",
    selectProfileBanner: "🎯 Selecione seu perfil. Cada categoria tem ambiente dedicado e leva ao painel correto.",
    selectProfileTitle: "Selecione seu perfil",
    patientLabel: "Paciente / Usuário",
    patientDesc: "Busco consultas, receitas digitais ou tratamento canabinoide",
    doctorLabel: "Médico Prescritor",
    doctorDesc: "CRM ativo / Registro médico internacional",
    pharmacyLabel: "Farmácia / Loja",
    pharmacyDesc: "CNPJ / Licença sanitária internacional e ANVISA",
    changeProfile: "← Trocar perfil",
    googleLoginTitle: "Login rápido para",
    googleLoginBtn: "Entrar com Google como",
    googleTerms: "Ao continuar, você aceita os Termos LGPD/GDPR e autoriza conformidade médica para atendimentos.",
    countryLabel: "País de Residência / Atuação *",
    fullName: "Nome completo *",
    fullNamePh: "Seu nome completo",
    email: "E-mail *",
    password: "Senha *",
    passwordPh: "Mínimo 6 caracteres",
    phone: "Telefone / WhatsApp com DDI",
    docLabel: "Documento de Identificação *",
    birthDate: "Data de Nascimento *",
    zipLabel: "CEP / Código Postal *",
    street: "Logradouro / Rua",
    district: "Bairro / Distrito",
    number: "Número *",
    complement: "Complemento",
    pharmacyName: "Razão Social / Nome da Empresa *",
    cnpjOrTax: "CNPJ / Registro Fiscal (Tax ID) *",
    anvisaOrAuth: "Autorização Sanitária (ANVISA / FDA / Ministério) *",
    tcleText: "Li, compreendi e aceito integralmente o TCLE (Termo de Consentimento Livre e Esclarecido) e a Política de Privacidade (LGPD Lei nº 13.709/2018 e Resoluções CFM 2.314/2022 e 2.454/2026). Estou ciente das diretrizes da telemedicina com hash auditável.",
    submitBtn: "Criar Minha Conta",
    submitting: "Criando conta...",
    alreadyRegistered: "Já tem uma conta?",
    loginLink: "Fazer login",
  },
  ES: {
    createAccount: "CREAR CUENTA",
    heroTitle: "Forme parte de",
    heroTitleHl: "Planta & Raiz",
    heroSubtitle: "Cree su cuenta para acceder a consultas, telemedicina y toda la plataforma internacional.",
    alreadyHaveAccount: "¿Ya tiene cuenta? Inicie sesión",
    languageLabel: "Idioma:",
    selectProfileBanner: "🎯 Seleccione su perfil. Cada categoría tiene un entorno dedicado y lleva al panel correspondiente.",
    selectProfileTitle: "Seleccione su perfil",
    patientLabel: "Paciente / Usuario",
    patientDesc: "Busco consultas, recetas digitales o tratamiento cannabinoide",
    doctorLabel: "Médico Prescriptor",
    doctorDesc: "Matrícula activa / Registro médico internacional",
    pharmacyLabel: "Farmacia / Tienda",
    pharmacyDesc: "Registro fiscal / Licencia sanitaria internacional",
    changeProfile: "← Cambiar perfil",
    googleLoginTitle: "Acceso rápido para",
    googleLoginBtn: "Entrar con Google como",
    googleTerms: "Al continuar, acepta los Términos de Protección de Datos y autoriza el cumplimiento médico para atención.",
    countryLabel: "País de Residencia / Operación *",
    fullName: "Nombre completo *",
    fullNamePh: "Su nombre completo legal",
    email: "Correo electrónico *",
    password: "Contraseña *",
    passwordPh: "Mínimo 6 caracteres",
    phone: "Teléfono / WhatsApp con código de país",
    docLabel: "Documento de Identificación *",
    birthDate: "Fecha de Nacimiento *",
    zipLabel: "Código Postal / Zip *",
    street: "Dirección / Calle",
    district: "Barrio / Distrito",
    number: "Número *",
    complement: "Complemento / Apto",
    pharmacyName: "Razón Social / Nombre Comercial *",
    cnpjOrTax: "Registro Fiscal (Tax ID / RUC / RFC) *",
    anvisaOrAuth: "Licencia Sanitaria / Autorización Farmacéutica *",
    tcleText: "He leído y acepto el Consentimiento Informado (TCLE) y la Política de Privacidad de Telemedicina Internacional. Estoy al tanto de las directrices con registro auditable.",
    submitBtn: "Crear Mi Cuenta",
    submitting: "Creando cuenta...",
    alreadyRegistered: "¿Ya tiene una cuenta?",
    loginLink: "Iniciar sesión",
  },
  EN: {
    createAccount: "CREATE ACCOUNT",
    heroTitle: "Join",
    heroTitleHl: "Planta & Raiz",
    heroSubtitle: "Create your account to access telemedicine consultations, digital prescriptions, and global healthcare.",
    alreadyHaveAccount: "Already have an account? Sign in",
    languageLabel: "Language:",
    selectProfileBanner: "🎯 Select your profile. Each category connects to its specialized dashboard.",
    selectProfileTitle: "Select your profile",
    patientLabel: "Patient / User",
    patientDesc: "Looking for consultations, medical prescriptions, or cannabinoid care",
    doctorLabel: "Prescribing Doctor",
    doctorDesc: "Active license / International medical board registration",
    pharmacyLabel: "Pharmacy / Dispensary",
    pharmacyDesc: "Business Tax ID / National pharmaceutical & health authority license",
    changeProfile: "← Change profile",
    googleLoginTitle: "Quick sign in for",
    googleLoginBtn: "Sign in with Google as",
    googleTerms: "By continuing, you agree to GDPR/Privacy Terms and authorize clinical telemetry compliance.",
    countryLabel: "Country of Residence / Operation *",
    fullName: "Full Legal Name *",
    fullNamePh: "Your full name",
    email: "Email Address *",
    password: "Password *",
    passwordPh: "Minimum 6 characters",
    phone: "Phone / WhatsApp with Country Code",
    docLabel: "Identity Document / ID Number *",
    birthDate: "Date of Birth *",
    zipLabel: "Postal Code / Zip Code *",
    street: "Street Address",
    district: "Neighborhood / District",
    number: "Number / Suite *",
    complement: "Apartment / Unit",
    pharmacyName: "Company / Legal Business Name *",
    cnpjOrTax: "Business Tax ID / Registration *",
    anvisaOrAuth: "Health Authority / Pharmacy License Number *",
    tcleText: "I have read and fully accept the Informed Consent (TCLE) and Telemedicine Privacy Policy with audit cryptographic hashing.",
    submitBtn: "Create My Account",
    submitting: "Creating account...",
    alreadyRegistered: "Already have an account?",
    loginLink: "Sign in",
  },
};

const Cadastro = () => {
  const [type, setType] = useState<UserType>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tcleAccepted, setTcleAccepted] = useState(false);
  const [country, setCountry] = useState<CountryCode>("BR");
  const [lang, setLang] = useState<LangCode>("PT");
  const [cepLoading, setCepLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const activeRefCode = searchParams.get("ref") || searchParams.get("ref_id") || getReferralCode();

  const currentCountryConfig = useMemo(() => {
    return COUNTRIES.find((c) => c.code === country) || COUNTRIES[0];
  }, [country]);

  const t = STRINGS[lang] || STRINGS.PT;

  // Auto-switch language on country selection
  const handleCountryChange = (c: CountryCode) => {
    setCountry(c);
    const cfg = COUNTRIES.find(x => x.code === c);
    if (cfg) {
      setLang(cfg.lang as LangCode);
    }
  };

  const handleChange = (key: string, value: string) => setFormData({ ...formData, [key]: value });

  /** ViaCEP — preenche endereço automaticamente no Brasil */
  const handleCep = async (raw: string) => {
    if (country !== "BR") {
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
      setFormData((p) => ({
        ...p,
        logradouro: data.logradouro || p.logradouro || "",
        bairro: data.bairro || p.bairro || "",
        cidade: data.localidade || p.cidade || "",
        uf: data.uf || p.uf || "",
      }));
      toast({ title: "Endereço preenchido! 📍", description: `${data.logradouro || ""} — ${data.localidade}/${data.uf}` });
    } catch {
      toast({ title: "Não foi possível consultar o CEP", variant: "destructive" });
    } finally {
      setCepLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!type) return false;
    const email = formData.email || "";
    const nome = formData.nome || "";
    const senha = formData.senha || "";

    if (nome.length < 3 || nome.length > 100) {
      toast({ title: "Nome inválido", description: "O nome deve ter entre 3 e 100 caracteres.", variant: "destructive" });
      return false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "E-mail inválido", description: "Insira um e-mail válido.", variant: "destructive" });
      return false;
    }
    if (senha.length < 6) {
      toast({ title: "Senha muito curta", description: "Mínimo de 6 caracteres.", variant: "destructive" });
      return false;
    }

    if (country === "BR") {
      const cpf = formData.cpf || "";
      if (type === "paciente" && cpf && !validateCPF(cpf)) {
        toast({ title: "CPF inválido", description: "Insira um CPF válido com 11 dígitos.", variant: "destructive" });
        return false;
      }
      const cnpj = formData.cnpj || "";
      if (type === "farmacia" && cnpj && !validateCNPJ(cnpj)) {
        toast({ title: "CNPJ inválido", description: "Insira um CNPJ válido com 14 dígitos.", variant: "destructive" });
        return false;
      }
    }

    if (!tcleAccepted) {
      toast({ title: "TCLE Obrigatório", description: "Você precisa aceitar os termos do TCLE e Privacidade para criar a conta.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    const dbType = type === "farmacia" ? "pharmacy" : "patient";

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.senha,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: formData.nome,
            country: country,
            language: lang,
          },
        },
      });

      if (authError) {
        const msg = authError.message || "";
        if (msg.includes("already registered") || msg.includes("already been registered")) {
          toast({ title: "E-mail já cadastrado", description: "Tente fazer login ou use outro e-mail.", variant: "destructive" });
        } else if (msg.toLowerCase().includes("weak") || msg.toLowerCase().includes("pwned")) {
          toast({
            title: "Senha fraca 🔒",
            description: "Esta senha apareceu em vazamentos públicos. Crie uma senha mais forte com letras, números e símbolos.",
            variant: "destructive",
          });
        } else {
          toast({ title: "Erro no cadastro", description: msg, variant: "destructive" });
        }
        setLoading(false);
        return;
      }

      // 2. Atualizar perfil com dados internacionais
      if (authData.user) {
        await supabase.from("profiles").update({
          full_name: formData.nome,
          phone: formData.telefone || null,
          cpf: formData.cpf || null,
          user_type: dbType,
          signup_role: type || "paciente",
          date_of_birth: formData.dataNascimento || null,
        }).eq("id", authData.user.id);

        // 3. Gravar consentimento TCLE obrigatório com hash SHA-256
        const timestamp = new Date().toISOString();
        let consentHash = "";
        try {
          const msgUint8 = new TextEncoder().encode(`TCLE_${authData.user.id}_${timestamp}_v2026.1`);
          const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
          consentHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
        } catch {
          consentHash = `sha256_fallback_${Date.now()}`;
        }

        await (supabase as any).from("tcle_consents").insert({
          user_id: authData.user.id,
          version: "2026.1",
          accepted_at: timestamp,
          hash: consentHash,
          checks: { read: true, limitations: true, privacy: true, ai: true, country },
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 400) : null,
        });

        // 4. Link referral (árvore de indicações)
        await linkReferralOnSignup(authData.user.id);

        // 5. Alerta WhatsApp
        supabase.functions
          .invoke("brisa-signup-alert", { body: { user_id: authData.user.id, event: "signup", country, type } })
          .catch((e) => console.warn("[brisa-signup-alert]", e));
      }

      trackPixelEvent("Lead", { content_name: `${type}_signup`, content_category: type }, {
        leadScore: 30, funnelStage: "intent", category: "conversion",
      });

      if (authData.session && redirectTo) {
        const dest = decodeURIComponent(redirectTo);
        if (dest.startsWith("/") && !dest.startsWith("//")) {
          window.location.href = dest;
          return;
        }
      }

      setSubmitted(true);
      toast({ title: "Cadastro realizado! ✅", description: "Verifique seu e-mail para confirmação da conta." });
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao criar conta. Tente novamente.", variant: "destructive" });
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <section className="pt-32 pb-20 hero-glow">
          <div className="container mx-auto px-4 relative z-10 flex justify-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-md text-center">
              <CheckCircle2 size={64} className="text-primary mx-auto mb-6" />
              <h1 className="text-3xl font-display font-black text-foreground mb-4">Cadastro Realizado!</h1>
              
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-6 text-emerald-700 dark:text-emerald-400 text-left">
                <p className="font-bold mb-2 flex items-center gap-2">
                  <Lock size={16} />
                  Verificação em Duas Etapas
                </p>
                <p className="text-sm">
                  Enviamos uma carta de boas-vindas com um link de acesso para o e-mail: <strong className="break-all">{formData.email}</strong>.
                </p>
                <p className="text-sm mt-2">
                  Por favor, confirme o recebimento para ativar completamente sua conta.
                </p>
              </div>

              <div className="flex flex-col gap-3 justify-center">
                <Button
                  onClick={() => openGlobalTour(type || "paciente")}
                  className="font-black bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 rounded-2xl h-12 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                >
                  <Sparkles size={16} className="mr-2 animate-pulse" /> 🚀 Fazer Tour 3D da Plataforma
                </Button>
                <Button className="font-black bg-primary text-primary-foreground rounded-2xl h-12" asChild>
                  <Link to="/login">Fazer Login <ArrowRight size={16} className="ml-2" /></Link>
                </Button>
                <Button variant="outline" className="font-bold rounded-2xl h-12" asChild>
                  <Link to="/">Voltar ao Início</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
        <InteractiveTour3DModal initialRole={type || "paciente"} />
        <Footer />
      </div>
    );
  }

  const userTypeOptions = [
    { id: "paciente" as UserType, label: t.patientLabel, icon: Users, desc: t.patientDesc, color: "green" },
    { id: "medico" as UserType, label: t.doctorLabel, icon: Stethoscope, desc: t.doctorDesc, color: "green" },
    { id: "farmacia" as UserType, label: t.pharmacyLabel, icon: Building2, desc: t.pharmacyDesc, color: "purple" },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-12 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center md:text-left">
            <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
              <div className="w-12 h-12 rounded-2xl bg-gradient-green border border-green flex items-center justify-center glow-green">
                <UserPlus size={24} className="text-primary" />
              </div>
              <span className="text-sm font-bold text-primary">{t.createAccount}</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-4">
              {t.heroTitle} <span className="text-gradient-green">{t.heroTitleHl}</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl font-medium mx-auto md:mx-0">
              {t.heroSubtitle}{" "}
              <Link to="/login" className="text-primary font-bold hover:underline">{t.alreadyHaveAccount}</Link>
            </p>

            {/* 🌐 Language Switcher Bar with SVG Flags */}
            <div className="mt-5 flex items-center gap-2 flex-wrap justify-center md:justify-start">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Globe size={14} className="text-primary" /> {t.languageLabel}
              </span>
              {(["PT", "ES", "EN"] as LangCode[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    lang === l
                      ? "bg-primary text-black shadow-md scale-105"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <CountryFlag code={l === "PT" ? "BR" : l === "ES" ? "ES" : "US"} className="w-4 h-3 rounded-sm object-cover" />
                  {l === "PT" ? "Português" : l === "ES" ? "Español" : "English"}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-8 pb-20">
        <div className="container mx-auto px-4">
          {/* Type Selection */}
          {!type && (
            <div className="max-w-3xl mx-auto">
              {activeRefCode && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-sm text-emerald-300 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Gift className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        🎁 Link de Indicação Ativo de Parceiro!
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Código: <span className="font-mono font-bold text-primary">{activeRefCode}</span>
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600/30 text-emerald-300 border-emerald-500/40">
                    Ativo ✅
                  </Badge>
                </div>
              )}

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-6 text-center">
                <p className="text-sm text-emerald-300 font-bold">
                  {t.selectProfileBanner}
                </p>
              </div>

              <h3 className="font-display font-black text-foreground mb-6">{t.selectProfileTitle}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userTypeOptions.map((ut) => (
                  <Card
                    key={ut.id}
                    className="border-border hover:border-primary/30 cursor-pointer transition-all hover:-translate-y-1"
                    onClick={() => {
                      if (ut.id === "medico") {
                        navigate(activeRefCode ? `/cadastro-profissional?ref=${activeRefCode}` : "/cadastro-profissional");
                      } else {
                        setType(ut.id);
                      }
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                        ut.color === "green" ? "bg-gradient-green border border-green" : "bg-gradient-purple border border-purple"
                      }`}>
                        <ut.icon size={28} className={ut.color === "green" ? "text-primary" : "text-secondary"} />
                      </div>
                      <h4 className="font-display font-black text-foreground mb-1">{ut.label}</h4>
                      <p className="text-xs text-muted-foreground">{ut.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Registration Form */}
          {type && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-2xl mx-auto">
              <button onClick={() => setType(null)} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
                {t.changeProfile}
              </button>

              {/* 🌍 Seletor de País de Residência / Atuação */}
              <div className="mb-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="country" className="font-bold flex items-center gap-2 text-xs text-foreground">
                    <Globe size={14} className="text-primary" />
                    {t.countryLabel}
                  </Label>
                </div>

                <Select value={country} onValueChange={(v) => handleCountryChange(v as CountryCode)}>
                  <SelectTrigger id="country" className="h-11 bg-muted border-border font-bold text-sm">
                    <div className="flex items-center gap-2.5">
                      <CountryFlag code={currentCountryConfig.code} className="w-5 h-3.5 rounded-sm object-cover shadow-sm border border-slate-700/50" />
                      <span className="font-bold text-primary">{currentCountryConfig.code}</span>
                      <span className="text-muted-foreground">—</span>
                      <span className="text-foreground">{currentCountryConfig.name}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-80 bg-slate-900 text-slate-100 border-slate-700">
                    <div className="p-2 text-[10px] font-bold text-primary uppercase tracking-wider">América Latina</div>
                    {COUNTRIES.filter(c => ["BR","BO","AR","CL","CO","PE","UY","PY","EC","MX"].includes(c.code)).map((c) => (
                      <SelectItem key={c.code} value={c.code} className="hover:bg-slate-800 cursor-pointer py-2">
                        <div className="flex items-center gap-2.5">
                          <CountryFlag code={c.code} className="w-5 h-3.5 rounded-sm object-cover shadow-sm border border-slate-700/50" />
                          <span className="font-bold text-primary">{c.code}</span>
                          <span className="text-muted-foreground">—</span>
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </SelectItem>
                    ))}

                    <div className="p-2 text-[10px] font-bold text-primary uppercase tracking-wider border-t border-slate-800 mt-1">América do Norte</div>
                    {COUNTRIES.filter(c => ["US","CA"].includes(c.code)).map((c) => (
                      <SelectItem key={c.code} value={c.code} className="hover:bg-slate-800 cursor-pointer py-2">
                        <div className="flex items-center gap-2.5">
                          <CountryFlag code={c.code} className="w-5 h-3.5 rounded-sm object-cover shadow-sm border border-slate-700/50" />
                          <span className="font-bold text-primary">{c.code}</span>
                          <span className="text-muted-foreground">—</span>
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </SelectItem>
                    ))}

                    <div className="p-2 text-[10px] font-bold text-primary uppercase tracking-wider border-t border-slate-800 mt-1">Europa</div>
                    {COUNTRIES.filter(c => ["PT","ES","NL"].includes(c.code)).map((c) => (
                      <SelectItem key={c.code} value={c.code} className="hover:bg-slate-800 cursor-pointer py-2">
                        <div className="flex items-center gap-2.5">
                          <CountryFlag code={c.code} className="w-5 h-3.5 rounded-sm object-cover shadow-sm border border-slate-700/50" />
                          <span className="font-bold text-primary">{c.code}</span>
                          <span className="text-muted-foreground">—</span>
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </SelectItem>
                    ))}

                    <div className="p-2 text-[10px] font-bold text-primary uppercase tracking-wider border-t border-slate-800 mt-1">Ásia</div>
                    {COUNTRIES.filter(c => ["CN","JP"].includes(c.code)).map((c) => (
                      <SelectItem key={c.code} value={c.code} className="hover:bg-slate-800 cursor-pointer py-2">
                        <div className="flex items-center gap-2.5">
                          <CountryFlag code={c.code} className="w-5 h-3.5 rounded-sm object-cover shadow-sm border border-slate-700/50" />
                          <span className="font-bold text-primary">{c.code}</span>
                          <span className="text-muted-foreground">—</span>
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {type === 'paciente' && (
              <>
              {/* Google login dedicado por categoria */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
                <p className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold mb-2 text-center">
                  {t.googleLoginTitle} {userTypeOptions.find(u => u.id === type)?.label}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full font-bold h-12 rounded-xl bg-white text-slate-900 hover:bg-slate-100 border-0 px-3 flex items-center justify-center gap-2 min-w-0"
                  onClick={async () => {
                    localStorage.setItem("pr_pending_signup_role", type || "paciente");
                    if (redirectTo) localStorage.setItem("pr_pending_redirect", decodeURIComponent(redirectTo));
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: {
                        redirectTo: `${window.location.origin}${redirectTo ? decodeURIComponent(redirectTo) : "/auth/callback"}`,
                      },
                    });
                    if (error) {
                      toast({ title: "Erro com Google", description: "Não foi possível continuar com Google.", variant: "destructive" });
                      return;
                    }
                  }}
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="truncate text-sm sm:text-base">
                    {t.googleLoginBtn}
                    <span className="hidden sm:inline"> {userTypeOptions.find(u => u.id === type)?.label}</span>
                  </span>
                </Button>

                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  {t.googleTerms}
                </p>
              </div>
              </>
              )}

              <Card className="border-border">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Common fields */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">{t.fullName}</Label>
                        <Input value={formData.nome || ""} onChange={(e) => handleChange("nome", e.target.value)} placeholder={t.fullNamePh} className="bg-muted border-border" required />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">{t.email}</Label>
                        <Input type="email" value={formData.email || ""} onChange={(e) => handleChange("email", e.target.value)} placeholder="seu@email.com" className="bg-muted border-border" required />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">{t.password}</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={formData.senha || ""}
                            onChange={(e) => handleChange("senha", e.target.value)}
                            placeholder={t.passwordPh}
                            className="bg-muted border-border pr-10"
                            required
                            minLength={6}
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">{t.phone}</Label>
                        <PhoneInput
                          international
                          defaultCountry={country as any}
                          placeholder="+55 11 99999-9999"
                          value={formData.telefone || ""}
                          onChange={(v) => handleChange("telefone", v || "")}
                          className="phone-input-custom"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">
                          {country === "BR" ? "CPF *" : `${t.docLabel} (${currentCountryConfig.defaultDoc})`}
                        </Label>
                        <Input
                          value={formData.cpf || ""}
                          onChange={(e) => handleChange("cpf", country === "BR" ? formatCPF(e.target.value) : e.target.value.toUpperCase())}
                          placeholder={country === "BR" ? "000.000.000-00" : "ID / Passport"}
                          className="bg-muted border-border font-mono"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">{t.birthDate}</Label>
                        <Input type="date" value={formData.dataNascimento || ""} onChange={(e) => handleChange("dataNascimento", e.target.value)} className="bg-muted border-border" required />
                      </div>
                    </div>

                    {/* Endereço com CEP */}
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                          <span>{t.zipLabel}</span>
                          {cepLoading && <span className="text-[10px] text-primary animate-pulse">Buscando...</span>}
                        </Label>
                        <Input
                          value={formData.cep || ""}
                          onChange={(e) => handleCep(e.target.value)}
                          placeholder={country === "BR" ? "00000-000" : "Zip Code"}
                          className="bg-muted border-border font-mono"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs font-bold text-muted-foreground">{t.street}</Label>
                        <Input value={formData.logradouro || ""} onChange={(e) => handleChange("logradouro", e.target.value)} className="bg-muted border-border" />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-muted-foreground">{t.number}</Label>
                        <Input value={formData.numero || ""} onChange={(e) => handleChange("numero", e.target.value)} placeholder="123" className="bg-muted border-border" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-muted-foreground">{t.district}</Label>
                        <Input value={formData.bairro || ""} onChange={(e) => handleChange("bairro", e.target.value)} className="bg-muted border-border" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-muted-foreground">{t.complement}</Label>
                        <Input value={formData.complemento || ""} onChange={(e) => handleChange("complemento", e.target.value)} placeholder="Apto / Sala" className="bg-muted border-border" />
                      </div>
                    </div>

                    {/* Pharmacy fields & KYC Uploads */}
                    {type === "farmacia" && (
                      <div className="space-y-4 pt-2 border-t border-border/50">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-bold text-muted-foreground">{t.pharmacyName}</Label>
                            <Input
                              value={formData.razaoSocial || ""}
                              onChange={(e) => handleChange("razaoSocial", e.target.value)}
                              placeholder="Razão Social / Nome Fantasia da Farmácia"
                              className="bg-muted border-border"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-bold text-muted-foreground">
                              {country === "BR" ? "CNPJ *" : t.cnpjOrTax}
                            </Label>
                            <Input
                              value={formData.cnpj || ""}
                              onChange={(e) => handleChange("cnpj", country === "BR" ? formatCNPJ(e.target.value) : e.target.value)}
                              placeholder={country === "BR" ? "00.000.000/0000-00" : "Tax ID / License"}
                              className="bg-muted border-border font-mono"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-bold text-muted-foreground">{t.anvisaOrAuth}</Label>
                            <Input
                              value={formData.anvisaAuth || ""}
                              onChange={(e) => handleChange("anvisaAuth", e.target.value)}
                              placeholder="Ex: AFE-ANVISA 7.82941.2"
                              className="bg-muted border-border"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-bold text-muted-foreground">Farmacêutico(a) Responsável & CRF *</Label>
                            <Input
                              value={formData.crf || ""}
                              onChange={(e) => handleChange("crf", e.target.value)}
                              placeholder="Nome do Farmacêutico — CRF/UF 12345"
                              className="bg-muted border-border"
                              required
                            />
                          </div>
                        </div>

                        {/* 🏢 Uploads de Documentos KYC Lojista */}
                        <div className="p-4 rounded-2xl bg-muted/20 border border-primary/20 space-y-3">
                          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Building2 size={15} className="text-primary" /> Anexo de Documentos & Compliance da Loja Física (KYC)
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Estes documentos serão auditados antes da publicação dos seus produtos no Shopping.
                          </p>

                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-muted-foreground">Foto da Fachada / Loja Física *</Label>
                              <Input type="file" accept="image/*" className="bg-muted border-border text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-muted-foreground">Logomarca da Empresa (Shopping) *</Label>
                              <Input type="file" accept="image/*" className="bg-muted border-border text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-muted-foreground">Contrato Social / Razão Social (PDF) *</Label>
                              <Input type="file" accept=".pdf,image/*" className="bg-muted border-border text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-muted-foreground">Alvará Sanitário / ANVISA AFE *</Label>
                              <Input type="file" accept=".pdf,image/*" className="bg-muted border-border text-xs" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Checkbox TCLE / LGPD Obrigatório */}
                    <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox
                          checked={tcleAccepted}
                          onCheckedChange={(v) => setTcleAccepted(!!v)}
                          className="mt-0.5 h-5 w-5 border-primary"
                        />
                        <span className="text-xs text-foreground leading-relaxed">
                          {t.tcleText}
                        </span>
                      </label>
                    </div>

                    <Button type="submit" className="w-full bg-primary text-primary-foreground font-black rounded-2xl h-12" disabled={loading || !tcleAccepted}>
                      {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <UserPlus size={16} className="mr-2" />}
                      {loading ? t.submitting : t.submitBtn}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      {t.alreadyRegistered}{" "}
                      <Link to="/login" className="text-primary font-bold hover:underline">{t.loginLink}</Link>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Cadastro;

import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Upload, UserPlus, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { categories } from "@/data/professionals";
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
    telefone: "",
    categoria: "",
    valorCobrado: "",
    resumoAtuacao: "",
    registroProfissional: "",
    crmUF: "SP",
    cidadeUF: "",
    atendimento: "chat",
    disponibilidade: "",
    plano: "basic",
  });
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

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
    const clean = phone.replace(/\D/g, "");
    if (country === "BO") {
      // BO: 8 dígitos locales o con código país 591 (total 11)
      return clean.length === 8 || (clean.startsWith("591") && clean.length === 11);
    }
    return /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(phone.replace(/\s/g, ""));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nomeCompleto || !form.email || !form.telefone || !form.categoria || !form.valorCobrado || !form.resumoAtuacao) {
      toast({ title: country === "BO" ? "Complete todos los campos obligatorios" : "Preencha todos os campos obrigatórios", variant: "destructive" });
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
        description: country === "BO" ? "Use formato +591 7 1234567" : "Insira um telefone válido.",
        variant: "destructive",
      });
      return;
    }
    if (form.resumoAtuacao.length > 500) {
      toast({ title: "Resumo muito longo", description: "Máximo 500.", variant: "destructive" });
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
        description: country === "BO" ? "Informe su matrícula del Colegio Médico." : "Informe seu registro de conselho.",
        variant: "destructive",
      });
      return;
    }
    if (!lgpdConsent) {
      toast({ title: country === "BO" ? "Acepte los términos para continuar" : "Aceite os termos para continuar", variant: "destructive" });
      return;
    }

    trackKYCSubmissionAttempt(documentType);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      trackKYCValidationSuccess(documentType);
      toast({
        title: country === "BO" ? "¡Registro enviado!" : "Cadastro enviado!",
        description: country === "BO"
          ? "Estado: PENDIENTE DE VERIFICACIÓN KYC. Validando su matrícula con el Colegio Médico."
          : "Status: PENDENTE DE VERIFICAÇÃO KYC. Aguarde validação automática do CRM.",
      });
    }, 1500);
  };

  if (submitted) {
    const isBO = country === "BO";
    return (
      <div className="min-h-screen bg-background">
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
              <p className="text-muted-foreground mb-4">
                {isBO
                  ? "El sistema está validando automáticamente su matrícula con el Colegio Médico de Bolivia."
                  : "O sistema está validando automaticamente seu CRM junto ao conselho médico e verificando seus documentos."}
              </p>
              <div className="p-4 rounded-2xl bg-muted/30 border border-border mb-8 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={18} className="text-primary" />
                  <span className="font-bold text-sm text-foreground">{isBO ? "Etapas de la Verificación KYC:" : "Etapas da Verificação KYC:"}</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>✅ {isBO ? "Validación del formato del documento" : "Validação do formato do documento"} ({documentType.toUpperCase()})</li>
                  <li>⏳ {isBO ? "Consulta al Colegio Médico / SEDES" : "Orientação Técnica ao Conselho Federal de Medicina (CRM)"}</li>
                  <li>⏳ {isBO ? "Verificación de consistencia de datos" : "Verificação de consistência de dados"}</li>
                  <li>⏳ {isBO ? "Liberación del Dashboard Médico" : "Liberação do Dashboard Médico"}</li>
                </ul>
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button className="font-black bg-primary text-primary-foreground rounded-2xl" asChild>
                  <a href="/profissionais">{isBO ? "Ver Profesionales" : "Ver Profissionais"} <ArrowRight size={16} className="ml-2" /></a>
                </Button>
                <Button variant="outline" className="font-black border-border rounded-2xl" asChild>
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
    <div className="min-h-screen bg-background">
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
                      <Label htmlFor="telefone">{t.phone}</Label>
                      <Input id="telefone" placeholder={t.phonePh} value={form.telefone} onChange={(e) => handleChange("telefone", e.target.value)} required />
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
                          <Label htmlFor="registroProfissional">{t.registry}</Label>
                          <Input
                            id="registroProfissional"
                            placeholder={t.registryPh}
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
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground">
                      🔒 {isBO
                        ? "Sus datos se verifican con el Colegio Médico de Bolivia / SEDES. Todos los intentos quedan registrados (Ley N° 1581)."
                        : "Seus dados são verificados automaticamente junto ao conselho profissional (compliance ANVISA/CFM/LGPD)."}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valorCobrado">{t.value}</Label>
                      <Input id="valorCobrado" type="number" min="0" step="0.01" placeholder={isBO ? "70.00" : "120.00"} value={form.valorCobrado} onChange={(e) => handleChange("valorCobrado", e.target.value)} required />
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

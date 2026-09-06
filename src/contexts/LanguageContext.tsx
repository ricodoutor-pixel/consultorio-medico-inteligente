import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Locale = "pt" | "en" | "es";

const translations: Record<Locale, Record<string, string>> = {
  pt: {

    // --- Mega Atualizacao ---
    "pro.book": "Agendar Orientação Técnica",
    "pro.startingAt": "a partir de",
    "pro.online": "Online",
    "pro.offline": "Offline",
    "pro.reviews": "Avaliações",
    "pro.experience": "Experiência:",
    "telemed.title": "Telemedicina 24/7",
    "telemed.subtitle": "Atendimento rápido, seguro e sem sair de casa.",
    "telemed.triage": "Triagem Rápida",
    "telemed.chat": "Orientação por Chat",
  
    // Navbar
    "nav.home": "Início",
    "nav.howItWorks": "Como Funciona",
    "nav.professionals": "Profissionais",
    "nav.shop": "Shopping",
    "nav.plans": "Planos",
    "nav.faq": "Perguntas Frequentes",
    "nav.contact": "Contato",
    "nav.login": "Entrar",
    "nav.signup": "Cadastrar",
    "nav.logout": "Sair",
    "nav.profile": "Meu Perfil",
    "nav.dashboard": "Painel",
    "nav.waitingRoom": "Sala de Espera",
    "nav.library": "Biblioteca",
    "nav.community": "Comunidade",
    "nav.investors": "Investidores",
    "nav.shopping_dashboard": "Lojista",
    "nav.blog": "Blog",
    "nav.iomt": "IoMT Hub",
    // Hero
    "hero.title": "Planta y Raiz - Mega Clínica Digital",
    "hero.subtitle": "Democratizando o acesso à saúde e bem-estar através da tecnologia e cannabis medicinal.",
    "hero.start_consultation": "Iniciar Orientação Técnica",
    "hero.online_now": "Online agora",
    "hero.responsible_tech": "Supervisionado por IA de última geração 24×7",
    // Common
    "common.save": "Salvar",
    "common.cancel": "Cancelar",
    "common.loading": "Carregando...",
    "common.search": "Buscar",
    "common.send": "Enviar",
    "common.close": "Fechar",
    "common.confirm": "Confirmar",
    "common.back": "Voltar",
    "common.next": "Próximo",
    "common.yes": "Sim",
    "common.no": "Não",
    // Consultation
    "consult.title": "Teleconsulta",
    "consult.mute": "Mutar",
    "consult.unmute": "Desmutar",
    "consult.endCall": "Encerrar Chamada",
    "consult.chat": "Chat",
    "consult.aiAssistant": "Assistente IA",
    "consult.medicalRecord": "Prontuário",
    "consult.elapsed": "Tempo de consulta",
    "consult.waitingRoom": "Sala de Espera Virtual",
    "consult.yourTurn": "Sua vez!",
    "consult.estimatedWait": "Tempo estimado de espera",
    "consult.position": "Posição na fila",
    // Medical
    "med.diagnosis": "Diagnóstico",
    "med.prescription": "Prescrição",
    "med.complaint": "Queixa Principal",
    "med.history": "Histórico",
    "med.treatment": "Conduta Terapêutica",
    "med.sign": "Assinar Digitalmente",
    "med.icd": "CID-10 / ICD-11",
    // Compliance
    "compliance.tcle": "Termo de Consentimento Livre e Esclarecido",
    "compliance.lgpd": "Direitos do Titular (LGPD)",
    "compliance.hipaa": "HIPAA Compliance",
    "compliance.dataResidency": "Residência de Dados",
    "compliance.encryption": "Criptografia E2E",
    // Network
    "network.excellent": "Excelente",
    "network.good": "Boa",
    "network.fair": "Regular",
    "network.poor": "Fraca",
    "network.quality": "Qualidade da conexão",
    // Accessibility
    "a11y.skipToContent": "Pular para o conteúdo",
    "a11y.mainMenu": "Menu principal",
    "a11y.videoArea": "Área de vídeo da teleconsulta",
    "a11y.chatArea": "Área de chat",
  },
  en: {

    "pro.book": "Book Technical Guidance",
    "pro.startingAt": "starting at",
    "pro.online": "Online",
    "pro.offline": "Offline",
    "pro.reviews": "Reviews",
    "pro.experience": "Experience:",
    "telemed.title": "Telemedicine 24/7",
    "telemed.subtitle": "Fast, secure, and from your home.",
    "telemed.triage": "Quick Triage",
    "telemed.chat": "Chat Guidance",
  
    "nav.home": "Home",
    "nav.howItWorks": "How It Works",
    "nav.professionals": "Professionals",
    "nav.shop": "Shop",
    "nav.plans": "Plans",
    "nav.faq": "FAQ",
    "nav.contact": "Contact",
    "nav.login": "Log In",
    "nav.signup": "Sign Up",
    "nav.logout": "Log Out",
    "nav.profile": "My Profile",
    "nav.dashboard": "Dashboard",
    "nav.waitingRoom": "Waiting Room",
    "nav.library": "Library",
    "nav.community": "Community",
    "nav.investors": "Investors",
    "nav.shopping_dashboard": "Merchant",
    "nav.blog": "Blog",
    "nav.iomt": "IoMT Hub",
    // Hero
    "hero.title": "Planta y Raiz - Mega Digital Clinic",
    "hero.subtitle": "Democratizing access to health and well-being through technology and medical cannabis.",
    "hero.start_consultation": "Start Consultation",
    "hero.online_now": "Online now",
    "hero.responsible_tech": "Technical and Legal Director",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading...",
    "common.search": "Search",
    "common.send": "Send",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.back": "Back",
    "common.next": "Next",
    "common.yes": "Yes",
    "common.no": "No",
    "consult.title": "Teleconsultation",
    "consult.mute": "Mute",
    "consult.unmute": "Unmute",
    "consult.endCall": "End Call",
    "consult.chat": "Chat",
    "consult.aiAssistant": "AI Assistant",
    "consult.medicalRecord": "Medical Record",
    "consult.elapsed": "Consultation time",
    "consult.waitingRoom": "Virtual Waiting Room",
    "consult.yourTurn": "Your turn!",
    "consult.estimatedWait": "Estimated wait time",
    "consult.position": "Queue position",
    "med.diagnosis": "Diagnosis",
    "med.prescription": "Prescription",
    "med.complaint": "Chief Complaint",
    "med.history": "History",
    "med.treatment": "Treatment Plan",
    "med.sign": "Sign Digitally",
    "med.icd": "ICD-10 / ICD-11",
    "compliance.tcle": "Informed Consent Form",
    "compliance.lgpd": "Data Subject Rights (LGPD)",
    "compliance.hipaa": "HIPAA Compliance",
    "compliance.dataResidency": "Data Residency",
    "compliance.encryption": "E2E Encryption",
    "network.excellent": "Excellent",
    "network.good": "Good",
    "network.fair": "Fair",
    "network.poor": "Poor",
    "network.quality": "Connection quality",
    "a11y.skipToContent": "Skip to content",
    "a11y.mainMenu": "Main menu",
    "a11y.videoArea": "Teleconsultation video area",
    "a11y.chatArea": "Chat area",
  },
  es: {

    "pro.book": "Programar Orientación Técnica",
    "pro.startingAt": "a partir de",
    "pro.online": "En línea",
    "pro.offline": "Desconectado",
    "pro.reviews": "Reseñas",
    "pro.experience": "Experiencia:",
    "telemed.title": "Telemedicina 24/7",
    "telemed.subtitle": "Atención rápida, segura y desde casa.",
    "telemed.triage": "Triaje Rápido",
    "telemed.chat": "Orientación por Chat",
  
    "nav.home": "Inicio",
    "nav.howItWorks": "Cómo Funciona",
    "nav.professionals": "Profesionales",
    "nav.shop": "Tienda",
    "nav.plans": "Planes",
    "nav.faq": "Preguntas Frecuentes",
    "nav.contact": "Contacto",
    "nav.login": "Iniciar Sesión",
    "nav.signup": "Registrarse",
    "nav.logout": "Cerrar Sesión",
    "nav.profile": "Mi Perfil",
    "nav.dashboard": "Panel",
    "nav.waitingRoom": "Sala de Espera",
    "nav.library": "Biblioteca",
    "nav.community": "Comunidad",
    "nav.investors": "Inversores",
    "nav.shopping_dashboard": "Tienda",
    "nav.blog": "Blog",
    "nav.iomt": "IoMT Hub",
    // Hero
    "hero.title": "Planta y Raiz - Mega Clínica Digital",
    "hero.subtitle": "Democratizando el acceso a la salud y el bienestar a través de la tecnología y el cannabis medicinal.",
    "hero.start_consultation": "Iniciar Orientação Técnica",
    "hero.online_now": "En línea ahora",
    "hero.responsible_tech": "Responsable Técnico y Jurídico",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.loading": "Cargando...",
    "common.search": "Buscar",
    "common.send": "Enviar",
    "common.close": "Cerrar",
    "common.confirm": "Confirmar",
    "common.back": "Volver",
    "common.next": "Siguiente",
    "common.yes": "Sí",
    "common.no": "No",
    "consult.title": "Teleconsulta",
    "consult.mute": "Silenciar",
    "consult.unmute": "Activar micrófono",
    "consult.endCall": "Terminar Llamada",
    "consult.chat": "Chat",
    "consult.aiAssistant": "Asistente IA",
    "consult.medicalRecord": "Historia Clínica",
    "consult.elapsed": "Tiempo de consulta",
    "consult.waitingRoom": "Sala de Espera Virtual",
    "consult.yourTurn": "¡Tu turno!",
    "consult.estimatedWait": "Tiempo estimado de espera",
    "consult.position": "Posición en la cola",
    "med.diagnosis": "Diagnóstico",
    "med.prescription": "Receta",
    "med.complaint": "Motivo de Orientação Técnica",
    "med.history": "Historial",
    "med.treatment": "Plan Terapéutico",
    "med.sign": "Firmar Digitalmente",
    "med.icd": "CIE-10 / CIE-11",
    "compliance.tcle": "Consentimiento Informado",
    "compliance.lgpd": "Derechos del Titular (LGPD)",
    "compliance.hipaa": "Cumplimiento HIPAA",
    "compliance.dataResidency": "Residencia de Datos",
    "compliance.encryption": "Cifrado E2E",
    "network.excellent": "Excelente",
    "network.good": "Buena",
    "network.fair": "Regular",
    "network.poor": "Débil",
    "network.quality": "Calidad de conexión",
    "a11y.skipToContent": "Saltar al contenido",
    "a11y.mainMenu": "Menú principal",
    "a11y.videoArea": "Área de video de teleconsulta",
    "a11y.chatArea": "Área de chat",
  },
};

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "pt",
  setLocale: () => {},
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("pr-locale");
    if (saved && ["pt", "en", "es"].includes(saved)) return saved as Locale;
    const browser = navigator.language.slice(0, 2);
    if (browser === "es") return "es";
    if (browser === "en") return "en";
    return "pt";
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("pr-locale", l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string) => translations[locale]?.[key] ?? translations.pt[key] ?? key,
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

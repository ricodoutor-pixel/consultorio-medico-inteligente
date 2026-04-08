/**
 * 🏢 Planta y Raiz - Mega Clínica Digital
 * 🚀 Manus CEO: Módulo de Internacionalização (i18n)
 * 🌍 Suporte: Português (BR), Espanhol (ES), Inglês (EN)
 */

export type Language = 'pt' | 'es' | 'en';

export const translations = {
  pt: {
    hero_title: "Planta y Raiz - Mega Clínica Digital",
    hero_subtitle: "Democratizando o acesso à saúde e bem-estar através da tecnologia e cannabis medicinal.",
    start_consultation: "Iniciar Consulta",
    professionals: "Profissionais",
    shopping: "Shopping",
    online_status: "Online agora",
    cfm_badge: "CFM 2314 + LGPD",
    responsible_tech: "Supervisionado por IA de última geração 24×7",
  },
  es: {
    hero_title: "Planta y Raiz - Mega Clínica Digital",
    hero_subtitle: "Democratizando el acceso a la salud y el bienestar a través de la tecnología y el cannabis medicinal.",
    start_consultation: "Iniciar Consulta",
    professionals: "Profesionales",
    shopping: "Tienda",
    online_status: "En línea ahora",
    cfm_badge: "CFM 2314 + LGPD",
    responsible_tech: "Supervisado por IA de última generación 24×7",
  },
  en: {
    hero_title: "Planta y Raiz - Mega Digital Clinic",
    hero_subtitle: "Democratizing access to health and well-being through technology and medical cannabis.",
    start_consultation: "Start Consultation",
    professionals: "Professionals",
    shopping: "Shopping",
    online_status: "Online now",
    cfm_badge: "CFM 2314 + LGPD",
    responsible_tech: "Supervised by cutting-edge AI 24×7",
  }
};

export const getTranslation = (lang: Language, key: keyof typeof translations['pt']) => {
  return translations[lang][key] || translations['pt'][key];
};

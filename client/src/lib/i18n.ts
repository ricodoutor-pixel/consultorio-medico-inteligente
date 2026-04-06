/**
 * 🌍 INTERNACIONALIZAÇÃO (i18n) - PLANTA Y RAIZ
 * Suporte para múltiplos idiomas e culturas
 * Data: 5 de Abril de 2026
 */

import { createContext, useContext, ReactNode } from 'react';

// Idiomas suportados
export type Language = 'pt' | 'es' | 'en' | 'fr' | 'ar' | 'de';

interface LanguageConfig {
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

export const LANGUAGES: Record<Language, LanguageConfig> = {
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', direction: 'ltr' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', direction: 'ltr' },
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧', direction: 'ltr' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷', direction: 'ltr' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', direction: 'rtl' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', direction: 'ltr' },
};

// Dicionário de traduções
export const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Header
    'header.title': 'Saúde & Liberdade',
    'header.subtitle': 'Telemedicina Cannabis Medicinal',
    'header.login': 'Entrar',
    'header.signup': 'Cadastrar',
    'header.language': 'Idioma',

    // Hero
    'hero.main': 'Bem-vindo à Planta y Raiz',
    'hero.description': 'Acesso equitativo à saúde cannabis medicinal para todos',
    'hero.cta': 'Começar Agora',
    'hero.learn': 'Saiba Mais',

    // Consultation
    'consultation.title': 'Agendar Consulta',
    'consultation.description': 'Conecte-se com médicos especializados',
    'consultation.price': 'R$ 150,00',
    'consultation.duration': '30 minutos',
    'consultation.book': 'Agendar',

    // AI Triage
    'triage.title': 'Triagem IA - Brisa',
    'triage.description': 'Triagem gratuita com inteligência artificial',
    'triage.start': 'Iniciar Triagem',
    'triage.free': 'Completamente Gratuito',

    // Marketplace
    'marketplace.title': 'Club Planta y Raiz',
    'marketplace.description': 'Produtos premium com a marca Planta y Raiz',
    'marketplace.cart': 'Carrinho',
    'marketplace.checkout': 'Finalizar Compra',

    // Footer
    'footer.about': 'Sobre Nós',
    'footer.contact': 'Contato',
    'footer.privacy': 'Privacidade',
    'footer.terms': 'Termos de Uso',
    'footer.copyright': '© 2026 Planta y Raiz. Todos os direitos reservados.',

    // Common
    'common.loading': 'Carregando...',
    'common.error': 'Erro ao carregar',
    'common.success': 'Sucesso!',
    'common.back': 'Voltar',
    'common.next': 'Próximo',
    'common.cancel': 'Cancelar',
    'common.save': 'Salvar',
  },

  es: {
    'header.title': 'Salud & Libertad',
    'header.subtitle': 'Telemedicina Cannabis Medicinal',
    'header.login': 'Iniciar Sesión',
    'header.signup': 'Registrarse',
    'header.language': 'Idioma',

    'hero.main': 'Bienvenido a Planta y Raiz',
    'hero.description': 'Acceso equitativo a la salud cannabis medicinal para todos',
    'hero.cta': 'Comenzar Ahora',
    'hero.learn': 'Más Información',

    'consultation.title': 'Agendar Consulta',
    'consultation.description': 'Conéctate con médicos especializados',
    'consultation.price': '$150 USD',
    'consultation.duration': '30 minutos',
    'consultation.book': 'Agendar',

    'triage.title': 'Triaje IA - Brisa',
    'triage.description': 'Triaje gratuito con inteligencia artificial',
    'triage.start': 'Iniciar Triaje',
    'triage.free': 'Completamente Gratis',

    'marketplace.title': 'Club Planta y Raiz',
    'marketplace.description': 'Productos premium con la marca Planta y Raiz',
    'marketplace.cart': 'Carrito',
    'marketplace.checkout': 'Finalizar Compra',

    'footer.about': 'Acerca de Nosotros',
    'footer.contact': 'Contacto',
    'footer.privacy': 'Privacidad',
    'footer.terms': 'Términos de Uso',
    'footer.copyright': '© 2026 Planta y Raiz. Todos los derechos reservados.',

    'common.loading': 'Cargando...',
    'common.error': 'Error al cargar',
    'common.success': '¡Éxito!',
    'common.back': 'Atrás',
    'common.next': 'Siguiente',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
  },

  en: {
    'header.title': 'Health & Freedom',
    'header.subtitle': 'Medical Cannabis Telemedicine',
    'header.login': 'Login',
    'header.signup': 'Sign Up',
    'header.language': 'Language',

    'hero.main': 'Welcome to Planta y Raiz',
    'hero.description': 'Equitable access to medical cannabis health for everyone',
    'hero.cta': 'Get Started',
    'hero.learn': 'Learn More',

    'consultation.title': 'Schedule Consultation',
    'consultation.description': 'Connect with specialized doctors',
    'consultation.price': '$150 USD',
    'consultation.duration': '30 minutes',
    'consultation.book': 'Book Now',

    'triage.title': 'AI Triage - Brisa',
    'triage.description': 'Free triage with artificial intelligence',
    'triage.start': 'Start Triage',
    'triage.free': 'Completely Free',

    'marketplace.title': 'Planta y Raiz Club',
    'marketplace.description': 'Premium products with Planta y Raiz brand',
    'marketplace.cart': 'Cart',
    'marketplace.checkout': 'Checkout',

    'footer.about': 'About Us',
    'footer.contact': 'Contact',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms of Use',
    'footer.copyright': '© 2026 Planta y Raiz. All rights reserved.',

    'common.loading': 'Loading...',
    'common.error': 'Error loading',
    'common.success': 'Success!',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
  },

  fr: {
    'header.title': 'Santé & Liberté',
    'header.subtitle': 'Télémédecine Cannabis Médical',
    'header.login': 'Connexion',
    'header.signup': 'S\'inscrire',
    'header.language': 'Langue',

    'hero.main': 'Bienvenue à Planta y Raiz',
    'hero.description': 'Accès équitable à la santé du cannabis médical pour tous',
    'hero.cta': 'Commencer',
    'hero.learn': 'En Savoir Plus',

    'consultation.title': 'Prendre Rendez-vous',
    'consultation.description': 'Connectez-vous avec des médecins spécialisés',
    'consultation.price': '150 € EUR',
    'consultation.duration': '30 minutes',
    'consultation.book': 'Réserver',

    'triage.title': 'Triage IA - Brisa',
    'triage.description': 'Triage gratuit avec intelligence artificielle',
    'triage.start': 'Commencer le Triage',
    'triage.free': 'Complètement Gratuit',

    'marketplace.title': 'Club Planta y Raiz',
    'marketplace.description': 'Produits premium avec la marque Planta y Raiz',
    'marketplace.cart': 'Panier',
    'marketplace.checkout': 'Passer la Commande',

    'footer.about': 'À Propos',
    'footer.contact': 'Contact',
    'footer.privacy': 'Confidentialité',
    'footer.terms': 'Conditions d\'Utilisation',
    'footer.copyright': '© 2026 Planta y Raiz. Tous droits réservés.',

    'common.loading': 'Chargement...',
    'common.error': 'Erreur de chargement',
    'common.success': 'Succès!',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
  },

  ar: {
    'header.title': 'الصحة والحرية',
    'header.subtitle': 'طب التلمذة الطبية بالقنب',
    'header.login': 'تسجيل الدخول',
    'header.signup': 'إنشاء حساب',
    'header.language': 'اللغة',

    'hero.main': 'مرحبا بك في Planta y Raiz',
    'hero.description': 'وصول عادل لصحة القنب الطبي للجميع',
    'hero.cta': 'ابدأ الآن',
    'hero.learn': 'معرفة المزيد',

    'consultation.title': 'حجز استشارة',
    'consultation.description': 'تواصل مع الأطباء المتخصصين',
    'consultation.price': '150 ر.س',
    'consultation.duration': '30 دقيقة',
    'consultation.book': 'احجز الآن',

    'triage.title': 'الفرز الذكي - Brisa',
    'triage.description': 'فرز مجاني بالذكاء الاصطناعي',
    'triage.start': 'ابدأ الفرز',
    'triage.free': 'مجاني تماما',

    'marketplace.title': 'نادي Planta y Raiz',
    'marketplace.description': 'منتجات فاخرة بعلامة Planta y Raiz',
    'marketplace.cart': 'السلة',
    'marketplace.checkout': 'إتمام الشراء',

    'footer.about': 'عن الشركة',
    'footer.contact': 'اتصل بنا',
    'footer.privacy': 'الخصوصية',
    'footer.terms': 'شروط الاستخدام',
    'footer.copyright': '© 2026 Planta y Raiz. جميع الحقوق محفوظة.',

    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ في التحميل',
    'common.success': 'نجح!',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
  },

  de: {
    'header.title': 'Gesundheit & Freiheit',
    'header.subtitle': 'Telemedizin für medizinisches Cannabis',
    'header.login': 'Anmelden',
    'header.signup': 'Registrieren',
    'header.language': 'Sprache',

    'hero.main': 'Willkommen bei Planta y Raiz',
    'hero.description': 'Gerechter Zugang zur medizinischen Cannabisgesundheit für alle',
    'hero.cta': 'Jetzt Starten',
    'hero.learn': 'Mehr Erfahren',

    'consultation.title': 'Beratung Buchen',
    'consultation.description': 'Verbinden Sie sich mit spezialisierten Ärzten',
    'consultation.price': '150 € EUR',
    'consultation.duration': '30 Minuten',
    'consultation.book': 'Jetzt Buchen',

    'triage.title': 'KI-Triage - Brisa',
    'triage.description': 'Kostenlose Triage mit künstlicher Intelligenz',
    'triage.start': 'Triage Starten',
    'triage.free': 'Völlig Kostenlos',

    'marketplace.title': 'Planta y Raiz Club',
    'marketplace.description': 'Premium-Produkte mit der Marke Planta y Raiz',
    'marketplace.cart': 'Warenkorb',
    'marketplace.checkout': 'Zur Kasse',

    'footer.about': 'Über Uns',
    'footer.contact': 'Kontakt',
    'footer.privacy': 'Datenschutz',
    'footer.terms': 'Nutzungsbedingungen',
    'footer.copyright': '© 2026 Planta y Raiz. Alle Rechte vorbehalten.',

    'common.loading': 'Wird geladen...',
    'common.error': 'Fehler beim Laden',
    'common.success': 'Erfolg!',
    'common.back': 'Zurück',
    'common.next': 'Weiter',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
  },
};

// Context para i18n
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languages: typeof LANGUAGES;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Provider
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = React.useState<Language>('pt');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook para usar i18n
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n deve ser usado dentro de I18nProvider');
  }
  return context;
}

// Função para detectar idioma do navegador
export function detectBrowserLanguage(): Language {
  const browserLang = navigator.language.split('-')[0];
  const supportedLangs = Object.keys(LANGUAGES) as Language[];
  return (supportedLangs.includes(browserLang as Language) ? browserLang : 'pt') as Language;
}

// Função para formatar data por idioma
export function formatDate(date: Date, language: Language): string {
  return new Intl.DateTimeFormat(language === 'pt' ? 'pt-BR' : language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Função para formatar moeda por idioma
export function formatCurrency(amount: number, language: Language): string {
  const currencyMap: Record<Language, string> = {
    pt: 'BRL',
    es: 'USD',
    en: 'USD',
    fr: 'EUR',
    ar: 'SAR',
    de: 'EUR',
  };

  return new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : language, {
    style: 'currency',
    currency: currencyMap[language],
  }).format(amount);
}

export default {
  I18nProvider,
  useI18n,
  detectBrowserLanguage,
  formatDate,
  formatCurrency,
  LANGUAGES,
  translations,
};

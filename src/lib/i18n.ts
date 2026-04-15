import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pt from '@/locales/pt.json';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

const savedLocale = localStorage.getItem('pr-locale') || 
  (navigator.language.startsWith('es') ? 'es' : navigator.language.startsWith('en') ? 'en' : 'pt');

i18n.use(initReactI18next).init({
  resources: { pt: { translation: pt }, en: { translation: en }, es: { translation: es } },
  lng: savedLocale,
  fallbackLng: 'pt',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('pr-locale', lng);
  document.documentElement.lang = lng;
});

export default i18n;

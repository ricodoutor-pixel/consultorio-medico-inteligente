import { useLanguage } from "@/contexts/LanguageContext";

export const AccessibilitySkipLink = () => {
  const { t } = useLanguage();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:text-sm focus:font-bold focus:shadow-lg transition-all"
    >
      {t("a11y.skipToContent")}
    </a>
  );
};

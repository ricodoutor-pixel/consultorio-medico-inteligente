import { useLanguage, Locale } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FLAGS: Record<Locale, { label: string; flag: string }> = {
  pt: { label: "Português", flag: "🇧🇷" },
  en: { label: "English", flag: "🇺🇸" },
  es: { label: "Español", flag: "🇧🇴" },
};

export const LanguageSwitcher = () => {
  const { locale, setLocale } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" aria-label="Change language">
          <Globe size={14} />
          <span>{FLAGS[locale].flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {(Object.entries(FLAGS) as [Locale, { label: string; flag: string }][]).map(([key, val]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => setLocale(key)}
            className={`gap-2 text-xs ${locale === key ? "bg-primary/10 font-bold" : ""}`}
          >
            <span>{val.flag}</span> {val.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Currency = "BRL" | "USD" | "EUR";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Conversion rate from BRL to current currency (1 BRL = rate * currency) */
  rate: number;
  /** Format a BRL amount in the active currency. */
  format: (amountBRL: number) => string;
  /** Convert BRL → active currency value (numeric). */
  convert: (amountBRL: number) => number;
}

// Static fallback rates (refreshed manually). Override via VITE_FX_API if desired.
const DEFAULT_RATES: Record<Currency, number> = {
  BRL: 1,
  USD: 0.18,
  EUR: 0.17,
};

const LOCALES: Record<Currency, string> = {
  BRL: "pt-BR",
  USD: "en-US",
  EUR: "es-ES",
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "BRL",
  setCurrency: () => {},
  rate: 1,
  format: (v) => `R$ ${v.toFixed(2)}`,
  convert: (v) => v,
});

export const useCurrency = () => useContext(CurrencyContext);

const detectCurrencyFromLocale = (): Currency => {
  const saved = localStorage.getItem("pr-currency") as Currency | null;
  if (saved && ["BRL", "USD", "EUR"].includes(saved)) return saved;

  try {
    const lang = navigator.language || "";
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    // USA detection
    if (lang.startsWith("en-US") || tz.startsWith("America/") && !tz.includes("Sao_Paulo") && !tz.includes("Argentina") && !tz.includes("Bogota") && !tz.includes("La_Paz")) {
      // Restrict to US-specific time zones
      if (tz.includes("New_York") || tz.includes("Los_Angeles") || tz.includes("Chicago") || tz.includes("Denver") || tz.includes("Phoenix") || tz.includes("Anchorage") || tz.includes("Honolulu") || lang === "en-US") {
        return "USD";
      }
    }
    if (lang.startsWith("es-ES") || tz === "Europe/Madrid") return "EUR";
  } catch {
    // ignore
  }
  return "BRL";
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(detectCurrencyFromLocale);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("pr-currency", c);
  };

  useEffect(() => {
    document.documentElement.dataset.currency = currency;
  }, [currency]);

  const rate = DEFAULT_RATES[currency];

  const convert = (amountBRL: number) => Number((amountBRL * rate).toFixed(2));

  const format = (amountBRL: number) => {
    const value = convert(amountBRL);
    try {
      return new Intl.NumberFormat(LOCALES[currency], {
        style: "currency",
        currency,
      }).format(value);
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rate, format, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
};

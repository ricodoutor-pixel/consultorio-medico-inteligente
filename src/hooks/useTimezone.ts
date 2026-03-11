import { useMemo } from "react";

/**
 * Timezone-aware scheduling hook for global telemedicine
 * Detects user timezone, converts between regions
 */
export const useTimezone = () => {
  const userTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const userOffset = useMemo(() => new Date().getTimezoneOffset(), []);

  const formatInTimezone = (date: Date | string, tz?: string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz || userTimezone,
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  };

  const convertToUTC = (date: Date): Date => {
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  };

  const convertFromUTC = (utcDate: Date, tz?: string): string => {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz || userTimezone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(utcDate);
  };

  const getRegionTimezone = (region: "br" | "us" | "bo" | "latam") => {
    const MAP: Record<string, string> = {
      br: "America/Sao_Paulo",
      us: "America/New_York",
      bo: "America/La_Paz",
      latam: "America/Mexico_City",
    };
    return MAP[region] || userTimezone;
  };

  return {
    userTimezone,
    userOffset,
    formatInTimezone,
    convertToUTC,
    convertFromUTC,
    getRegionTimezone,
  };
};

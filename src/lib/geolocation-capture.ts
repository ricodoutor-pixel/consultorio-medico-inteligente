/**
 * Captura geolocalização do usuário (1x ao aceitar termos) + reverse geocoding via edge function.
 * LGPD: só executa após consentimento explícito.
 */
import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "pr_geo_captured_v1";

export async function captureUserGeolocation(force = false): Promise<void> {
  if (!force && localStorage.getItem(LS_KEY)) return;
  if (!("geolocation" in navigator)) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        await supabase.functions.invoke("capture-user-location", {
          body: { latitude, longitude },
        });
        localStorage.setItem(LS_KEY, String(Date.now()));
      } catch (e) {
        console.error("[geo-capture]", e);
      }
    },
    (err) => {
      console.warn("[geo-capture] denied", err.message);
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
  );
}

export async function refreshUserGeolocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          await supabase.functions.invoke("capture-user-location", {
            body: { latitude, longitude, emergency: true },
          });
        } catch {}
        resolve({ lat: latitude, lng: longitude });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

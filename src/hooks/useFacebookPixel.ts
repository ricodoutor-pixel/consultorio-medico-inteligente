/**
 * Facebook Pixel Hook — Planta y Raiz
 * Loads the Meta Pixel script and provides tracking helpers.
 * Also bridges events to Supabase social_interactions for CAPI.
 */
import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PIXEL_ID = (import.meta.env.VITE_FACEBOOK_PIXEL_ID as string | undefined) || "820052977324750";

/* ---------- script loader (runs once) ---------- */
let pixelLoaded = false;

function loadPixelScript(pixelId: string) {
  if (pixelLoaded || typeof window === "undefined") return;
  pixelLoaded = true;

  /* Meta base code */
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function (...args: any[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s?.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq?.("init", pixelId);
  window.fbq?.("track", "PageView");
}

/* ---------- CAPI bridge: log to Supabase ---------- */
async function bridgeToSupabase(
  eventName: string,
  properties?: Record<string, unknown>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data } = await supabase.from("social_interactions").insert([{
      platform: "facebook_pixel" as string,
      interaction_type: eventName,
      post_url: window.location.pathname,
      subscriber_id: user?.id || null,
      lead_score: (properties?.lead_score as number) ?? 0,
      funnel_stage: (properties?.funnel_stage as string) ?? "awareness",
      campaign_source: "meta_pixel",
      engagement_data: JSON.parse(JSON.stringify({
        pixel_id: PIXEL_ID,
        event_properties: properties,
        page_url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        timestamp: Date.now(),
      })),
      tags: ["meta_pixel", eventName.toLowerCase()],
    }]).select("id").single();

    // Use the DB row ID as event_id for deduplication with CAPI
    if (data?.id && typeof window.fbq === "function") {
      window.fbq("track", eventName, properties, { eventID: data.id });
    }
  } catch (err) {
    console.warn("[FB Pixel CAPI Bridge]", err);
  }
}

/* ---------- public tracking helper ---------- */
export function trackPixelEvent(
  eventName: string,
  properties?: Record<string, unknown>,
  options?: { leadScore?: number; funnelStage?: string; category?: string }
) {
  // Client-side pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", eventName, properties);
  }

  // GTM dataLayer enrichment
  window.dataLayer?.push({
    event: `fb_${eventName}`,
    lead_score: options?.leadScore ?? 0,
    category: options?.category ?? "general",
    ...properties,
  });

  // Server-side bridge
  bridgeToSupabase(eventName, {
    ...properties,
    lead_score: options?.leadScore ?? 0,
    funnel_stage: options?.funnelStage ?? "awareness",
    category: options?.category,
  });

  if (import.meta.env.DEV) {
    console.log(`[FB Pixel] ${eventName}`, properties, options);
  }
}

/* ---------- hook ---------- */
export function useFacebookPixel() {
  const location = useLocation();

  // Load script once
  useEffect(() => {
    if (PIXEL_ID) loadPixelScript(PIXEL_ID);
  }, []);

  // Track PageView on every route change
  useEffect(() => {
    if (!PIXEL_ID) return;
    window.fbq?.("track", "PageView");
    bridgeToSupabase("PageView", {
      page: location.pathname,
      funnel_stage: "awareness",
      lead_score: 1,
    });
  }, [location.pathname]);

  const trackLead = useCallback(
    (props?: Record<string, unknown>) =>
      trackPixelEvent("Lead", props, {
        leadScore: 30,
        funnelStage: "intent",
        category: "conversion",
      }),
    []
  );

  const trackSchedule = useCallback(
    (props?: Record<string, unknown>) =>
      trackPixelEvent("Schedule", props, {
        leadScore: 35,
        funnelStage: "decision",
        category: "conversion",
      }),
    []
  );

  const trackContact = useCallback(
    (props?: Record<string, unknown>) =>
      trackPixelEvent("Contact", props, {
        leadScore: 20,
        funnelStage: "intent",
        category: "conversion",
      }),
    []
  );

  const trackCustom = useCallback(
    (name: string, props?: Record<string, unknown>, opts?: { leadScore?: number; funnelStage?: string; category?: string }) =>
      trackPixelEvent(name, props, opts),
    []
  );

  return { trackLead, trackSchedule, trackContact, trackCustom };
}

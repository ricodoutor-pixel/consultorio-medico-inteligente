import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// SYSTEM CACHE — Cache Inteligente com Supabase
// Planta & Raiz 3.0 — Performance Layer
// ============================================================================

// In-memory cache for edge function lifetime
const memoryCache = new Map<string, { data: unknown; expiresAt: number }>();

const TTL_CONFIG: Record<string, number> = {
  doctor_profile: 3600,      // 1h
  doctor_availability: 900,  // 15min
  consultation_history: 86400, // 24h
  nps_data: 3600,            // 1h
  leaderboard: 300,          // 5min
  strain_catalog: 7200,      // 2h
  system_metrics: 60,        // 1min
};

function getCacheKey(namespace: string, id: string): string {
  return `${namespace}:${id}`;
}

function getFromMemory(key: string): unknown | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
}

function setInMemory(key: string, data: unknown, ttlSeconds: number): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  // Evict oldest if cache too large
  if (memoryCache.size > 500) {
    const oldest = memoryCache.keys().next().value;
    if (oldest) memoryCache.delete(oldest);
  }
}

import { requireServiceAuth } from "../_shared/service-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const unauthorized = requireServiceAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, namespace, id, data } = await req.json();

    // GET — buscar do cache
    if (action === "get") {
      const key = getCacheKey(namespace, id);
      
      // 1. Check memory
      const memResult = getFromMemory(key);
      if (memResult) {
        return new Response(JSON.stringify({ 
          hit: true, source: "memory", data: memResult 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2. Check DB cache table
      const { data: cached } = await supabase
        .from("system_cache")
        .select("*")
        .eq("cache_key", key)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (cached) {
        // Warm memory cache
        const ttl = TTL_CONFIG[namespace] || 300;
        setInMemory(key, cached.cache_value, ttl);
        return new Response(JSON.stringify({ 
          hit: true, source: "db", data: cached.cache_value 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ hit: false, data: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SET — gravar no cache
    if (action === "set") {
      const key = getCacheKey(namespace, id);
      const ttl = TTL_CONFIG[namespace] || 300;
      const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

      // Memory
      setInMemory(key, data, ttl);

      // DB (upsert)
      await supabase.from("system_cache").upsert({
        cache_key: key,
        namespace,
        cache_value: data,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "cache_key" });

      return new Response(JSON.stringify({ success: true, ttl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // INVALIDATE — limpar cache
    if (action === "invalidate") {
      const key = getCacheKey(namespace, id);
      memoryCache.delete(key);
      await supabase.from("system_cache").delete().eq("cache_key", key);

      return new Response(JSON.stringify({ success: true, invalidated: key }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // INVALIDATE_NAMESPACE — limpar todo namespace
    if (action === "invalidate_namespace") {
      for (const [k] of memoryCache) {
        if (k.startsWith(`${namespace}:`)) memoryCache.delete(k);
      }
      await supabase.from("system_cache").delete().like("cache_key", `${namespace}:%`);

      return new Response(JSON.stringify({ success: true, namespace }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STATS
    if (action === "stats") {
      const { count: totalEntries } = await supabase
        .from("system_cache")
        .select("*", { count: "exact", head: true });

      const { count: expiredEntries } = await supabase
        .from("system_cache")
        .select("*", { count: "exact", head: true })
        .lt("expires_at", new Date().toISOString());

      return new Response(JSON.stringify({
        memoryEntries: memoryCache.size,
        dbEntries: totalEntries || 0,
        expiredEntries: expiredEntries || 0,
        namespaces: Object.keys(TTL_CONFIG),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[system-cache] error:", error);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

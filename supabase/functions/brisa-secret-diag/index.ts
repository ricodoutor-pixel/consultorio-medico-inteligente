// Diagnóstico TEMPORÁRIO: retorna apenas o comprimento e SHA-256 do BRISA_CEO_SECRET_KEY do env.
// Não expõe o valor. Útil para alinhar com o vault.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const v = Deno.env.get('BRISA_CEO_SECRET_KEY') || '';
  const bytes = new TextEncoder().encode(v);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return new Response(JSON.stringify({
    env_len: v.length,
    env_sha256: hex,
    env_first2: v.slice(0, 2),
    env_last2: v.slice(-2),
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});

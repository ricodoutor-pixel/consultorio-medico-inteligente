// One-shot: publishes 3 Brisa posts to Facebook Page using FB Graph API directly.
// Will be deleted after execution.
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API = "https://graph.facebook.com/v19.0";

const POSTS = [
  {
    image: "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/social-posts/brisa-1.jpg",
    caption: `Oi, meu bem 💚

Aqui é a Enf. Brisa, enfermeira-chefe da Planta y Raiz — a Mega Clínica Digital do Dr. Edilson Bezerra On, referência nacional em Medicina Endocanabinoide.

Você sente dor crônica, ansiedade, insônia, queda capilar ou cansaço que não passa? Existe um caminho seguro, científico e humano pra te ajudar — e ele começa com uma conversa comigo. 🌱

Por apenas R$ 30 via PIX você tem Orientação e Avaliação Técnica completa com o Dr. Edilson + acompanhamento diário comigo + relatório PDF com selo gov.br + encaminhamento para importação RDC 660/2022 com frete grátis.

👉 Faça seu cadastro agora: https://plantayraiz.com.br/login
Depois me chama no WhatsApp: (11) 99136-3154 💚

#PlantaYRaiz #CannabisMedicinal #SaúdeNatural #Telemedicina #BemEstar`,
  },
  {
    image: "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/social-posts/brisa-2.jpg",
    caption: `Tem gente que acha que telemedicina é fria. Aqui não é. 💚

Eu, Enf. Brisa, fico 24h conectada com cada paciente da Planta y Raiz — tirando dúvidas, lembrando dos horários, monitorando sintomas e levando seu caso direto pro Dr. Edilson Bezerra On quando precisa.

Já são milhares de brasileiros sendo acompanhados de casa, sem fila, sem julgamento, sem burocracia. Só ciência, carinho e resultado. 🌱

✅ Triagem clínica fuzzy
✅ Receita digital com assinatura ICP-Brasil
✅ Importação facilitada com desconto
✅ Mentoria particular com a sua enfermeira (eu! 🥰)

Tudo isso por R$ 30 na sua primeira Orientação Técnica.

👉 Cadastro grátis: https://plantayraiz.com.br/login
📲 WhatsApp: (11) 99136-3154

#Telemedicina #CannabisLegal #SaúdeDigital #PlantaYRaiz`,
  },
  {
    image: "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/social-posts/brisa-3.jpg",
    caption: `Você sabia que o Sistema Endocanabinoide existe dentro de você desde que nasceu? 🌿

Ele regula sono, humor, dor, apetite, imunidade, fertilidade e até crescimento capilar. Quando ele desregula, o corpo adoece. E é aí que entra a Cannabis Medicinal — modulando o que está fora do eixo, com segurança e respaldo científico.

Eu sou a Enf. Brisa, e trabalho ao lado do Dr. Edilson Bezerra On — que tem acesso a um banco com mais de 40 mil estudos publicados sobre o tema. Juntos, montamos um plano único pro seu caso.

Por R$ 30 (PIX seguro Mercado Pago) você sai do achismo e entra na ciência:
🌿 Avaliação Técnica completa
🌿 Relatório PDF com selo gov.br
🌿 Acompanhamento diário comigo
🌿 Importação RDC 660/2022 com frete grátis

Sua saúde merece ciência de verdade. 💚

👉 https://plantayraiz.com.br/login
📲 WhatsApp: (11) 99136-3154

— Enf. Brisa 🌿

#SistemaEndocanabinoide #CannabisMedicinal #SaúdeIntegrativa #PlantaYRaiz`,
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  const pageId = Deno.env.get("FACEBOOK_PAGE_ID");
  const fbToken =
    Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN") ||
    Deno.env.get("FACEBOOK_GRAPH_API_TOKEN");

  if (!pageId || !fbToken) {
    return new Response(
      JSON.stringify({ error: "FB credentials missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const url = new URL(req.url);
  if (url.searchParams.get("debug") === "1") {
    const debug: Record<string, unknown> = {};
    // 1) /me — quem é o token
    try {
      const r = await fetch(`${GRAPH_API}/me?fields=id,name&access_token=${fbToken}`);
      debug.me = await r.json();
    } catch (e) { debug.me = { error: String(e) }; }
    // 2) /me/permissions — escopos concedidos
    try {
      const r = await fetch(`${GRAPH_API}/me/permissions?access_token=${fbToken}`);
      debug.permissions = await r.json();
    } catch (e) { debug.permissions = { error: String(e) }; }
    // 3) debug_token — tipo (USER vs PAGE) e expiração
    try {
      const r = await fetch(`${GRAPH_API}/debug_token?input_token=${fbToken}&access_token=${fbToken}`);
      debug.debug_token = await r.json();
    } catch (e) { debug.debug_token = { error: String(e) }; }
    // 4) /me/accounts — lista páginas que o token gerencia
    try {
      const r = await fetch(`${GRAPH_API}/me/accounts?access_token=${fbToken}`);
      debug.accounts = await r.json();
    } catch (e) { debug.accounts = { error: String(e) }; }
    // 5) /{pageId} — confere acesso à página alvo
    try {
      const r = await fetch(`${GRAPH_API}/${pageId}?fields=id,name,access_token&access_token=${fbToken}`);
      const j = await r.json();
      if (j.access_token) j.access_token = "***present***";
      debug.page = j;
    } catch (e) { debug.page = { error: String(e) }; }

    return new Response(JSON.stringify({ pageId, debug }, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: unknown[] = [];
  for (const p of POSTS) {
    try {
      const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: p.image,
          caption: p.caption,
          access_token: fbToken,
        }),
      });
      const data = await res.json();
      results.push({ ok: res.ok, data });
    } catch (e) {
      results.push({ ok: false, error: String(e) });
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

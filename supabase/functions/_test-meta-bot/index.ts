// Temporary test harness: signs a fake Messenger payload with FACEBOOK_APP_SECRET
// and POSTs it to meta-messenger-bot to validate the full pipeline.
const FB_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const channel = url.searchParams.get("channel") ?? "messenger"; // or "instagram"
  const text = url.searchParams.get("text") ?? "Olá Brisa, estou com dor crônica nas costas há 2 meses. Pode me ajudar?";
  const senderId = url.searchParams.get("sender") ?? "TEST_USER_999";
  const entryId = channel === "instagram"
    ? (Deno.env.get("INSTAGRAM_BUSINESS_ACCOUNT_ID") ?? "IG_TEST")
    : "PAGE_TEST";

  const payload = {
    object: channel === "instagram" ? "instagram" : "page",
    entry: [{
      id: entryId,
      time: Date.now(),
      messaging: [{
        sender: { id: senderId },
        recipient: { id: entryId },
        timestamp: Date.now(),
        message: { mid: "mid.test." + crypto.randomUUID(), text },
      }],
    }],
  };

  const raw = JSON.stringify(payload);
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(FB_APP_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const sig = "sha256=" + Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, "0")).join("");

  const r = await fetch(`${SUPABASE_URL}/functions/v1/meta-messenger-bot`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-hub-signature-256": sig },
    body: raw,
  });
  const respText = await r.text();

  // Wait a bit so the background AI call has time to log
  await new Promise(r => setTimeout(r, 4000));

  return new Response(JSON.stringify({
    sent_payload: payload,
    webhook_status: r.status,
    webhook_body: respText,
  }, null, 2), { headers: { "Content-Type": "application/json" } });
});

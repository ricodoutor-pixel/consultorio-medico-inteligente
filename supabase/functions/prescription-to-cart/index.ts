/**
 * prescription-to-cart — Generates a one-click checkout cart from a prescription
 * 
 * Called by doctors after prescribing. Creates a pre-filled cart with products
 * and sends the patient a unique link to complete purchase in 1 click.
 */
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PrescribedItem {
  product_name: string;
  quantity: number;
  dosage?: string;
  unit_price?: number;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Authenticate caller via JWT (anon/publishable key not accepted)
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(token);
    const callerId = claimsData?.claims?.sub as string | undefined;
    if (claimsErr || !callerId) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { prescription_id, doctor_id, patient_id, items, action } = body;

    if (action === "get_cart") {
      // Patient retrieving cart by token — must be the cart's patient
      const { cart_token } = body;
      if (!cart_token) throw new Error("cart_token required");

      const { data: cart, error } = await supabase
        .from("prescription_carts")
        .select("*")
        .eq("cart_token", cart_token)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error || !cart) {
        return new Response(JSON.stringify({ error: "Cart not found or expired" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: callerId, _role: "admin" });
      if (cart.patient_id !== callerId && !isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ status: "ok", cart }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create cart from prescription
    if (!prescription_id || !doctor_id || !patient_id) {
      throw new Error("prescription_id, doctor_id, patient_id required");
    }

    // Verify caller is the prescribing doctor (or admin) and owns this prescription
    const { data: rx, error: rxErr } = await supabase
      .from("prescriptions")
      .select("id, doctor_id, patient_id")
      .eq("id", prescription_id)
      .maybeSingle();
    if (rxErr || !rx) {
      return new Response(JSON.stringify({ error: "Prescription not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: doctorRow } = await supabase
      .from("doctors").select("id").eq("user_id", callerId).maybeSingle();
    const { data: isAdmin2 } = await supabase.rpc("has_role", { _user_id: callerId, _role: "admin" });
    const callerDoctorId = doctorRow?.id;
    if (!isAdmin2 && (!callerDoctorId || rx.doctor_id !== callerDoctorId || rx.doctor_id !== doctor_id)) {
      return new Response(JSON.stringify({ error: "Forbidden: caller is not the prescribing doctor" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (rx.patient_id !== patient_id) {
      return new Response(JSON.stringify({ error: "patient_id does not match prescription" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prescribedItems: PrescribedItem[] = items || [];
    const totalAmount = prescribedItems.reduce((sum: number, item: PrescribedItem) => 
      sum + (item.unit_price || 0) * (item.quantity || 1), 0);

    // Check if patient has active Stripe subscription for discount
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("price_id, status")
      .eq("user_id", patient_id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Map price_id to discount percentage
    const discountMap: Record<string, number> = {
      essencial_mensal: 5,
      premium_mensal: 15,
      vip_mensal: 25,
    };
    const discountPercent = subscription ? (discountMap[subscription.price_id] || 5) : 0;

    const { data: cart, error } = await supabase
      .from("prescription_carts")
      .insert({
        prescription_id,
        patient_id,
        doctor_id,
        items: prescribedItems,
        total_amount: totalAmount * (1 - discountPercent / 100),
        discount_percent: discountPercent,
      })
      .select("id, cart_token")
      .single();

    if (error) throw error;

    const cartUrl = `https://plantayraiz.com.br/carrinho/${cart.cart_token}`;

    // Log to audit
    await supabase.from("audit_log").insert({
      user_id: doctor_id,
      action: "prescription_cart_created",
      table_name: "prescription_carts",
      record_id: cart.id,
      new_data: { prescription_id, items_count: prescribedItems.length, total: totalAmount },
    });

    return new Response(JSON.stringify({
      status: "ok",
      cart_id: cart.id,
      cart_token: cart.cart_token,
      cart_url: cartUrl,
      total_amount: totalAmount,
      discount_percent: discountPercent,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[PRESCRIPTION-CART]", err);
    return new Response(JSON.stringify({ status: "error", message: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

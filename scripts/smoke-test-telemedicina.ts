import { supabase } from "../src/integrations/supabase/client";

async function smokeTest() {
  console.log("Iniciando Smoke Test: Módulo de Telemedicina e Dispensário...");

  try {
    // 1. Check Appointment existence
    console.log("1. Verificando tabela appointments...");
    const { data: appointments, error: apptErr } = await supabase.from('appointments').select('id, type, status').limit(1);
    if (apptErr) throw apptErr;
    console.log("   ✅ appointments OK", appointments);

    // 2. Check Medical Records
    console.log("2. Verificando tabela medical_records...");
    const { data: records, error: recErr } = await supabase.from('medical_records').select('id').limit(1);
    if (recErr) throw recErr;
    console.log("   ✅ medical_records OK");

    // 3. Check Products (Dispensary)
    console.log("3. Verificando tabela products...");
    const { data: products, error: prodErr } = await supabase.from('products').select('id').limit(1);
    if (prodErr) throw prodErr;
    console.log("   ✅ products OK");

    // 4. Check B2B Orders
    console.log("4. Verificando tabela b2b_orders...");
    const { data: b2bOrders, error: b2bErr } = await supabase.from('b2b_orders').select('id').limit(1);
    if (b2bErr) throw b2bErr;
    console.log("   ✅ b2b_orders OK");

    console.log("\n✅ Todos os testes de banco de dados críticos (Supabase) passaram!");
  } catch (err) {
    console.error("\n❌ Falha no Smoke Test:", err);
    process.exit(1);
  }
}

smokeTest();

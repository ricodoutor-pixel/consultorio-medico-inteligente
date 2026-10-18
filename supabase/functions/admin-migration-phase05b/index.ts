import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import postgres from "npm:postgres@3.4.4";

serve(async (req) => {
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) {
    return new Response(JSON.stringify({ error: "SUPABASE_DB_URL not found" }), { status: 500 });
  }

  const sql = postgres(dbUrl, { ssl: "require", max: 1 });

  try {
    const results = [];

    // 1. Add columns
    await sql.unsafe(`
      ALTER TABLE public.doctors 
      ADD COLUMN IF NOT EXISTS council_type TEXT NOT NULL DEFAULT 'CRM',
      ADD COLUMN IF NOT EXISTS council_number TEXT;
    `);
    results.push("1. Columns council_type and council_number ensured");

    // 2. Zero out ratings where total_consultations = 0 OR NULL
    const zeroRes = await sql.unsafe(`
      UPDATE public.doctors
      SET rating = NULL
      WHERE total_consultations = 0 OR total_consultations IS NULL;
    `);
    results.push(`2. Ratings zerados para registros com 0 consultas: ${zeroRes.count}`);

    // 3. Add CHECK constraint on rating
    await sql.unsafe(`
      ALTER TABLE public.doctors
      DROP CONSTRAINT IF EXISTS doctors_rating_requires_consultations;
      ALTER TABLE public.doctors
      ADD CONSTRAINT doctors_rating_requires_consultations
      CHECK (total_consultations > 0 OR rating IS NULL);
    `);
    results.push("3. CHECK constraint doctors_rating_requires_consultations ativa");

    // 4. Trigger de garantia
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.enforce_doctor_rating_check()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF NEW.total_consultations = 0 OR NEW.total_consultations IS NULL THEN
          NEW.rating := NULL;
        END IF;
        RETURN NEW;
      END;
      $$;

      DROP TRIGGER IF EXISTS trg_enforce_doctor_rating_check ON public.doctors;
      CREATE TRIGGER trg_enforce_doctor_rating_check
        BEFORE INSERT OR UPDATE ON public.doctors
        FOR EACH ROW
        EXECUTE FUNCTION public.enforce_doctor_rating_check();
    `);
    results.push("4. Trigger enforce_doctor_rating_check criada");

    // 5. Atualizar classificações de conselho e número
    // 5a. Veterinário
    await sql.unsafe(`
      UPDATE public.doctors
      SET council_type = 'CRMV', council_number = '19333'
      WHERE specialty ILIKE '%Veterinária%' OR full_name ILIKE '%Eduardo Migueis Correa%';
    `);
    results.push("5a. Médico Veterinário classificado como CRMV");

    // 5b. Enfermeiros
    await sql.unsafe(`
      UPDATE public.doctors
      SET council_type = 'COREN', council_number = crm
      WHERE full_name ILIKE 'Enf.%' OR specialty ILIKE '%Enfermagem%';
    `);
    results.push("5b. Enfermeiros classificados como COREN");

    // 5c. Farmacêuticos
    await sql.unsafe(`
      UPDATE public.doctors
      SET council_type = 'CRF', council_number = crm
      WHERE specialty ILIKE '%Farmácia%' OR specialty ILIKE '%Farmacologia%' OR specialty ILIKE '%Farmacotécnica%' OR specialty ILIKE '%Toxicologia%';
    `);
    results.push("5c. Farmacêuticos clínicos classificados como CRF");

    // 5d. Técnicos de enfermagem -> A_CONFIRMAR (auditoria manual)
    await sql.unsafe(`
      UPDATE public.doctors
      SET council_type = 'A_CONFIRMAR', council_number = crm
      WHERE full_name ILIKE 'Téc.%';
    `);
    results.push("5d. Técnicos classificados como A_CONFIRMAR");

    // 5e. Auxiliares, Psicólogos, Ocupacional, Acupuntura, Cuidadores, Jardineiros, Integrativa
    await sql.unsafe(`
      UPDATE public.doctors
      SET council_type = 'A_CONFIRMAR', council_number = crm
      WHERE crm IN ('AUX-1','AUX-2','AUX-3','AUX-4','AUX-5',
                    'PSI-1','PSI-2','PSI-3','PSI-4','PSI-5','PSI-6',
                    'OCU-1','OCU-2','OCU-3','OCU-4','OCU-5','OCU-6',
                    'ACU-1','ACU-2','ACU-3','ACU-4','ACU-5','ACU-6',
                    'JAR-1','JAR-2','JAR-3','JAR-4','JAR-5','JAR-6',
                    'CUID-1','CUID-2','CUID-3',
                    'INT-1','INT-2','INT-3');
    `);
    results.push("5e. Categorias com placeholders marcadas como A_CONFIRMAR");

    // 5f. Médicos reais com CRM
    await sql.unsafe(`
      UPDATE public.doctors
      SET council_type = 'CRM', council_number = crm
      WHERE council_type = 'CRM' AND (council_number IS NULL OR council_number = '');
    `);
    results.push("5f. Médicos com CRM confirmados");

    // 6. Check constraint no council_type
    await sql.unsafe(`
      ALTER TABLE public.doctors
      DROP CONSTRAINT IF EXISTS doctors_council_type_check;
      ALTER TABLE public.doctors
      ADD CONSTRAINT doctors_council_type_check
      CHECK (council_type IN ('CRM', 'COREN', 'CRF', 'CRMV', 'CRP', 'OUTRO', 'A_CONFIRMAR'));
    `);
    results.push("6. CHECK constraint doctors_council_type_check ativa");

    // 7. Atualizar view doctors_public
    try {
      await sql.unsafe(`
        CREATE OR REPLACE VIEW public.doctors_public AS
        SELECT 
          id, user_id, crm, crm_state, rqe, specialty, bio, consultation_price,
          is_online, is_verified, rating, total_consultations, available_hours,
          created_at, updated_at, kyc_status, full_name, is_approved,
          consultation_fee, plan_tier, council_type, council_number
        FROM public.doctors
        WHERE is_approved = true AND is_verified = true;
      `);
      results.push("7. doctors_public view atualizada");
    } catch (ve) {
      results.push("7. View update: " + ve.message);
    }

    // 8. Colunas de paciente em public.profiles
    await sql.unsafe(`
      ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS user_type TEXT,
        ADD COLUMN IF NOT EXISTS signup_role TEXT,
        ADD COLUMN IF NOT EXISTS cpf TEXT,
        ADD COLUMN IF NOT EXISTS date_of_birth TEXT,
        ADD COLUMN IF NOT EXISTS city TEXT,
        ADD COLUMN IF NOT EXISTS state TEXT,
        ADD COLUMN IF NOT EXISTS country TEXT,
        ADD COLUMN IF NOT EXISTS email TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

      UPDATE public.profiles
      SET user_type = 'doctor', signup_role = 'medico'
      WHERE role = 'doctor' AND (user_type IS NULL OR user_type = '');
    `);
    results.push("8. public.profiles atualizada com campos de paciente");

    // 9. Tabelas de suporte administrativo
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.pacientes_leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT,
        email TEXT,
        whatsapp TEXT,
        origem TEXT DEFAULT 'web',
        status TEXT DEFAULT 'novo',
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.leads_contatos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT,
        telefone TEXT,
        email TEXT,
        origem TEXT DEFAULT 'chat',
        status TEXT DEFAULT 'ativo',
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.orientacao_tecnica_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_name TEXT,
        patient_whatsapp TEXT,
        patient_email TEXT,
        amount NUMERIC DEFAULT 30.00,
        payment_status TEXT DEFAULT 'paid',
        created_at TIMESTAMPTZ DEFAULT now()
      );

      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
      CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Public profiles insert" ON public.profiles;
      CREATE POLICY "Public profiles insert" ON public.profiles FOR INSERT WITH CHECK (true);
      DROP POLICY IF EXISTS "Public profiles update" ON public.profiles;
      CREATE POLICY "Public profiles update" ON public.profiles FOR UPDATE USING (true);

      ALTER TABLE public.pacientes_leads ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "pacientes_leads_read" ON public.pacientes_leads;
      CREATE POLICY "pacientes_leads_read" ON public.pacientes_leads FOR ALL USING (true);

      ALTER TABLE public.leads_contatos ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "leads_contatos_read" ON public.leads_contatos;
      CREATE POLICY "leads_contatos_read" ON public.leads_contatos FOR ALL USING (true);

      ALTER TABLE public.orientacao_tecnica_orders ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "orientacao_tecnica_orders_read" ON public.orientacao_tecnica_orders;
      CREATE POLICY "orientacao_tecnica_orders_read" ON public.orientacao_tecnica_orders FOR ALL USING (true);
    `);
    results.push("9. Tabelas e policies de leads, orientacoes e pacientes ativas");

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message, stack: err.stack }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  } finally {
    await sql.end();
  }
});

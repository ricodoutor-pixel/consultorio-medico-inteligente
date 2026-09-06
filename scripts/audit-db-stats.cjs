const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://iugojpynmfszomjmmvub.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function auditData() {
  console.log("=== AUDITORIA GERAL DE BASE DE DADOS SUPABASE ===");

  // 1. Total de Profiles por user_type
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, full_name, email, user_type, signup_role, created_at');

  if (pErr) {
    console.error("Erro ao buscar profiles:", pErr);
  } else {
    console.log(`Total de Profiles cadastrados: ${profiles?.length || 0}`);
    const typesCount = {};
    profiles?.forEach(p => {
      const t = p.user_type || p.signup_role || 'indefinido';
      typesCount[t] = (typesCount[t] || 0) + 1;
    });
    console.log("Distribuição por Categoria de Usuário:", typesCount);
  }

  // 2. Total de Médicos / Doctors
  const { data: doctors, error: dErr } = await supabase
    .from('doctors')
    .select('id, user_id, crm, crm_state, specialty, verified_by_admin, country, created_at');

  if (dErr) {
    console.error("Erro ao buscar doctors:", dErr);
  } else {
    console.log(`Total de Médicos/Profissionais na tabela doctors: ${doctors?.length || 0}`);
    const verified = doctors?.filter(d => d.verified_by_admin).length || 0;
    const pending = (doctors?.length || 0) - verified;
    console.log(`Médicos Aprovados: ${verified} | Pendentes de KYC: ${pending}`);
  }

  // 3. Documentos KYC
  const { data: kyc, error: kErr } = await supabase
    .from('doctor_kyc_documents')
    .select('id, doctor_user_id, document_kind, verification_status, created_at');

  if (kErr) {
    console.error("Erro ao buscar KYC:", kErr);
  } else {
    console.log(`Total de Documentos KYC em análise: ${kyc?.length || 0}`);
  }

  // 4. TCLE Consents
  const { data: tcle, error: tErr } = await supabase
    .from('tcle_consents')
    .select('id, user_id, accepted_at, version');

  if (!tErr) {
    console.log(`Total de Consentimentos TCLE Gravados com Hash: ${tcle?.length || 0}`);
  }

  // 5. Leads / Contatos (Brevo / Capturas)
  const { data: leads, error: lErr } = await supabase
    .from('leads_contatos')
    .select('id, nome, email, telefone, categoria, created_at');

  if (!lErr) {
    console.log(`Total de Leads / Contatos capturados na plataforma: ${leads?.length || 0}`);
  }
}

auditData();

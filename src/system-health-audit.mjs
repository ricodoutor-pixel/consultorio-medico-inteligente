// 🌿 Planta y Raiz — Auditoria Completa de Fluxos & Liberação de Cards KYC
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tkxxoghzhvhjzdoomgss.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log('================================================================');
  console.log('🌿 [Planta y Raiz] RELATÓRIO DE AUDITORIA GERAL DO SISTEMA');
  console.log('================================================================');

  // 1. Auditoria de Médicos Cadastrados
  try {
    const { data: doctors, error: docErr } = await supabase
      .from('doctors')
      .select('id, user_id, full_name, crm, crm_state, specialty, is_approved_by_admin, is_online, approval_status');

    if (docErr) {
      console.log('⚠️ [Database] Tabela doctors:', docErr.message);
    } else {
      console.log(`✅ [Database] Total de Médicos no Banco: ${doctors.length}`);
      const approved = doctors.filter(d => d.is_approved_by_admin || d.approval_status === 'approved').length;
      const pending = doctors.filter(d => !d.is_approved_by_admin && d.approval_status !== 'approved').length;
      console.log(`   - Aprovados com Card Ativo: ${approved}`);
      console.log(`   - Pendentes de Aprovação KYC: ${pending}`);
    }
  } catch (e) {
    console.log('⚠️ Erro ao consultar médicos:', e.message);
  }

  // 2. Auditoria de Documentos KYC
  try {
    const { data: kycDocs, error: kycErr } = await supabase
      .from('doctor_kyc_documents')
      .select('*');

    if (kycErr) {
      console.log('⚠️ [KYC Docs]:', kycErr.message);
    } else {
      console.log(`✅ [KYC] Documentos Anexados no Sistema: ${kycDocs?.length || 0}`);
    }
  } catch (e) {
    console.log('⚠️ Erro ao consultar KYC docs:', e.message);
  }

  // 3. Auditoria de Leads CRM
  try {
    const { count, error: crmErr } = await supabase
      .from('leads_crm')
      .select('*', { count: 'exact', head: true });

    if (crmErr) {
      console.log('⚠️ [CRM Leads]:', crmErr.message);
    } else {
      console.log(`✅ [CRM] Leads Catalogados: ${count || 0}`);
    }
  } catch (e) {}

  console.log('\n================================================================');
  console.log('🚀 STATUS DAS PÁGINAS PRINCIPAIS DO FUNIL DE TRÁFEGO:');
  console.log('1. /cadastro-profissional -> Form com Validação de CPF, CRM, Upload de Docs & KYC');
  console.log('2. /medsocio -> Landing Page do Programa Médico Sócio (93% retenção, PIX instantâneo)');
  console.log('3. /admin/aprovacoes-medicas -> Painel KYC para Averiguação de Docs e Toggle ON/OFF de Cards');
  console.log('4. /profissionais -> Diretório Oficial de Médicos com Cards Ativos');
  console.log('5. /telemedicina -> Sala Split-Pane de Teleconsulta HD + Prontuário Inteligente');
  console.log('================================================================\n');
}

runAudit();

// 🌿 Planta y Raiz — Motor Autônomo de Mineração de Leads Médicos (Meta: 500)
// Coleta dados estruturados: Nome, Telefone, E-mail, Especialidade, CRM, Cidade/UF e Link

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const OUTPUT_FILE = path.resolve('./mined_doctor_leads_500.json');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tkxxoghzhvhjzdoomgss.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function loadExistingLeads() {
  try {
    if (fs.existsSync(OUTPUT_FILE)) {
      const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error('[Miner] Erro ao carregar leads existentes:', e.message);
  }
  return [];
}

function saveLeads(leads) {
  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(leads, null, 2), 'utf-8');
    console.log(`💾 [Miner] Base salva com sucesso: ${leads.length} médicos em ${OUTPUT_FILE}`);
  } catch (e) {
    console.error('[Miner] Erro ao salvar arquivo JSON:', e.message);
  }
}

async function syncToSupabase(lead) {
  if (!supabaseUrl || !supabaseKey) return;
  try {
    await supabase.from('leads_crm').upsert({
      name: lead.name,
      phone: lead.phone,
      email: lead.email || null,
      specialty: lead.specialty || 'Medicina Canabinoide / Integrativa',
      city: lead.city || null,
      state: lead.state || null,
      source: lead.source || 'miner_engine',
      status: 'mined',
      created_at: new Date().toISOString()
    }, { onConflict: 'phone' });
  } catch (e) {
    // ignora falha de sync se schema diferir
  }
}

console.log('================================================================');
console.log('🌿 [Planta y Raiz] MOTOR DE MINERAÇÃO DE LEADS MÉDICOS ATIVO');
console.log('🎯 META: 500 MÉDICOS QUALIFICADOS (NOME, TEL, EMAIL, ESPECIALIDADE)');
console.log('================================================================');

const currentLeads = loadExistingLeads();
console.log(`[Status] Leads já catalogados no arquivo: ${currentLeads.length}/500`);

export { loadExistingLeads, saveLeads, syncToSupabase };

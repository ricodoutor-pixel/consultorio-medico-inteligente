/**
 * DIRETIVA SUPREMA DE ARQUITETURA E UNIFICAÇÃO — PLANTA Y RAIZ (2026)
 * Script Oficial de Auditoria (Somente Leitura) — Banco Unificado shmbwdjuddvquszwkvuq
 *
 * Executa exclusivamente consultas GET/HEAD/RPC de leitura contra a API oficial:
 * https://shmbwdjuddvquszwkvuq.supabase.co
 */

import fs from 'node:fs';
import path from 'node:path';

const OFFICIAL_URL = 'https://shmbwdjuddvquszwkvuq.supabase.co';
const OFFICIAL_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ';

function loadEnvPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (process.env.SMTP_PASS) return process.env.SMTP_PASS;
  try {
    const envText = fs.readFileSync(path.resolve('.env'), 'utf8');
    const m = envText.match(/^(?:ADMIN_PASSWORD|SMTP_PASS)=(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  } catch {}
  return '';
}

async function restGet(endpoint, token) {
  const res = await fetch(`${OFFICIAL_URL}/rest/v1/${endpoint}`, {
    headers: {
      apikey: OFFICIAL_ANON,
      Authorization: `Bearer ${token}`,
      Prefer: 'count=exact',
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function restRpc(fn, body, token) {
  const res = await fetch(`${OFFICIAL_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: OFFICIAL_ANON,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function getAuthToken() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { token: process.env.SUPABASE_SERVICE_ROLE_KEY, mode: 'service_role' };
  }
  const password = loadEnvPassword();
  if (password) {
    try {
      const authRes = await fetch(`${OFFICIAL_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: OFFICIAL_ANON,
        },
        body: JSON.stringify({
          email: 'contato@plantayraiz.com.br',
          password,
        }),
      });
      const authJson = await authRes.json();
      if (authRes.ok && authJson.access_token) {
        return { token: authJson.access_token, mode: 'admin_jwt' };
      }
    } catch {}
  }
  return { token: OFFICIAL_ANON, mode: 'anon_public' };
}

async function main() {
  const { token, mode } = await getAuthToken();
  console.log(`Modo de leitura: ${mode} | Projeto: shmbwdjuddvquszwkvuq`);

  const [doctorsRes, doctorsPubRes, kycDocsRes, vendorsRes, profilesRes] = await Promise.all([
    restGet('doctors?select=*&order=created_at.desc', token),
    restGet('doctors_public?select=*&order=created_at.desc', OFFICIAL_ANON),
    restGet('doctor_kyc_documents?select=*', token),
    restGet('vendors?select=*', token),
    restGet('profiles?select=*', token),
  ]);

  const rawDoctors = Array.isArray(doctorsRes.data) && doctorsRes.data.length > 0
    ? doctorsRes.data
    : (Array.isArray(doctorsPubRes.data) ? doctorsPubRes.data : []);
  const kycDocs = Array.isArray(kycDocsRes.data) ? kycDocsRes.data : [];
  const vendors = Array.isArray(vendorsRes.data) ? vendorsRes.data : [];
  const profiles = Array.isArray(profilesRes.data) ? profilesRes.data : [];

  const userIds = Array.from(new Set(rawDoctors.map((d) => d.user_id).filter(Boolean)));
  let rpcProfiles = [];
  if (userIds.length > 0 && mode !== 'anon_public') {
    const rpcRes = await restRpc('admin_doctor_profiles', { _ids: userIds }, token);
    if (rpcRes.status === 200 && Array.isArray(rpcRes.data)) {
      rpcProfiles = rpcRes.data;
    }
  }

  const profileMap = new Map();
  for (const p of profiles) profileMap.set(p.id, p);
  for (const p of rpcProfiles) profileMap.set(p.id, { ...profileMap.get(p.id), ...p });

  const docsByUser = new Map();
  for (const k of kycDocs) {
    const arr = docsByUser.get(k.doctor_user_id) || [];
    arr.push(k);
    docsByUser.set(k.doctor_user_id, arr);
  }

  // Query 1: Panorama geral dos cadastros
  const panorama = {
    total_medicos: rawDoctors.length,
    medicos_aprovados: rawDoctors.filter((d) => d.approval_status === 'approved').length,
    medicos_aprovados_is_approved_by_admin: rawDoctors.filter((d) => d.is_approved_by_admin === true).length,
    medicos_verificados_is_verified: rawDoctors.filter((d) => d.is_verified === true).length,
    total_documentos: kycDocs.length,
    total_farmacias: vendors.length,
    total_pacientes: profiles.filter((p) => p.user_type === 'patient').length,
  };

  console.log('\n=== 1. PANORAMA GERAL DOS CADASTROS (shmbwdjuddvquszwkvuq) ===');
  console.table([panorama]);

  // Query 2: Novos médicos pendentes com contagem de documentos
  // WHERE d.approval_status != 'approved' OR d.is_approved_by_admin = false
  const pending = rawDoctors
    .filter((d) => d.approval_status !== 'approved' || d.is_approved_by_admin === false)
    .map((d) => {
      const p = profileMap.get(d.user_id) || {};
      const uDocs = docsByUser.get(d.user_id) || [];
      return {
        id: d.id,
        full_name: p.full_name || d.full_name || null,
        crm: d.crm,
        crm_state: d.crm_state,
        specialty: d.specialty,
        approval_status: d.approval_status ?? null,
        is_approved_by_admin: d.is_approved_by_admin ?? null,
        kyc_status: d.kyc_status ?? null,
        created_at: d.created_at,
        docs_anexados: uDocs.length,
      };
    });

  console.log('\n=== 2. MÉDICOS PENDENTES (approval_status != approved OR is_approved_by_admin = false) ===');
  console.table(pending);
}

main();

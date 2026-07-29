import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("ERRO: Variáveis VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não encontradas no .env");
  console.log("Execute este script localmente tendo a Service Role Key no seu .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixDoctorProfile() {
  const targetEmail = 'contato@plantayraiz.com.br';
  console.log(`Buscando usuário: ${targetEmail}`);

  // 1. Obter o user_id da tabela auth.users via getUser (ou listUsers se necessário)
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error("Erro ao listar usuários:", listError);
    return;
  }

  const user = users.find(u => u.email === targetEmail);
  if (!user) {
    console.error(`Usuário com email ${targetEmail} não encontrado.`);
    return;
  }

  const userId = user.id;
  console.log(`User ID encontrado: ${userId}`);

  // 2. Garantir as roles necessárias (doctor, admin)
  const roles = ['doctor', 'admin'];
  for (const role of roles) {
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', role)
      .single();

    if (!existingRole) {
      console.log(`Adicionando role '${role}'...`);
      await supabase.from('user_roles').insert({ user_id: userId, role });
    } else {
      console.log(`Role '${role}' já existe.`);
    }
  }

  // Atualizar Profile
  await supabase.from('profiles').update({ full_name: 'Dr. Edilson Bezerra' }).eq('id', userId);

  // 3. Criar ou atualizar o registro na tabela doctors
  const { data: existingDoctor } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', userId)
    .single();

  const doctorPayload = {
    full_name: 'Dr. Edilson Bezerra',
    crm: '10963',
    crm_state: 'CE',
    specialty: 'Medicina Canábica / Orientação Técnica',
    is_verified: true,
    is_approved: true,
    is_online: true,
    consultation_fee: 30.00
  };

  if (existingDoctor) {
    console.log(`Atualizando registro do médico existente na tabela 'doctors'...`);
    const { error: updateError } = await supabase
      .from('doctors')
      .update(doctorPayload)
      .eq('user_id', userId);
    
    if (updateError) console.error("Erro ao atualizar médico:", updateError);
    else console.log("Médico atualizado com sucesso!");
  } else {
    console.log(`Criando novo registro do médico na tabela 'doctors'...`);
    const { error: insertError } = await supabase
      .from('doctors')
      .insert({
        user_id: userId,
        ...doctorPayload
      });
    
    if (insertError) console.error("Erro ao inserir médico:", insertError);
    else console.log("Médico criado com sucesso!");
  }

  console.log("=== SCRIPT CONCLUÍDO ===");
}

fixDoctorProfile();

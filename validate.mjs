import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://shmbwdjuddvquszwkvuq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTk4MzAyNiwiZXhwIjoyMDk3NTU5MDI2fQ.y4Zp27_xUaG8U-hX0D1D2_P_94sKz3zZzU_A3Q41-4Y';
const supabase = createClient(supabaseUrl, supabaseKey);

async function validateConsultorio() {
  console.log("Iniciando validação do fluxo do Consultório Virtual...");

  try {
    // 1. Pegar ou criar um médico
    let { data: doctors, error: dErr } = await supabase.from('doctors').select('id').limit(1);
    let doctorId;
    if (dErr || !doctors || !doctors.length) {
      console.log("Médico não encontrado. Criando usuário e médico...");
      
      const { data: newAuthUser, error: authErr } = await supabase.auth.admin.createUser({
        email: 'testedoctor' + Date.now() + '@plantayraiz.com.br',
        password: 'password123',
        email_confirm: true
      });
      if (authErr) throw new Error("Erro auth: " + authErr.message);

      const userId = newAuthUser.user.id;

      // Ensure profile exists (trigger might create it, but just in case)
      await supabase.from('profiles').upsert({ id: userId, full_name: 'Dr. Teste Mock' });

      const { data: newDoc, error: cDErr } = await supabase.from('doctors').insert({ 
        user_id: userId, 
        is_online: true, 
        specialty: 'General', 
        crm: '12345', 
        crm_state: 'SP' 
      }).select().single();
      if (cDErr) throw new Error("Erro ao criar médico mock: " + cDErr.message);
      doctorId = newDoc.id;
    } else {
      doctorId = doctors[0].id;
    }

    // 2. Pegar ou criar um paciente
    let { data: patients, error: pErr } = await supabase.from('patients').select('id').limit(1);
    let patientId;
    if (pErr || !patients || !patients.length) {
      console.log("Paciente não encontrado. Criando paciente...");
      const { data: newPat, error: cPErr } = await supabase.from('patients').insert({ full_name: 'Teste Paciente', phone: '11999999999' }).select().single();
      if (cPErr) throw new Error("Erro ao criar paciente mock: " + cPErr.message);
      patientId = newPat.id;
    } else {
      patientId = patients[0].id;
    }

    // 3. Criar uma consulta
    console.log(`Criando consulta: Doctor ${doctorId} - Patient ${patientId}`);
    const { data: appointment, error: aErr } = await supabase.from('appointments').insert({
      doctor_id: doctorId,
      patient_id: patientId,
      scheduled_at: new Date().toISOString(),
      status: 'scheduled',
      type: 'video',
      room_url: 'https://meet.jit.si/consulta_teste_123',
      room_id: 'consulta_teste_123'
    }).select().single();

    if (aErr) throw new Error(`Erro ao criar consulta: ${aErr.message}`);
    console.log("Consulta criada com sucesso!", appointment.id);

    // 4. Inserir anamnese em Prontuários / Notas
    console.log("Atualizando notas da consulta...");
    const { error: uErr } = await supabase.from('appointments').update({
      notes: 'Anamnese de teste: Paciente relata dor de cabeça. Validado através do script automatizado.',
      status: 'completed'
    }).eq('id', appointment.id);

    if (uErr) throw new Error(`Erro ao atualizar consulta: ${uErr.message}`);
    console.log("Anamnese adicionada e status alterado para completed.");

    console.log("Validação concluída com sucesso! Todo o fluxo de schema da consulta funciona perfeitamente.");
  } catch (error) {
    console.error("Falha na validação:", error);
  }
}

validateConsultorio();

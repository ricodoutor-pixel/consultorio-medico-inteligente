const { createClient } = require('@supabase/supabase-js');

async function run() {
  const SUPABASE_URL = "https://shmbwdjuddvquszwkvuq.supabase.co";
  const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA3Nzg0NiwiZXhwIjoyMDg3NjUzODQ2fQ.CakbSf2AraRH03BqvYhdkl0cKhV89hWN8phk3uyGalg";
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  function log(msg) {
    console.log(msg);
  }

  try {
    log("🔄 Buscando lista de usuários na autenticação...");
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    
    const masterUser = users.find(u => u.email === "contato@plantayraiz.com.br");
    if (!masterUser) {
       log("❌ ERRO: Usuário contato@plantayraiz.com.br não encontrado!");
       return;
    }
    
    log(`✅ Conta Mestre encontrada! ID: ${masterUser.id}`);
    
    log("🔄 Revogando privilégios de Admin/Super Admin dos outros perfis...");
    
    // Vamos buscar todos que são admin ou super_admin primeiro
    const { data: admins, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role')
      .neq('id', masterUser.id)
      .in('role', ['admin', 'super_admin']);
      
    if (fetchError) throw fetchError;
    
    if (!admins || admins.length === 0) {
        log("✨ Nenhum outro administrador encontrado. A segurança já está 100%.");
        return;
    }
    
    log(`⚠️ Encontrados ${admins.length} administradores que terão acesso revogado.`);
    
    // Rebaixando os usuários encontrados para 'user'
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'user' })
      .neq('id', masterUser.id)
      .in('role', ['admin', 'super_admin'])
      .select();
      
    if (updateError) throw updateError;
    
    log(`✅ SUCESSO! Acessos administrativos revogados de ${updateData.length} perfil(s).`);
    log(`🛡️ Apenas contato@plantayraiz.com.br mantém acesso Master.`);
    
  } catch (e) {
    log("❌ ERRO CRÍTICO: " + e.message);
  }
}
run();

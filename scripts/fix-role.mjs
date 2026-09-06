import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function run() {
  console.log("Fetching users...");
  const { data: users, error: uErr } = await supabase.auth.admin.listUsers();
  if (uErr) { console.error('Error listing users', uErr); return; }
  const targetUser = users.users.find(u => u.email === 'contato@plantayraiz.com.br');
  if (!targetUser) { console.error('User not found'); return; }
  
  console.log('User found:', targetUser.id);
  
  const { data: profile, error: pErr } = await supabase.from('profiles').update({ user_type: 'lojista' }).eq('id', targetUser.id).select();
  if (pErr) console.error('Error updating profile:', pErr);
  else console.log('Profile updated to lojista');

  const { data: role, error: rErr } = await supabase.from('user_roles').upsert({ user_id: targetUser.id, role: 'lojista' }).select();
  if (rErr) console.error('Error updating role:', rErr);
  else console.log('Role updated to lojista');
}
run();

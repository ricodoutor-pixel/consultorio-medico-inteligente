const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log("Checking user and roles in Supabase...");
  const targetEmail = "contato@plantayraiz.com.br";

  // 1. List users
  const { data: usersData, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) {
    console.error("Error listing users:", userErr);
    return;
  }

  const user = usersData.users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
  console.log("User found in auth.users:", user ? { id: user.id, email: user.email } : "NOT FOUND");

  if (user) {
    // 2. Check user_roles table
    const { data: roles, error: rolesErr } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);
    
    console.log("Roles in user_roles:", roles, rolesErr);

    const hasAdmin = roles?.some(r => r.role === 'admin');
    if (!hasAdmin) {
      console.log("Inserting admin role for user...");
      const { data: insData, error: insErr } = await supabase
        .from('user_roles')
        .upsert({ user_id: user.id, role: 'admin' });
      console.log("Insert admin role result:", insData, insErr);
    } else {
      console.log("User already has admin role in database!");
    }

    // 3. Also check profiles table
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    console.log("Profile:", profile, profErr);
  } else {
    console.log("Creating master admin user...");
    const { data: newU, error: newUErr } = await supabase.auth.admin.createUser({
      email: targetEmail,
      password: "password_here",
      email_confirm: true,
      user_metadata: { full_name: "Administrador Geral Planta y Raiz" }
    });
    console.log("Created user:", newU, newUErr);
  }
}

main();

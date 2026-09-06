const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function test() {
  console.log("Testing signInWithPassword for contato@plantayraiz.com.br...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "contato@plantayraiz.com.br",
    password: "password_here",
  });

  if (error) {
    console.error("Login failed:", error);
    return;
  }

  console.log("Login SUCCESS! User ID:", data.user.id);
  console.log("User email:", data.user.email);

  // Now test querying user_roles with the user's authenticated session
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  console.log("Query user_roles result:", roleData, "Error:", roleError);

  // Query all roles for this user
  const { data: allRoles, error: allRolesError } = await supabase
    .from('user_roles')
    .select('*');
  console.log("All visible roles:", allRoles, "Error:", allRolesError);
}

test();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://tkxxoghzhvhjzdoomgss.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRreHhvZ2h6aHZoanpkb29tZ3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzc4NDYsImV4cCI6MjA4NzY1Mzg0Nn0.KxKdf9jh2-sum1AmtkqUuBf78xGc-OXF0814iiBdP1Y";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function test() {
  console.log("Testing on tkxx project...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "contato@plantayraiz.com.br",
    password: "password_here",
  });

  console.log("Result:", data?.user ? "LOGIN OK user id=" + data.user.id : "ERROR: " + error?.message);

  if (data?.user) {
    const { data: roles, error: rErr } = await supabase.from('user_roles').select('*').eq('user_id', data.user.id);
    console.log("Roles for user on tkxx:", roles, rErr);
  }
}

test();

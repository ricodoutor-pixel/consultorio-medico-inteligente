import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://shmbwdjuddvquszwkvuq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findByCPF() {
  const { data, error } = await supabase.rpc("admin_doctor_profiles", { _ids: [
    '51c28fdd-ccd4-4b84-a0da-3cf604233804'
  ] });

  if (error) {
    console.error('Erro na busca:', error);
  } else {
    console.log('Resultados profiles:', data);
  }
}

findByCPF();

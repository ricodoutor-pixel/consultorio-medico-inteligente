import { pushFile } from './github-push.js';

async function main() {
  await pushFile('src/pages/CadastroProfissional.tsx', 'Add Free plan to doctor registration');
  await pushFile('src/components/doctor/DoctorSubscriptionPlans.tsx', 'Update subscription plans and add Free plan');
  await pushFile('src/pages/Profissionais.tsx', 'Use dynamic VIP seal based on plan_tier');
  await pushFile('src/hooks/useRealProfessionals.ts', 'Map plan_tier to Professional object');
  await pushFile('src/data/professionals.ts', 'Add plan_tier to Professional interface');
  await pushFile('supabase/migrations/20260825_add_free_plan_tier.sql', 'Migration for valid_plan_tier constraint');
}
main();

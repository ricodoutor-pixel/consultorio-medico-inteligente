// Acesso do médico ao Kit do Assinante: confere quem chama, se é médico aprovado, o plano e o uso do dia.
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCallerUserId, isAdmin } from "./admin-auth.ts";
import { brasiliaDayStartIso, dailyLimit, type DoctorAiTool, isPaidPlan } from "./doctor-kit.ts";

export interface DoctorKitAccess {
  userId: string;
  admin: boolean;
  doctor: boolean;
  verified: boolean;
  paid: boolean;
  planTier: string | null;
  limit: number;
  used: number;
}

export function serviceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

export async function doctorKitAccess(req: Request, tool: DoctorAiTool): Promise<DoctorKitAccess | null> {
  const userId = await getCallerUserId(req);
  if (!userId) return null;
  const svc = serviceClient();
  const [admin, { data: doc }, { count }] = await Promise.all([
    isAdmin(userId),
    svc.from("doctors").select("plan_tier, is_verified, suspended_at").eq("user_id", userId).maybeSingle(),
    svc
      .from("doctor_ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("tool", tool)
      .gte("created_at", brasiliaDayStartIso(new Date())),
  ]);
  const doctor = Boolean(doc) && !doc?.suspended_at;
  const paid = doctor && isPaidPlan(doc?.plan_tier);
  return {
    userId,
    admin,
    doctor,
    verified: doctor && Boolean(doc?.is_verified),
    paid,
    planTier: doc?.plan_tier ?? null,
    limit: dailyLimit(tool, { paid, admin, planTier: doc?.plan_tier ?? null }),
    used: count ?? 0,
  };
}

export async function recordDoctorAiUsage(userId: string, tool: DoctorAiTool, question: string, answer: string) {
  await serviceClient()
    .from("doctor_ai_usage")
    .insert({ user_id: userId, tool, question: question.slice(0, 4000), answer: answer.slice(0, 12000) });
}

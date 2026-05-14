import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { updateFrogIcon } from "@/lib/serviceWorkerRegistration";

export type FrogMood = "happy" | "warning" | "critical" | "in_call";

interface FrogMoodData {
  mood: FrogMood;
  reason: string;
  message: string;
  icon: string;
  updatedAt: string;
}

const MOOD_KEY = "verdinho_mood";

const DEFAULT_MESSAGES: Record<FrogMood, { message: string; reason: string; icon: string }> = {
  happy: {
    message: "Tudo certo por aqui! Continue assim, campeão! 💪",
    reason: "Em dia com o tratamento",
    icon: "/frog-happy.png",
  },
  warning: {
    message: "🌿 Senti sua falta! Vamos completar seu cadastro?",
    reason: "Cadastro incompleto ou ausência prolongada",
    icon: "/frog-warning.png",
  },
  critical: {
    message: "⚠️ Atenção! Seu tratamento precisa de ação imediata.",
    reason: "Orientação Técnica cancelada ou medicamento acabando",
    icon: "/frog-critical.png",
  },
  in_call: {
    message: "🩺 Seu médico está em atendimento — você está sendo cuidado!",
    reason: "Médico em sala de teleconsulta",
    icon: "/frog-happy.png",
  },
};

function getMoodFromStorage(): FrogMoodData {
  try {
    const stored = localStorage.getItem(MOOD_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    mood: "happy",
    ...DEFAULT_MESSAGES.happy,
    updatedAt: new Date().toISOString(),
  };
}

async function computeMoodFromSupabase(): Promise<FrogMood> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return "happy";

    const userId = session.user.id;
    const now = new Date();

    // PRIORIDADE MÁXIMA: médico em atendimento ativo (Verde→Azul)
    const { data: activeCall } = await supabase
      .from("appointments")
      .select("id")
      .eq("patient_id", userId)
      .eq("status", "in_progress")
      .limit(1)
      .maybeSingle();
    if (activeCall) return "in_call";

    // Check profile completeness
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, cpf, date_of_birth")
      .eq("id", userId)
      .single();

    const isProfileIncomplete = profile && (!profile.phone || !profile.cpf || !profile.date_of_birth);

    // Check pending/cancelled appointments
    const { data: pendingAppts } = await supabase
      .from("appointments")
      .select("id, status, scheduled_at")
      .eq("patient_id", userId)
      .in("status", ["scheduled", "cancelled"])
      .order("scheduled_at", { ascending: false })
      .limit(5);

    const hasCancelled = pendingAppts?.some(a => a.status === "cancelled");
    const hasMissedAppt = pendingAppts?.some(a => {
      const scheduled = new Date(a.scheduled_at);
      return a.status === "scheduled" && scheduled < now;
    });

    // Check expiring prescriptions
    const { data: prescriptions } = await supabase
      .from("prescriptions")
      .select("id, valid_until, status")
      .eq("patient_id", userId)
      .eq("status", "active")
      .order("valid_until", { ascending: true })
      .limit(3);

    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const hasExpiringRx = prescriptions?.some(p =>
      p.valid_until && new Date(p.valid_until) <= sevenDaysFromNow
    );

    // Determine mood
    if (hasCancelled || hasMissedAppt || hasExpiringRx) return "critical";
    if (isProfileIncomplete) return "warning";
    return "happy";
  } catch (err) {
    console.error("useFrogMood: error computing mood", err);
    return "happy";
  }
}

export function useFrogMood() {
  const [moodData, setMoodData] = useState<FrogMoodData>(getMoodFromStorage);

  const syncMood = useCallback(async () => {
    const computed = await computeMoodFromSupabase();
    const data: FrogMoodData = {
      mood: computed,
      message: DEFAULT_MESSAGES[computed].message,
      reason: DEFAULT_MESSAGES[computed].reason,
      icon: DEFAULT_MESSAGES[computed].icon,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(MOOD_KEY, JSON.stringify(data));
    setMoodData(data);
    // Notifica o Service Worker para atualizar o ícone do PWA
    updateFrogIcon(computed);
  }, []);

  useEffect(() => {
    syncMood();
    // Re-sync every 5 minutes
    const interval = setInterval(syncMood, 5 * 60 * 1000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      syncMood();
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [syncMood]);

  const setMood = useCallback((mood: FrogMood, customMessage?: string, customReason?: string) => {
    const data: FrogMoodData = {
      mood,
      message: customMessage || DEFAULT_MESSAGES[mood].message,
      reason: customReason || DEFAULT_MESSAGES[mood].reason,
      icon: DEFAULT_MESSAGES[mood].icon,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(MOOD_KEY, JSON.stringify(data));
    setMoodData(data);
    updateFrogIcon(mood);
  }, []);

  return {
    mood: moodData.mood,
    message: moodData.message,
    reason: moodData.reason,
    icon: moodData.icon,
    setMood,
    refresh: syncMood,
  };
}

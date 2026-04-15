import { useState, useEffect, useCallback } from "react";

export type FrogMood = "happy" | "warning" | "critical";

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
    reason: "Cadastro incompleto ou ausência de 48h",
    icon: "/frog-warning.png",
  },
  critical: {
    message: "⚠️ Atenção! Você tem pendências importantes. Vamos resolver agora?",
    reason: "Consulta cancelada ou medicamento acabando",
    icon: "/frog-critical.png",
  },
};

function getMoodFromStorage(): FrogMoodData {
  try {
    const stored = localStorage.getItem(MOOD_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return {
    mood: "happy",
    ...DEFAULT_MESSAGES.happy,
    updatedAt: new Date().toISOString(),
  };
}

export function useFrogMood() {
  const [moodData, setMoodData] = useState<FrogMoodData>(getMoodFromStorage);

  useEffect(() => {
    const handler = () => setMoodData(getMoodFromStorage());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

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
  }, []);

  return {
    mood: moodData.mood,
    message: moodData.message,
    reason: moodData.reason,
    icon: moodData.icon,
    setMood,
  };
}

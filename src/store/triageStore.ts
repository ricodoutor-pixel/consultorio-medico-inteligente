import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface TriageProgress {
  sessionId: string;
  currentStep: number;
  totalSteps: number;
  answers: Record<string, string>;
  symptoms: string[];
  urgencyLevel: "baixa" | "media" | "alta" | "emergencia";
  startedAt: string;
}

interface TriageStore {
  progress: TriageProgress | null;
  startTriage: (sessionId: string, totalSteps?: number) => void;
  updateStep: (step: number) => void;
  addAnswer: (questionId: string, answer: string) => void;
  addSymptom: (symptom: string) => void;
  setUrgency: (level: TriageProgress["urgencyLevel"]) => void;
  completeTriage: () => TriageProgress | null;
  clearTriage: () => void;
}

export const useTriageStore = create<TriageStore>()(
  persist(
    (set, get) => ({
      progress: null,
      startTriage: (sessionId, totalSteps = 10) =>
        set({
          progress: {
            sessionId,
            currentStep: 0,
            totalSteps,
            answers: {},
            symptoms: [],
            urgencyLevel: "baixa",
            startedAt: new Date().toISOString(),
          },
        }),
      updateStep: (step) => {
        const p = get().progress;
        if (p) set({ progress: { ...p, currentStep: step } });
      },
      addAnswer: (questionId, answer) => {
        const p = get().progress;
        if (p) set({ progress: { ...p, answers: { ...p.answers, [questionId]: answer } } });
      },
      addSymptom: (symptom) => {
        const p = get().progress;
        if (p && !p.symptoms.includes(symptom)) {
          set({ progress: { ...p, symptoms: [...p.symptoms, symptom] } });
        }
      },
      setUrgency: (level) => {
        const p = get().progress;
        if (p) set({ progress: { ...p, urgencyLevel: level } });
      },
      completeTriage: () => {
        const p = get().progress;
        set({ progress: null });
        return p;
      },
      clearTriage: () => set({ progress: null }),
    }),
    {
      name: "triage-progress",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserPreferences {
  theme: "dark" | "light";
  locale: string;
  notificationsEnabled: boolean;
  lastVisitedRoute: string;
  onboardingCompleted: boolean;
}

interface AuthPersistStore {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  setLastRoute: (route: string) => void;
  reset: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: "dark",
  locale: "pt",
  notificationsEnabled: true,
  lastVisitedRoute: "/",
  onboardingCompleted: false,
};

export const useAuthPersist = create<AuthPersistStore>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      updatePreference: (key, value) =>
        set({ preferences: { ...get().preferences, [key]: value } }),
      setLastRoute: (route) =>
        set({ preferences: { ...get().preferences, lastVisitedRoute: route } }),
      reset: () => set({ preferences: defaultPreferences }),
    }),
    {
      name: "auth-preferences",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Settings } from "@/types";

const defaultSettings: Settings = {
  deepgramApiKey: "",
  deepseekApiKey: "",
  googleTranslateApiKey: "",
  translationProvider: "deepseek",
  sourceLanguage: "en",
  targetLanguage: "vi",
  answerStyle: "STAR",
  answerLanguage: "Same as target",
  micDeviceId: "",
  profileText: "",
  jdText: "",
  confidenceThreshold: 0.7,
  textSize: "Large",
  darkMode: true,
};

interface SettingsStore extends Settings {
  setSettings: (partial: Partial<Settings>) => void;
  resetSettings: () => void;
}

type PersistedSettings = Settings & { openaiApiKey?: string };

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setSettings: (partial) => set((s) => ({ ...s, ...partial })),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: "interview-copilot-settings",
      version: 4,
      migrate: (persisted, version) => {
        const s = persisted as PersistedSettings & {
          translationProvider?: string;
        };
        if (version < 2 && s.openaiApiKey && !s.deepseekApiKey) {
          s.deepseekApiKey = s.openaiApiKey;
        }
        delete s.openaiApiKey;
        if (version < 3) {
          s.translationProvider = s.googleTranslateApiKey?.trim()
            ? "google"
            : "deepseek";
        }
        return s as Settings;
      },
    }
  )
);

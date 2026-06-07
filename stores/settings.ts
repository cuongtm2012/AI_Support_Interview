import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createInterviewPreset } from "@/lib/interview-preset-utils";
import type {
  AnswerLanguage,
  AnswerStyle,
  InterviewPreset,
  LanguageCode,
  TextSize,
  TranslationProvider,
} from "@/types";

const defaultPreset = createInterviewPreset("Interview 1");

const defaultSettings = {
  deepgramApiKey: "",
  deepseekApiKey: "",
  googleTranslateApiKey: "",
  translationProvider: "deepseek" as TranslationProvider,
  sourceLanguage: "en" as LanguageCode,
  targetLanguage: "vi" as LanguageCode,
  answerStyle: "STAR" as AnswerStyle,
  answerLanguage: "Same as source" as AnswerLanguage,
  micDeviceId: "",
  profileText: "",
  jdText: "",
  interviewPresets: [defaultPreset],
  activePresetId: defaultPreset.id,
  confidenceThreshold: 0.7,
  textSize: "Large" as TextSize,
  darkMode: true,
};

type PersistedSettings = typeof defaultSettings & { openaiApiKey?: string };

function syncPresetFields(
  presets: InterviewPreset[],
  activeId: string,
  patch: Partial<
    Pick<InterviewPreset, "profileText" | "jdText" | "analysis" | "analyzedAt" | "name">
  >
): InterviewPreset[] {
  return presets.map((p) =>
    p.id === activeId ? { ...p, ...patch, updatedAt: Date.now() } : p
  );
}

type SettingsState = typeof defaultSettings;

interface SettingsStore extends SettingsState {
  setSettings: (partial: Partial<SettingsState>) => void;
  resetSettings: () => void;
  switchInterviewPreset: (id: string) => void;
  addInterviewPreset: (name?: string) => void;
  deleteInterviewPreset: (id: string) => void;
  renameInterviewPreset: (name: string) => void;
  setPresetAnalysis: (analysis: string) => void;
  getActivePreset: () => InterviewPreset | undefined;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      setSettings: (partial) =>
        set((s) => {
          const next = { ...s, ...partial };
          if (partial.profileText !== undefined || partial.jdText !== undefined) {
            next.interviewPresets = syncPresetFields(
              s.interviewPresets,
              s.activePresetId,
              {
                ...(partial.profileText !== undefined
                  ? { profileText: partial.profileText }
                  : {}),
                ...(partial.jdText !== undefined ? { jdText: partial.jdText } : {}),
                analysis: null,
                analyzedAt: null,
              }
            );
          }
          return next;
        }),
      resetSettings: () => set(defaultSettings),
      getActivePreset: () => {
        const s = get();
        return (
          s.interviewPresets.find((p) => p.id === s.activePresetId) ??
          s.interviewPresets[0]
        );
      },
      switchInterviewPreset: (id) =>
        set((s) => {
          const preset = s.interviewPresets.find((p) => p.id === id);
          if (!preset) return s;
          return {
            ...s,
            activePresetId: id,
            profileText: preset.profileText,
            jdText: preset.jdText,
          };
        }),
      addInterviewPreset: (name) =>
        set((s) => {
          const preset = createInterviewPreset(
            name?.trim() || `Interview ${s.interviewPresets.length + 1}`
          );
          return {
            ...s,
            interviewPresets: [...s.interviewPresets, preset],
            activePresetId: preset.id,
            profileText: "",
            jdText: "",
          };
        }),
      deleteInterviewPreset: (id) =>
        set((s) => {
          if (s.interviewPresets.length <= 1) return s;
          const filtered = s.interviewPresets.filter((p) => p.id !== id);
          const nextActive =
            s.activePresetId === id
              ? filtered[filtered.length - 1]
              : (filtered.find((p) => p.id === s.activePresetId) ?? filtered[0]);
          return {
            ...s,
            interviewPresets: filtered,
            activePresetId: nextActive.id,
            profileText: nextActive.profileText,
            jdText: nextActive.jdText,
          };
        }),
      renameInterviewPreset: (name) =>
        set((s) => ({
          ...s,
          interviewPresets: syncPresetFields(s.interviewPresets, s.activePresetId, {
            name: name.trim() || "Untitled",
          }),
        })),
      setPresetAnalysis: (analysis) =>
        set((s) => ({
          ...s,
          interviewPresets: syncPresetFields(s.interviewPresets, s.activePresetId, {
            analysis,
            analyzedAt: Date.now(),
          }),
        })),
    }),
    {
      name: "interview-copilot-settings",
      version: 6,
      migrate: (persisted, version) => {
        const s = persisted as PersistedSettings & {
          translationProvider?: string;
          interviewPresets?: InterviewPreset[];
          activePresetId?: string;
          profileText?: string;
          jdText?: string;
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
        if (version < 5 && s.answerLanguage === "Same as target") {
          s.answerLanguage = "Same as source";
        }
        if (version < 6) {
          const preset = createInterviewPreset(
            "Interview 1",
            s.profileText ?? "",
            s.jdText ?? ""
          );
          s.interviewPresets = [preset];
          s.activePresetId = preset.id;
        }
        return s as SettingsState;
      },
      partialize: (state) => ({
        deepgramApiKey: state.deepgramApiKey,
        deepseekApiKey: state.deepseekApiKey,
        googleTranslateApiKey: state.googleTranslateApiKey,
        translationProvider: state.translationProvider,
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
        answerStyle: state.answerStyle,
        answerLanguage: state.answerLanguage,
        micDeviceId: state.micDeviceId,
        profileText: state.profileText,
        jdText: state.jdText,
        interviewPresets: state.interviewPresets,
        activePresetId: state.activePresetId,
        confidenceThreshold: state.confidenceThreshold,
        textSize: state.textSize,
        darkMode: state.darkMode,
      }),
    }
  )
);

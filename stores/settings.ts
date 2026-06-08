import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createInterviewPreset,
  normalizeInterviewPreset,
} from "@/lib/interview-preset-utils";
import type {
  AnswerLanguage,
  AnswerStyle,
  CandidateGender,
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
  gender: "" as CandidateGender | "",
  age: "",
  interviewRole: "",
  profileText: "",
  jdText: "",
  interviewPresets: [defaultPreset],
  activePresetId: defaultPreset.id,
  confidenceThreshold: 0.7,
  textSize: "Large" as TextSize,
  darkMode: true,
};

type PersistedSettings = typeof defaultSettings & { openaiApiKey?: string };

type PresetSyncFields = Pick<
  InterviewPreset,
  | "gender"
  | "age"
  | "interviewRole"
  | "profileText"
  | "jdText"
  | "analysis"
  | "analyzedAt"
  | "name"
>;

function syncPresetFields(
  presets: InterviewPreset[],
  activeId: string,
  patch: Partial<PresetSyncFields>
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
          const touchesPreset =
            partial.gender !== undefined ||
            partial.age !== undefined ||
            partial.interviewRole !== undefined ||
            partial.profileText !== undefined ||
            partial.jdText !== undefined;

          if (touchesPreset) {
            const clearsAnalysis =
              partial.profileText !== undefined ||
              partial.jdText !== undefined ||
              partial.gender !== undefined ||
              partial.age !== undefined ||
              partial.interviewRole !== undefined;

            next.interviewPresets = syncPresetFields(
              s.interviewPresets,
              s.activePresetId,
              {
                ...(partial.gender !== undefined ? { gender: partial.gender } : {}),
                ...(partial.age !== undefined ? { age: partial.age } : {}),
                ...(partial.interviewRole !== undefined
                  ? { interviewRole: partial.interviewRole }
                  : {}),
                ...(partial.profileText !== undefined
                  ? { profileText: partial.profileText }
                  : {}),
                ...(partial.jdText !== undefined ? { jdText: partial.jdText } : {}),
                ...(clearsAnalysis
                  ? { analysis: null, analyzedAt: null }
                  : {}),
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
            gender: preset.gender ?? "",
            age: preset.age ?? "",
            interviewRole: preset.interviewRole ?? "",
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
            gender: "",
            age: "",
            interviewRole: "",
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
            gender: nextActive.gender ?? "",
            age: nextActive.age ?? "",
            interviewRole: nextActive.interviewRole ?? "",
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
      version: 8,
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
        if (version < 7) {
          const presets = s.interviewPresets ?? [];
          s.interviewPresets = presets.map((p) => ({
            ...p,
            gender: p.gender ?? "",
            age: p.age ?? "",
            interviewRole: p.interviewRole ?? "",
          }));
        }
        if (s.interviewPresets?.length) {
          s.interviewPresets = s.interviewPresets.map(normalizeInterviewPreset);
          const active =
            s.interviewPresets.find((p) => p.id === s.activePresetId) ??
            s.interviewPresets[0];
          if (active) {
            s.activePresetId = active.id;
            s.gender = active.gender;
            s.age = active.age;
            s.interviewRole = active.interviewRole;
            s.profileText = active.profileText;
            s.jdText = active.jdText;
          }
        } else {
          s.gender = s.gender ?? "";
          s.age = s.age ?? "";
          s.interviewRole = s.interviewRole ?? "";
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
        gender: state.gender,
        age: state.age,
        interviewRole: state.interviewRole,
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

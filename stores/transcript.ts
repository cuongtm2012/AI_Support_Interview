import { create } from "zustand";
import type { QuestionHistoryItem } from "@/types";

interface TranscriptStore {
  interimText: string;
  finalText: string;
  translatedText: string;
  isListening: boolean;
  confidence: number | null;
  questionHistory: QuestionHistoryItem[];
  autoScroll: boolean;
  deepgramStatus:
    | "idle"
    | "connected"
    | "reconnecting"
    | "disconnected"
    | "error";
  reconnectAttempt: number;
  translationCache: Map<string, string>;
  transcriptCache: Set<string>;

  setInterim: (text: string, confidence?: number | null) => void;
  setFinal: (text: string, confidence?: number | null) => void;
  setTranslated: (text: string) => void;
  setListening: (listening: boolean) => void;
  addToHistory: (item: Omit<QuestionHistoryItem, "id">) => void;
  setAutoScroll: (v: boolean) => void;
  setDeepgramStatus: (
    status: "idle" | "connected" | "reconnecting" | "disconnected" | "error",
    attempt?: number
  ) => void;
  getCachedTranslation: (key: string) => string | undefined;
  setCachedTranslation: (key: string, value: string) => void;
  hasTranscript: (key: string) => boolean;
  markTranscript: (key: string) => void;
  unmarkTranscript: (key: string) => void;
  clearCurrent: () => void;
  clearSession: () => void;
}

export const useTranscriptStore = create<TranscriptStore>((set, get) => ({
  interimText: "",
  finalText: "",
  translatedText: "",
  isListening: false,
  confidence: null,
  questionHistory: [],
  autoScroll: true,
  deepgramStatus: "idle",
  reconnectAttempt: 0,
  translationCache: new Map(),
  transcriptCache: new Set(),

  setInterim: (text, confidence = null) =>
    set({ interimText: text, confidence }),

  setFinal: (text, confidence = null) =>
    set({ finalText: text, interimText: "", confidence }),

  setTranslated: (text) => set({ translatedText: text }),

  setListening: (listening) => set({ isListening: listening }),

  addToHistory: (item) =>
    set((s) => ({
      questionHistory: [
        { ...item, id: crypto.randomUUID() },
        ...s.questionHistory,
      ].slice(0, 50),
    })),

  setAutoScroll: (v) => set({ autoScroll: v }),

  setDeepgramStatus: (status, attempt = 0) =>
    set({ deepgramStatus: status, reconnectAttempt: attempt }),

  getCachedTranslation: (key) => get().translationCache.get(key),

  setCachedTranslation: (key, value) => {
    const cache = new Map(get().translationCache);
    cache.set(key, value);
    set({ translationCache: cache });
  },

  hasTranscript: (key) => get().transcriptCache.has(key),

  markTranscript: (key) => {
    const cache = new Set(get().transcriptCache);
    cache.add(key);
    set({ transcriptCache: cache });
  },

  unmarkTranscript: (key) => {
    const cache = new Set(get().transcriptCache);
    cache.delete(key);
    set({ transcriptCache: cache });
  },

  clearCurrent: () =>
    set({ interimText: "", finalText: "", translatedText: "", confidence: null }),

  clearSession: () =>
    set({
      interimText: "",
      finalText: "",
      translatedText: "",
      confidence: null,
      questionHistory: [],
      deepgramStatus: "idle",
      reconnectAttempt: 0,
      translationCache: new Map(),
      transcriptCache: new Set(),
    }),
}));

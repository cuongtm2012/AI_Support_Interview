import { create } from "zustand";
import type { QnaCard, QuestionType } from "@/types";
import { qnaCardsToHistory } from "@/lib/qna-utils";

interface TranscriptStore {
  interimText: string;
  interimTranslated: string;
  isListening: boolean;
  confidence: number | null;
  qnaCards: QnaCard[];
  highlightCardId: string | null;
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

  /** Derived for export/recap — cards converted to history items */
  questionHistory: ReturnType<typeof qnaCardsToHistory>;

  setInterim: (text: string, confidence?: number | null) => void;
  setInterimTranslated: (text: string) => void;
  setListening: (listening: boolean) => void;
  addQnaCard: (item: {
    original: string;
    confidence: number;
  }) => string;
  updateQnaCard: (id: string, patch: Partial<QnaCard>) => void;
  appendQnaAnswer: (id: string, chunk: string) => void;
  scrollToCard: (id: string) => void;
  syncQnaCardFromRemote: (item: {
    original: string;
    translated: string;
    answer: string;
    questionType: QuestionType;
    timestamp: number;
  }) => void;
  clearHighlight: () => void;
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

function withHistory(cards: QnaCard[]) {
  return { qnaCards: cards, questionHistory: qnaCardsToHistory(cards) };
}

export const useTranscriptStore = create<TranscriptStore>((set, get) => ({
  interimText: "",
  interimTranslated: "",
  isListening: false,
  confidence: null,
  qnaCards: [],
  highlightCardId: null,
  autoScroll: true,
  deepgramStatus: "idle",
  reconnectAttempt: 0,
  translationCache: new Map(),
  transcriptCache: new Set(),
  questionHistory: [],

  setInterim: (text, confidence = null) =>
    set({ interimText: text, confidence }),

  setInterimTranslated: (text) => set({ interimTranslated: text }),

  setListening: (listening) => set({ isListening: listening }),

  addQnaCard: ({ original, confidence }) => {
    const id = crypto.randomUUID();
    const card: QnaCard = {
      id,
      original,
      translated: null,
      answer: null,
      questionType: null,
      status: "transcribing",
      confidence,
      timestamp: Date.now(),
      error: null,
    };
    set((s) => ({
      interimText: "",
      interimTranslated: "",
      ...withHistory([...s.qnaCards, card]),
    }));
    return id;
  },

  updateQnaCard: (id, patch) =>
    set((s) => {
      const cards = s.qnaCards.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      );
      return withHistory(cards);
    }),

  appendQnaAnswer: (id, chunk) =>
    set((s) => {
      const cards = s.qnaCards.map((c) =>
        c.id === id ? { ...c, answer: (c.answer ?? "") + chunk } : c
      );
      return withHistory(cards);
    }),

  scrollToCard: (id) => set({ highlightCardId: id }),

  syncQnaCardFromRemote: (item) => {
    const id = crypto.randomUUID();
    const card: QnaCard = {
      id,
      original: item.original,
      translated: item.translated || null,
      answer: item.answer || null,
      questionType: item.questionType,
      status: "complete",
      confidence: 1,
      timestamp: item.timestamp,
      error: null,
    };
    set((s) => withHistory([...s.qnaCards, card]));
  },

  clearHighlight: () => set({ highlightCardId: null }),

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
    set({ interimText: "", interimTranslated: "", confidence: null }),

  clearSession: () =>
    set({
      interimText: "",
      interimTranslated: "",
      confidence: null,
      qnaCards: [],
      highlightCardId: null,
      deepgramStatus: "idle",
      reconnectAttempt: 0,
      translationCache: new Map(),
      transcriptCache: new Set(),
      questionHistory: [],
    }),
}));

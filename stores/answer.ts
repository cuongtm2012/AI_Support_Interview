import { create } from "zustand";
import type { QuestionType } from "@/types";

interface AnswerStore {
  question: string;
  answer: string;
  questionType: QuestionType | null;
  isClassifying: boolean;
  isGenerating: boolean;
  error: string | null;

  setQuestion: (q: string) => void;
  setQuestionType: (t: QuestionType | null) => void;
  setClassifying: (v: boolean) => void;
  appendAnswer: (chunk: string) => void;
  setAnswer: (a: string) => void;
  setGenerating: (v: boolean) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

export const useAnswerStore = create<AnswerStore>((set) => ({
  question: "",
  answer: "",
  questionType: null,
  isClassifying: false,
  isGenerating: false,
  error: null,

  setQuestion: (q) => set({ question: q }),
  setQuestionType: (t) => set({ questionType: t }),
  setClassifying: (v) => set({ isClassifying: v }),
  appendAnswer: (chunk) =>
    set((s) => ({ answer: s.answer + chunk, error: null })),
  setAnswer: (a) => set({ answer: a }),
  setGenerating: (v) => set({ isGenerating: v }),
  setError: (e) => set({ error: e }),
  reset: () =>
    set({
      question: "",
      answer: "",
      questionType: null,
      isClassifying: false,
      isGenerating: false,
      error: null,
    }),
}));

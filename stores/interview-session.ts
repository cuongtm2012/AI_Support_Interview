import { create } from "zustand";

interface InterviewSessionStore {
  dbSessionId: string | null;
  setDbSessionId: (id: string | null) => void;
}

export const useInterviewSessionStore = create<InterviewSessionStore>((set) => ({
  dbSessionId: null,
  setDbSessionId: (id) => set({ dbSessionId: id }),
}));

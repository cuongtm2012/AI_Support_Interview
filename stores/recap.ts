import { create } from "zustand";
import type { SessionRecapMeta } from "@/types";

interface RecapStore {
  showRecap: boolean;
  meta: SessionRecapMeta | null;
  sessionStartedAt: number | null;

  setSessionStartedAt: (t: number) => void;
  openRecap: (meta: SessionRecapMeta) => void;
  closeRecap: () => void;
}

export const useRecapStore = create<RecapStore>((set) => ({
  showRecap: false,
  meta: null,
  sessionStartedAt: null,

  setSessionStartedAt: (t) => set({ sessionStartedAt: t }),
  openRecap: (meta) => set({ showRecap: true, meta }),
  closeRecap: () => set({ showRecap: false, meta: null, sessionStartedAt: null }),
}));

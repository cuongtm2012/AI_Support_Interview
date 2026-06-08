import { create } from "zustand";

interface UserApiKeysState {
  deepgramApiKey: string;
  deepseekApiKey: string;
  loaded: boolean;
  saving: boolean;
  setKeys: (partial: {
    deepgramApiKey?: string;
    deepseekApiKey?: string;
  }) => void;
  setLoaded: (loaded: boolean) => void;
  setSaving: (saving: boolean) => void;
  clearKeys: () => void;
}

export const useUserApiKeysStore = create<UserApiKeysState>((set) => ({
  deepgramApiKey: "",
  deepseekApiKey: "",
  loaded: false,
  saving: false,
  setKeys: (partial) => set((s) => ({ ...s, ...partial })),
  setLoaded: (loaded) => set({ loaded }),
  setSaving: (saving) => set({ saving }),
  clearKeys: () =>
    set({
      deepgramApiKey: "",
      deepseekApiKey: "",
      loaded: false,
      saving: false,
    }),
}));

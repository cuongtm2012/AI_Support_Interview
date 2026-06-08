import { useUserApiKeysStore } from "@/stores/user-api-keys";
import { useSettingsStore } from "@/stores/settings";

export function getDeepgramApiKey(): string {
  return useUserApiKeysStore.getState().deepgramApiKey.trim();
}

export function getDeepseekApiKey(): string {
  return useUserApiKeysStore.getState().deepseekApiKey.trim();
}

export function getGoogleTranslateApiKey(): string {
  return useSettingsStore.getState().googleTranslateApiKey.trim();
}

export function areUserApiKeysLoaded(): boolean {
  return useUserApiKeysStore.getState().loaded;
}

/** STT (Start Listening) — chỉ cần Deepgram */
export function hasRequiredApiKeys(): {
  ok: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (!getDeepgramApiKey()) missing.push("Deepgram");
  return { ok: missing.length === 0, missing };
}

export function hasDeepseekApiKey(): boolean {
  return !!getDeepseekApiKey();
}

export function hasGoogleTranslateKey(): boolean {
  return !!getGoogleTranslateApiKey();
}

/** @deprecated Use shouldTranslate from translation-config */
export function hasTranslationKey(): boolean {
  const { translationProvider } = useSettingsStore.getState();
  if (translationProvider === "none") return false;
  if (translationProvider === "google") return hasGoogleTranslateKey();
  return hasDeepseekApiKey();
}

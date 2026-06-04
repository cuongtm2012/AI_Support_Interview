import { useSettingsStore } from "@/stores/settings";

export const API_KEY_HEADER = "x-api-key";

/** Build fetch headers with the user's API key for a proxy route. */
export function apiKeyHeaders(key: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    [API_KEY_HEADER]: key,
  };
}

export function getDeepgramApiKey(): string {
  return useSettingsStore.getState().deepgramApiKey.trim();
}

export function getDeepseekApiKey(): string {
  return useSettingsStore.getState().deepseekApiKey.trim();
}

export function getGoogleTranslateApiKey(): string {
  return useSettingsStore.getState().googleTranslateApiKey.trim();
}

export function hasRequiredApiKeys(): {
  ok: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (!getDeepgramApiKey()) missing.push("Deepgram");
  if (!getDeepseekApiKey()) missing.push("DeepSeek");
  return { ok: missing.length === 0, missing };
}

export function hasGoogleTranslateKey(): boolean {
  return !!getGoogleTranslateApiKey();
}

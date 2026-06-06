import type { LanguageCode, TranslationProvider } from "@/types";
import {
  getDeepseekApiKey,
  getGoogleTranslateApiKey,
} from "@/lib/api-keys";
import { useSettingsStore } from "@/stores/settings";

const LANG_LABEL: Record<LanguageCode, string> = {
  en: "English",
  vi: "Vietnamese",
};

export function getTranslationProvider(): TranslationProvider {
  return useSettingsStore.getState().translationProvider ?? "deepseek";
}

export function shouldTranslate(
  source: LanguageCode,
  target: LanguageCode
): boolean {
  if (source === target) return false;
  const provider = getTranslationProvider();
  if (provider === "none") return false;
  if (provider === "google") return !!getGoogleTranslateApiKey();
  if (provider === "deepseek") return !!getDeepseekApiKey();
  return false;
}

export function translationProviderLabel(provider: TranslationProvider): string {
  switch (provider) {
    case "deepseek":
      return "DeepSeek (dùng key AI)";
    case "google":
      return "Google Cloud Translation";
    case "none":
      return "Không dịch";
  }
}

export function langPairLabel(source: LanguageCode, target: LanguageCode): string {
  return `${LANG_LABEL[source]} → ${LANG_LABEL[target]}`;
}

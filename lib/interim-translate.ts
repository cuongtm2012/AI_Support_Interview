import { translateText } from "@/lib/translate";
import { shouldTranslate } from "@/lib/translation-config";
import { useSettingsStore } from "@/stores/settings";
import { useTranscriptStore } from "@/stores/transcript";

const DEBOUNCE_MS = 700;
const MIN_CHARS = 12;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastScheduledKey = "";

function interimKey(text: string): string {
  return text.trim().toLowerCase();
}

/** Debounced interim translation for the bottom live bar (SPEC v3.0). */
export function scheduleInterimTranslation(text: string): void {
  const settings = useSettingsStore.getState();
  const store = useTranscriptStore.getState();

  if (!shouldTranslate(settings.sourceLanguage, settings.targetLanguage)) {
    store.setInterimTranslated("");
    return;
  }

  const trimmed = text.trim();
  if (!trimmed || trimmed.length < MIN_CHARS) {
    store.setInterimTranslated("");
    return;
  }

  const key = interimKey(trimmed);
  const cached = store.getCachedTranslation(key);
  if (cached) {
    store.setInterimTranslated(cached);
    return;
  }

  if (key === lastScheduledKey) return;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void (async () => {
      lastScheduledKey = key;
      try {
        const translated = await translateText(
          trimmed,
          settings.sourceLanguage,
          settings.targetLanguage
        );
        const current = useTranscriptStore.getState();
        if (interimKey(current.interimText) === key) {
          current.setInterimTranslated(translated);
          current.setCachedTranslation(key, translated);
        }
      } catch {
        if (interimKey(useTranscriptStore.getState().interimText) === key) {
          useTranscriptStore.getState().setInterimTranslated("");
        }
      }
    })();
  }, DEBOUNCE_MS);
}

export function resetInterimTranslation(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  lastScheduledKey = "";
  useTranscriptStore.getState().setInterimTranslated("");
}

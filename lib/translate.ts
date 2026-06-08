import type { LanguageCode } from "@/types";
import { getDeepseekApiKey, getGoogleTranslateApiKey } from "@/lib/api-keys";
import { API_KEY_HEADER } from "@/lib/server-api-key";
import {
  getTranslationProvider,
  shouldTranslate,
} from "@/lib/translation-config";

export async function translateText(
  text: string,
  source: LanguageCode,
  target: LanguageCode
): Promise<string> {
  if (!shouldTranslate(source, target)) {
    throw new Error("NO_TRANSLATION");
  }

  const provider = getTranslationProvider();
  const key =
    provider === "google" ? getGoogleTranslateApiKey() : getDeepseekApiKey();

  if (!key) throw new Error("NO_TRANSLATION");

  const headers: HeadersInit = { "Content-Type": "application/json" };
  const payload: Record<string, string> = { text, source, target, provider };

  if (provider === "google") {
    headers[API_KEY_HEADER] = key;
    payload.apiKey = key;
  }

  const res = await fetch("/api/translate", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error || "Translation failed"
    );
  }

  const data = (await res.json()) as { translated: string };
  return data.translated;
}

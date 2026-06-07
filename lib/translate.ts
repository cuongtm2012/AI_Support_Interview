import type { LanguageCode } from "@/types";
import {
  apiKeyHeaders,
  getDeepseekApiKey,
  getGoogleTranslateApiKey,
  withApiKey,
} from "@/lib/api-keys";
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

  const res = await fetch("/api/translate", {
    method: "POST",
    headers: apiKeyHeaders(key),
    body: JSON.stringify(withApiKey(key, { text, source, target, provider })),
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

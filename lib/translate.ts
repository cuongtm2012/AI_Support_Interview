import type { LanguageCode } from "@/types";
import { apiKeyHeaders, getGoogleTranslateApiKey } from "@/lib/api-keys";

export async function translateText(
  text: string,
  source: LanguageCode,
  target: LanguageCode
): Promise<string> {
  const key = getGoogleTranslateApiKey();
  if (!key) {
    throw new Error("NO_GOOGLE_KEY");
  }

  const res = await fetch("/api/translate", {
    method: "POST",
    headers: apiKeyHeaders(key),
    body: JSON.stringify({ text, source, target }),
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

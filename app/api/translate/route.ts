import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/api-guard";
import { getClientApiKey } from "@/lib/server-api-key";
import { getUserDeepseekKey } from "@/lib/server-user-api-keys";
import type { TranslationProvider } from "@/types";

const LANG_MAP: Record<string, string> = {
  en: "en",
  vi: "vi",
  ja: "ja",
  ko: "ko",
  zh: "zh",
};

async function translateGoogle(
  apiKey: string,
  text: string,
  source: string,
  target: string
): Promise<string> {
  const url = new URL("https://translation.googleapis.com/language/translate/v2");
  url.searchParams.set("key", apiKey);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source, target, format: "text" }),
  });
  if (!res.ok) throw new Error("Google Translate API failed");
  const data = (await res.json()) as {
    data?: { translations?: Array<{ translatedText?: string }> };
  };
  const out = data.data?.translations?.[0]?.translatedText;
  if (!out) throw new Error("Google returned empty translation");
  return out;
}

async function translateDeepseek(
  apiKey: string,
  text: string,
  source: string,
  target: string
): Promise<string> {
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.3,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `Translate from ${source} to ${target}. Output ONLY the translation, no quotes or explanation.`,
        },
        { role: "user", content: text },
      ],
    }),
  });
  if (!res.ok) throw new Error("DeepSeek translation failed");
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const out = data.choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error("DeepSeek returned empty translation");
  return out;
}

export async function POST(req: NextRequest) {
  const limited = await rateLimitResponse(req);
  if (limited) return limited;

  let body: {
    text?: string;
    source?: string;
    target?: string;
    provider?: TranslationProvider;
    apiKey?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { text, source, target, provider = "deepseek" } = body;
  if (!text?.trim()) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  if (provider === "none") {
    return NextResponse.json({ translated: text });
  }

  const sourceLang = LANG_MAP[source || "en"] || "en";
  const targetLang = LANG_MAP[target || "vi"] || "vi";

  if (sourceLang === targetLang) {
    return NextResponse.json({ translated: text });
  }

  const apiKey =
    provider === "google"
      ? getClientApiKey(req, process.env.GOOGLE_TRANSLATE_API_KEY, body)
      : await getUserDeepseekKey();
  if (!apiKey) {
    const label = provider === "google" ? "Google Translate" : "DeepSeek";
    return NextResponse.json(
      { error: `${label} API key required (Settings → API Keys)` },
      { status: 401 }
    );
  }

  try {
    const translated =
      provider === "google"
        ? await translateGoogle(apiKey, text, sourceLang, targetLang)
        : await translateDeepseek(apiKey, text, sourceLang, targetLang);

    return NextResponse.json({ translated, provider });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

import type {
  AnswerStyle,
  AnswerLanguage,
  LanguageCode,
  QuestionType,
} from "@/types";
import { resolveAnswerLanguageLabel } from "@/lib/answer-language";
import { apiKeyHeaders, getDeepseekApiKey, withApiKey } from "@/lib/api-keys";

export interface GenerateAnswerParams {
  question: string;
  questionType: QuestionType;
  candidateContext: string;
  profileText: string;
  jdText: string;
  answerStyle: AnswerStyle;
  answerLanguage: AnswerLanguage;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

export async function generateAnswerStreaming(
  params: GenerateAnswerParams
): Promise<void> {
  const key = getDeepseekApiKey();
  if (!key) {
    throw new Error("DeepSeek API key chưa được cấu hình (Settings → API Keys)");
  }

  const lang = resolveAnswerLanguageLabel(
    params.answerLanguage,
    params.sourceLanguage,
    params.targetLanguage
  );

  const res = await fetch("/api/answer", {
    method: "POST",
    headers: apiKeyHeaders(key),
    body: JSON.stringify(
      withApiKey(key, {
        question: params.question,
        questionType: params.questionType,
        candidateContext: params.candidateContext,
        profileText: params.profileText,
        jdText: params.jdText,
        answerStyle: params.answerStyle,
        answerLanguage: lang,
      })
    ),
    signal: params.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error || "Answer generation failed"
    );
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const parsed = JSON.parse(payload) as { text?: string };
        if (parsed.text) params.onChunk(parsed.text);
      } catch {
        // skip malformed chunks
      }
    }
  }
}

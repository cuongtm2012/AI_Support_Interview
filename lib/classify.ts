import type { QuestionClassification, QuestionType } from "@/types";
import { apiKeyHeaders, getDeepseekApiKey } from "@/lib/api-keys";
import {
  formatHintForType,
  heuristicClassify,
  isQuestionType,
} from "@/lib/question-type";

export async function classifyQuestion(
  question: string
): Promise<QuestionClassification> {
  const key = getDeepseekApiKey();
  if (!key) {
    const type = heuristicClassify(question);
    return { type, formatHint: formatHintForType(type) };
  }

  try {
    const res = await fetch("/api/classify-question", {
      method: "POST",
      headers: apiKeyHeaders(key),
      body: JSON.stringify({ question }),
    });

    if (!res.ok) throw new Error("Classify API failed");

    const data = (await res.json()) as {
      type?: string;
      formatHint?: string;
    };

    const rawType = data.type ?? "";
    const type: QuestionType = isQuestionType(rawType)
      ? rawType
      : heuristicClassify(question);

    return {
      type,
      formatHint: data.formatHint || formatHintForType(type),
    };
  } catch {
    const type = heuristicClassify(question);
    return { type, formatHint: formatHintForType(type) };
  }
}

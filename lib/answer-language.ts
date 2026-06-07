import type { AnswerLanguage, LanguageCode } from "@/types";

export function resolveAnswerLanguageLabel(
  answerLanguage: AnswerLanguage,
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode
): string {
  if (answerLanguage === "Vietnamese") return "Vietnamese";
  if (answerLanguage === "English") return "English";
  if (answerLanguage === "Same as source") {
    return sourceLanguage === "vi" ? "Vietnamese" : "English";
  }
  return targetLanguage === "vi" ? "Vietnamese" : "English";
}

export function resolveAnswerLangCode(
  answerLanguage: AnswerLanguage,
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode
): LanguageCode {
  if (answerLanguage === "Vietnamese") return "vi";
  if (answerLanguage === "English") return "en";
  if (answerLanguage === "Same as source") return sourceLanguage;
  return targetLanguage;
}

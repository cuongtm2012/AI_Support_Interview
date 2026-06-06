export type LanguageCode = "en" | "vi";

export type AnswerStyle =
  | "STAR"
  | "Professional"
  | "Casual"
  | "Concise"
  | "Technical";

export type AnswerLanguage = "Vietnamese" | "English" | "Same as target";

export type TextSize = "Small" | "Medium" | "Large";

/** Cách dịch câu hỏi interviewer → target language */
export type TranslationProvider = "deepseek" | "google" | "none";

export type QuestionType =
  | "behavioral"
  | "technical"
  | "situational"
  | "competency";

export interface QuestionClassification {
  type: QuestionType;
  formatHint: string;
}

export interface ApiKeys {
  deepgramApiKey: string;
  deepseekApiKey: string;
  googleTranslateApiKey: string;
}

export interface Settings extends ApiKeys {
  translationProvider: TranslationProvider;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  answerStyle: AnswerStyle;
  answerLanguage: AnswerLanguage;
  micDeviceId: string;
  profileText: string;
  jdText: string;
  confidenceThreshold: number;
  textSize: TextSize;
  darkMode: boolean;
}

export interface QuestionHistoryItem {
  id: string;
  original: string;
  translated: string;
  answer: string;
  questionType: QuestionType;
  timestamp: number;
}

export type QnaCardStatus =
  | "transcribing"
  | "translating"
  | "classifying"
  | "generating"
  | "complete"
  | "error";

export interface QnaCard {
  id: string;
  original: string;
  translated: string | null;
  answer: string | null;
  questionType: QuestionType | null;
  status: QnaCardStatus;
  confidence: number;
  timestamp: number;
  error: string | null;
}

export interface TranscriptState {
  interimText: string;
  finalText: string;
  translatedText: string;
  isListening: boolean;
  confidence: number | null;
}

export interface AnswerState {
  question: string;
  answer: string;
  questionType: QuestionType | null;
  isClassifying: boolean;
  isGenerating: boolean;
  error: string | null;
}

export interface SessionRecapMeta {
  startedAt: number;
  endedAt: number;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  answerStyle: AnswerStyle;
  questionCount: number;
}

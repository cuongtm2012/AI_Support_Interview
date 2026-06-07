export type LanguageCode = "en" | "vi";

export type AnswerStyle =
  | "STAR"
  | "Professional"
  | "Casual"
  | "Concise"
  | "Technical";

export type AnswerLanguage =
  | "Vietnamese"
  | "English"
  | "Same as target"
  | "Same as source";

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

export interface InterviewPreset {
  id: string;
  name: string;
  profileText: string;
  jdText: string;
  analysis: string | null;
  analyzedAt: number | null;
  updatedAt: number;
}

export interface Settings extends ApiKeys {
  translationProvider: TranslationProvider;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  answerStyle: AnswerStyle;
  answerLanguage: AnswerLanguage;
  micDeviceId: string;
  /** Denormalized from active preset — used by pipeline & AI */
  profileText: string;
  jdText: string;
  interviewPresets: InterviewPreset[];
  activePresetId: string;
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
  isListening: boolean;
  confidence: number | null;
}

export interface SessionRecapMeta {
  startedAt: number;
  endedAt: number;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  answerStyle: AnswerStyle;
  questionCount: number;
}

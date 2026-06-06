import type { QnaCard, QuestionHistoryItem } from "@/types";

export function qnaCardToHistoryItem(card: QnaCard): QuestionHistoryItem {
  return {
    id: card.id,
    original: card.original,
    translated: card.translated ?? "",
    answer: card.answer ?? "",
    questionType: card.questionType ?? "behavioral",
    timestamp: card.timestamp,
  };
}

export function qnaCardsToHistory(cards: QnaCard[]): QuestionHistoryItem[] {
  return cards
    .filter((c) => c.status === "complete" || c.answer || c.translated)
    .map(qnaCardToHistoryItem);
}

export function formatCardTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

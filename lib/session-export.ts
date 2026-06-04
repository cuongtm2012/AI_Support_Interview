import type { QuestionHistoryItem, SessionRecapMeta } from "@/types";
import { formatLiveSessionExport } from "@/lib/export-transcript";

export interface SessionExportPayload {
  meta: SessionRecapMeta;
  questions: QuestionHistoryItem[];
}

export function buildSessionExportPayload(
  history: QuestionHistoryItem[],
  meta: Omit<SessionRecapMeta, "questionCount">
): SessionExportPayload {
  return {
    meta: { ...meta, questionCount: history.length },
    questions: [...history].reverse(),
  };
}

export function downloadSessionJson(payload: SessionExportPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const stamp = new Date(payload.meta.endedAt).toISOString().slice(0, 10);
  triggerDownload(blob, `interview-${stamp}.json`);
}

export function downloadSessionTxt(
  history: QuestionHistoryItem[],
  meta: { sourceLang?: string; targetLang?: string; style?: string }
): void {
  const text = formatLiveSessionExport([...history].reverse(), meta);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `interview-${Date.now()}.txt`);
}

export function formatRecapCopyAll(
  history: QuestionHistoryItem[],
  meta: { sourceLang?: string; targetLang?: string; style?: string }
): string {
  return formatLiveSessionExport([...history].reverse(), meta);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

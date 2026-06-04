import type { QuestionHistoryItem } from "@/types";
import { QUESTION_TYPE_LABELS } from "@/lib/question-type";

export function formatLiveSessionExport(
  history: QuestionHistoryItem[],
  meta?: { sourceLang?: string; targetLang?: string; style?: string }
): string {
  const lines: string[] = [
    "# Interview Copilot — Session Export",
    `Exported: ${new Date().toLocaleString()}`,
  ];

  if (meta?.sourceLang) {
    lines.push(`Languages: ${meta.sourceLang} → ${meta.targetLang ?? "?"}`);
  }
  if (meta?.style) lines.push(`Style: ${meta.style}`);
  lines.push("");

  if (history.length === 0) {
    lines.push("_No questions recorded yet._");
    return lines.join("\n");
  }

  history.forEach((item, i) => {
    const typeLabel = QUESTION_TYPE_LABELS[item.questionType];
    lines.push(`## Question ${i + 1} [${typeLabel}]`);
    lines.push(`**Original:** ${item.original}`);
    if (item.translated) lines.push(`**Translation:** ${item.translated}`);
    if (item.answer) lines.push(`**AI Answer:**\n${item.answer}`);
    lines.push("");
  });

  return lines.join("\n");
}

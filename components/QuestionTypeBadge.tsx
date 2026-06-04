"use client";

import type { QuestionType } from "@/types";
import {
  QUESTION_TYPE_LABELS,
  QUESTION_TYPE_STYLES,
} from "@/lib/question-type";

export function QuestionTypeBadge({ type }: { type: QuestionType }) {
  const style = QUESTION_TYPE_STYLES[type];
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${style.bg} ${style.text} ${style.border}`}
    >
      {QUESTION_TYPE_LABELS[type]}
    </span>
  );
}

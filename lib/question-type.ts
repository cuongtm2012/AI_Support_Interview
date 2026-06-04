import type { QuestionType } from "@/types";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  situational: "Situational",
  competency: "Competency",
};

export const QUESTION_TYPE_STYLES: Record<
  QuestionType,
  { bg: string; text: string; border: string }
> = {
  behavioral: {
    bg: "bg-violet-500/15",
    text: "text-violet-300",
    border: "border-violet-500/30",
  },
  technical: {
    bg: "bg-sky-500/15",
    text: "text-sky-300",
    border: "border-sky-500/30",
  },
  situational: {
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/30",
  },
  competency: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    border: "border-emerald-500/30",
  },
};

export function formatHintForType(type: QuestionType): string {
  switch (type) {
    case "behavioral":
      return "STAR — Situation, Task, Action, Result";
    case "technical":
      return "Giải thích ngắn gọn + ví dụ thực tế";
    case "situational":
      return "Approach + giải pháp cụ thể";
    case "competency":
      return "Liệt kê kinh nghiệm và kỹ năng liên quan";
  }
}

export function answerGuidanceForType(type: QuestionType): string {
  switch (type) {
    case "behavioral":
      return "behavioral → dùng format STAR (Situation, Task, Action, Result)";
    case "technical":
      return "technical → giải thích ngắn gọn, có ví dụ thực tế từ profile";
    case "situational":
      return "situational → nêu approach rồi giải pháp từng bước";
    case "competency":
      return "competency → liệt kê kinh nghiệm và kỹ năng liên quan JD";
  }
}

export function isQuestionType(value: string): value is QuestionType {
  return (
    value === "behavioral" ||
    value === "technical" ||
    value === "situational" ||
    value === "competency"
  );
}

export function heuristicClassify(question: string): QuestionType {
  const q = question.toLowerCase();

  if (
    /tell me about|describe a time|give me an example|situation where|ever had to|walk me through a time/.test(
      q
    )
  ) {
    return "behavioral";
  }
  if (
    /how would you|what would you do if|imagine you|hypothetical|if you were/.test(
      q
    )
  ) {
    return "situational";
  }
  if (
    /explain|how does|what is|difference between|algorithm|code|implement|architecture|design a|complexity/.test(
      q
    )
  ) {
    return "technical";
  }
  if (
    /experience with|skills in|proficient|familiar with|years of experience|competency/.test(
      q
    )
  ) {
    return "competency";
  }

  return "behavioral";
}

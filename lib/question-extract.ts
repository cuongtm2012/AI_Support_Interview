import { wordCount } from "@/lib/transcript-merge";

const QUESTION_START =
  /\b(what|why|how|when|where|who|which|can you|could you|would you|do you|did you|have you|are you|tell me about|describe|explain|walk me through|give me an example of)\b/i;

/** Lecturer / promo noise — not a question to the candidate. */
const LECTURE_NOISE =
  /\b(i will explain|here is the definition|here is the same example|upcoming questions|type never give up|in the comments|parakeet ai|share your success|let's conclude|super simple definition|you can be the next one)\b/i;

export function extractQuestions(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const found: string[] = [];
  const re = /([^.!?\n]*\?)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(normalized)) !== null) {
    const q = match[1].trim();
    if (q.length < 8) continue;
    if (!QUESTION_START.test(q)) continue;
    if (LECTURE_NOISE.test(q)) continue;
    found.push(q);
  }
  return dedupeQuestions(found);
}

export function extractPrimaryQuestion(text: string): string | null {
  const questions = extractQuestions(text);
  if (questions.length === 0) return null;
  return questions.sort((a, b) => b.length - a.length)[0];
}

export function isLikelyInterviewQuestion(text: string): boolean {
  return extractPrimaryQuestion(text) !== null;
}

/** True when STT chunk is lecturer monologue with no extractable interview question. */
export function isLectureMonologue(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  if (isLikelyInterviewQuestion(normalized)) return false;
  if (wordCount(normalized) < 10) return false;
  return (
    LECTURE_NOISE.test(normalized) ||
    /\b(for example|remember|clear\?|okay\?|right\?)\b/i.test(normalized)
  );
}

function dedupeQuestions(questions: string[]): string[] {
  const out: string[] = [];
  for (const q of questions) {
    const lower = q.toLowerCase();
    if (out.some((existing) => existing.toLowerCase() === lower)) continue;
    if (out.some((existing) => existing.toLowerCase().includes(lower))) continue;
    out.push(q);
  }
  return out;
}

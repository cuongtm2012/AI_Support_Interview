/** Merge Deepgram final segments (handles overlap + cumulative text). */
export function mergeTranscriptFragments(fragments: string[]): string {
  if (fragments.length === 0) return "";
  let result = fragments[0].trim();
  for (let i = 1; i < fragments.length; i++) {
    const next = fragments[i].trim();
    if (!next) continue;
    if (result === next || result.endsWith(next)) continue;
    if (next.startsWith(result)) {
      result = next;
      continue;
    }
    const overlap = suffixPrefixOverlap(result, next);
    result =
      overlap > 0
        ? result + next.slice(overlap)
        : `${result} ${next}`;
  }
  return result.replace(/\s+/g, " ").trim();
}

function suffixPrefixOverlap(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  for (let len = max; len > 0; len--) {
    if (a.slice(-len).toLowerCase() === b.slice(0, len).toLowerCase()) {
      return len;
    }
  }
  return 0;
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function endsWithQuestion(text: string): boolean {
  return /\?\s*$/.test(text.trim());
}

export function endsWithSentence(text: string): boolean {
  return /[.!?]\s*$/.test(text.trim());
}

/** Fragment likely continues previous speech (mid-sentence). */
export function isContinuationFragment(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return /^[a-z("'‘]/.test(t) || /^,(\s|$)/.test(t);
}

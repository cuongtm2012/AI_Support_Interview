import type { InterviewPreset } from "@/types";

export function createInterviewPreset(
  name: string,
  profileText = "",
  jdText = ""
): InterviewPreset {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    profileText,
    jdText,
    analysis: null,
    analyzedAt: null,
    updatedAt: now,
  };
}

export function presetReadiness(preset: InterviewPreset): {
  ok: boolean;
  missing: ("profile" | "jd")[];
} {
  const missing: ("profile" | "jd")[] = [];
  if (!preset.profileText.trim()) missing.push("profile");
  if (!preset.jdText.trim()) missing.push("jd");
  return { ok: missing.length === 0, missing };
}

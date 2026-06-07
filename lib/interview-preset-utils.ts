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

export function getActivePreset(
  presets: InterviewPreset[],
  activePresetId: string
): InterviewPreset | undefined {
  return presets.find((p) => p.id === activePresetId);
}

/** @deprecated Use presetReadiness(active).ok — kept for cached client bundles */
export function isActivePresetReady(
  presets: InterviewPreset[],
  activePresetId: string
): boolean {
  const active = getActivePreset(presets, activePresetId);
  if (!active) return false;
  return presetReadiness(active).ok;
}

export function formatPresetMissingLabels(
  missing: ("profile" | "jd")[]
): string {
  if (missing.length === 2) return "Profile và Job description";
  return missing[0] === "profile" ? "Profile" : "Job description";
}

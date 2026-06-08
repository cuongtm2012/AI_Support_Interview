import type { CandidateGender, InterviewPreset } from "@/types";

export type PresetMissingField =
  | "gender"
  | "age"
  | "role"
  | "profile"
  | "jd";

const GENDER_LABELS: Record<CandidateGender, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
};

export function normalizeInterviewPreset(preset: InterviewPreset): InterviewPreset {
  return {
    ...preset,
    gender: preset.gender ?? "",
    age: preset.age ?? "",
    interviewRole: preset.interviewRole ?? "",
    profileText: preset.profileText ?? "",
    jdText: preset.jdText ?? "",
  };
}

export function createInterviewPreset(
  name: string,
  profileText = "",
  jdText = ""
): InterviewPreset {
  const now = Date.now();
  return normalizeInterviewPreset({
    id: crypto.randomUUID(),
    name,
    gender: "",
    age: "",
    interviewRole: "",
    profileText,
    jdText,
    analysis: null,
    analyzedAt: null,
    updatedAt: now,
  });
}

export function isValidAge(age: string): boolean {
  const n = Number.parseInt(age.trim(), 10);
  return Number.isFinite(n) && n >= 16 && n <= 80;
}

export function presetReadiness(preset: InterviewPreset): {
  ok: boolean;
  missing: PresetMissingField[];
} {
  const missing: PresetMissingField[] = [];
  if (!preset.gender) missing.push("gender");
  if (!isValidAge(preset.age)) missing.push("age");
  if (!preset.interviewRole.trim()) missing.push("role");
  if (!preset.profileText.trim()) missing.push("profile");
  if (!preset.jdText.trim()) missing.push("jd");
  return { ok: missing.length === 0, missing };
}

export function formatCandidateContext(preset: InterviewPreset): string {
  const lines: string[] = [];
  if (preset.gender) {
    lines.push(`Giới tính: ${GENDER_LABELS[preset.gender as CandidateGender]}`);
  }
  if (isValidAge(preset.age)) {
    lines.push(`Tuổi: ${preset.age.trim()}`);
  }
  if (preset.interviewRole.trim()) {
    lines.push(`Vị trí đang phỏng vấn: ${preset.interviewRole.trim()}`);
  }
  return lines.join("\n");
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

const MISSING_LABELS: Record<PresetMissingField, string> = {
  gender: "Giới tính",
  age: "Tuổi",
  role: "Vị trí ứng tuyển",
  profile: "Profile",
  jd: "Job description",
};

export function formatPresetMissingLabels(
  missing: PresetMissingField[]
): string {
  if (missing.length === 0) return "";
  if (missing.length === 1) return MISSING_LABELS[missing[0]];
  if (missing.length === 2) {
    return `${MISSING_LABELS[missing[0]]} & ${MISSING_LABELS[missing[1]]}`;
  }
  return missing.map((m) => MISSING_LABELS[m]).join(", ");
}

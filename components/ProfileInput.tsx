"use client";

import { useSettingsStore } from "@/stores/settings";

export function ProfileInput({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  const { profileText, jdText, setSettings } = useSettingsStore();
  const compact = variant === "compact";

  if (compact) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex min-h-0 flex-col">
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Profile
          </label>
          <textarea
            value={profileText}
            onChange={(e) => setSettings({ profileText: e.target.value })}
            rows={7}
            placeholder="Kinh nghiệm, skills, role (3–5 câu)..."
            className="input-field settings-textarea min-h-[148px] flex-1 resize-y text-sm leading-relaxed"
          />
        </div>
        <div className="flex min-h-0 flex-col">
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Job description
          </label>
          <textarea
            value={jdText}
            onChange={(e) => setSettings({ jdText: e.target.value })}
            rows={7}
            placeholder="Paste JD hoặc mô tả công việc..."
            className="input-field settings-textarea min-h-[148px] flex-1 resize-y text-sm leading-relaxed"
          />
        </div>
        <p className="text-[10px] text-slate-600 md:col-span-2">
          DOC/PDF → MD: doctomd.com · lightpdf.com
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label-caps mb-2 block">Profile</label>
        <textarea
          value={profileText}
          onChange={(e) => setSettings({ profileText: e.target.value })}
          rows={4}
          placeholder="Kinh nghiệm, skills, role (3–5 câu)..."
          className="input-field resize-y"
        />
      </div>
      <div>
        <label className="label-caps mb-2 block">Job description</label>
        <textarea
          value={jdText}
          onChange={(e) => setSettings({ jdText: e.target.value })}
          rows={4}
          placeholder="Paste JD hoặc mô tả công việc..."
          className="input-field resize-y"
        />
      </div>
      <p className="text-xs text-slate-600">
        DOC/PDF → MD: doctomd.com · lightpdf.com/pdf-to-markdown
      </p>
    </div>
  );
}

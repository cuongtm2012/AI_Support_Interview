"use client";

import { useSettingsStore } from "@/stores/settings";

export function ProfileInput() {
  const { profileText, jdText, setSettings } = useSettingsStore();

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

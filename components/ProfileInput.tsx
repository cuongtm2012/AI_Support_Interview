"use client";

import { useRef, useState } from "react";
import { useSettingsStore } from "@/stores/settings";
import { analyzeProfileAndJd } from "@/lib/analyze-profile";
import {
  DOCUMENT_UPLOAD_ACCEPT,
  extractTextFromDocument,
} from "@/lib/document-import";
import { presetReadiness } from "@/lib/interview-preset-utils";
import { hasDeepseekApiKey } from "@/lib/api-keys";
import { Button } from "@/components/ui/Button";
import {
  IconAlert,
  IconCheck,
  IconSparkles,
} from "@/components/ui/Icons";

function DocumentUploadButton({
  label,
  onImported,
}: {
  label: string;
  onImported: (text: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      onImported(await extractTextFromDocument(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không đọc được file");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-slate-400 transition hover:border-accent/30 hover:bg-accent/10 hover:text-accent disabled:opacity-50"
      >
        {loading ? "Đang đọc…" : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={DOCUMENT_UPLOAD_ACCEPT}
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
}

function ProfileField({
  label,
  value,
  placeholder,
  onChange,
  onImport,
  compact,
  expanded,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onImport: (text: string) => void;
  compact?: boolean;
  expanded?: boolean;
}) {
  const filled = value.trim().length > 0;

  return (
    <div className="flex min-h-0 flex-col gap-2 rounded-xl border border-white/[0.06] bg-surface-base/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="label-caps">{label}</label>
          {filled ? (
            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
              <IconCheck size={9} />
              OK
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 rounded bg-live/10 px-1.5 py-0.5 text-[9px] font-medium text-live">
              <IconAlert size={9} />
              Trống
            </span>
          )}
        </div>
        <DocumentUploadButton label="Upload file" onImported={onImport} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input-field settings-textarea w-full resize-y text-sm leading-relaxed ${
          expanded
            ? "min-h-[min(42vh,480px)]"
            : compact
              ? "min-h-[140px]"
              : "min-h-[180px] lg:min-h-[220px]"
        }`}
      />
      <p className="text-[10px] text-slate-600">
        {value.length > 0
          ? `${value.length.toLocaleString()} ký tự`
          : "Paste hoặc upload — thay thế toàn bộ nội dung"}
      </p>
    </div>
  );
}

function WorkflowSteps({
  hasPreset,
  profileOk,
  jdOk,
  analyzed,
}: {
  hasPreset: boolean;
  profileOk: boolean;
  jdOk: boolean;
  analyzed: boolean;
}) {
  const steps = [
    { label: "Chọn bộ", done: hasPreset },
    { label: "Profile", done: profileOk },
    { label: "JD", done: jdOk },
    { label: "Phân tích", done: analyzed },
  ];

  return (
    <ol className="flex flex-wrap items-center gap-1 text-[10px]">
      {steps.map((step, i) => (
        <li key={step.label} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-700">→</span>}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
              step.done
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-white/[0.04] text-slate-500"
            }`}
          >
            {step.done && <IconCheck size={9} />}
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function PresetManager({ variant }: { variant: "modal" | "default" }) {
  const interviewPresets = useSettingsStore((s) => s.interviewPresets);
  const activePresetId = useSettingsStore((s) => s.activePresetId);
  const activePreset = useSettingsStore((s) =>
    s.interviewPresets.find((p) => p.id === s.activePresetId)
  );
  const switchInterviewPreset = useSettingsStore((s) => s.switchInterviewPreset);
  const addInterviewPreset = useSettingsStore((s) => s.addInterviewPreset);
  const deleteInterviewPreset = useSettingsStore((s) => s.deleteInterviewPreset);
  const renameInterviewPreset = useSettingsStore((s) => s.renameInterviewPreset);

  const readiness = activePreset
    ? presetReadiness(activePreset)
    : { ok: false, missing: ["profile", "jd"] as const };

  return (
    <div className="settings-section space-y-3">
      <WorkflowSteps
        hasPreset={!!activePreset}
        profileOk={!!activePreset?.profileText.trim()}
        jdOk={!!activePreset?.jdText.trim()}
        analyzed={!!activePreset?.analysis}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="label-caps mr-1 shrink-0">Buổi PV</span>
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-0.5">
          {interviewPresets.map((p) => {
            const { ok } = presetReadiness(p);
            const active = p.id === activePresetId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => switchInterviewPreset(p.id)}
                className={`shrink-0 cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? "border-accent/40 bg-accent/15 text-accent"
                    : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/[0.12] hover:text-slate-200"
                }`}
              >
                {p.name}
                {!ok && " ⚠"}
                {ok && p.analysis && " ✓"}
              </button>
            );
          })}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addInterviewPreset()}
          className="!px-2 !text-[11px]"
        >
          + Mới
        </Button>
        {interviewPresets.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteInterviewPreset(activePresetId)}
            className="!px-2 !text-[11px] !text-red-400"
          >
            Xóa
          </Button>
        )}
      </div>

      <input
        type="text"
        value={activePreset?.name ?? ""}
        onChange={(e) => renameInterviewPreset(e.target.value)}
        placeholder="Tên buổi phỏng vấn (vd: AWS SAA, Google PM…)"
        className="input-field w-full text-sm"
      />

      {!readiness.ok && variant === "modal" && (
        <div className="flex items-start gap-2 rounded-lg border border-live/20 bg-live/5 px-3 py-2">
          <IconAlert size={14} className="mt-0.5 shrink-0 text-live" />
          <p className="text-[11px] leading-relaxed text-amber-200/90">
            Bộ <strong>{activePreset?.name}</strong> còn thiếu{" "}
            <strong>{readiness.missing.join(" & ")}</strong>. Nhập đủ trước khi
            Start Listening.
          </p>
        </div>
      )}
    </div>
  );
}

function AnalysisPanel({ modalExpanded }: { modalExpanded?: boolean }) {
  const profileText = useSettingsStore((s) => s.profileText);
  const jdText = useSettingsStore((s) => s.jdText);
  const setPresetAnalysis = useSettingsStore((s) => s.setPresetAnalysis);
  const activePreset = useSettingsStore((s) =>
    s.interviewPresets.find((p) => p.id === s.activePresetId)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(true);

  const { ok, missing } = activePreset
    ? presetReadiness(activePreset)
    : { ok: false, missing: ["profile", "jd"] as const };

  const handleAnalyze = async () => {
    setError(null);
    if (!hasDeepseekApiKey()) {
      setError("Cần DeepSeek API key (tab API Keys)");
      return;
    }
    if (!ok) {
      setError(`Thiếu ${missing.join(" và ")} — nhập trước khi phân tích`);
      return;
    }

    setLoading(true);
    try {
      const analysis = await analyzeProfileAndJd(profileText, jdText);
      setPresetAnalysis(analysis);
      setResultOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Phân tích thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-section">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/20 bg-accent/[0.06] p-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-200">
            Phân tích Profile ↔ JD
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            So khớp CV với JD — điểm mạnh, gap, câu hỏi dự đoán
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<IconSparkles size={14} />}
          onClick={() => void handleAnalyze()}
          disabled={loading || !ok}
          className="shrink-0 !text-xs"
        >
          {loading ? "Đang phân tích…" : "Phân tích"}
        </Button>
      </div>

      {error && (
        <p className="mt-2 text-[11px] text-red-400" role="alert">
          {error}
        </p>
      )}
      {!ok && !error && (
        <p className="mt-2 text-[11px] text-slate-500">
          Nhập đủ Profile và JD ở trên để bật phân tích.
        </p>
      )}

      {activePreset?.analysis && (
        <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.06] bg-black/20">
          <button
            type="button"
            onClick={() => setResultOpen((v) => !v)}
            className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-xs font-medium text-slate-300 transition hover:bg-white/[0.03]"
          >
            <span>Kết quả phân tích</span>
            <span className="text-[10px] text-slate-600">
              {resultOpen ? "Thu gọn" : "Mở rộng"}
            </span>
          </button>
          {resultOpen && (
            <div
              className={`overflow-y-auto border-t border-white/[0.04] px-3 py-3 ${
                modalExpanded ? "max-h-[min(38vh,420px)]" : "max-h-[200px]"
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-300">
                {activePreset.analysis}
              </pre>
              {activePreset.analyzedAt && (
                <p className="mt-2 text-[10px] text-slate-600">
                  Cập nhật:{" "}
                  {new Date(activePreset.analyzedAt).toLocaleString("vi-VN")}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ProfileInput({
  variant = "default",
  expanded = false,
}: {
  variant?: "default" | "compact" | "modal";
  expanded?: boolean;
}) {
  const { profileText, jdText, setSettings } = useSettingsStore();
  const isModal = variant === "modal" || variant === "compact";

  return (
    <div className="space-y-4">
      <PresetManager variant={isModal ? "modal" : "default"} />

      <div
        className={
          isModal
            ? "grid gap-3 lg:grid-cols-2"
            : "flex flex-col gap-4"
        }
      >
        <ProfileField
          label="Profile / CV"
          value={profileText}
          placeholder="Kinh nghiệm, skills, projects, role — paste hoặc upload CV/resume..."
          onChange={(v) => setSettings({ profileText: v })}
          onImport={(text) => setSettings({ profileText: text })}
          compact={isModal}
          expanded={expanded}
        />
        <ProfileField
          label="Job Description"
          value={jdText}
          placeholder="Paste JD hoặc upload file mô tả công việc..."
          onChange={(v) => setSettings({ jdText: v })}
          onImport={(text) => setSettings({ jdText: text })}
          compact={isModal}
          expanded={expanded}
        />
      </div>

      <AnalysisPanel modalExpanded={expanded} />

      {isModal && (
        <p className="text-center text-[10px] text-slate-600">
          PDF, DOCX, TXT, MD ·{" "}
          <a
            href="https://doctomd.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent/80 hover:underline"
          >
            doctomd.com
          </a>
        </p>
      )}
    </div>
  );
}

/** True when active preset is missing profile or JD. */
export function useActivePresetIncomplete(): boolean {
  const active = useSettingsStore((s) =>
    s.interviewPresets.find((p) => p.id === s.activePresetId)
  );
  if (!active) return true;
  return !presetReadiness(active).ok;
}

export function getActivePresetLabel(): string {
  const preset = useSettingsStore.getState().getActivePreset();
  return preset?.name ?? "Chưa chọn";
}

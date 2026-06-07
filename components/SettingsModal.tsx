"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSettingsStore } from "@/stores/settings";
import { ApiKeysSection } from "@/components/ApiKeysSection";
import { ProfileInput, useActivePresetIncomplete } from "@/components/ProfileInput";
import { hasRequiredApiKeys } from "@/lib/api-keys";
import {
  IconSettings,
  IconX,
  IconKey,
  IconGlobe,
  IconSparkles,
  IconCheck,
  IconAlert,
  IconMaximize,
  IconMinimize,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import type {
  AnswerLanguage,
  AnswerStyle,
  LanguageCode,
  TextSize,
  TranslationProvider,
} from "@/types";
import { translationProviderLabel } from "@/lib/translation-config";

type SettingsTab = "keys" | "interview" | "profile" | "display";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
}

const TABS: {
  id: SettingsTab;
  label: string;
  description: string;
  icon: typeof IconKey;
}[] = [
  {
    id: "keys",
    label: "API Keys",
    description: "Deepgram, DeepSeek, Google",
    icon: IconKey,
  },
  {
    id: "profile",
    label: "Profile & JD",
    description: "CV và mô tả công việc",
    icon: IconSparkles,
  },
  {
    id: "interview",
    label: "Interview",
    description: "Ngôn ngữ & phong cách trả lời",
    icon: IconGlobe,
  },
  {
    id: "display",
    label: "Giao diện",
    description: "Cỡ chữ & theme",
    icon: IconSettings,
  },
];

const TAB_HEADERS: Record<
  SettingsTab,
  { title: string; subtitle: string }
> = {
  keys: {
    title: "API Keys",
    subtitle: "Deepgram bắt buộc cho STT. DeepSeek dùng cho gợi ý câu trả lời và phân tích.",
  },
  profile: {
    title: "Profile & Job Description",
    subtitle: "Mỗi buổi phỏng vấn một bộ riêng — chọn đúng bộ, nhập đủ, rồi phân tích trước khi nghe.",
  },
  interview: {
    title: "Interview",
    subtitle: "Cấu hình dịch thuật, ngôn ngữ câu trả lời và ngưỡng confidence STT.",
  },
  display: {
    title: "Giao diện",
    subtitle: "Tùy chỉnh hiển thị trên màn hình phỏng vấn.",
  },
};

export function SettingsModal({ open, onClose, initialTab }: SettingsModalProps) {
  const settings = useSettingsStore();
  const [tab, setTab] = useState<SettingsTab>("keys");
  const [maximized, setMaximized] = useState(false);
  const keysOk = hasRequiredApiKeys().ok;
  const profileIncomplete = useActivePresetIncomplete();

  useEffect(() => {
    if (open) {
      setTab(initialTab ?? (keysOk ? "profile" : "keys"));
    } else {
      setMaximized(false);
    }
  }, [open, initialTab, keysOk]);

  if (!open) return null;

  const header = TAB_HEADERS[tab];
  const activeTabMeta = TABS.find((t) => t.id === tab)!;

  return (
    <div
      className={`fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm ${
        maximized
          ? "p-0"
          : "items-center justify-center p-3 sm:p-4"
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className={`glass-panel flex w-full flex-col overflow-hidden shadow-2xl ${
          maximized
            ? "h-[100dvh] max-w-none rounded-none"
            : "h-[min(90vh,720px)] max-w-4xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <IconSettings size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="settings-title"
              className="truncate text-sm font-semibold text-slate-100 sm:text-base"
            >
              Settings
            </h2>
            <p className="truncate text-[11px] text-slate-500">
              {activeTabMeta.label}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            Xong
          </Button>
          <button
            type="button"
            onClick={() => setMaximized((v) => !v)}
            className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={maximized ? "Thu nhỏ modal" : "Phóng to modal"}
            title={maximized ? "Thu nhỏ" : "Phóng to"}
          >
            {maximized ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close settings"
          >
            <IconX size={16} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* Sidebar — desktop */}
          <nav
            className="settings-nav hidden w-52 shrink-0 flex-col gap-0.5 border-r border-white/[0.06] p-3 md:flex"
            role="tablist"
            aria-label="Settings sections"
          >
            {TABS.map(({ id, label, description, icon: Icon }) => (
              <SettingsNavItem
                key={id}
                active={tab === id}
                label={label}
                description={description}
                icon={<Icon size={15} />}
                status={
                  id === "keys" ? (
                    keysOk ? (
                      "ok"
                    ) : (
                      "warn"
                    )
                  ) : id === "profile" ? (
                    profileIncomplete ? (
                      "warn"
                    ) : (
                      "ok"
                    )
                  ) : undefined
                }
                onClick={() => setTab(id)}
              />
            ))}
          </nav>

          {/* Mobile tab strip */}
          <nav
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/[0.06] px-3 py-2 md:hidden"
            role="tablist"
          >
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              const warn =
                (id === "keys" && !keysOk) ||
                (id === "profile" && profileIncomplete);
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(id)}
                  className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    active
                      ? "bg-accent/15 text-accent"
                      : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                  }`}
                >
                  <Icon size={13} />
                  {label}
                  {warn && (
                    <span className="h-1.5 w-1.5 rounded-full bg-live" aria-hidden />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-white/[0.04] px-4 py-3 sm:px-5">
              <h3 className="text-sm font-semibold text-slate-100">
                {header.title}
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                {header.subtitle}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {tab === "keys" && <ApiKeysSection variant="compact" />}
              {tab === "interview" && <InterviewTab settings={settings} />}
              {tab === "profile" && (
                <ProfileInput variant="modal" expanded={maximized} />
              )}
              {tab === "display" && <DisplayTab settings={settings} />}
            </div>

            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.06] bg-surface-base/40 px-4 py-2.5 sm:px-5">
              <SettingsFooterStatus tab={tab} />
              <Button variant="secondary" size="sm" onClick={onClose}>
                Đóng
              </Button>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsNavItem({
  active,
  label,
  description,
  icon,
  status,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  icon: ReactNode;
  status?: "ok" | "warn";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`settings-nav-item ${active ? "settings-nav-item-active" : ""}`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.04]">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
          {label}
          {status === "warn" && (
            <IconAlert size={11} className="shrink-0 text-live" />
          )}
          {status === "ok" && (
            <IconCheck size={11} className="shrink-0 text-emerald-400" />
          )}
        </span>
        <span className="block truncate text-[10px] text-slate-600">
          {description}
        </span>
      </span>
    </button>
  );
}

function SettingsFooterStatus({ tab }: { tab: SettingsTab }) {
  const keys = hasRequiredApiKeys();
  const profileIncomplete = useActivePresetIncomplete();
  const settings = useSettingsStore();
  const activePreset = useSettingsStore((s) =>
    s.interviewPresets.find((p) => p.id === s.activePresetId)
  );

  if (tab === "keys") {
    return (
      <p
        className={`flex items-center gap-1.5 text-[11px] ${
          keys.ok ? "text-emerald-400/90" : "text-live"
        }`}
      >
        {keys.ok ? <IconCheck size={12} /> : <IconAlert size={12} />}
        {keys.ok
          ? "STT sẵn sàng"
          : `Thiếu ${keys.missing.join(", ")}`}
      </p>
    );
  }

  if (tab === "profile") {
    return (
      <p
        className={`flex items-center gap-1.5 text-[11px] ${
          profileIncomplete ? "text-amber-400/90" : "text-emerald-400/90"
        }`}
      >
        {profileIncomplete ? <IconAlert size={12} /> : <IconCheck size={12} />}
        {profileIncomplete
          ? "Chưa đủ Profile hoặc JD — không thể Start Listening"
          : activePreset?.analysis
            ? `${activePreset.name} · đã phân tích`
            : `${activePreset?.name ?? "Preset"} · sẵn sàng nghe`}
      </p>
    );
  }

  if (tab === "interview") {
    const lang =
      settings.sourceLanguage === "en" ? "English" : "Vietnamese";
    const target =
      settings.targetLanguage === "en" ? "English" : "Vietnamese";
    return (
      <p className="text-[11px] text-slate-600">
        STT: {lang} → Dịch: {target} ·{" "}
        {translationProviderLabel(settings.translationProvider)} · Trả lời:{" "}
        {settings.answerLanguage} · Confidence{" "}
        {settings.confidenceThreshold.toFixed(2)}
      </p>
    );
  }

  if (tab === "display") {
    return (
      <p className="text-[11px] text-slate-600">
        Text: {settings.textSize} · Theme:{" "}
        {settings.darkMode ? "Dark" : "Light"}
      </p>
    );
  }

  return (
    <p className="text-[11px] text-slate-600">
      Thay đổi được lưu tự động
    </p>
  );
}

function InterviewTab({
  settings,
}: {
  settings: ReturnType<typeof useSettingsStore.getState>;
}) {
  return (
    <div className="space-y-4">
      <SettingsSection title="Dịch thuật" hint="Cách dịch câu hỏi interviewer sang ngôn ngữ đích">
        <Field label="Provider">
          <select
            value={settings.translationProvider}
            onChange={(e) =>
              settings.setSettings({
                translationProvider: e.target.value as TranslationProvider,
              })
            }
            className="select-field settings-input"
          >
            <option value="none">Không dịch — chỉ ngôn ngữ gốc</option>
            <option value="deepseek">
              DeepSeek — dùng chung key AI (mặc định)
            </option>
            <option value="google">Google Cloud Translation</option>
          </select>
          <p className="mt-1.5 text-[10px] text-slate-600">
            {translationProviderLabel(settings.translationProvider)}
            {settings.sourceLanguage === settings.targetLanguage &&
              " · Source = Target → tự bỏ dịch"}
          </p>
        </Field>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Source (STT)">
            <select
              value={settings.sourceLanguage}
              onChange={(e) =>
                settings.setSettings({
                  sourceLanguage: e.target.value as LanguageCode,
                })
              }
              className="select-field settings-input"
            >
              <option value="en">English</option>
              <option value="vi">Vietnamese</option>
            </select>
          </Field>

          <Field label="Target (dịch)">
            <select
              value={settings.targetLanguage}
              onChange={(e) =>
                settings.setSettings({
                  targetLanguage: e.target.value as LanguageCode,
                })
              }
              className="select-field settings-input"
            >
              <option value="vi">Vietnamese</option>
              <option value="en">English</option>
            </select>
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection title="Câu trả lời AI" hint="Phong cách và ngôn ngữ gợi ý trả lời">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Answer style" className="sm:col-span-2">
            <select
              value={settings.answerStyle}
              onChange={(e) =>
                settings.setSettings({
                  answerStyle: e.target.value as AnswerStyle,
                })
              }
              className="select-field settings-input"
            >
              {(
                ["STAR", "Professional", "Casual", "Concise", "Technical"] as AnswerStyle[]
              ).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Answer language">
            <select
              value={settings.answerLanguage}
              onChange={(e) =>
                settings.setSettings({
                  answerLanguage: e.target.value as AnswerLanguage,
                })
              }
              className="select-field settings-input"
            >
              <option value="Same as source">Same as source (STT lang)</option>
              <option value="Same as target">Same as target (translation)</option>
              <option value="English">English</option>
              <option value="Vietnamese">Vietnamese</option>
            </select>
          </Field>

          <Field label="STT confidence">
            <div className="flex h-8 items-center gap-2">
              <input
                type="range"
                min={0.5}
                max={1}
                step={0.05}
                value={settings.confidenceThreshold}
                onChange={(e) =>
                  settings.setSettings({
                    confidenceThreshold: parseFloat(e.target.value),
                  })
                }
                className="min-w-0 flex-1 accent-accent"
              />
              <span className="w-9 shrink-0 text-right font-mono text-[10px] text-accent">
                {settings.confidenceThreshold.toFixed(2)}
              </span>
            </div>
          </Field>
        </div>
      </SettingsSection>
    </div>
  );
}

function DisplayTab({
  settings,
}: {
  settings: ReturnType<typeof useSettingsStore.getState>;
}) {
  return (
    <SettingsSection title="Hiển thị">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Text size">
          <select
            value={settings.textSize}
            onChange={(e) =>
              settings.setSettings({
                textSize: e.target.value as TextSize,
              })
            }
            className="select-field settings-input"
          >
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
          </select>
        </Field>

        <Field label="Theme">
          <label className="settings-input flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-white/[0.1] bg-surface-base/80 px-2.5 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={(e) =>
                settings.setSettings({ darkMode: e.target.checked })
              }
              className="h-3.5 w-3.5 accent-accent"
            />
            Dark mode
          </label>
        </Field>
      </div>
    </SettingsSection>
  );
}

function SettingsSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="settings-section">
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-slate-200">{title}</h4>
        {hint && (
          <p className="mt-0.5 text-[10px] leading-relaxed text-slate-600">
            {hint}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label-caps mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

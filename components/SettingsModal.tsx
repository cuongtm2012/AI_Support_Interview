"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settings";
import { ApiKeysSection } from "@/components/ApiKeysSection";
import { ProfileInput } from "@/components/ProfileInput";
import { hasRequiredApiKeys } from "@/lib/api-keys";
import {
  IconSettings,
  IconX,
  IconKey,
  IconGlobe,
  IconSparkles,
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
}

const TABS: { id: SettingsTab; label: string; icon: typeof IconKey }[] = [
  { id: "keys", label: "Keys", icon: IconKey },
  { id: "interview", label: "Interview", icon: IconGlobe },
  { id: "profile", label: "Profile", icon: IconSparkles },
  { id: "display", label: "Display", icon: IconSettings },
];

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const settings = useSettingsStore();
  const [tab, setTab] = useState<SettingsTab>("keys");

  useEffect(() => {
    if (open) {
      setTab(hasRequiredApiKeys().ok ? "interview" : "keys");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="glass-panel flex w-full max-w-xl flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 py-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
            <IconSettings size={14} />
          </span>
          <h2
            id="settings-title"
            className="min-w-0 flex-1 text-sm font-semibold text-slate-100"
          >
            Settings
          </h2>
          <Button variant="primary" size="sm" onClick={onClose}>
            Xong
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close settings"
          >
            <IconX size={16} />
          </button>
        </header>

        <nav
          className="flex shrink-0 gap-0.5 border-b border-white/[0.06] px-3 py-1.5"
          role="tablist"
          aria-label="Settings sections"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            );
          })}
        </nav>

        <div
          className={`overflow-y-auto px-4 py-3 ${
            tab === "profile"
              ? "max-h-[min(72vh,520px)]"
              : tab === "interview"
                ? "max-h-[min(55vh,320px)]"
                : "max-h-[min(50vh,280px)]"
          }`}
        >
          {tab === "keys" && <ApiKeysSection variant="compact" />}
          {tab === "interview" && <InterviewTab settings={settings} />}
          {tab === "profile" && <ProfileInput variant="compact" />}
          {tab === "display" && <DisplayTab settings={settings} />}
        </div>
      </div>
    </div>
  );
}

function InterviewTab({
  settings,
}: {
  settings: ReturnType<typeof useSettingsStore.getState>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Field label="Dịch câu hỏi" className="sm:col-span-2">
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
        <p className="mt-1 text-[10px] text-slate-600">
          {translationProviderLabel(settings.translationProvider)}
          {settings.sourceLanguage === settings.targetLanguage &&
            " · Source = Target → tự bỏ dịch"}
        </p>
      </Field>

      <Field label="Source">
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

      <Field label="Target">
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

      <Field label="Answer lang">
        <select
          value={settings.answerLanguage}
          onChange={(e) =>
            settings.setSettings({
              answerLanguage: e.target.value as AnswerLanguage,
            })
          }
          className="select-field settings-input"
        >
          <option value="Same as target">Same as target</option>
          <option value="English">English</option>
          <option value="Vietnamese">Vietnamese</option>
        </select>
      </Field>

      <Field label="Confidence">
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
  );
}

function DisplayTab({
  settings,
}: {
  settings: ReturnType<typeof useSettingsStore.getState>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
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
        <label className="settings-input flex cursor-pointer items-center gap-2 rounded-lg border border-white/[0.1] bg-surface-base/80 px-2.5 text-xs text-slate-300">
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
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

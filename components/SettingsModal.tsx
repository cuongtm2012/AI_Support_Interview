"use client";

import { useSettingsStore } from "@/stores/settings";
import { ApiKeysSection } from "@/components/ApiKeysSection";
import { ProfileInput } from "@/components/ProfileInput";
import { IconSettings, IconX } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import type {
  AnswerLanguage,
  AnswerStyle,
  LanguageCode,
  TextSize,
} from "@/types";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const settings = useSettingsStore();

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
        className="glass-panel max-h-[90vh] w-full max-w-lg overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-surface-card/95 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <IconSettings size={18} />
            </span>
            <h2 id="settings-title" className="text-lg font-semibold text-slate-100">
              Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-slate-400 transition duration-200 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close settings"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <ApiKeysSection />

          <hr className="border-white/[0.06]" />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Source language">
              <select
                value={settings.sourceLanguage}
                onChange={(e) =>
                  settings.setSettings({
                    sourceLanguage: e.target.value as LanguageCode,
                  })
                }
                className="select-field"
              >
                <option value="en">English</option>
                <option value="vi">Vietnamese</option>
              </select>
            </Field>

            <Field label="Target language">
              <select
                value={settings.targetLanguage}
                onChange={(e) =>
                  settings.setSettings({
                    targetLanguage: e.target.value as LanguageCode,
                  })
                }
                className="select-field"
              >
                <option value="vi">Vietnamese</option>
                <option value="en">English</option>
              </select>
            </Field>
          </div>

          <Field label="Answer style">
            <select
              value={settings.answerStyle}
              onChange={(e) =>
                settings.setSettings({
                  answerStyle: e.target.value as AnswerStyle,
                })
              }
              className="select-field"
            >
              {(
                [
                  "STAR",
                  "Professional",
                  "Casual",
                  "Concise",
                  "Technical",
                ] as AnswerStyle[]
              ).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Answer language">
              <select
                value={settings.answerLanguage}
                onChange={(e) =>
                  settings.setSettings({
                    answerLanguage: e.target.value as AnswerLanguage,
                  })
                }
                className="select-field"
              >
                <option value="Same as target">Same as target</option>
                <option value="English">English</option>
                <option value="Vietnamese">Vietnamese</option>
              </select>
            </Field>

            <Field label="Text size">
              <select
                value={settings.textSize}
                onChange={(e) =>
                  settings.setSettings({
                    textSize: e.target.value as TextSize,
                  })
                }
                className="select-field"
              >
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>
            </Field>
          </div>

          <Field label={`Confidence threshold — ${settings.confidenceThreshold}`}>
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
              className="w-full accent-accent"
            />
          </Field>

          <Field label="Giao diện">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={(e) =>
                  settings.setSettings({ darkMode: e.target.checked })
                }
                className="h-4 w-4 accent-accent"
              />
              Dark mode
            </label>
          </Field>

          <ProfileInput />
        </div>

        <div className="sticky bottom-0 border-t border-white/[0.06] bg-surface-card/95 p-4 backdrop-blur-xl">
          <Button variant="primary" onClick={onClose} className="w-full justify-center">
            Lưu & đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label-caps mb-2 block">{label}</label>
      {children}
    </div>
  );
}

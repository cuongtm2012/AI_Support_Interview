"use client";

import { useSettingsStore } from "@/stores/settings";
import { hasRequiredApiKeys } from "@/lib/api-keys";
import { shouldTranslate } from "@/lib/translation-config";
import { IconKey, IconCheck, IconAlert } from "@/components/ui/Icons";

function ApiKeyInput({
  label,
  value,
  onChange,
  required,
  placeholder,
  compact,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  compact?: boolean;
}) {
  return (
    <div>
      <label
        className={`flex items-center gap-1.5 font-medium text-slate-400 ${
          compact ? "mb-1 text-xs" : "mb-1.5 text-sm"
        }`}
      >
        {label}
        {required ? (
          <span className="rounded bg-red-500/15 px-1 py-0.5 text-[9px] font-semibold uppercase text-red-400">
            Req
          </span>
        ) : (
          <span className="text-[9px] uppercase text-slate-600">Opt</span>
        )}
      </label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={`input-field font-mono ${compact ? "settings-input" : ""}`}
      />
    </div>
  );
}

function translationStatusMessage(): string {
  const s = useSettingsStore.getState();
  if (s.translationProvider === "none") return "Dịch: tắt";
  if (s.translationProvider === "deepseek") {
    return s.deepseekApiKey.trim()
      ? "Dịch: DeepSeek"
      : "Dịch: cần DeepSeek key";
  }
  return s.googleTranslateApiKey.trim()
    ? "Dịch: Google"
    : "Dịch: cần Google key";
}

export function ApiKeysSection({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  const settings = useSettingsStore();
  const { ok, missing } = hasRequiredApiKeys();
  const compact = variant === "compact";
  const showGoogle = settings.translationProvider === "google";
  const translateReady = shouldTranslate(
    settings.sourceLanguage,
    settings.targetLanguage
  );

  if (compact) {
    return (
      <div className="space-y-2">
        <div className={`grid gap-2 ${showGoogle ? "sm:grid-cols-2" : ""}`}>
          <ApiKeyInput
            label="Deepgram"
            required
            compact
            value={settings.deepgramApiKey}
            onChange={(v) => settings.setSettings({ deepgramApiKey: v })}
            placeholder="dg_..."
          />
          <ApiKeyInput
            label="DeepSeek"
            compact
            value={settings.deepseekApiKey}
            onChange={(v) => settings.setSettings({ deepseekApiKey: v })}
            placeholder="sk-..."
          />
          {showGoogle && (
            <div className="sm:col-span-2">
              <ApiKeyInput
                label="Google Translate"
                compact
                value={settings.googleTranslateApiKey}
                onChange={(v) =>
                  settings.setSettings({ googleTranslateApiKey: v })
                }
                placeholder="AIza..."
              />
            </div>
          )}
        </div>

        <p
          className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] leading-snug ${
            !ok ? "text-live" : "text-slate-500"
          }`}
        >
          {!ok ? (
            <>
              <IconAlert size={11} className="shrink-0" />
              <span>Thiếu {missing.join(", ")}</span>
            </>
          ) : (
            <>
              <IconCheck size={11} className="shrink-0 text-emerald-400" />
              <span className="text-emerald-400/90">STT OK</span>
            </>
          )}
          <span className="text-slate-600">· {translationStatusMessage()}</span>
          {translateReady && (
            <span className="text-slate-600">· sẽ dịch khi nghe</span>
          )}
          <a
            href="https://platform.deepseek.com/api_keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Get keys
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/[0.08] bg-surface-base/60 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <IconKey size={18} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">API Keys</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Deepgram bắt buộc cho STT. DeepSeek tùy chọn (gợi ý câu trả lời).
            Dịch bật trong tab Interview.
          </p>
        </div>
      </div>

      <ApiKeyInput
        label="Deepgram"
        required
        value={settings.deepgramApiKey}
        onChange={(v) => settings.setSettings({ deepgramApiKey: v })}
        placeholder="dg_..."
      />
      <ApiKeyInput
        label="DeepSeek"
        value={settings.deepseekApiKey}
        onChange={(v) => settings.setSettings({ deepseekApiKey: v })}
        placeholder="sk-..."
      />
      {showGoogle && (
        <ApiKeyInput
          label="Google Translate"
          value={settings.googleTranslateApiKey}
          onChange={(v) => settings.setSettings({ googleTranslateApiKey: v })}
          placeholder="AIza..."
        />
      )}

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs">
        {!ok ? (
          <p className="flex items-center gap-2 text-live">
            <IconAlert size={14} />
            Thiếu: {missing.join(", ")}
          </p>
        ) : (
          <p className="flex items-center gap-2 text-emerald-400/90">
            <IconCheck size={14} />
            Deepgram sẵn sàng cho STT
          </p>
        )}
        <p className="mt-2 text-slate-600">{translationStatusMessage()}</p>
      </div>
    </div>
  );
}

"use client";

import { useSettingsStore } from "@/stores/settings";
import { hasRequiredApiKeys, hasGoogleTranslateKey } from "@/lib/api-keys";
import { IconKey, IconCheck, IconAlert } from "@/components/ui/Icons";

function ApiKeyInput({
  label,
  value,
  onChange,
  required,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  hint?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-400">
        {label}
        {required ? (
          <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400">
            Required
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-wide text-slate-600">
            Optional
          </span>
        )}
      </label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="input-field font-mono"
      />
      {hint}
    </div>
  );
}

export function ApiKeysSection() {
  const settings = useSettingsStore();
  const { ok, missing } = hasRequiredApiKeys();

  return (
    <div className="space-y-4 rounded-xl border border-white/[0.08] bg-surface-base/60 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <IconKey size={18} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">API Keys</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Nhập một lần — lưu localStorage. Gửi qua header tới server proxy,
            không nằm trong source code.
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
        required
        value={settings.deepseekApiKey}
        onChange={(v) => settings.setSettings({ deepseekApiKey: v })}
        placeholder="sk-..."
        hint={
          <p className="mt-1.5 text-xs text-slate-600">
            Gợi ý câu trả lời ·{" "}
            <a
              href="https://platform.deepseek.com/api_keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              platform.deepseek.com
            </a>
          </p>
        }
      />
      <ApiKeyInput
        label="Google Translate"
        value={settings.googleTranslateApiKey}
        onChange={(v) => settings.setSettings({ googleTranslateApiKey: v })}
        placeholder="AIza..."
      />

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs">
        {!ok ? (
          <p className="flex items-center gap-2 text-live">
            <IconAlert size={14} />
            Thiếu: {missing.join(", ")}
          </p>
        ) : (
          <p className="flex items-center gap-2 text-emerald-400/90">
            <IconCheck size={14} />
            Deepgram & DeepSeek đã sẵn sàng
          </p>
        )}
        {!hasGoogleTranslateKey() && (
          <p className="mt-2 text-slate-600">
            Chưa có Google Translate — bỏ qua bước dịch
          </p>
        )}
      </div>
    </div>
  );
}

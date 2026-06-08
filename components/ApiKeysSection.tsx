"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { hasRequiredApiKeys, hasDeepseekApiKey } from "@/lib/api-keys";
import { saveUserApiKeys } from "@/lib/supabase/user-api-keys";
import { useSettingsStore } from "@/stores/settings";
import { useUserApiKeysStore } from "@/stores/user-api-keys";
import { shouldTranslate } from "@/lib/translation-config";
import { IconKey, IconCheck, IconAlert } from "@/components/ui/Icons";

function ApiKeyInput({
  label,
  value,
  onChange,
  required,
  placeholder,
  compact,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  compact?: boolean;
  disabled?: boolean;
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
        disabled={disabled}
        className={`input-field font-mono ${compact ? "settings-input" : ""} ${
          disabled ? "opacity-60" : ""
        }`}
      />
    </div>
  );
}

function translationStatusMessage(): string {
  const s = useSettingsStore.getState();
  if (s.translationProvider === "none") return "Dịch: tắt";
  if (s.translationProvider === "deepseek") {
    return hasDeepseekApiKey() ? "Dịch: DeepSeek" : "Dịch: cần DeepSeek key";
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
  const { user } = useAuth();
  const settings = useSettingsStore();
  const deepgramApiKey = useUserApiKeysStore((s) => s.deepgramApiKey);
  const deepseekApiKey = useUserApiKeysStore((s) => s.deepseekApiKey);
  const keysLoaded = useUserApiKeysStore((s) => s.loaded);
  const saving = useUserApiKeysStore((s) => s.saving);
  const setKeys = useUserApiKeysStore((s) => s.setKeys);
  const setSaving = useUserApiKeysStore((s) => s.setSaving);

  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistKeys = useCallback(
    (next: { deepgramApiKey?: string; deepseekApiKey?: string }) => {
      if (!user) return;

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void (async () => {
          setSaving(true);
          setSaveError(null);
          const current = useUserApiKeysStore.getState();
          const result = await saveUserApiKeys(user.id, {
            deepgramApiKey: next.deepgramApiKey ?? current.deepgramApiKey,
            deepseekApiKey: next.deepseekApiKey ?? current.deepseekApiKey,
          });
          setSaving(false);
          if (!result.ok) {
            setSaveError(result.error ?? "Không lưu được API keys.");
          }
        })();
      }, 600);
    },
    [user, setSaving]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const handleDeepgramChange = (v: string) => {
    setKeys({ deepgramApiKey: v });
    persistKeys({ deepgramApiKey: v });
  };

  const handleDeepseekChange = (v: string) => {
    setKeys({ deepseekApiKey: v });
    persistKeys({ deepseekApiKey: v });
  };

  const { ok, missing } = hasRequiredApiKeys();
  const compact = variant === "compact";
  const showGoogle = settings.translationProvider === "google";
  const translateReady = shouldTranslate(
    settings.sourceLanguage,
    settings.targetLanguage
  );
  const disabled = !user || !keysLoaded;

  if (compact) {
    return (
      <div className="space-y-2">
        <p className="text-[10px] text-slate-500">
          API keys lưu theo tài khoản — đăng ký tại{" "}
          <a
            href="https://console.deepgram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Deepgram
          </a>{" "}
          &{" "}
          <a
            href="https://platform.deepseek.com/api_keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            DeepSeek
          </a>
          .
        </p>

        <div className={`grid gap-2 ${showGoogle ? "sm:grid-cols-2" : ""}`}>
          <ApiKeyInput
            label="Deepgram"
            required
            compact
            disabled={disabled}
            value={deepgramApiKey}
            onChange={handleDeepgramChange}
            placeholder="dg_..."
          />
          <ApiKeyInput
            label="DeepSeek"
            compact
            disabled={disabled}
            value={deepseekApiKey}
            onChange={handleDeepseekChange}
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
          {!keysLoaded ? (
            <span className="text-slate-500">Đang tải keys…</span>
          ) : !ok ? (
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
          {saving && <span className="text-slate-600">· đang lưu…</span>}
          {saveError && <span className="text-live">· {saveError}</span>}
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
            Deepgram & DeepSeek lưu theo tài khoản — tự đăng ký và nhập key của
            bạn. Google Translate (nếu dùng) vẫn lưu trên trình duyệt.
          </p>
        </div>
      </div>

      <ApiKeyInput
        label="Deepgram"
        required
        disabled={disabled}
        value={deepgramApiKey}
        onChange={handleDeepgramChange}
        placeholder="dg_..."
      />
      <ApiKeyInput
        label="DeepSeek"
        disabled={disabled}
        value={deepseekApiKey}
        onChange={handleDeepseekChange}
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
        {!keysLoaded ? (
          <p className="text-slate-500">Đang tải API keys từ tài khoản…</p>
        ) : !ok ? (
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
        {saving && <p className="mt-1 text-slate-600">Đang lưu…</p>}
        {saveError && <p className="mt-1 text-live">{saveError}</p>}
      </div>
    </div>
  );
}

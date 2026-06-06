"use client";

import { useTranscriptStore } from "@/stores/transcript";
import { useSettingsStore } from "@/stores/settings";
import { shouldTranslate } from "@/lib/translation-config";
import { IconMic, IconGlobe } from "@/components/ui/Icons";
import { StatusDot } from "@/components/ui/Panel";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import { ConnectionStatus } from "@/components/ConnectionStatus";

const LANG: Record<string, string> = { en: "EN", vi: "VI" };

export function TranscriptPanel() {
  const { interimText, interimTranslated, isListening } = useTranscriptStore();
  const { sourceLanguage, targetLanguage, translationProvider } =
    useSettingsStore();

  const showTranslation =
    translationProvider !== "none" &&
    shouldTranslate(sourceLanguage, targetLanguage);

  return (
    <div className="glass-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-2.5">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-live/10 text-live">
            <IconMic size={14} />
          </span>
          <StatusDot
            active={isListening}
            label={isListening ? "Live STT" : "Idle"}
          />
        </div>
        <ConnectionStatus />
      </div>

      <div className="border-b border-white/[0.06] px-5 py-1.5">
        <ConfidenceIndicator />
      </div>

      <div className="px-5 py-3">
        <p className="text-sm leading-relaxed">
          <span className="mr-2 text-xs font-semibold uppercase text-slate-500">
            {LANG[sourceLanguage] ?? "SRC"}
          </span>
          {interimText ? (
            <span className="interim-text">{interimText}</span>
          ) : (
            <span className="text-slate-600">
              {isListening
                ? "Đang nghe… (interim — câu hoàn chỉnh sẽ lên panel Q&A)"
                : "Chưa có audio đang nhận dạng"}
            </span>
          )}
        </p>

        {showTranslation && interimText && (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
            <span className="mr-2 inline-flex items-center gap-1 text-xs font-semibold uppercase text-accent/70">
              <IconGlobe size={11} />
              {LANG[targetLanguage] ?? "TGT"}
            </span>
            {interimTranslated || (
              <span className="text-slate-600">—</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

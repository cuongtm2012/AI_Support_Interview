"use client";

import { useEffect, useRef } from "react";
import { useTranscriptStore } from "@/stores/transcript";
import { useSettingsStore } from "@/stores/settings";
import { IconMic, IconGlobe } from "@/components/ui/Icons";
import { StatusDot } from "@/components/ui/Panel";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import { ConnectionStatus } from "@/components/ConnectionStatus";

function textSizeClass(size: string): string {
  if (size === "Small") return "text-size-small";
  if (size === "Medium") return "text-size-medium";
  return "text-size-large";
}

const LANG_LABEL: Record<string, string> = {
  en: "EN",
  vi: "VI",
};

export function TranscriptPanel() {
  const {
    interimText,
    finalText,
    translatedText,
    isListening,
    autoScroll,
    setAutoScroll,
  } = useTranscriptStore();
  const { sourceLanguage, targetLanguage, textSize } = useSettingsStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [interimText, finalText, translatedText, autoScroll]);

  const displayText = interimText || finalText;

  return (
    <div className="glass-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-live/10 text-live">
            <IconMic size={16} />
          </span>
          <StatusDot
            active={isListening}
            label={isListening ? "Listening" : "Microphone idle"}
          />
        </div>
        <div className="flex items-center gap-2">
          <ConnectionStatus />
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500 transition hover:text-slate-400">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-white/20 bg-surface-base accent-accent"
          />
          Auto-scroll
        </label>
        </div>
      </div>

      <div className="border-b border-white/[0.06] px-5 py-2">
        <ConfidenceIndicator />
      </div>

      <div
        ref={scrollRef}
        className={`max-h-44 overflow-y-auto px-5 py-4 ${textSizeClass(textSize)}`}
      >
        <div className="mb-3">
          <span className="label-caps mb-1.5 block">
            {LANG_LABEL[sourceLanguage] || "SRC"} Transcript
          </span>
          {interimText ? (
            <p className="interim-text">{interimText}</p>
          ) : finalText ? (
            <p className="final-text">{finalText}</p>
          ) : (
            <p className="text-slate-600">
              Transcript sẽ hiện khi bạn bắt đầu nghe...
            </p>
          )}
        </div>

        {displayText && (
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
            <span className="label-caps mb-1.5 flex items-center gap-1.5 text-accent">
              <IconGlobe size={12} />
              {LANG_LABEL[targetLanguage] || "TGT"} Translation
            </span>
            <p className="text-slate-200">
              {translatedText || "Đang dịch..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useTranscriptStore } from "@/stores/transcript";
import { useSettingsStore } from "@/stores/settings";

function confidenceColor(value: number, threshold: number): string {
  if (value >= threshold) return "bg-emerald-500";
  if (value >= threshold - 0.15) return "bg-live";
  return "bg-red-400";
}

function confidenceLabel(value: number, threshold: number): string {
  if (value >= threshold) return "Tốt";
  if (value >= threshold - 0.15) return "Trung bình";
  return "Thấp";
}

export function ConfidenceIndicator() {
  const confidence = useTranscriptStore((s) => s.confidence);
  const isListening = useTranscriptStore((s) => s.isListening);
  const threshold = useSettingsStore((s) => s.confidenceThreshold);

  if (!isListening || confidence === null) return null;

  const pct = Math.round(confidence * 100);
  const barColor = confidenceColor(confidence, threshold);

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-surface-base/50 px-3 py-2"
      title="Độ tin cậy nhận dạng giọng nói (Deepgram)"
    >
      <span className="label-caps shrink-0">Mic quality</span>
      <div className="h-2 min-w-[100px] flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs font-medium text-slate-400">
        {pct}% · {confidenceLabel(confidence, threshold)}
      </span>
    </div>
  );
}

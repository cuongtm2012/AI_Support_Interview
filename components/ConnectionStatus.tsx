"use client";

import { useTranscriptStore } from "@/stores/transcript";

export function ConnectionStatus() {
  const { isListening, deepgramStatus, reconnectAttempt } =
    useTranscriptStore();

  if (!isListening) return null;
  if (deepgramStatus === "idle" || deepgramStatus === "connected") {
    return null;
  }

  const isReconnecting = deepgramStatus === "reconnecting";

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isReconnecting
          ? "bg-live/15 text-live"
          : "bg-red-500/15 text-red-300"
      }`}
    >
      {isReconnecting
        ? `Đang kết nối lại STT (${reconnectAttempt}/5)…`
        : deepgramStatus === "error"
          ? "Lỗi STT"
          : "Mất kết nối STT"}
    </span>
  );
}

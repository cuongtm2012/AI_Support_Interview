"use client";

import { useTranscriptStore } from "@/stores/transcript";
import { useInterviewSessionStore } from "@/stores/interview-session";

export type InterviewStatusTone = "idle" | "session" | "listening" | "warning";

export function useInterviewStatus(): { tone: InterviewStatusTone; label: string } {
  const isListening = useTranscriptStore((s) => s.isListening);
  const deepgramStatus = useTranscriptStore((s) => s.deepgramStatus);
  const reconnectAttempt = useTranscriptStore((s) => s.reconnectAttempt);
  const questionCount = useTranscriptStore((s) => s.qnaCards.length);
  const hasSession = useInterviewSessionStore((s) => !!s.dbSessionId);

  if (isListening) {
    if (deepgramStatus === "reconnecting") {
      return {
        tone: "warning",
        label:
          reconnectAttempt > 0
            ? `Reconnecting (${reconnectAttempt})`
            : "Reconnecting",
      };
    }
    if (deepgramStatus === "error") {
      return { tone: "warning", label: "STT error" };
    }
    if (deepgramStatus === "disconnected") {
      return { tone: "warning", label: "Disconnected" };
    }
    if (deepgramStatus === "connected") {
      return { tone: "listening", label: "Listening" };
    }
    return { tone: "listening", label: "Connecting…" };
  }

  if (hasSession || questionCount > 0) {
    return { tone: "session", label: "Session paused" };
  }

  return { tone: "idle", label: "Idle" };
}

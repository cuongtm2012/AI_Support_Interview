"use client";

import { useEffect } from "react";
import { subscribeToSessionQuestions } from "@/lib/supabase/realtime";
import { useInterviewSessionStore } from "@/stores/interview-session";
import { useTranscriptStore } from "@/stores/transcript";
import { isQuestionType } from "@/lib/question-type";
import type { QuestionType } from "@/types";

export function useSessionRealtime() {
  const sessionId = useInterviewSessionStore((s) => s.dbSessionId);

  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribeToSessionQuestions(sessionId, (q) => {
      const { questionHistory, addToHistory } = useTranscriptStore.getState();
      const exists = questionHistory.some(
        (h) =>
          h.original === q.transcript_raw &&
          (h.answer || "") === (q.ai_answer || "")
      );
      if (exists) return;

      const rawType = q.question_type ?? "";
      const qType: QuestionType = isQuestionType(rawType)
        ? rawType
        : "behavioral";

      addToHistory({
        original: q.transcript_raw,
        translated: q.transcript_vi ?? "",
        answer: q.ai_answer ?? "",
        questionType: qType,
        timestamp: new Date(q.created_at).getTime(),
      });
    });

    return () => unsubscribe?.();
  }, [sessionId]);
}

"use client";

import { useEffect, useRef } from "react";
import { useTranscriptStore } from "@/stores/transcript";
import { QnaCardView } from "@/components/QnaCard";
import { Panel } from "@/components/ui/Panel";
import { IconSparkles } from "@/components/ui/Icons";

export function QnaMainPanel() {
  const qnaCards = useTranscriptStore((s) => s.qnaCards);
  const highlightCardId = useTranscriptStore((s) => s.highlightCardId);
  const autoScroll = useTranscriptStore((s) => s.autoScroll);
  const clearHighlight = useTranscriptStore((s) => s.clearHighlight);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const lastCardAnswer = qnaCards[qnaCards.length - 1]?.answer;

  useEffect(() => {
    if (!autoScroll) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [qnaCards.length, autoScroll, lastCardAnswer]);

  useEffect(() => {
    if (!highlightCardId) return;
    const el = document.getElementById(`qna-card-${highlightCardId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightCardId]);

  return (
    <Panel
      title="Q&A"
      icon={<IconSparkles size={16} />}
      badge={
        qnaCards.length > 0 ? (
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-500">
            {qnaCards.length} câu
          </span>
        ) : undefined
      }
      bodyClassName="min-h-0 overflow-hidden"
      className="h-full"
    >
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4"
      >
        {qnaCards.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <IconSparkles size={28} />
            </div>
            <p className="max-w-md text-slate-400">
              Câu hỏi và gợi ý trả lời sẽ xuất hiện ở đây sau khi STT nhận
              dạng xong một câu
            </p>
            <p className="mt-2 text-xs text-slate-600">
              Ngôn ngữ gốc hiện trước · dịch và AI cập nhật trong từng thẻ
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {qnaCards.map((card, i) => (
              <QnaCardView
                key={card.id}
                card={card}
                index={i}
                highlighted={highlightCardId === card.id}
                onHighlightEnd={clearHighlight}
              />
            ))}
            <div ref={bottomRef} aria-hidden />
          </div>
        )}
      </div>
    </Panel>
  );
}

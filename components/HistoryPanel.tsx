"use client";

import { useTranscriptStore } from "@/stores/transcript";
import { QuestionTypeBadge } from "@/components/QuestionTypeBadge";
import { IconHistory } from "@/components/ui/Icons";

export function HistoryPanel() {
  const qnaCards = useTranscriptStore((s) => s.qnaCards);
  const scrollToCard = useTranscriptStore((s) => s.scrollToCard);

  if (qnaCards.length === 0) return null;

  const items = [...qnaCards].reverse();

  return (
    <div className="glass-panel flex min-h-0 flex-1 flex-col p-4">
      <div className="mb-3 flex shrink-0 items-center gap-2">
        <IconHistory size={14} className="text-slate-500" />
        <h3 className="label-caps">Lịch sử</h3>
        <span className="text-[10px] text-slate-600">({qnaCards.length})</span>
      </div>
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {items.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => scrollToCard(item.id)}
              className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-xs text-slate-400 transition duration-200 hover:bg-white/5 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="mb-1 flex items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-600">
                  Q{qnaCards.length - i}
                </span>
                {item.questionType && (
                  <QuestionTypeBadge type={item.questionType} />
                )}
              </span>
              <span className="line-clamp-2">{item.original}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useTranscriptStore } from "@/stores/transcript";
import { useAnswerStore } from "@/stores/answer";
import { QuestionTypeBadge } from "@/components/QuestionTypeBadge";
import { IconHistory } from "@/components/ui/Icons";

export function HistoryPanel() {
  const history = useTranscriptStore((s) => s.questionHistory);
  const { setQuestion, setAnswer, setQuestionType } = useAnswerStore();

  if (history.length === 0) return null;

  return (
    <div className="glass-panel p-4">
      <div className="mb-3 flex items-center gap-2">
        <IconHistory size={14} className="text-slate-500" />
        <h3 className="label-caps">Lịch sử câu hỏi</h3>
      </div>
      <ul className="max-h-36 space-y-1 overflow-y-auto">
        {history.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => {
                setQuestion(item.original);
                setAnswer(item.answer);
                setQuestionType(item.questionType);
              }}
              className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-xs text-slate-400 transition duration-200 hover:bg-white/5 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="mb-1 block">
                <QuestionTypeBadge type={item.questionType} />
              </span>
              <span className="line-clamp-2">{item.original}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

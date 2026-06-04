"use client";

import { useAnswerStore } from "@/stores/answer";
import { useSettingsStore } from "@/stores/settings";
import { regenerateAnswer } from "@/lib/pipeline";
import { QuestionTypeBadge } from "@/components/QuestionTypeBadge";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import {
  IconSparkles,
  IconCopy,
  IconRefresh,
  IconVolume,
} from "@/components/ui/Icons";

function textSizeClass(size: string): string {
  if (size === "Small") return "text-size-small";
  if (size === "Medium") return "text-size-medium";
  return "text-size-large";
}

export function AnswerPanel() {
  const { question, answer, questionType, isClassifying, isGenerating, error } =
    useAnswerStore();
  const textSize = useSettingsStore((s) => s.textSize);

  const handleCopy = async () => {
    if (!answer) return;
    await navigator.clipboard.writeText(answer);
  };

  const handleSpeak = () => {
    if (!answer || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(answer);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Panel
      title="AI Suggested Answer"
      icon={<IconSparkles size={16} />}
      badge={
        <span className="ml-1 flex items-center gap-2">
          {questionType && !isClassifying && (
            <QuestionTypeBadge type={questionType} />
          )}
          {isClassifying && (
            <span className="label-caps text-slate-500">Classifying…</span>
          )}
          {isGenerating && (
            <span className="label-caps text-accent">Generating</span>
          )}
        </span>
      }
      bodyClassName="overflow-hidden"
    >
      <div
        className={`flex-1 overflow-y-auto px-5 py-4 ${textSizeClass(textSize)}`}
      >
        {question ? (
          <div className="mb-5 rounded-xl border border-white/[0.06] bg-surface-base/50 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className="label-caps">Question</p>
              {questionType && <QuestionTypeBadge type={questionType} />}
            </div>
            <p className="text-slate-300">{question}</p>
          </div>
        ) : (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <IconSparkles size={28} />
            </div>
            <p className="max-w-sm text-slate-400">
              Câu trả lời AI sẽ xuất hiện khi interviewer nói xong một câu hỏi
            </p>
            <p className="mt-2 text-xs text-slate-600">
              Bấm Start Listening và đợi final transcript
            </p>
          </div>
        )}

        {(isClassifying || isGenerating) && !answer && question && (
          <div className="space-y-2" aria-live="polite">
            <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
          </div>
        )}

        {answer && (
          <div className="font-serif whitespace-pre-wrap leading-relaxed text-slate-100">
            {answer}
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-white/[0.06] p-4">
        <Button
          variant="primary"
          icon={<IconCopy size={16} />}
          onClick={() => void handleCopy()}
          disabled={!answer}
        >
          Copy
        </Button>
        <Button
          id="regenerate-btn"
          variant="secondary"
          icon={<IconRefresh size={16} />}
          onClick={() => void regenerateAnswer()}
          disabled={!question || isGenerating || isClassifying}
        >
          Regenerate
        </Button>
        <Button
          variant="secondary"
          icon={<IconVolume size={16} />}
          onClick={handleSpeak}
          disabled={!answer}
        >
          Speak
        </Button>
      </div>
    </Panel>
  );
}

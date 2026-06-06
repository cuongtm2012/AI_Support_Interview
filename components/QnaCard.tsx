"use client";

import { useSettingsStore } from "@/stores/settings";
import { shouldTranslate } from "@/lib/translation-config";
import { regenerateAnswer } from "@/lib/pipeline";
import { QuestionTypeBadge } from "@/components/QuestionTypeBadge";
import { Button } from "@/components/ui/Button";
import { IconCopy, IconGlobe, IconRefresh, IconVolume } from "@/components/ui/Icons";
import { formatCardTime } from "@/lib/qna-utils";
import type { QnaCard } from "@/types";

const LANG: Record<string, string> = { en: "EN", vi: "VI" };

function textSizeClass(size: string): string {
  if (size === "Small") return "text-size-small";
  if (size === "Medium") return "text-size-medium";
  return "text-size-large";
}

interface QnaCardProps {
  card: QnaCard;
  index: number;
  highlighted?: boolean;
  onHighlightEnd?: () => void;
}

export function QnaCardView({
  card,
  index,
  highlighted,
  onHighlightEnd,
}: QnaCardProps) {
  const { sourceLanguage, targetLanguage, textSize, translationProvider } =
    useSettingsStore();
  const showTranslation =
    translationProvider !== "none" &&
    shouldTranslate(sourceLanguage, targetLanguage);

  const handleCopy = async () => {
    if (!card.answer) return;
    await navigator.clipboard.writeText(card.answer);
  };

  const handleSpeak = () => {
    if (!card.answer || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(card.answer);
    utterance.lang = targetLanguage === "vi" ? "vi-VN" : "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const isLoading =
    card.status === "translating" ||
    card.status === "classifying" ||
    card.status === "generating";

  return (
    <article
      id={`qna-card-${card.id}`}
      className={`rounded-xl border bg-surface-base/40 p-4 transition duration-300 ${
        highlighted
          ? "border-accent/50 ring-2 ring-accent/30"
          : "border-white/[0.08]"
      }`}
      onAnimationEnd={highlighted ? onHighlightEnd : undefined}
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            Q{index + 1}
          </span>
          {card.questionType && (
            <QuestionTypeBadge type={card.questionType} />
          )}
          {card.status === "classifying" && (
            <span className="text-xs text-slate-500">Classifying…</span>
          )}
          {card.status === "generating" && (
            <span className="text-xs text-accent">Generating…</span>
          )}
        </div>
        <time className="text-xs tabular-nums text-slate-600">
          {formatCardTime(card.timestamp)}
        </time>
      </header>

      <div className={textSizeClass(textSize)}>
        <p className="font-medium leading-relaxed text-slate-100">
          <span className="mr-2 text-xs font-semibold uppercase text-slate-500">
            {LANG[sourceLanguage]}
          </span>
          {card.original}
        </p>

        {showTranslation && (
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            <span className="mr-2 inline-flex items-center gap-1 text-xs font-semibold uppercase text-accent/80">
              <IconGlobe size={11} />
              {LANG[targetLanguage]}
            </span>
            {card.translated ?? (
              <span className="text-slate-600">
                {card.status === "translating" ? "Đang dịch…" : "—"}
              </span>
            )}
          </p>
        )}
      </div>

      {(card.answer || isLoading) && (
        <div
          className={`mt-4 border-t border-white/[0.06] pt-4 ${textSizeClass(textSize)}`}
        >
          <p className="label-caps mb-2 text-accent">Gợi ý trả lời</p>
          {isLoading && !card.answer && (
            <div className="space-y-2" aria-live="polite">
              <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
            </div>
          )}
          {card.answer && (
            <p className="font-serif whitespace-pre-wrap leading-relaxed text-slate-100">
              {card.answer}
            </p>
          )}
        </div>
      )}

      {card.error && (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {card.error}
        </p>
      )}

      {card.answer && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="primary"
            icon={<IconCopy size={14} />}
            onClick={() => void handleCopy()}
          >
            Copy
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<IconRefresh size={14} />}
            onClick={() => void regenerateAnswer(card.id)}
            disabled={isLoading}
          >
            Regen
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<IconVolume size={14} />}
            onClick={handleSpeak}
          >
            Speak
          </Button>
        </div>
      )}
    </article>
  );
}

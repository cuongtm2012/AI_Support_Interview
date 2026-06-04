"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranscriptStore } from "@/stores/transcript";
import { useSettingsStore } from "@/stores/settings";
import { useRecapStore } from "@/stores/recap";
import { QuestionTypeBadge } from "@/components/QuestionTypeBadge";
import { Button } from "@/components/ui/Button";
import { IconCopy, IconSparkles } from "@/components/ui/Icons";
import {
  buildSessionExportPayload,
  downloadSessionJson,
  downloadSessionTxt,
  formatRecapCopyAll,
} from "@/lib/session-export";

export function RecapScreen() {
  const showRecap = useRecapStore((s) => s.showRecap);
  const meta = useRecapStore((s) => s.meta);
  const history = useTranscriptStore((s) => s.questionHistory);
  const { sourceLanguage, targetLanguage, answerStyle } = useSettingsStore();
  const [copied, setCopied] = useState(false);

  if (!showRecap || !meta) return null;

  const ordered = [...history].reverse();
  const exportMeta = {
    sourceLang: sourceLanguage,
    targetLang: targetLanguage,
    style: answerStyle,
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(
      formatRecapCopyAll(history, exportMeta)
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const payload = buildSessionExportPayload(history, {
      startedAt: meta.startedAt,
      endedAt: meta.endedAt,
      sourceLang: meta.sourceLang,
      targetLang: meta.targetLang,
      answerStyle: meta.answerStyle,
    });
    downloadSessionJson(payload);
  };

  const handleDownloadTxt = () => {
    downloadSessionTxt(history, exportMeta);
  };

  const handleNewInterview = () => {
    useTranscriptStore.getState().clearSession();
    useRecapStore.getState().closeRecap();
  };

  const durationMin = Math.max(
    1,
    Math.round((meta.endedAt - meta.startedAt) / 60000)
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface-base">
      <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <IconSparkles size={22} />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">
              Buổi phỏng vấn đã kết thúc
            </h1>
            <p className="text-sm text-slate-500">
              {new Date(meta.startedAt).toLocaleString("vi-VN")} · ~{durationMin}{" "}
              phút
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void handleCopyAll()}>
            <IconCopy size={16} />
            {copied ? "Đã copy!" : "Copy All"}
          </Button>
          <Button variant="secondary" onClick={handleDownloadTxt}>
            Download TXT
          </Button>
          <Button variant="primary" onClick={handleDownloadJson}>
            Download JSON
          </Button>
        </div>
      </header>

      <div className="shrink-0 border-b border-white/[0.06] bg-accent/5 px-6 py-4">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-6 text-sm">
          <div>
            <p className="label-caps text-slate-500">Câu hỏi</p>
            <p className="text-2xl font-bold text-accent">{meta.questionCount}</p>
          </div>
          <div>
            <p className="label-caps text-slate-500">Ngôn ngữ</p>
            <p className="text-slate-300">
              {meta.sourceLang.toUpperCase()} → {meta.targetLang.toUpperCase()}
            </p>
          </div>
          <div>
            <p className="label-caps text-slate-500">Style</p>
            <p className="text-slate-300">{meta.answerStyle}</p>
          </div>
        </div>
      </div>

      <main className="mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-y-auto p-6">
        {ordered.length === 0 ? (
          <p className="text-center text-slate-500">
            Không có câu hỏi nào được ghi nhận trong buổi này.
          </p>
        ) : (
          <ul className="space-y-4">
            {ordered.map((item, i) => (
              <li key={item.id} className="glass-panel p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="label-caps">Q{i + 1}</span>
                  <QuestionTypeBadge type={item.questionType} />
                </div>
                <p className="text-slate-200">{item.original}</p>
                {item.translated && item.translated !== item.original && (
                  <p className="mt-2 rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-slate-400">
                    {item.translated}
                  </p>
                )}
                {item.answer && (
                  <div className="mt-4 border-t border-white/[0.06] pt-4">
                    <p className="label-caps mb-2 text-accent">AI Answer</p>
                    <p className="font-serif whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                      {item.answer}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="flex shrink-0 justify-center gap-3 border-t border-white/[0.06] p-4">
        <Button variant="primary" onClick={handleNewInterview}>
          Phỏng vấn mới
        </Button>
        <Link href="/sessions">
          <Button variant="secondary">Xem Sessions</Button>
        </Link>
      </footer>
    </div>
  );
}

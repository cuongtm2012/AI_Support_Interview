"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  fetchSessionWithQuestions,
  formatSessionExport,
} from "@/lib/supabase/sessions";
import type { SessionWithQuestions } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { QuestionTypeBadge } from "@/components/QuestionTypeBadge";
import { IconCopy, IconHistory } from "@/components/ui/Icons";
import { isQuestionType } from "@/lib/question-type";
import type { QuestionType } from "@/types";
import { AuthButton } from "@/components/AuthButton";

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [session, setSession] = useState<SessionWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || !sessionId) {
      setLoading(false);
      return;
    }
    void fetchSessionWithQuestions(sessionId).then((data) => {
      setSession(data);
      setLoading(false);
    });
  }, [user, sessionId]);

  const handleExport = async () => {
    if (!session) return;
    await navigator.clipboard.writeText(formatSessionExport(session));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-white/[0.06] bg-surface-elevated/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/sessions"
            className="text-sm text-slate-500 transition hover:text-accent"
          >
            ← Sessions
          </Link>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <IconHistory size={20} className="text-accent" />
            Chi tiết buổi phỏng vấn
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {session && (
            <Button
              variant="secondary"
              icon={<IconCopy size={16} />}
              onClick={() => void handleExport()}
              className="!py-1.5 !text-xs"
            >
              {copied ? "Đã copy!" : "Export all"}
            </Button>
          )}
          <AuthButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-6">
        {authLoading || loading ? (
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
          </div>
        ) : !user ? (
          <div className="glass-panel p-6 text-center text-slate-500">
            <Link href="/sessions" className="text-accent hover:underline">
              Đăng nhập để xem
            </Link>
          </div>
        ) : !session ? (
          <div className="glass-panel p-6 text-center text-slate-500">
            Không tìm thấy session
          </div>
        ) : (
          <>
            <div className="glass-panel p-5">
              <p className="label-caps mb-2">Thông tin</p>
              <p className="text-slate-300">
                {new Date(session.started_at).toLocaleString("vi-VN")}
                {session.ended_at &&
                  ` — ${new Date(session.ended_at).toLocaleString("vi-VN")}`}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {session.source_lang.toUpperCase()} →{" "}
                {session.target_lang.toUpperCase()} · {session.answer_style}
              </p>
              {session.profile_text && (
                <p className="mt-3 text-xs text-slate-600 line-clamp-2">
                  Profile: {session.profile_text}
                </p>
              )}
            </div>

            {session.questions.length === 0 ? (
              <p className="text-center text-slate-500">Chưa có câu hỏi nào</p>
            ) : (
              session.questions.map((q, i) => (
                <article key={q.id} className="glass-panel p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <p className="label-caps">Câu hỏi {i + 1}</p>
                    {isQuestionType(q.question_type ?? "") && (
                      <QuestionTypeBadge type={q.question_type as QuestionType} />
                    )}
                  </div>
                  <p className="text-slate-200">{q.transcript_raw}</p>
                  {q.transcript_vi && (
                    <p className="mt-2 rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-slate-300">
                      {q.transcript_vi}
                    </p>
                  )}
                  {q.ai_answer && (
                    <div className="mt-4 border-t border-white/[0.06] pt-4">
                      <p className="label-caps mb-2 text-accent">AI Answer</p>
                      <p className="font-serif whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                        {q.ai_answer}
                      </p>
                    </div>
                  )}
                </article>
              ))
            )}
          </>
        )}
      </main>
    </div>
  );
}

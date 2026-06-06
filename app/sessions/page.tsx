"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchUserSessions } from "@/lib/supabase/sessions";
import type { InterviewSession } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { IconHistory, IconSparkles } from "@/components/ui/Icons";
import { AuthButton } from "@/components/AuthButton";

export default function SessionsPage() {
  const { user, loading, configured, signInWithGoogle } = useAuth();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    void fetchUserSessions().then((data) => {
      setSessions(data);
      setFetching(false);
    });
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-white/[0.06] bg-surface-elevated/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-slate-500 transition hover:text-accent"
          >
            ← Interview
          </Link>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <IconHistory size={20} className="text-accent" />
            Session History
          </h1>
        </div>
        <AuthButton />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 p-6">
        {!configured && (
          <div className="glass-panel p-6 text-center text-slate-400">
            <p>Supabase chưa được cấu hình.</p>
            <p className="mt-2 text-sm">
              Thêm <code className="text-accent">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
              và{" "}
              <code className="text-accent">
                NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
              </code>{" "}
              vào file env.
            </p>
            <Link href="/" className="mt-4 inline-block text-accent hover:underline">
              Về trang chính
            </Link>
          </div>
        )}

        {configured && loading && (
          <p className="text-center text-slate-500">Đang tải...</p>
        )}

        {configured && !loading && !user && (
          <div className="glass-panel flex flex-col items-center gap-4 p-8 text-center">
            <IconSparkles size={32} className="text-accent" />
            <p className="text-slate-300">
              Đăng nhập Google để xem lịch sử các buổi phỏng vấn đã lưu
            </p>
            <Button variant="primary" onClick={() => void signInWithGoogle()}>
              Đăng nhập Google
            </Button>
          </div>
        )}

        {configured && user && (
          <>
            {fetching ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-2xl bg-white/5"
                  />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="glass-panel p-8 text-center text-slate-500">
                <p>Chưa có buổi phỏng vấn nào được lưu.</p>
                <Link
                  href="/"
                  className="mt-4 inline-block text-accent hover:underline"
                >
                  Bắt đầu phỏng vấn
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/sessions/${s.id}`}
                      className="glass-panel block cursor-pointer p-4 transition duration-200 hover:border-accent/30 hover:bg-white/[0.02]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-200">
                            {new Date(s.started_at).toLocaleString("vi-VN")}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {s.source_lang.toUpperCase()} →{" "}
                            {s.target_lang.toUpperCase()} · {s.answer_style}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            s.status === "active"
                              ? "bg-live/15 text-live"
                              : "bg-white/5 text-slate-500"
                          }`}
                        >
                          {s.status === "active" ? "Active" : "Ended"}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}

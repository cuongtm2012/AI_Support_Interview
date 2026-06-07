"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { IconAlert } from "@/components/ui/Icons";

type AuthTab = "signin" | "signup";

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, configured } = useAuth();
  const [tab, setTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("auth") === "error") {
      setAuthError(
        "Đăng nhập thất bại. Kiểm tra cấu hình Supabase Auth và thử lại."
      );
      window.history.replaceState({}, "", "/login");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  const switchTab = (next: AuthTab) => {
    setTab(next);
    setAuthError(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Đang tải…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-y-auto px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 ring-1 ring-accent/25">
          <span className="text-base font-bold text-accent">IC</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">
          Interview Copilot
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Đăng nhập để lưu lịch sử phỏng vấn
        </p>
      </div>

      <div className="glass-panel w-full max-w-sm p-8">
        {!configured ? (
          <div className="space-y-3 text-center text-sm text-slate-400">
            <p>Supabase chưa được cấu hình.</p>
            <p>
              Thêm{" "}
              <code className="rounded bg-white/5 px-1 text-xs text-slate-300">
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              và{" "}
              <code className="rounded bg-white/5 px-1 text-xs text-slate-300">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              vào <strong className="text-slate-300">.env.local</strong>.
            </p>
          </div>
        ) : (
          <>
            {authError && (
              <div className="mb-4 flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5">
                <IconAlert size={16} className="mt-0.5 shrink-0 text-red-400" />
                <p className="auth-error-message text-sm text-red-200">
                  {authError}
                </p>
              </div>
            )}

            <div className="mb-6 flex rounded-xl bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => switchTab("signin")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  tab === "signin"
                    ? "bg-accent/15 text-accent ring-1 ring-accent/25"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchTab("signup")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  tab === "signup"
                    ? "bg-accent/15 text-accent ring-1 ring-accent/25"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Sign Up
              </button>
            </div>

            {tab === "signin" ? (
              <SignInForm email={email} onEmailChange={setEmail} />
            ) : (
              <SignUpForm email={email} onEmailChange={setEmail} />
            )}
          </>
        )}
      </div>

      <footer className="mt-8 text-center text-xs text-slate-600">
        <span>Terms of Service</span>
        <span className="mx-2">·</span>
        <span>Privacy</span>
      </footer>
    </div>
  );
}

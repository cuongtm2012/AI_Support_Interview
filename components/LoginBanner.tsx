"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useHydrated } from "@/hooks/useHydrated";
import { Button } from "@/components/ui/Button";
import { IconAlert, IconKey } from "@/components/ui/Icons";

export function LoginBanner() {
  const hydrated = useHydrated();
  const { user, loading, configured, signInWithGoogle } = useAuth();

  if (!hydrated || loading || user) return null;

  if (!configured) {
    return (
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.08] bg-surface-base/80 px-6 py-2.5">
        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-400">
          <IconKey size={16} className="shrink-0 text-slate-500" />
          <span>
            Cloud login chưa bật — thêm{" "}
            <code className="rounded bg-white/5 px-1 text-xs text-slate-300">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            và{" "}
            <code className="rounded bg-white/5 px-1 text-xs text-slate-300">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            vào <strong className="text-slate-300">.env.local</strong> (xem{" "}
            <code className="text-xs">docs/SUPABASE.md</code>).
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-accent/20 bg-accent/5 px-6 py-2.5">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <IconAlert size={16} className="shrink-0 text-accent" />
        <span>
          Đăng nhập Google để lưu lịch sử phỏng vấn lên cloud (Supabase)
        </span>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          variant="primary"
          onClick={() => void signInWithGoogle()}
          className="!py-1.5 !text-xs"
        >
          Đăng nhập Google
        </Button>
        <Link
          href="/sessions"
          className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
        >
          Sessions
        </Link>
      </div>
    </div>
  );
}

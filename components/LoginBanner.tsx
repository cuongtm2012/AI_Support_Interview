"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useHydrated } from "@/hooks/useHydrated";
import { Button } from "@/components/ui/Button";
import { IconAlert } from "@/components/ui/Icons";

export function LoginBanner() {
  const hydrated = useHydrated();
  const { user, loading, configured, signInWithGoogle } = useAuth();

  if (!hydrated || !configured || loading || user) return null;

  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-accent/20 bg-accent/5 px-6 py-2.5">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <IconAlert size={16} className="shrink-0 text-accent" />
        <span>
          Đăng nhập để lưu lịch sử phỏng vấn lên cloud (Supabase)
        </span>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          variant="primary"
          onClick={() => void signInWithGoogle()}
          className="!py-1.5 !text-xs"
        >
          Google Login
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

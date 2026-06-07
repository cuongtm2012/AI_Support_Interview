"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useHydrated } from "@/hooks/useHydrated";
import { Button } from "@/components/ui/Button";

export function AuthButton() {
  const hydrated = useHydrated();
  const { user, loading, configured, signOut } = useAuth();

  if (!hydrated) {
    return (
      <span className="inline-block w-20 text-xs text-slate-500">Đang tải...</span>
    );
  }

  if (!configured) {
    return (
      <Button
        variant="secondary"
        disabled
        title="Thêm NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY vào .env.local"
        className="!py-1.5 !text-xs opacity-60"
      >
        Đăng nhập
      </Button>
    );
  }

  if (loading) {
    return (
      <span className="inline-block w-20 text-xs text-slate-500">Đang tải...</span>
    );
  }

  if (user) {
    const label =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Account";

    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-[120px] truncate text-xs text-slate-500 sm:inline">
          {label}
        </span>
        <Button variant="ghost" onClick={() => void signOut()} className="!py-1.5 !text-xs">
          Đăng xuất
        </Button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-accent/30 bg-white/5 px-3 py-1.5 text-xs font-medium text-accent transition duration-200 hover:bg-white/10"
    >
      Đăng nhập
    </Link>
  );
}

"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";

export function AuthButton() {
  const { user, loading, configured, signInWithGoogle, signOut } = useAuth();

  if (!configured) return null;

  if (loading) {
    return (
      <span className="text-xs text-slate-500">Đang tải...</span>
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
    <Button
      variant="secondary"
      onClick={() => void signInWithGoogle()}
      className="!py-1.5 !text-xs"
    >
      Đăng nhập Google
    </Button>
  );
}

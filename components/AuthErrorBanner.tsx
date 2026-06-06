"use client";

import { useEffect, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import Link from "next/link";
import { IconAlert } from "@/components/ui/Icons";

export function AuthErrorBanner() {
  const hydrated = useHydrated();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "error") {
      setShow(true);
      params.delete("auth");
      const path =
        window.location.pathname +
        (params.toString() ? `?${params}` : "");
      window.history.replaceState({}, "", path);
    }
  }, []);

  if (!hydrated || !show) return null;

  return (
    <div
      className="flex shrink-0 items-start justify-between gap-4 border-b border-red-500/30 bg-red-500/10 px-6 py-3"
      role="alert"
    >
      <div className="flex gap-2 text-sm text-red-200">
        <IconAlert size={18} className="mt-0.5 shrink-0 text-red-400" />
        <div>
          <p className="font-medium">Đăng nhập thất bại</p>
          <p className="mt-1 text-red-200/80">
            Kiểm tra Google provider và Redirect URLs trong Supabase. Xem{" "}
            <Link
              href="https://supabase.com/dashboard/project/oogmcxyofaextlfqcnbo/auth/url-configuration"
              className="underline hover:text-red-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              URL Configuration
            </Link>
            .
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setShow(false)}
        className="shrink-0 text-xs text-red-300 hover:text-red-100"
      >
        Đóng
      </button>
    </div>
  );
}

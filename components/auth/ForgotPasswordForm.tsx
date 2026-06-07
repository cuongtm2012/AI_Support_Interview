"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { isValidEmail, normalizeEmail } from "@/lib/auth-validation";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/ui/Icons";

export function ForgotPasswordForm() {
  const { resetPassword, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setFieldError("Email không hợp lệ.");
      return;
    }
    setFieldError(null);

    setSubmitting(true);
    const result = await resetPassword(normalized);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSentMessage(
      result.message ?? "Kiểm tra email để nhận hướng dẫn đặt lại mật khẩu."
    );
  };

  if (!configured) {
    return (
      <p className="text-center text-sm text-slate-400">
        Supabase chưa được cấu hình. Vui lòng kiểm tra biến môi trường.
      </p>
    );
  }

  if (sentMessage) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <IconCheck size={24} className="mx-auto text-emerald-400" />
          <p className="auth-success-message mt-3 text-sm">{sentMessage}</p>
        </div>
        <Link
          href="/login"
          className="inline-block text-xs text-accent hover:underline"
        >
          ← Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <p className="text-sm text-slate-400">
        Nhập email đã đăng ký — chúng tôi sẽ gửi link đặt lại mật khẩu.
      </p>

      <div>
        <label htmlFor="forgot-email" className="label-caps mb-1.5 block">
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`input-field ${fieldError ? "auth-input-error" : ""}`}
          placeholder="you@example.com"
          disabled={submitting}
        />
        {fieldError && (
          <p className="auth-error-message mt-1.5">{fieldError}</p>
        )}
      </div>

      {error && <p className="auth-error-message">{error}</p>}

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={submitting}
      >
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <span className="auth-loading-spinner" />
            Đang gửi…
          </span>
        ) : (
          "Gửi link reset"
        )}
      </Button>

      <p className="text-center">
        <Link
          href="/login"
          className="text-xs text-slate-500 transition hover:text-accent"
        >
          ← Quay lại đăng nhập
        </Link>
      </p>
    </form>
  );
}

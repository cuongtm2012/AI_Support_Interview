"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { validateSignUpPassword } from "@/lib/auth-validation";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/ui/Icons";

export function ResetPasswordForm() {
  const router = useRouter();
  const { updatePassword, configured, loading, user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && configured && !user) {
      setError(
        "Link reset không hợp lệ hoặc đã hết hạn. Yêu cầu link mới từ trang quên mật khẩu."
      );
    }
  }, [loading, configured, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nextErrors: typeof fieldErrors = {};
    const passwordError = validateSignUpPassword(password);
    if (passwordError) {
      nextErrors.password = passwordError;
    }
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1200);
  };

  if (!configured) {
    return (
      <p className="text-center text-sm text-slate-400">
        Supabase chưa được cấu hình. Vui lòng kiểm tra biến môi trường.
      </p>
    );
  }

  if (loading) {
    return <p className="text-center text-sm text-slate-500">Đang tải…</p>;
  }

  if (done) {
    return (
      <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
        <IconCheck size={24} className="mx-auto text-emerald-400" />
        <p className="auth-success-message text-sm">
          Mật khẩu đã được cập nhật. Đang chuyển về app…
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4 text-center">
        <p className="auth-error-message text-sm">{error}</p>
        <Link
          href="/auth/forgot-password"
          className="inline-block text-xs text-accent hover:underline"
        >
          Yêu cầu link reset mới
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <p className="text-sm text-slate-400">Nhập mật khẩu mới cho tài khoản của bạn.</p>

      <div>
        <label htmlFor="reset-password" className="label-caps mb-1.5 block">
          New Password
        </label>
        <input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`input-field ${fieldErrors.password ? "auth-input-error" : ""}`}
          placeholder="Ít nhất 8 ký tự"
          disabled={submitting}
        />
        {fieldErrors.password && (
          <p className="auth-error-message mt-1.5">{fieldErrors.password}</p>
        )}
      </div>

      <div>
        <label htmlFor="reset-confirm" className="label-caps mb-1.5 block">
          Confirm Password
        </label>
        <input
          id="reset-confirm"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`input-field ${fieldErrors.confirmPassword ? "auth-input-error" : ""}`}
          placeholder="Nhập lại mật khẩu"
          disabled={submitting}
        />
        {fieldErrors.confirmPassword && (
          <p className="auth-error-message mt-1.5">
            {fieldErrors.confirmPassword}
          </p>
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
            Đang lưu…
          </span>
        ) : (
          "Cập nhật mật khẩu"
        )}
      </Button>
    </form>
  );
}

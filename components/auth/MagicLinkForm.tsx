"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { isValidEmail, normalizeEmail } from "@/lib/auth-validation";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/ui/Icons";

interface MagicLinkFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onBack: () => void;
}

export function MagicLinkForm({
  email,
  onEmailChange,
  onBack,
}: MagicLinkFormProps) {
  const { signInWithMagicLink } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSentMessage(null);

    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setFieldError("Email không hợp lệ.");
      return;
    }
    setFieldError(null);

    setSubmitting(true);
    const result = await signInWithMagicLink(normalized);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSentMessage(result.message ?? "Kiểm tra email để nhận magic link đăng nhập.");
  };

  if (sentMessage) {
    return (
      <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
        <IconCheck size={24} className="mx-auto text-emerald-400" />
        <p className="auth-success-message text-sm">{sentMessage}</p>
        <Button variant="ghost" size="sm" onClick={onBack} className="w-full">
          Quay lại đăng nhập
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <label htmlFor="magic-email" className="label-caps mb-1.5 block">
          Email
        </label>
        <input
          id="magic-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
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
          "Gửi Magic Link"
        )}
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-xs text-slate-500 transition hover:text-slate-300"
      >
        ← Quay lại đăng nhập bằng mật khẩu
      </button>
    </form>
  );
}

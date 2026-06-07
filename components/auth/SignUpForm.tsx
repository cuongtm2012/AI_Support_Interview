"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getPasswordStrength,
  isValidEmail,
  normalizeEmail,
  PASSWORD_STRENGTH_LABELS,
  validateSignUpPassword,
} from "@/lib/auth-validation";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/ui/Icons";

interface SignUpFormProps {
  email: string;
  onEmailChange: (email: string) => void;
}

export function SignUpForm({ email, onEmailChange }: SignUpFormProps) {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const strength = password ? getPasswordStrength(password) : null;
  const strengthColors = {
    weak: "bg-red-500/70",
    fair: "bg-amber-400/70",
    good: "bg-emerald-400/70",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const nextErrors: typeof fieldErrors = {};
    const normalized = normalizeEmail(email);

    if (!isValidEmail(normalized)) {
      nextErrors.email = "Email không hợp lệ.";
    }

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
    const result = await signUp(normalized, password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.message) {
      setSuccessMessage(result.message);
      return;
    }

    router.replace("/");
    router.refresh();
  };

  if (successMessage) {
    return (
      <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
        <IconCheck size={24} className="mx-auto text-emerald-400" />
        <p className="auth-success-message text-sm">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <label htmlFor="signup-email" className="label-caps mb-1.5 block">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className={`input-field ${fieldErrors.email ? "auth-input-error" : ""}`}
          placeholder="you@example.com"
          disabled={submitting}
        />
        {fieldErrors.email && (
          <p className="auth-error-message mt-1.5">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="signup-password" className="label-caps mb-1.5 block">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`input-field ${fieldErrors.password ? "auth-input-error" : ""}`}
          placeholder="Ít nhất 8 ký tự"
          disabled={submitting}
        />
        {strength && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {(["weak", "fair", "good"] as const).map((level, i) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full ${
                    (strength === "good" && i <= 2) ||
                    (strength === "fair" && i <= 1) ||
                    (strength === "weak" && i === 0)
                      ? strengthColors[strength]
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Độ mạnh: {PASSWORD_STRENGTH_LABELS[strength]}
            </p>
          </div>
        )}
        {fieldErrors.password && (
          <p className="auth-error-message mt-1.5">{fieldErrors.password}</p>
        )}
      </div>

      <div>
        <label htmlFor="signup-confirm" className="label-caps mb-1.5 block">
          Confirm Password
        </label>
        <input
          id="signup-confirm"
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
            Đang tạo tài khoản…
          </span>
        ) : (
          "Create Account"
        )}
      </Button>

      <AuthDivider />

      <Button
        type="button"
        variant="secondary"
        onClick={() => void signInWithGoogle()}
        disabled={submitting}
        className="w-full"
      >
        Google
      </Button>
    </form>
  );
}

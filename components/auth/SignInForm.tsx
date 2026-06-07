"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { isValidEmail, normalizeEmail } from "@/lib/auth-validation";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { Button } from "@/components/ui/Button";

interface SignInFormProps {
  email: string;
  onEmailChange: (email: string) => void;
}

export function SignInForm({ email, onEmailChange }: SignInFormProps) {
  const router = useRouter();
  const { signInWithPassword, signInWithGoogle } = useAuth();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [magicLinkMode, setMagicLinkMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nextErrors: typeof fieldErrors = {};
    const normalized = normalizeEmail(email);

    if (!isValidEmail(normalized)) {
      nextErrors.email = "Email không hợp lệ.";
    }
    if (!password) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    const result = await signInWithPassword(normalized, password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.replace("/");
    router.refresh();
  };

  if (magicLinkMode) {
    return (
      <MagicLinkForm
        email={email}
        onEmailChange={onEmailChange}
        onBack={() => setMagicLinkMode(false)}
      />
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <label htmlFor="signin-email" className="label-caps mb-1.5 block">
          Email
        </label>
        <input
          id="signin-email"
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
        <label htmlFor="signin-password" className="label-caps mb-1.5 block">
          Password
        </label>
        <input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`input-field ${fieldErrors.password ? "auth-input-error" : ""}`}
          placeholder="••••••••"
          disabled={submitting}
        />
        {fieldErrors.password && (
          <p className="auth-error-message mt-1.5">{fieldErrors.password}</p>
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
            Đang đăng nhập…
          </span>
        ) : (
          "Sign In"
        )}
      </Button>

      <AuthDivider />

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void signInWithGoogle()}
          disabled={submitting}
          className="w-full"
        >
          Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setMagicLinkMode(true)}
          disabled={submitting}
          className="w-full"
        >
          Magic Link
        </Button>
      </div>

      <p className="text-center">
        <Link
          href="/auth/forgot-password"
          className="text-xs text-slate-500 transition hover:text-accent"
        >
          Forgot password?
        </Link>
      </p>
    </form>
  );
}

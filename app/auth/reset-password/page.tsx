import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-y-auto px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 ring-1 ring-accent/25">
          <span className="text-base font-bold text-accent">IC</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-100">Đặt lại mật khẩu</h1>
      </div>

      <div className="glass-panel w-full max-w-sm p-8">
        <ResetPasswordForm />
      </div>

      <p className="mt-6 text-center">
        <Link
          href="/login"
          className="text-xs text-slate-500 transition hover:text-accent"
        >
          ← Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}

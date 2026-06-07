import { Suspense } from "react";
import { LoginPage } from "@/components/LoginPage";

export default function LoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-slate-500">Đang tải…</p>
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}

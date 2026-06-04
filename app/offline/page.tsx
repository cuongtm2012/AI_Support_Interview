import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-base p-6 text-center">
      <h1 className="text-xl font-semibold text-slate-100">Bạn đang offline</h1>
      <p className="max-w-sm text-slate-500">
        Interview Copilot cần kết nối mạng cho STT, dịch và AI. Kiểm tra Wi‑Fi rồi
        thử lại.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-surface-base"
      >
        Về trang chính
      </Link>
    </div>
  );
}

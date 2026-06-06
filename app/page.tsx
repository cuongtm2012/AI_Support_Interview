"use client";

import dynamic from "next/dynamic";

const InterviewPage = dynamic(
  () =>
    import("@/components/InterviewPage").then((m) => ({
      default: m.InterviewPage,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-surface-base text-sm text-slate-500">
        Đang tải Interview Copilot…
      </div>
    ),
  }
);

export default function Home() {
  return <InterviewPage />;
}

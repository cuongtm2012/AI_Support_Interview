"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PiPZone } from "@/components/PiPZone";
import { QnaMainPanel } from "@/components/QnaMainPanel";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { MicControl } from "@/components/MicControl";
import { SettingsModal } from "@/components/SettingsModal";
import { HistoryPanel } from "@/components/HistoryPanel";
import { ApiKeyBanner } from "@/components/ApiKeyBanner";
import { ProfilePresetBanner } from "@/components/ProfilePresetBanner";
import { MicFallbackBanner } from "@/components/MicFallbackBanner";
import { AuthButton } from "@/components/AuthButton";
import { useAuth } from "@/components/providers/AuthProvider";
import { IconSettings, IconHistory } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/Panel";
import { useInterviewStatus } from "@/hooks/useInterviewStatus";
import { useSessionRealtime } from "@/hooks/useSessionRealtime";
import { useMeetingStreamStore } from "@/stores/meeting-stream";
import { ExportTranscriptButton } from "@/components/ExportTranscriptButton";
import { InstallPwa } from "@/components/InstallPwa";
import { RecapScreen } from "@/components/RecapScreen";
import { PanelErrorBoundary } from "@/components/PanelErrorBoundary";

export function InterviewPage() {
  const router = useRouter();
  const { user, loading, configured } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<
    "keys" | "interview" | "profile" | "display"
  >("keys");
  const interviewStatus = useInterviewStatus();
  const hasMeeting = useMeetingStreamStore((s) => !!s.stream);

  const openSettings = (tab?: "keys" | "interview" | "profile" | "display") => {
    if (tab) setSettingsTab(tab);
    setSettingsOpen(true);
  };

  useSessionRealtime();

  useEffect(() => {
    if (configured && !loading && !user) {
      router.replace("/login");
    }
  }, [configured, loading, user, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        document.getElementById("mic-toggle")?.click();
      }
      if (e.key === "r" || e.key === "R") {
        void import("@/lib/pipeline").then(({ regenerateAnswer }) =>
          regenerateAnswer()
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      void import("@/lib/pipeline").then(({ stopListening }) => stopListening());
    };
  }, []);

  if (configured && (loading || !user)) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-slate-500">
        Đang tải Interview Copilot…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-surface-elevated/80 px-6 py-3.5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/25">
            <span className="text-sm font-bold text-accent">IC</span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-100">
              Interview Copilot
            </h1>
            <p className="text-xs text-slate-500">
              STT real-time · Q&A unified · Dịch & AI tùy chọn
            </p>
          </div>
          <StatusDot
            tone={interviewStatus.tone}
            label={interviewStatus.label}
          />
        </div>
        <div className="flex items-center gap-2">
          <InstallPwa />
          <Link
            href="/sessions"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-400 transition duration-200 hover:bg-white/5 hover:text-slate-200"
          >
            <IconHistory size={16} />
            <span className="hidden sm:inline">Sessions</span>
          </Link>
          <AuthButton />
          <Button
            variant="ghost"
            icon={<IconSettings size={16} />}
            onClick={() => openSettings()}
            className="!px-3"
            aria-label="Open settings"
          >
            Settings
          </Button>
        </div>
      </header>

      <ApiKeyBanner onOpenSettings={() => openSettings("keys")} />
      <ProfilePresetBanner onOpenSettings={() => openSettings("profile")} />
      <MicFallbackBanner />

      <main className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:flex-row">
        <aside
          className={`flex min-h-0 w-full shrink-0 flex-col gap-3 lg:w-[min(300px,26vw)] ${
            hasMeeting ? "" : "lg:max-w-xs"
          }`}
        >
          <PanelErrorBoundary label="Meeting">
            <PiPZone compact={!hasMeeting} />
          </PanelErrorBoundary>
          <PanelErrorBoundary label="History">
            <HistoryPanel />
          </PanelErrorBoundary>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <PanelErrorBoundary label="Q&A">
            <QnaMainPanel />
          </PanelErrorBoundary>
        </div>
      </main>

      <footer className="shrink-0 space-y-2 border-t border-white/[0.06] bg-surface-elevated/60 p-4 backdrop-blur-xl">
        <PanelErrorBoundary label="Transcript">
          <TranscriptPanel />
        </PanelErrorBoundary>
        <div className="flex flex-wrap items-center gap-3">
          <MicControl />
          <ExportTranscriptButton />
        </div>
      </footer>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={settingsTab}
      />

      <RecapScreen />
    </div>
  );
}

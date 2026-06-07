"use client";

import { useSettingsStore } from "@/stores/settings";
import { presetReadiness } from "@/lib/interview-preset-utils";
import { useHydrated } from "@/hooks/useHydrated";
import { IconAlert } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

interface ProfilePresetBannerProps {
  onOpenSettings: () => void;
}

export function ProfilePresetBanner({ onOpenSettings }: ProfilePresetBannerProps) {
  const hydrated = useHydrated();
  const active = useSettingsStore((s) =>
    s.interviewPresets.find((p) => p.id === s.activePresetId)
  );

  if (!hydrated || !active) return null;

  const { ok, missing } = presetReadiness(active);
  if (ok) return null;

  const labels =
    missing.length === 2
      ? "Profile và Job description"
      : missing[0] === "profile"
        ? "Profile"
        : "Job description";

  return (
    <div
      className="flex shrink-0 items-center justify-between gap-4 border-b border-amber-500/25 bg-amber-500/10 px-6 py-2.5"
      role="alert"
    >
      <div className="flex min-w-0 items-center gap-2 text-sm text-amber-100/90">
        <IconAlert size={18} className="shrink-0 text-amber-400" />
        <span>
          Bộ <strong className="text-white">{active.name}</strong> thiếu{" "}
          <strong className="text-white">{labels}</strong> — AI answer sẽ kém
          chính xác.
        </span>
      </div>
      <Button
        variant="secondary"
        onClick={onOpenSettings}
        className="shrink-0 !py-1.5 !text-xs"
      >
        Mở Profile
      </Button>
    </div>
  );
}

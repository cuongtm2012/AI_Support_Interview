"use client";

import { useSettingsStore } from "@/stores/settings";
import { presetReadiness, formatPresetMissingLabels } from "@/lib/interview-preset-utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { useHydrated } from "@/hooks/useHydrated";
import { IconAlert } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

interface ProfilePresetBannerProps {
  onOpenSettings: () => void;
}

export function ProfilePresetBanner({ onOpenSettings }: ProfilePresetBannerProps) {
  const hydrated = useHydrated();
  const { user, loading } = useAuth();
  const active = useSettingsStore((s) =>
    s.interviewPresets.find((p) => p.id === s.activePresetId)
  );

  if (!hydrated || loading || !user) return null;

  if (!active) {
    return (
      <div
        className="flex shrink-0 items-center justify-between gap-4 border-b border-live/25 bg-live/10 px-6 py-2.5"
        role="alert"
      >
        <div className="flex min-w-0 items-center gap-2 text-sm text-red-100/90">
          <IconAlert size={18} className="shrink-0 text-live" />
          <span>
            Chưa chọn bộ Profile + JD —{" "}
            <strong className="text-white">không thể Start Listening</strong>.
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

  const { ok, missing } = presetReadiness(active);
  if (ok) return null;

  const labels = formatPresetMissingLabels(missing);

  return (
    <div
      className="flex shrink-0 items-center justify-between gap-4 border-b border-amber-500/25 bg-amber-500/10 px-6 py-2.5"
      role="alert"
    >
      <div className="flex min-w-0 items-center gap-2 text-sm text-amber-100/90">
        <IconAlert size={18} className="shrink-0 text-amber-400" />
        <span>
          Bộ <strong className="text-white">{active.name}</strong> thiếu{" "}
          <strong className="text-white">{labels}</strong> —{" "}
          <strong className="text-white">không thể Start Listening</strong>.
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

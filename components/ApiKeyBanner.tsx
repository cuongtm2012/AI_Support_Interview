"use client";

import { hasRequiredApiKeys } from "@/lib/api-keys";
import { IconAlert } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

interface ApiKeyBannerProps {
  onOpenSettings: () => void;
}

export function ApiKeyBanner({ onOpenSettings }: ApiKeyBannerProps) {
  const { ok, missing } = hasRequiredApiKeys();
  if (ok) return null;

  return (
    <div
      className="flex shrink-0 items-center justify-between gap-4 border-b border-live/30 bg-live/10 px-6 py-2.5"
      role="alert"
    >
      <div className="flex items-center gap-2 text-sm text-amber-100/90">
        <IconAlert size={18} className="shrink-0 text-live" />
        <span>
          Cần nhập API key:{" "}
          <strong className="font-semibold text-white">
            {missing.join(", ")}
          </strong>
        </span>
      </div>
      <Button variant="secondary" onClick={onOpenSettings} className="!py-1.5 !text-xs">
        Mở Settings
      </Button>
    </div>
  );
}

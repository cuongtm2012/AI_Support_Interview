"use client";

import { useTranscriptStore } from "@/stores/transcript";
import { hasMeetingAudio, useMeetingStreamStore } from "@/stores/meeting-stream";
import { IconAlert } from "@/components/ui/Icons";

/** Shown while listening on mic because tab capture has no Share tab audio (SPEC §4). */
export function MicFallbackBanner() {
  const isListening = useTranscriptStore((s) => s.isListening);
  const meetingStream = useMeetingStreamStore((s) => s.stream);

  if (!isListening || !meetingStream || hasMeetingAudio(meetingStream)) {
    return null;
  }

  return (
    <div
      className="flex shrink-0 items-center gap-2 border-b border-amber-500/20 bg-amber-500/8 px-6 py-2 text-sm text-amber-100/90"
      role="status"
    >
      <IconAlert size={16} className="shrink-0 text-amber-400" />
      <span>
        Đang dùng mic. Để nghe audio tab: chọn lại tab cuộc gọi và bật{" "}
        <strong className="text-white">Share tab audio</strong>.
      </span>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { IconVideo } from "@/components/ui/Icons";
import {
  formatMeetingSurface,
  getMeetingCaptureInfo,
  hasShareableAudio,
  isMeetingCaptureSupported,
  pickMeetingDisplay,
  stopMeetingStream,
  type MeetingCaptureInfo,
} from "@/lib/meeting-capture";
import { useMeetingStreamStore } from "@/stores/meeting-stream";

export function PiPZone({ compact = false }: { compact?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [info, setInfo] = useState<MeetingCaptureInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipSupported, setPipSupported] = useState(false);
  const supported = isMeetingCaptureSupported();

  useEffect(() => {
    setPipSupported(
      typeof document !== "undefined" && !!document.pictureInPictureEnabled
    );
  }, []);

  const attachStream = useCallback((media: MediaStream) => {
    setStream(media);
    setInfo(getMeetingCaptureInfo(media));
    useMeetingStreamStore.getState().setStream(media);

    if (!hasShareableAudio(media)) {
      setError(
        "Chưa có audio tab. Chọn lại tab YouTube/Meet và bật «Share tab audio»."
      );
    } else {
      setError(null);
    }

    const clearAll = () => {
      setStream(null);
      setInfo(null);
      useMeetingStreamStore.getState().setStream(null);
    };
    for (const track of media.getTracks()) {
      track.onended = clearAll;
    }
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) {
      void el.play().catch(() => {});
    }
  }, [stream]);

  useEffect(() => {
    return () => stopMeetingStream(stream);
  }, [stream]);

  const selectSource = async () => {
    setError(null);
    setLoading(true);
    stopMeetingStream(stream);
    setStream(null);
    setInfo(null);

    try {
      const media = await pickMeetingDisplay();
      attachStream(media);
    } catch (e) {
      if (e instanceof DOMException && e.name === "NotAllowedError") {
        setError("Đã hủy chọn nguồn hoặc bị từ chối quyền chia sẻ.");
      } else {
        setError(
          e instanceof Error ? e.message : "Không thể lấy nguồn cuộc gọi"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const stopCapture = () => {
    stopMeetingStream(stream);
    setStream(null);
    setInfo(null);
    setError(null);
    useMeetingStreamStore.getState().setStream(null);
  };

  const openNativePiP = async () => {
    const el = videoRef.current;
    if (!el || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement !== el) {
        await el.requestPictureInPicture();
      }
    } catch {
      setError("Không mở được Picture-in-Picture trên video này.");
    }
  };

  const hasPreview = !!stream;

  return (
    <Panel
      title="Meeting"
      icon={<IconVideo size={16} />}
      className={`border-dashed !border-white/[0.12] !bg-surface-card/40 ${
        compact && !hasPreview ? "!min-h-0 shrink-0" : ""
      }`}
      bodyClassName={compact && !hasPreview ? "" : "flex-1 min-h-0"}
      actions={
        hasPreview ? (
          <div className="flex gap-1">
            {pipSupported && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void openNativePiP()}
              >
                PiP
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void selectSource()}
              disabled={loading}
            >
              Đổi
            </Button>
          </div>
        ) : undefined
      }
    >
      {hasPreview ? (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <video
            ref={videoRef}
            className="h-full min-h-[180px] w-full flex-1 bg-black object-contain"
            playsInline
            muted
            autoPlay
          />
          {info && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
              <p className="truncate text-xs font-medium text-slate-200">
                {info.label}
              </p>
              <p className="text-[10px] text-slate-400">
                {formatMeetingSurface(info.surface)}
                {hasShareableAudio(stream) ? " · Audio ✓" : " · Audio ✗"}
              </p>
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-2 top-2 !bg-black/50 !text-slate-300 hover:!bg-black/70"
            onClick={stopCapture}
          >
            ✕
          </Button>
        </div>
      ) : compact ? (
        <button
          type="button"
          onClick={() => void selectSource()}
          disabled={loading || !supported}
          className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03] disabled:opacity-60"
        >
          <IconVideo size={18} className="shrink-0 text-slate-500" />
          <span className="text-xs text-slate-400">
            {loading ? "Đang chọn tab…" : "Chọn tab Meet/YouTube + Share tab audio"}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void selectSource()}
          disabled={loading || !supported}
          className="flex min-h-[200px] flex-1 cursor-pointer flex-col items-center justify-center gap-4 p-5 text-center transition hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-surface-base/80 ring-1 ring-accent/20">
            <IconVideo
              size={32}
              className={loading ? "animate-pulse text-accent" : "text-slate-500"}
            />
          </div>
          <div className="max-w-[260px]">
            <p className="text-sm font-medium text-slate-200">
              {loading
                ? "Đang mở bộ chọn nguồn…"
                : "Chọn tab hoặc cửa sổ cuộc gọi"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Bấm vào đây → chọn tab YouTube/Meet và{" "}
              <span className="text-accent">bật «Share tab audio»</span>
            </p>
          </div>
          <ol className="w-full max-w-[260px] space-y-2 text-left text-xs text-slate-500">
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] font-semibold text-accent">
                1
              </span>
              Mở Meet / Teams / Zoom trên tab hoặc app
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] font-semibold text-accent">
                2
              </span>
              Tick «Share tab audio» khi Chrome hỏi
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] font-semibold text-accent">
                3
              </span>
              Start Listening → STT lấy audio từ tab (không chỉ mic)
            </li>
          </ol>
        </button>
      )}

      {error && (
        <p className="border-t border-white/[0.06] px-4 py-2 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      {!supported && !hasPreview && (
        <p className="border-t border-white/[0.06] px-4 py-2 text-xs text-amber-400/90">
          Cần Chrome/Edge để chọn tab. Hoặc dùng PiP thủ công trên player Meet/Zoom.
        </p>
      )}
    </Panel>
  );
}

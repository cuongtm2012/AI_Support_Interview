export type MeetingCaptureSurface = "browser" | "window" | "monitor" | "unknown";

export interface MeetingCaptureInfo {
  label: string;
  surface: MeetingCaptureSurface;
}

function parseSurface(
  settings: MediaTrackSettings
): MeetingCaptureSurface {
  const s = settings.displaySurface;
  if (s === "browser" || s === "window" || s === "monitor") return s;
  return "unknown";
}

export function getMeetingCaptureInfo(
  stream: MediaStream
): MeetingCaptureInfo {
  const track = stream.getVideoTracks()[0];
  if (!track) {
    return { label: "Nguồn video", surface: "unknown" };
  }
  return {
    label: track.label?.trim() || "Nguồn đã chọn",
    surface: parseSurface(track.getSettings()),
  };
}

export function formatMeetingSurface(surface: MeetingCaptureSurface): string {
  switch (surface) {
    case "browser":
      return "Tab trình duyệt";
    case "window":
      return "Cửa sổ ứng dụng";
    case "monitor":
      return "Toàn màn hình";
    default:
      return "Nguồn chia sẻ";
  }
}

export function isMeetingCaptureSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getDisplayMedia
  );
}

/** Opens the OS/browser picker to share a tab, window, or screen. */
export async function pickMeetingDisplay(): Promise<MediaStream> {
  if (!isMeetingCaptureSupported()) {
    throw new Error(
      "Trình duyệt không hỗ trợ chọn tab/cửa sổ. Dùng Chrome hoặc Edge."
    );
  }

  return navigator.mediaDevices.getDisplayMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 15, max: 30 },
    },
    audio: true,
  });
}

export function hasShareableAudio(stream: MediaStream | null): boolean {
  return (
    !!stream &&
    stream.getAudioTracks().some((t) => t.readyState === "live")
  );
}

export function stopMeetingStream(stream: MediaStream | null): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

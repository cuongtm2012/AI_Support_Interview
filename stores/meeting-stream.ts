import { create } from "zustand";

interface MeetingStreamStore {
  stream: MediaStream | null;
  setStream: (stream: MediaStream | null) => void;
}

export const useMeetingStreamStore = create<MeetingStreamStore>((set) => ({
  stream: null,
  setStream: (stream) => set({ stream }),
}));

export function hasMeetingAudio(stream: MediaStream | null): boolean {
  return (
    !!stream &&
    stream.getAudioTracks().some((t) => t.readyState === "live" && !t.muted)
  );
}

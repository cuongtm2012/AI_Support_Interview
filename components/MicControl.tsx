"use client";

import { useEffect, useState } from "react";
import { useTranscriptStore } from "@/stores/transcript";
import { useSettingsStore } from "@/stores/settings";
import { listAudioDevices, requestMicPermission } from "@/lib/audio";
import { hasRequiredApiKeys } from "@/lib/api-keys";
import { startListening, stopListening, endSession } from "@/lib/pipeline";
import { useInterviewSessionStore } from "@/stores/interview-session";
import { Button } from "@/components/ui/Button";
import { IconMic, IconStop } from "@/components/ui/Icons";

export function MicControl() {
  const isListening = useTranscriptStore((s) => s.isListening);
  const questionCount = useTranscriptStore((s) => s.qnaCards.length);
  const hasSession = useInterviewSessionStore((s) => !!s.dbSessionId);
  const { micDeviceId, profileText, setSettings } = useSettingsStore();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        await requestMicPermission();
        const list = await listAudioDevices();
        setDevices(list);
      } catch {
        setError("Cần quyền truy cập microphone");
      }
    })();
  }, []);

  const handleEndSession = async () => {
    setError(null);
    setLoading(true);
    try {
      await endSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể kết thúc session");
    } finally {
      setLoading(false);
    }
  };

  const toggleListening = async () => {
    setError(null);
    if (isListening) {
      stopListening();
      return;
    }

    const { ok, missing } = hasRequiredApiKeys();
    if (!ok) {
      setError(`Thiếu API key: ${missing.join(", ")} — mở Settings`);
      return;
    }

    setLoading(true);
    try {
      await startListening();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể bắt đầu nghe");
      stopListening();
    } finally {
      setLoading(false);
    }
  };

  const profileLabel = profileText
    ? profileText.slice(0, 48).replace(/\n/g, " ") + (profileText.length > 48 ? "…" : "")
    : "Chưa có profile";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        id="mic-toggle"
        variant={isListening ? "danger" : "primary"}
        icon={isListening ? <IconStop size={16} /> : <IconMic size={16} />}
        onClick={() => void toggleListening()}
        disabled={loading}
        className="!px-6 !py-3"
      >
        {loading
          ? "Đang kết nối..."
          : isListening
            ? "Stop Listening"
            : "Start Listening"}
      </Button>

      {(isListening || hasSession || questionCount > 0) && (
        <Button
          variant="secondary"
          onClick={() => void handleEndSession()}
          disabled={loading}
          className="!border-accent/40 !text-accent"
        >
          End Session
        </Button>
      )}

      <select
        value={micDeviceId}
        onChange={(e) => setSettings({ micDeviceId: e.target.value })}
        disabled={isListening}
        className="select-field max-w-xs"
        aria-label="Chọn microphone"
      >
        <option value="">Mic mặc định</option>
        {devices.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || `Mic ${d.deviceId.slice(0, 8)}`}
          </option>
        ))}
      </select>

      <div className="hidden h-8 w-px bg-white/10 sm:block" aria-hidden />

      <p className="text-sm text-slate-500">
        <span className="text-slate-600">Profile: </span>
        <span className="text-slate-400">{profileLabel}</span>
      </p>

      {error && (
        <p className="w-full text-sm text-red-400 sm:w-auto" role="alert">
          {error}
        </p>
      )}

      <p className="hidden text-xs text-slate-600 lg:block">
        <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono">
          Space
        </kbd>{" "}
        toggle ·{" "}
        <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono">
          R
        </kbd>{" "}
        regenerate
      </p>
    </div>
  );
}

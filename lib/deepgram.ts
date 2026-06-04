import type { LanguageCode } from "@/types";
import { apiKeyHeaders, getDeepgramApiKey } from "@/lib/api-keys";

export interface DeepgramCallbacks {
  onInterim: (text: string, confidence: number) => void;
  onFinal: (text: string, confidence: number) => void;
  onError: (error: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onReconnecting?: (attempt: number) => void;
  onReconnected?: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_MS = 1000;

export class DeepgramClient {
  private ws: WebSocket | null = null;
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;
  private language: LanguageCode = "en";
  private callbacks: DeepgramCallbacks | null = null;
  private intentionalClose = false;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private hasConnectedOnce = false;

  async connect(
    language: LanguageCode,
    callbacks: DeepgramCallbacks
  ): Promise<void> {
    this.language = language;
    this.callbacks = callbacks;
    this.intentionalClose = false;
    this.reconnectAttempts = 0;
    await this.openSocket();
  }

  private async openSocket(): Promise<void> {
    const callbacks = this.callbacks;
    if (!callbacks) return;

    const apiKey = getDeepgramApiKey();
    if (!apiKey) {
      throw new Error(
        "Deepgram API key chưa được cấu hình (Settings → API Keys)"
      );
    }

    const res = await fetch("/api/deepgram-token", {
      headers: apiKeyHeaders(apiKey),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        (err as { error?: string }).error || "Failed to get Deepgram token"
      );
    }
    const { token } = (await res.json()) as { token: string };

    const lang = this.language === "en" ? "en" : "vi";
    const params = new URLSearchParams({
      model: "nova-3",
      language: lang,
      punctuate: "true",
      interim_results: "true",
      endpointing: "300",
      smart_format: "true",
      encoding: "linear16",
      sample_rate: "16000",
      channels: "1",
    });

    const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
    this.ws = new WebSocket(url, ["token", token]);

    this.ws.onopen = () => {
      if (this.hasConnectedOnce) {
        callbacks.onReconnected?.();
      } else {
        this.hasConnectedOnce = true;
        callbacks.onOpen?.();
      }
      this.reconnectAttempts = 0;
      this.keepAliveInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: "KeepAlive" }));
        }
      }, 10000);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as {
          channel?: {
            alternatives?: Array<{
              transcript?: string;
              confidence?: number;
            }>;
          };
          is_final?: boolean;
          speech_final?: boolean;
        };

        const alt = data.channel?.alternatives?.[0];
        const transcript = alt?.transcript?.trim() || "";
        const confidence = alt?.confidence ?? 0;
        if (!transcript) return;

        if (data.is_final || data.speech_final) {
          callbacks.onFinal(transcript, confidence);
        } else {
          callbacks.onInterim(transcript, confidence);
        }
      } catch {
        callbacks.onError("Failed to parse Deepgram response");
      }
    };

    this.ws.onerror = () => {
      if (!this.intentionalClose) {
        callbacks.onError("Deepgram WebSocket error");
      }
    };

    this.ws.onclose = () => {
      this.clearKeepAlive();
      if (this.intentionalClose) {
        callbacks.onClose?.();
        return;
      }
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose || !this.callbacks) return;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.callbacks.onError(
        "Mất kết nối Deepgram. Bấm Stop rồi Start Listening lại."
      );
      this.callbacks.onClose?.();
      return;
    }

    this.reconnectAttempts += 1;
    const delay = BASE_RECONNECT_MS * Math.pow(2, this.reconnectAttempts - 1);
    this.callbacks.onReconnecting?.(this.reconnectAttempts);

    this.reconnectTimeout = setTimeout(() => {
      void this.openSocket().catch((e) => {
        this.callbacks?.onError(
          e instanceof Error ? e.message : "Reconnect failed"
        );
      });
    }, delay);
  }

  sendAudio(chunk: ArrayBufferLike): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(chunk);
    }
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.clearKeepAlive();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "CloseStream" }));
      this.ws.close();
    }
    this.ws = null;
    this.callbacks = null;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private clearKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }
}

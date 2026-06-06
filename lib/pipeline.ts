import { DeepgramClient } from "@/lib/deepgram";
import {
  createAudioCapture,
  createAudioCaptureFromStream,
  type AudioCaptureHandle,
} from "@/lib/audio";
import {
  hasMeetingAudio,
  useMeetingStreamStore,
} from "@/stores/meeting-stream";
import { translateText } from "@/lib/translate";
import { classifyQuestion } from "@/lib/classify";
import { generateAnswerStreaming } from "@/lib/ai-answer";
import { shouldTranslate } from "@/lib/translation-config";
import { hasDeepseekApiKey } from "@/lib/api-keys";
import {
  createInterviewSession,
  endInterviewSession,
  saveQuestionToSession,
} from "@/lib/supabase/sessions";
import { useSettingsStore } from "@/stores/settings";
import { useTranscriptStore } from "@/stores/transcript";
import { useInterviewSessionStore } from "@/stores/interview-session";
import { useRecapStore } from "@/stores/recap";

let deepgramClient: DeepgramClient | null = null;
let audioCapture: AudioCaptureHandle | null = null;
let answerAbort: AbortController | null = null;
let lastFinalHash = "";

function hashText(text: string): string {
  return text.trim().toLowerCase();
}

function stopAudioOnly(): void {
  audioCapture?.stop();
  audioCapture = null;
  deepgramClient?.disconnect();
  deepgramClient = null;
  answerAbort?.abort();
  answerAbort = null;
  useTranscriptStore.getState().setListening(false);
  useTranscriptStore.getState().setDeepgramStatus("idle");
}

async function translateForCard(
  cardId: string,
  text: string,
  key: string
): Promise<string | null> {
  const settings = useSettingsStore.getState();
  const store = useTranscriptStore.getState();

  if (!shouldTranslate(settings.sourceLanguage, settings.targetLanguage)) {
    return null;
  }

  const cached = store.getCachedTranslation(key);
  if (cached) {
    store.updateQnaCard(cardId, { translated: cached });
    return cached;
  }

  store.updateQnaCard(cardId, { status: "translating" });

  try {
    const translated = await translateText(
      text,
      settings.sourceLanguage,
      settings.targetLanguage
    );
    store.setCachedTranslation(key, translated);
    store.updateQnaCard(cardId, { translated });
    return translated;
  } catch {
    store.updateQnaCard(cardId, { translated: null });
    return null;
  }
}

async function processQnaCard(
  cardId: string,
  text: string,
  confidence: number
): Promise<void> {
  const settings = useSettingsStore.getState();
  const store = useTranscriptStore.getState();
  const key = hashText(text);

  if (store.hasTranscript(key)) return;
  store.markTranscript(key);

  const translatedPromise = translateForCard(cardId, text, key);

  if (confidence < settings.confidenceThreshold || !hasDeepseekApiKey()) {
    const translated = await translatedPromise;
    store.updateQnaCard(cardId, { status: "complete" });

    const sessionId = useInterviewSessionStore.getState().dbSessionId;
    if (sessionId) {
      void saveQuestionToSession({
        sessionId,
        transcriptRaw: text,
        transcriptTranslated: translated ?? "",
        aiAnswer: "",
        questionType: "behavioral",
        answerLanguage: settings.answerLanguage,
        targetLanguage: settings.targetLanguage,
      });
    }
    return;
  }

  answerAbort?.abort();
  answerAbort = new AbortController();

  store.updateQnaCard(cardId, {
    status: "classifying",
    answer: null,
    error: null,
  });

  let questionType = (await classifyQuestion(text)).type;
  store.updateQnaCard(cardId, { questionType, status: "generating", answer: "" });

  try {
    await generateAnswerStreaming({
      question: text,
      questionType,
      profileText: settings.profileText,
      jdText: settings.jdText,
      answerStyle: settings.answerStyle,
      answerLanguage: settings.answerLanguage,
      targetLanguage: settings.targetLanguage,
      signal: answerAbort.signal,
      onChunk: (chunk) =>
        useTranscriptStore.getState().appendQnaAnswer(cardId, chunk),
    });

    const translated = await translatedPromise;
    const finalCard = useTranscriptStore
      .getState()
      .qnaCards.find((c) => c.id === cardId);

    store.updateQnaCard(cardId, { status: "complete" });

    const sessionId = useInterviewSessionStore.getState().dbSessionId;
    if (sessionId && finalCard) {
      void saveQuestionToSession({
        sessionId,
        transcriptRaw: text,
        transcriptTranslated: translated ?? "",
        aiAnswer: finalCard.answer ?? "",
        questionType,
        answerLanguage: settings.answerLanguage,
        targetLanguage: settings.targetLanguage,
      });
    }
  } catch (e) {
    if ((e as Error).name !== "AbortError") {
      store.updateQnaCard(cardId, {
        status: "error",
        error:
          e instanceof Error ? e.message : "Answer generation failed",
      });
    }
  }
}

async function onFinalTranscript(text: string, confidence: number) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const key = hashText(trimmed);
  if (key === lastFinalHash) return;
  lastFinalHash = key;

  const cardId = useTranscriptStore.getState().addQnaCard({
    original: trimmed,
    confidence,
  });

  void processQnaCard(cardId, trimmed, confidence);
}

async function connectDeepgram(): Promise<void> {
  const settings = useSettingsStore.getState();

  deepgramClient = new DeepgramClient();
  await deepgramClient.connect(settings.sourceLanguage, {
    onInterim: (text, confidence) => {
      if (!text.trim()) return;
      useTranscriptStore.getState().setInterim(text, confidence);
    },
    onFinal: (text, confidence) => {
      void onFinalTranscript(text, confidence);
    },
    onError: (err) => {
      useTranscriptStore.getState().setDeepgramStatus("error");
      console.error("[Deepgram]", err);
    },
    onOpen: () => {
      useTranscriptStore.getState().setDeepgramStatus("connected");
    },
    onReconnecting: (attempt) => {
      useTranscriptStore
        .getState()
        .setDeepgramStatus("reconnecting", attempt);
    },
    onReconnected: () => {
      useTranscriptStore.getState().setDeepgramStatus("connected");
    },
    onClose: () => {
      if (useTranscriptStore.getState().isListening) {
        useTranscriptStore.getState().setDeepgramStatus("disconnected");
      }
    },
  });
}

async function startAudioCapture(): Promise<void> {
  const settings = useSettingsStore.getState();
  const meetingStream = useMeetingStreamStore.getState().stream;
  const useTabAudio = hasMeetingAudio(meetingStream);

  if (!useTabAudio) {
    await navigator.mediaDevices.getUserMedia({ audio: true });
  }

  if (useTabAudio && meetingStream) {
    audioCapture = createAudioCaptureFromStream(meetingStream, (chunk) =>
      deepgramClient?.sendAudio(chunk)
    );
  } else {
    audioCapture = createAudioCapture(
      settings.micDeviceId || undefined,
      (chunk) => deepgramClient?.sendAudio(chunk)
    );
  }
  await audioCapture.start();
}

export async function startListening(): Promise<void> {
  const settings = useSettingsStore.getState();
  const existingSessionId = useInterviewSessionStore.getState().dbSessionId;
  const isResume = !!existingSessionId;

  useRecapStore.getState().closeRecap();
  useTranscriptStore.getState().clearCurrent();
  useTranscriptStore.getState().setListening(true);
  useTranscriptStore.getState().setDeepgramStatus("idle");

  if (!isResume) {
    useTranscriptStore.getState().clearSession();
    lastFinalHash = "";
    useRecapStore.getState().setSessionStartedAt(Date.now());
  }

  try {
    const meetingStream = useMeetingStreamStore.getState().stream;
    if (!hasMeetingAudio(meetingStream) && meetingStream) {
      console.warn(
        "[pipeline] Meeting stream without tab audio — falling back to mic"
      );
    }

    await connectDeepgram();
    await startAudioCapture();

    if (!isResume) {
      const sessionId = await createInterviewSession({
        sourceLang: settings.sourceLanguage,
        targetLang: settings.targetLanguage,
        answerStyle: settings.answerStyle,
        profileText: settings.profileText,
        jdText: settings.jdText,
      });
      useInterviewSessionStore.getState().setDbSessionId(sessionId);
    }
  } catch (e) {
    stopAudioOnly();
    throw e;
  }
}

export function stopListening(): void {
  stopAudioOnly();
}

export async function endSession(): Promise<void> {
  const settings = useSettingsStore.getState();
  const transcript = useTranscriptStore.getState();
  const recap = useRecapStore.getState();

  stopAudioOnly();

  const sessionId = useInterviewSessionStore.getState().dbSessionId;
  if (sessionId) {
    await endInterviewSession(sessionId);
    useInterviewSessionStore.getState().setDbSessionId(null);
  }

  const endedAt = Date.now();
  recap.openRecap({
    startedAt: recap.sessionStartedAt ?? endedAt,
    endedAt,
    sourceLang: settings.sourceLanguage,
    targetLang: settings.targetLanguage,
    answerStyle: settings.answerStyle,
    questionCount: transcript.qnaCards.length,
  });
}

export async function regenerateAnswer(cardId?: string): Promise<void> {
  const store = useTranscriptStore.getState();
  const card =
    (cardId && store.qnaCards.find((c) => c.id === cardId)) ||
    store.qnaCards[store.qnaCards.length - 1];

  if (!card) return;
  if (!hasDeepseekApiKey()) {
    store.updateQnaCard(card.id, {
      error: "Cần DeepSeek API key trong Settings để gợi ý câu trả lời.",
    });
    return;
  }

  const key = hashText(card.original);
  store.unmarkTranscript(key);
  store.updateQnaCard(card.id, {
    answer: null,
    error: null,
    status: "transcribing",
  });

  await processQnaCard(card.id, card.original, card.confidence || 1);
}

import { DeepgramClient } from "@/lib/deepgram";
import { createAudioCapture, createAudioCaptureFromStream } from "@/lib/audio";
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
import {
  resetInterimTranslation,
  scheduleInterimTranslation,
} from "@/lib/interim-translate";
import {
  cancelMergeDebounce,
  clearMergeState,
  getPipelineState,
  hashTranscriptKey,
  type PipelineState,
} from "@/lib/pipeline-state";
import {
  mergeTranscriptFragments,
  wordCount,
} from "@/lib/transcript-merge";

/** Wait this long after last segment before flushing one Q&A card. */
const MERGE_IDLE_MS = 2800;
/** Force flush if accumulated text exceeds this (long monologue). */
const MAX_CARD_WORDS = 100;

function stopAudioOnly(state: PipelineState): void {
  state.audioCapture?.stop();
  state.audioCapture = null;
  state.deepgramClient?.disconnect();
  state.deepgramClient = null;
  state.answerAbort?.abort();
  state.answerAbort = null;
  resetInterimTranslation();
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
  state: PipelineState,
  cardId: string,
  text: string,
  confidence: number
): Promise<void> {
  const settings = useSettingsStore.getState();
  const store = useTranscriptStore.getState();
  const key = hashTranscriptKey(text);

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

  state.answerAbort?.abort();
  state.answerAbort = new AbortController();

  store.updateQnaCard(cardId, {
    status: "classifying",
    answer: null,
    error: null,
  });

  const questionType = (await classifyQuestion(text)).type;
  store.updateQnaCard(cardId, {
    questionType,
    status: "generating",
    answer: "",
  });

  try {
    await generateAnswerStreaming({
      question: text,
      questionType,
      profileText: settings.profileText,
      jdText: settings.jdText,
      answerStyle: settings.answerStyle,
      answerLanguage: settings.answerLanguage,
      targetLanguage: settings.targetLanguage,
      signal: state.answerAbort.signal,
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

function flushMergeBuffer(state: PipelineState, confidence: number): void {
  cancelMergeDebounce(state);
  if (!state.mergeCardId || state.mergeBufferAcc.length === 0) return;

  const fullText = mergeTranscriptFragments(state.mergeBufferAcc);
  if (!fullText) {
    clearMergeState(state);
    return;
  }

  const cid = state.mergeCardId;
  clearMergeState(state);

  useTranscriptStore.getState().updateQnaCard(cid, {
    original: fullText,
    status: "translating",
  });
  void processQnaCard(state, cid, fullText, confidence);
}

function scheduleMergeFlush(state: PipelineState): void {
  cancelMergeDebounce(state);
  state.mergeDebounceTimer = setTimeout(() => {
    state.mergeDebounceTimer = null;
    flushMergeBuffer(state, state.lastSegmentConfidence);
  }, MERGE_IDLE_MS);
}

function appendFinalSegment(
  state: PipelineState,
  text: string,
  confidence: number
): void {
  resetInterimTranslation();

  const trimmed = text.trim();
  if (!trimmed) return;

  const key = hashTranscriptKey(trimmed);
  if (state.seenSegmentKeys.has(key)) return;
  state.seenSegmentKeys.add(key);
  state.lastSegmentConfidence = confidence;

  const store = useTranscriptStore.getState();
  state.mergeBufferAcc.push(trimmed);
  const fullText = mergeTranscriptFragments(state.mergeBufferAcc);

  if (!state.mergeCardId) {
    state.mergeCardId = store.addQnaCard({
      original: fullText,
      confidence,
    });
  } else {
    store.updateQnaCard(state.mergeCardId, { original: fullText });
  }

  if (wordCount(fullText) >= MAX_CARD_WORDS) {
    flushMergeBuffer(state, confidence);
    return;
  }

  scheduleMergeFlush(state);
}

function onUtteranceEnd(state: PipelineState): void {
  flushMergeBuffer(state, state.lastSegmentConfidence);
}

async function connectDeepgram(state: PipelineState): Promise<void> {
  const settings = useSettingsStore.getState();

  state.deepgramClient = new DeepgramClient();
  await state.deepgramClient.connect(settings.sourceLanguage, {
    onInterim: (text, confidence) => {
      if (!text.trim()) return;
      useTranscriptStore.getState().setInterim(text, confidence);
      scheduleInterimTranslation(text);
    },
    onFinalSegment: (text, confidence) => {
      appendFinalSegment(state, text, confidence);
    },
    onUtteranceEnd: () => {
      onUtteranceEnd(state);
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

async function startAudioCapture(state: PipelineState): Promise<void> {
  const settings = useSettingsStore.getState();
  const meetingStream = useMeetingStreamStore.getState().stream;
  const useTabAudio = hasMeetingAudio(meetingStream);

  if (!useTabAudio) {
    await navigator.mediaDevices.getUserMedia({ audio: true });
  }

  const send = (chunk: ArrayBufferLike) => state.deepgramClient?.sendAudio(chunk);

  if (useTabAudio && meetingStream) {
    state.audioCapture = createAudioCaptureFromStream(meetingStream, send);
  } else {
    state.audioCapture = createAudioCapture(
      settings.micDeviceId || undefined,
      send
    );
  }
  await state.audioCapture.start();
}

export async function startListening(): Promise<void> {
  const state = getPipelineState();
  const settings = useSettingsStore.getState();
  const existingSessionId = useInterviewSessionStore.getState().dbSessionId;
  const isResume = !!existingSessionId;

  useRecapStore.getState().closeRecap();
  useTranscriptStore.getState().clearCurrent();
  useTranscriptStore.getState().setListening(true);
  useTranscriptStore.getState().setDeepgramStatus("idle");

  if (!isResume) {
    useTranscriptStore.getState().clearSession();
    state.lastFinalHash = "";
    clearMergeState(state);
    useRecapStore.getState().setSessionStartedAt(Date.now());
  } else {
    state.lastFinalHash = "";
  }

  try {
    const meetingStream = useMeetingStreamStore.getState().stream;
    if (!hasMeetingAudio(meetingStream) && meetingStream) {
      console.warn(
        "[pipeline] Meeting stream without tab audio — falling back to mic"
      );
    }

    await connectDeepgram(state);
    await startAudioCapture(state);

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
    stopAudioOnly(state);
    throw e;
  }
}

export function stopListening(): void {
  stopAudioOnly(getPipelineState());
}

export async function endSession(): Promise<void> {
  const state = getPipelineState();

  if (state.mergeCardId && state.mergeBufferAcc.length > 0) {
    const fullText = mergeTranscriptFragments(state.mergeBufferAcc);
    const cid = state.mergeCardId;
    const confidence = state.lastSegmentConfidence;
    cancelMergeDebounce(state);
    state.mergeBufferAcc = [];
    state.mergeCardId = null;
    state.seenSegmentKeys.clear();
    useTranscriptStore.getState().updateQnaCard(cid, { original: fullText });
    await processQnaCard(state, cid, fullText, confidence);
  } else {
    clearMergeState(state);
  }

  const settings = useSettingsStore.getState();
  const transcript = useTranscriptStore.getState();
  const recap = useRecapStore.getState();

  stopAudioOnly(state);

  const sessionId = useInterviewSessionStore.getState().dbSessionId;
  if (sessionId) {
    await endInterviewSession(sessionId);
    useInterviewSessionStore.getState().setDbSessionId(null);
  }

  recap.openRecap({
    startedAt: recap.sessionStartedAt ?? Date.now(),
    endedAt: Date.now(),
    sourceLang: settings.sourceLanguage,
    targetLang: settings.targetLanguage,
    answerStyle: settings.answerStyle,
    questionCount: transcript.qnaCards.length,
  });
}

export async function regenerateAnswer(cardId?: string): Promise<void> {
  const state = getPipelineState();
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

  const key = hashTranscriptKey(card.original);
  store.unmarkTranscript(key);
  store.updateQnaCard(card.id, {
    answer: null,
    error: null,
    status: "transcribing",
  });

  await processQnaCard(state, card.id, card.original, card.confidence || 1);
}

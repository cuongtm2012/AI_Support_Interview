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
  extractPrimaryQuestion,
  isLectureMonologue,
  isLikelyInterviewQuestion,
} from "@/lib/question-extract";
import { presetReadiness } from "@/lib/interview-preset-utils";
import {
  endsWithQuestion,
  endsWithSentence,
  isContinuationFragment,
  mergeTranscriptFragments,
  wordCount,
} from "@/lib/transcript-merge";

/** Pause before checking whether to finalize a card (lecture/video friendly). */
const MERGE_IDLE_MS = 8000;
/** Shorter wait after a clear question ending with "?". */
const MERGE_IDLE_QUESTION_MS = 5500;
/** Force flush after this much silence even if mid-sentence. */
const MERGE_FORCE_FLUSH_MS = 18000;
const MIN_FLUSH_WORDS = 12;
const MAX_CARD_WORDS = 180;

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
  rawTranscript: string,
  confidence: number
): Promise<void> {
  const settings = useSettingsStore.getState();
  const store = useTranscriptStore.getState();
  const trimmedRaw = rawTranscript.trim();

  const extracted = extractPrimaryQuestion(trimmedRaw);
  const shouldAnswer =
    extracted !== null &&
    isLikelyInterviewQuestion(trimmedRaw) &&
    !isLectureMonologue(trimmedRaw);

  const displayText = extracted ?? trimmedRaw;
  store.updateQnaCard(cardId, { original: displayText });

  const cacheKey = hashTranscriptKey(displayText);
  if (store.hasTranscript(cacheKey)) return;
  store.markTranscript(cacheKey);

  const translatedPromise = translateForCard(cardId, displayText, cacheKey);

  if (!shouldAnswer) {
    const translated = await translatedPromise;
    store.updateQnaCard(cardId, {
      status: "complete",
      questionType: null,
      answer: null,
    });

    const sessionId = useInterviewSessionStore.getState().dbSessionId;
    if (sessionId) {
      void saveQuestionToSession({
        sessionId,
        transcriptRaw: displayText,
        transcriptTranslated: translated ?? "",
        aiAnswer: "",
        questionType: null,
        answerLanguage: settings.answerLanguage,
        sourceLanguage: settings.sourceLanguage,
        targetLanguage: settings.targetLanguage,
      });
    }
    return;
  }

  const questionText = extracted!;

  if (confidence < settings.confidenceThreshold || !hasDeepseekApiKey()) {
    const translated = await translatedPromise;
    store.updateQnaCard(cardId, { status: "complete" });

    const sessionId = useInterviewSessionStore.getState().dbSessionId;
    if (sessionId) {
      void saveQuestionToSession({
        sessionId,
        transcriptRaw: questionText,
        transcriptTranslated: translated ?? "",
        aiAnswer: "",
        questionType: "behavioral",
        answerLanguage: settings.answerLanguage,
        sourceLanguage: settings.sourceLanguage,
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

  const questionType = (await classifyQuestion(questionText)).type;
  store.updateQnaCard(cardId, {
    questionType,
    status: "generating",
    answer: "",
  });

  try {
    await generateAnswerStreaming({
      question: questionText,
      questionType,
      profileText: settings.profileText,
      jdText: settings.jdText,
      answerStyle: settings.answerStyle,
      answerLanguage: settings.answerLanguage,
      sourceLanguage: settings.sourceLanguage,
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
        transcriptRaw: questionText,
        transcriptTranslated: translated ?? "",
        aiAnswer: finalCard.answer ?? "",
        questionType,
        answerLanguage: settings.answerLanguage,
        sourceLanguage: settings.sourceLanguage,
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
  if (!state.mergeCardId) return;
  cancelMergeDebounce(state);

  const fullText = mergeTranscriptFragments(state.mergeBufferAcc);
  const delay = endsWithQuestion(fullText)
    ? MERGE_IDLE_QUESTION_MS
    : MERGE_IDLE_MS;

  state.mergeDebounceTimer = setTimeout(() => {
    state.mergeDebounceTimer = null;
    tryFlushMergeBuffer(state);
  }, delay);
}

function tryFlushMergeBuffer(state: PipelineState): void {
  if (!state.mergeCardId || state.mergeBufferAcc.length === 0) return;

  const fullText = mergeTranscriptFragments(state.mergeBufferAcc);
  const words = wordCount(fullText);
  const idleMs = Date.now() - state.lastSegmentAt;
  const lastSeg = state.mergeBufferAcc[state.mergeBufferAcc.length - 1] ?? "";

  if (words >= MAX_CARD_WORDS) {
    flushMergeBuffer(state, state.lastSegmentConfidence);
    return;
  }

  if (extractPrimaryQuestion(fullText) && words >= MIN_FLUSH_WORDS && idleMs >= MERGE_IDLE_QUESTION_MS) {
    flushMergeBuffer(state, state.lastSegmentConfidence);
    return;
  }

  // Clear standalone question — finalize after shorter pause (still min word count)
  if (endsWithQuestion(fullText) && words >= MIN_FLUSH_WORDS && idleMs >= MERGE_IDLE_QUESTION_MS) {
    flushMergeBuffer(state, state.lastSegmentConfidence);
    return;
  }

  // Complete sentence with enough context
  if (
    endsWithSentence(fullText) &&
    words >= MIN_FLUSH_WORDS &&
    idleMs >= MERGE_IDLE_MS
  ) {
    flushMergeBuffer(state, state.lastSegmentConfidence);
    return;
  }

  // Mid-sentence fragment — keep accumulating through short pauses in video/lecture
  if (isContinuationFragment(lastSeg) && idleMs < MERGE_FORCE_FLUSH_MS) {
    scheduleMergeFlush(state);
    return;
  }

  if (!endsWithSentence(fullText) && idleMs < MERGE_FORCE_FLUSH_MS) {
    scheduleMergeFlush(state);
    return;
  }

  if (idleMs >= MERGE_FORCE_FLUSH_MS && words >= MIN_FLUSH_WORDS) {
    flushMergeBuffer(state, state.lastSegmentConfidence);
  } else {
    scheduleMergeFlush(state);
  }
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
  state.lastSegmentAt = Date.now();

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
  // Deepgram detected a short pause — re-check flush criteria, do not finalize immediately
  scheduleMergeFlush(state);
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
  const active = settings.interviewPresets.find(
    (p) => p.id === settings.activePresetId
  );
  if (!active || !presetReadiness(active).ok) {
    throw new Error(
      "Chưa đủ Profile hoặc JD trên bộ đang chọn — mở Settings → Profile & JD"
    );
  }

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

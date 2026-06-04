import { DeepgramClient } from "@/lib/deepgram";
import { createAudioCapture } from "@/lib/audio";
import { translateText } from "@/lib/translate";
import { classifyQuestion } from "@/lib/classify";
import { generateAnswerStreaming } from "@/lib/ai-answer";
import { hasGoogleTranslateKey } from "@/lib/api-keys";
import {
  createInterviewSession,
  endInterviewSession,
  saveQuestionToSession,
} from "@/lib/supabase/sessions";
import { useSettingsStore } from "@/stores/settings";
import { useTranscriptStore } from "@/stores/transcript";
import { useAnswerStore } from "@/stores/answer";
import { useInterviewSessionStore } from "@/stores/interview-session";
import { useRecapStore } from "@/stores/recap";

let deepgramClient: DeepgramClient | null = null;
let audioCapture: ReturnType<typeof createAudioCapture> | null = null;
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

async function onFinalTranscript(text: string, confidence: number) {
  const settings = useSettingsStore.getState();
  const transcript = useTranscriptStore.getState();
  const answer = useAnswerStore.getState();

  if (confidence < settings.confidenceThreshold) return;

  const key = hashText(text);
  if (key === lastFinalHash || transcript.hasTranscript(key)) return;
  lastFinalHash = key;
  transcript.markTranscript(key);

  transcript.setFinal(text, confidence);

  let translated = transcript.getCachedTranslation(key);
  if (!translated) {
    if (!hasGoogleTranslateKey()) {
      translated = text;
    } else {
      try {
        translated = await translateText(
          text,
          settings.sourceLanguage,
          settings.targetLanguage
        );
        transcript.setCachedTranslation(key, translated);
      } catch {
        translated = "Dịch không khả dụng";
      }
    }
  }
  transcript.setTranslated(translated);

  answerAbort?.abort();
  answerAbort = new AbortController();

  answer.setQuestion(text);
  answer.setAnswer("");
  answer.setQuestionType(null);
  answer.setClassifying(true);
  answer.setGenerating(false);
  answer.setError(null);

  let questionType = (
    await classifyQuestion(text)
  ).type;
  answer.setQuestionType(questionType);
  answer.setClassifying(false);
  answer.setGenerating(true);

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
      onChunk: (chunk) => answer.appendAnswer(chunk),
    });

    const finalAnswer = useAnswerStore.getState().answer;
    const finalType = useAnswerStore.getState().questionType ?? questionType;

    transcript.addToHistory({
      original: text,
      translated,
      answer: finalAnswer,
      questionType: finalType,
      timestamp: Date.now(),
    });

    const sessionId = useInterviewSessionStore.getState().dbSessionId;
    if (sessionId) {
      void saveQuestionToSession({
        sessionId,
        transcriptRaw: text,
        transcriptTranslated: translated,
        aiAnswer: finalAnswer,
        questionType: finalType,
        answerLanguage: settings.answerLanguage,
        targetLanguage: settings.targetLanguage,
      });
    }
  } catch (e) {
    if ((e as Error).name !== "AbortError") {
      answer.setError(
        e instanceof Error ? e.message : "Answer generation failed"
      );
    }
  } finally {
    answer.setGenerating(false);
    answer.setClassifying(false);
  }
}

export async function startListening(): Promise<void> {
  const settings = useSettingsStore.getState();
  const transcript = useTranscriptStore.getState();

  useRecapStore.getState().closeRecap();
  transcript.clearSession();
  useAnswerStore.getState().reset();

  await navigator.mediaDevices.getUserMedia({ audio: true });

  deepgramClient = new DeepgramClient();
  await deepgramClient.connect(settings.sourceLanguage, {
    onInterim: (text, confidence) => {
      if (confidence >= settings.confidenceThreshold) {
        useTranscriptStore.getState().setInterim(text, confidence);
      }
    },
    onFinal: (text, confidence) => {
      void onFinalTranscript(text, confidence);
    },
    onError: (err) => {
      useAnswerStore.getState().setError(err);
      useTranscriptStore.getState().setDeepgramStatus("error");
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

  audioCapture = createAudioCapture(
    settings.micDeviceId || undefined,
    (chunk) => deepgramClient?.sendAudio(chunk)
  );
  await audioCapture.start();
  transcript.setListening(true);
  lastFinalHash = "";

  const startedAt = Date.now();
  useRecapStore.getState().setSessionStartedAt(startedAt);

  const sessionId = await createInterviewSession({
    sourceLang: settings.sourceLanguage,
    targetLang: settings.targetLanguage,
    answerStyle: settings.answerStyle,
    profileText: settings.profileText,
    jdText: settings.jdText,
  });
  useInterviewSessionStore.getState().setDbSessionId(sessionId);
}

/** Stop mic/STT only — session stays active until End Session */
export function stopListening(): void {
  stopAudioOnly();
}

/** End interview: stop audio, close Supabase session, show recap */
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
    questionCount: transcript.questionHistory.length,
  });
}

export async function regenerateAnswer(): Promise<void> {
  const transcript = useTranscriptStore.getState();
  const text = transcript.finalText;
  if (!text) return;
  const key = hashText(text);
  lastFinalHash = "";
  transcript.unmarkTranscript(key);
  await onFinalTranscript(
    text,
    useTranscriptStore.getState().confidence ?? 1
  );
}

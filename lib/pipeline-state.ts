import type { DeepgramClient } from "@/lib/deepgram";
import type { AudioCaptureHandle } from "@/lib/audio";

export interface PipelineState {
  tabId: string;
  deepgramClient: DeepgramClient | null;
  audioCapture: AudioCaptureHandle | null;
  answerAbort: AbortController | null;
  lastFinalHash: string;
  mergeBufferAcc: string[];
  mergeCardId: string | null;
  mergeDebounceTimer: ReturnType<typeof setTimeout> | null;
  lastSegmentConfidence: number;
  seenSegmentKeys: Set<string>;
}

const TAB_KEY = "ic-tab-id";

function getTabId(): string {
  if (typeof sessionStorage === "undefined") return "server";
  let id = sessionStorage.getItem(TAB_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(TAB_KEY, id);
  }
  return id;
}

function createEmptyState(tabId: string): PipelineState {
  return {
    tabId,
    deepgramClient: null,
    audioCapture: null,
    answerAbort: null,
    lastFinalHash: "",
    mergeBufferAcc: [],
    mergeCardId: null,
    mergeDebounceTimer: null,
    lastSegmentConfidence: 1,
    seenSegmentKeys: new Set(),
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __icPipelineStates: Map<string, PipelineState> | undefined;
}

export function getPipelineState(): PipelineState {
  const tabId = getTabId();
  if (!globalThis.__icPipelineStates) {
    globalThis.__icPipelineStates = new Map();
  }
  let state = globalThis.__icPipelineStates.get(tabId);
  if (!state) {
    state = createEmptyState(tabId);
    globalThis.__icPipelineStates.set(tabId, state);
  }
  return state;
}

export function cancelMergeDebounce(state: PipelineState): void {
  if (state.mergeDebounceTimer) {
    clearTimeout(state.mergeDebounceTimer);
    state.mergeDebounceTimer = null;
  }
}

export function clearMergeState(state: PipelineState): void {
  cancelMergeDebounce(state);
  state.mergeBufferAcc = [];
  state.mergeCardId = null;
  state.seenSegmentKeys.clear();
  state.lastSegmentConfidence = 1;
}

export function hashTranscriptKey(text: string): string {
  const normalized = text.trim().toLowerCase();
  return `${normalized.length}:${normalized}`;
}

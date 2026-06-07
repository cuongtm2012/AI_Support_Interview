const TARGET_SAMPLE_RATE = 16000;

export async function listAudioDevices(): Promise<MediaDeviceInfo[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === "audioinput");
}

export async function requestMicPermission(): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((t) => t.stop());
}

export type AudioCaptureHandle = {
  start: () => Promise<void>;
  stop: () => void;
};

export function createAudioCapture(
  deviceId: string | undefined,
  onChunk: (data: ArrayBufferLike) => void
): AudioCaptureHandle {
  return createPcmCapture(
    async () => {
      const constraints: MediaTrackConstraints = {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      };
      if (deviceId) constraints.deviceId = { exact: deviceId };
      return navigator.mediaDevices.getUserMedia({ audio: constraints });
    },
    onChunk,
    { stopTracksOnEnd: true }
  );
}

export function createAudioCaptureFromStream(
  stream: MediaStream,
  onChunk: (data: ArrayBufferLike) => void
): AudioCaptureHandle {
  return createPcmCapture(async () => stream, onChunk, {
    stopTracksOnEnd: false,
  });
}

function createPcmCapture(
  acquireStream: () => Promise<MediaStream>,
  onChunk: (data: ArrayBufferLike) => void,
  opts: { stopTracksOnEnd: boolean }
): AudioCaptureHandle {
  let stream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let processor: ScriptProcessorNode | null = null;
  let workletNode: AudioWorkletNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let inputRate = TARGET_SAMPLE_RATE;

  const emitPcm = (input: Float32Array) => {
    const pcm = floatTo16BitPCMResampled(input, inputRate, TARGET_SAMPLE_RATE);
    onChunk(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength));
  };

  const start = async () => {
    stream = await acquireStream();
    if (stream.getAudioTracks().length === 0) {
      throw new Error("Không có track âm thanh trong nguồn đã chọn");
    }

    audioContext = new AudioContext();
    inputRate = audioContext.sampleRate;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    source = audioContext.createMediaStreamSource(stream);

    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;

    const useWorklet =
      typeof AudioWorkletNode !== "undefined" &&
      audioContext.audioWorklet !== undefined;

    if (useWorklet) {
      try {
        await audioContext.audioWorklet.addModule("/pcm-processor.js");
        workletNode = new AudioWorkletNode(audioContext, "pcm-processor", {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          channelCount: 1,
        });
        workletNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
          if (e.data?.length) emitPcm(e.data);
        };
        source.connect(workletNode);
        workletNode.connect(silentGain);
        silentGain.connect(audioContext.destination);
        return;
      } catch (err) {
        console.warn("[audio] AudioWorklet failed, using ScriptProcessor", err);
        workletNode = null;
      }
    }

    processor = audioContext.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      emitPcm(e.inputBuffer.getChannelData(0));
    };
    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(audioContext.destination);
  };

  const stop = () => {
    processor?.disconnect();
    workletNode?.disconnect();
    source?.disconnect();
    if (opts.stopTracksOnEnd) {
      stream?.getTracks().forEach((t) => t.stop());
    }
    void audioContext?.close();
    processor = null;
    workletNode = null;
    source = null;
    stream = null;
    audioContext = null;
  };

  return { start, stop };
}

function floatTo16BitPCMResampled(
  input: Float32Array,
  inputRate: number,
  outputRate: number
): Int16Array {
  if (inputRate === outputRate) {
    return floatTo16BitPCM(input);
  }
  const ratio = inputRate / outputRate;
  const outLength = Math.max(1, Math.floor(input.length / ratio));
  const resampled = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    resampled[i] = input[Math.floor(i * ratio)] ?? 0;
  }
  return floatTo16BitPCM(resampled);
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

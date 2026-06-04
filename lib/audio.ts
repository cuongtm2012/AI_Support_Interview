const SAMPLE_RATE = 16000;

export async function listAudioDevices(): Promise<MediaDeviceInfo[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === "audioinput");
}

export async function requestMicPermission(): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((t) => t.stop());
}

export function createAudioCapture(
  deviceId: string | undefined,
  onChunk: (data: ArrayBufferLike) => void
): { start: () => Promise<void>; stop: () => void } {
  let stream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let processor: ScriptProcessorNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;

  const start = async () => {
    const constraints: MediaTrackConstraints = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      sampleRate: SAMPLE_RATE,
      channelCount: 1,
    };
    if (deviceId) constraints.deviceId = { exact: deviceId };

    stream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
    audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    source = audioContext.createMediaStreamSource(stream);
    processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const pcm = floatTo16BitPCM(input);
      onChunk(
        pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength)
      );
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  };

  const stop = () => {
    processor?.disconnect();
    source?.disconnect();
    stream?.getTracks().forEach((t) => t.stop());
    audioContext?.close();
    processor = null;
    source = null;
    stream = null;
    audioContext = null;
  };

  return { start, stop };
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

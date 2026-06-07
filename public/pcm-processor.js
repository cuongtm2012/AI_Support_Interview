class PcmProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]?.[0];
    if (input?.length) {
      // Copy — shared buffer is reused by the engine between process() calls
      this.port.postMessage(input.slice());
    }
    return true;
  }
}

registerProcessor("pcm-processor", PcmProcessor);

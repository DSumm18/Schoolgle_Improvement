/**
 * AudioWorklet processor for capturing raw 16kHz mono PCM audio.
 *
 * The browser's AudioContext typically runs at 44100Hz or 48000Hz.
 * This processor downsamples to 16000Hz as required by Gemini Live API,
 * and converts Float32 samples to Int16 PCM.
 */
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    // Send audio chunks every ~100ms (1600 samples at 16kHz)
    this._chunkSize = 1600;
  }

  /**
   * Downsample from source rate to 16kHz
   */
  _downsample(inputBuffer, inputSampleRate) {
    if (inputSampleRate === 16000) {
      return inputBuffer;
    }
    const ratio = inputSampleRate / 16000;
    const outputLength = Math.floor(inputBuffer.length / ratio);
    const output = new Float32Array(outputLength);
    for (let i = 0; i < outputLength; i++) {
      const srcIndex = Math.floor(i * ratio);
      output[i] = inputBuffer[srcIndex];
    }
    return output;
  }

  /**
   * Convert Float32 [-1, 1] to Int16 PCM
   */
  _float32ToInt16(float32Array) {
    const int16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) {
      return true;
    }

    const channelData = input[0]; // mono
    const downsampled = this._downsample(channelData, sampleRate);

    // Accumulate samples
    for (let i = 0; i < downsampled.length; i++) {
      this._buffer.push(downsampled[i]);
    }

    // When we have enough samples, send a chunk
    while (this._buffer.length >= this._chunkSize) {
      const chunk = new Float32Array(this._buffer.splice(0, this._chunkSize));
      const pcm = this._float32ToInt16(chunk);
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
    }

    return true;
  }
}

registerProcessor("audio-capture-processor", AudioCaptureProcessor);

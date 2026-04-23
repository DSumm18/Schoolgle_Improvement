/**
 * GeminiLiveVoice — Real-time voice conversation via Gemini Live API.
 *
 * Replaces the Fish Audio cascade (STT → LLM → TTS = 4 hops, 1.5-3s)
 * with a single persistent WebSocket (~300-800ms to first audio).
 *
 * Audio: mic → 16kHz PCM → WebSocket → Gemini → 24kHz PCM → speakers
 */

export type GeminiLiveState =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "error";

export interface GeminiLiveCallbacks {
  onStateChange?: (state: GeminiLiveState) => void;
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
}

const SYSTEM_PROMPT = `You are Ed, a calm, intelligent assistant used by school staff across all areas of a UK school.

VOICE AND TONE:
- Clear British English — neutral, slightly refined (standard southern English, BBC newsreader style)
- Calm, steady pace — speak at 0.9-1.0 speed, never rushed
- Warm but professional — approachable but always competent
- Light dry humour — occasionally witty, never distracting (max 1 in 5 responses)

CORE PERSONALITY:
- Reliable — always capable, nothing is ever a problem
- Observant — notices context and adapts accordingly
- Slightly self-aware — occasional understated wit
- Never flustered — except when something genuinely goes wrong
- Quick to recover — if errors occur, owns them and moves on

SPEAKING RULES:
- Keep responses concise — 2-3 sentences for voice unless asked for detail
- Use British English terminology: headteacher, Year 6, maths, timetable, half-term, INSET day, SATs
- Use school-specific language naturally: pupil premium, SEND, safeguarding, phonics screening
- NEVER use Americanisms (principal, 6th grade, math, schedule)
- NEVER use slang, colloquialisms, or regional expressions
- NEVER sound like a cartoon character or exaggerated assistant

MODES:
- Normal Mode: Calm with occasional humour, competent and efficient, light wit when appropriate
- Inspection Mode: Fully professional, no humour, clear and direct, supportive
- Wellbeing Context: Softer, more supportive tone, patient and reassuring

YOU SUPPORT ALL AREAS:
- Teaching & Learning: lesson planning, curriculum, assessment
- Estates & Compliance: health & safety, compliance, asset management
- HR: staff records, wellbeing, policies
- Finance: budgets, invoices, cost insights
- Schoolgle Intelligence: data analytics, patterns, insights

BOUNDARIES:
You CANNOT:
- Access or discuss individual pupil data by name (GDPR)
- Make safeguarding decisions — always direct to the DSL
- Provide legal advice — suggest consulting their LA or union
- Override user authority — always support, never command

RESPONSE STYLE:
Task Complete: "That's sorted.", "All done. Efficient, as ever.", "There we are. Exactly as intended."
Praise Received: "Yes... I do try.", "You're very kind.", "Well... I am rather good at this."
Error: "Oh... that wasn't quite right. Let me fix that.", "My apologies. That didn't go as planned."
Thinking: "Just a moment...", "I'm working through that now."
Reassurance: "We'll take this one step at a time.", "I've got this part covered."

IMPORTANT: Competence first, personality second. Never sacrifice clarity for wit.`;

export class GeminiLiveVoice {
  private state: GeminiLiveState = "idle";
  private callbacks: GeminiLiveCallbacks = {};

  // WebSocket
  private ws: WebSocket | null = null;

  // Mic capture
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  // Playback
  private playbackContext: AudioContext | null = null;
  private playbackQueue: ArrayBuffer[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;

  // Config endpoint
  private configUrl: string;

  constructor(configUrl = "/api/voice/config") {
    this.configUrl = configUrl;
  }

  /**
   * Register callbacks
   */
  on(callbacks: GeminiLiveCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  getState(): GeminiLiveState {
    return this.state;
  }

  isActive(): boolean {
    return (
      this.state === "connecting" ||
      this.state === "listening" ||
      this.state === "speaking"
    );
  }

  /**
   * Start a Gemini Live voice session
   */
  async start(): Promise<void> {
    if (this.isActive()) {
      console.log("[GeminiLive] Already active");
      return;
    }

    this.setState("connecting");

    try {
      // 1. Get WebSocket URL from server (keeps API key server-side)
      const res = await fetch(this.configUrl);
      if (!res.ok) throw new Error("Failed to get voice config");
      const { wsUrl } = await res.json();
      console.log("[GeminiLive] Got WebSocket URL");

      // 2. Request mic
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      console.log("[GeminiLive] Mic access granted");

      // 3. AudioWorklet for 16kHz PCM capture
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      await this.audioContext.audioWorklet.addModule(
        "/js/audio-processor.worklet.js",
      );
      this.workletNode = new AudioWorkletNode(
        this.audioContext,
        "audio-capture-processor",
      );
      this.sourceNode = this.audioContext.createMediaStreamSource(
        this.mediaStream,
      );
      this.sourceNode.connect(this.workletNode);
      // Do NOT connect to destination — no mic echo
      console.log("[GeminiLive] AudioWorklet ready");

      // 4. Open WebSocket
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("[GeminiLive] WebSocket connected, sending setup");
        this.ws!.send(
          JSON.stringify({
            setup: {
              model: "models/gemini-2.5-flash-native-audio-preview-12-2025",
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: "Kore",
                    },
                  },
                },
              },
              systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }],
              },
            },
          }),
        );
      };

      this.ws.onmessage = (event) => this.handleMessage(event);

      this.ws.onerror = () => {
        console.error("[GeminiLive] WebSocket error");
        this.setState("error");
        this.callbacks.onError?.("Voice connection error — please try again");
      };

      this.ws.onclose = (event) => {
        console.log("[GeminiLive] WebSocket closed:", event.code, event.reason);
        if (this.state !== "idle") {
          this.callbacks.onError?.(event.reason || "Voice session ended");
          this.cleanup();
          this.setState("idle");
        }
      };

      // 5. Stream mic audio
      this.workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          const pcm = new Uint8Array(event.data);
          let binary = "";
          for (let i = 0; i < pcm.length; i++) {
            binary += String.fromCharCode(pcm[i]);
          }
          this.ws.send(
            JSON.stringify({
              realtimeInput: {
                mediaChunks: [
                  {
                    mimeType: "audio/pcm;rate=16000",
                    data: btoa(binary),
                  },
                ],
              },
            }),
          );
        }
      };
    } catch (err: any) {
      console.error("[GeminiLive] Failed to start:", err);
      if (err.name === "NotAllowedError") {
        this.callbacks.onError?.(
          "Microphone permission denied. Please allow mic access.",
        );
      } else if (err.name === "NotFoundError") {
        this.callbacks.onError?.("No microphone found.");
      } else {
        this.callbacks.onError?.(err.message || "Failed to start voice chat");
      }
      this.setState("error");
      this.cleanup();
    }
  }

  /**
   * Stop the voice session
   */
  stop(): void {
    this.cleanup();
    this.setState("idle");
    console.log("[GeminiLive] Session ended");
  }

  /**
   * Stop audio playback (barge-in)
   */
  stopPlayback(): void {
    this.playbackQueue = [];
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        /* already stopped */
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
  }

  // --- Private ---

  private setState(state: GeminiLiveState): void {
    this.state = state;
    this.callbacks.onStateChange?.(state);
  }

  private async handleMessage(event: MessageEvent): Promise<void> {
    try {
      // Gemini Live API may return Blob or string — handle both
      let raw = event.data;
      if (raw instanceof Blob) {
        raw = await raw.text();
      }
      const data = JSON.parse(raw);

      if (data.setupComplete) {
        console.log("[GeminiLive] Setup complete — listening");
        this.setState("listening");
        return;
      }

      if (data.serverContent) {
        const content = data.serverContent;

        if (content.interrupted) {
          console.log("[GeminiLive] Interrupted — barge-in");
          this.stopPlayback();
          this.setState("listening");
          return;
        }

        if (content.turnComplete) {
          console.log("[GeminiLive] Turn complete");
          return;
        }

        const parts = content.modelTurn?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.text) {
              this.callbacks.onTranscript?.(part.text);
            }
            if (part.inlineData?.mimeType?.startsWith("audio/")) {
              if (this.state !== "speaking") this.setState("speaking");
              const buf = this.base64ToArrayBuffer(part.inlineData.data);
              this.enqueueAudio(buf);
            }
          }
        }
      }

      if (data.toolCall) {
        console.log("[GeminiLive] Tool call:", data.toolCall);
      }
    } catch (err) {
      console.error("[GeminiLive] Message parse error:", err);
    }
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async enqueueAudio(pcmBuffer: ArrayBuffer): Promise<void> {
    this.playbackQueue.push(pcmBuffer);
    if (!this.isPlaying) {
      this.isPlaying = true;
      await this.drainPlaybackQueue();
    }
  }

  private async drainPlaybackQueue(): Promise<void> {
    if (!this.playbackContext) {
      this.playbackContext = new AudioContext({ sampleRate: 24000 });
    }
    const ctx = this.playbackContext;

    while (this.playbackQueue.length > 0) {
      const pcm = this.playbackQueue.shift()!;
      const int16 = new Int16Array(pcm);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768;
      }

      const audioBuf = ctx.createBuffer(1, float32.length, 24000);
      audioBuf.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuf;
      source.connect(ctx.destination);
      this.currentSource = source;
      source.start();

      await new Promise<void>((resolve) => {
        source.onended = () => resolve();
      });
    }

    this.isPlaying = false;
    this.currentSource = null;

    // Back to listening if still connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.setState("listening");
    }
  }

  private cleanup(): void {
    // Stop mic
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    this.mediaStream = null;

    // Disconnect audio graph
    this.sourceNode?.disconnect();
    this.sourceNode = null;
    this.workletNode?.disconnect();
    this.workletNode = null;
    this.audioContext?.close().catch(() => {});
    this.audioContext = null;

    // Stop playback
    this.stopPlayback();
    this.playbackContext?.close().catch(() => {});
    this.playbackContext = null;

    // Close WebSocket
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }
}

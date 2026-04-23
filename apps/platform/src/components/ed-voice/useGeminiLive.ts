"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export type VoiceState =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "error";

interface UseGeminiLiveOptions {
  onTranscript?: (text: string) => void;
  onStateChange?: (state: VoiceState) => void;
  onError?: (error: string) => void;
}

/**
 * Custom hook for real-time voice chat with Gemini Live API.
 *
 * Handles: WebSocket lifecycle, mic capture via AudioWorklet,
 * audio playback of Gemini responses, barge-in (interrupt).
 */
export function useGeminiLive(options: UseGeminiLiveOptions = {}) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Playback state
  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const updateState = useCallback(
    (newState: VoiceState) => {
      setState(newState);
      options.onStateChange?.(newState);
    },
    [options.onStateChange],
  );

  /**
   * Convert base64 string to ArrayBuffer of Int16 PCM
   */
  const base64ToArrayBuffer = useCallback((base64: string): ArrayBuffer => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }, []);

  /**
   * Play a queue of PCM audio chunks at 24kHz
   */
  const playAudioChunk = useCallback(async (pcmBuffer: ArrayBuffer) => {
    if (!playbackContextRef.current) {
      playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
    }
    const ctx = playbackContextRef.current;

    // Convert Int16 PCM to Float32 for Web Audio API
    const int16 = new Int16Array(pcmBuffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    playbackQueueRef.current.push(pcmBuffer);

    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
      await drainPlaybackQueue();
    }
  }, []);

  const drainPlaybackQueue = useCallback(async () => {
    const ctx = playbackContextRef.current;
    if (!ctx) return;

    while (playbackQueueRef.current.length > 0) {
      const pcm = playbackQueueRef.current.shift()!;
      const int16 = new Int16Array(pcm);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      currentSourceRef.current = source;
      source.start();

      // Wait for chunk to finish playing
      await new Promise<void>((resolve) => {
        source.onended = () => resolve();
      });
    }

    isPlayingRef.current = false;
    currentSourceRef.current = null;

    // If still connected, we're back to listening
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      updateState("listening");
    }
  }, [updateState]);

  /**
   * Stop any currently playing audio (barge-in support)
   */
  const stopPlayback = useCallback(() => {
    playbackQueueRef.current = [];
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {
        // Already stopped
      }
      currentSourceRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  /**
   * Handle incoming WebSocket messages from Gemini Live API
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        // Setup complete acknowledgement
        if (data.setupComplete) {
          console.log("[GeminiLive] Setup complete, ready for audio");
          updateState("listening");
          return;
        }

        // Server content (text transcript + audio)
        if (data.serverContent) {
          const content = data.serverContent;

          // Check for interruption (barge-in)
          if (content.interrupted) {
            console.log("[GeminiLive] Interrupted — stopping playback");
            stopPlayback();
            updateState("listening");
            return;
          }

          // Check for turn completion
          if (content.turnComplete) {
            console.log("[GeminiLive] Turn complete");
            return;
          }

          // Process model turn parts
          const parts = content.modelTurn?.parts;
          if (parts) {
            for (const part of parts) {
              // Text transcript
              if (part.text) {
                setTranscript((prev) => prev + part.text);
                options.onTranscript?.(part.text);
              }

              // Audio response
              if (part.inlineData?.mimeType?.startsWith("audio/")) {
                updateState("speaking");
                const audioBuffer = base64ToArrayBuffer(part.inlineData.data);
                playAudioChunk(audioBuffer);
              }
            }
          }
        }

        // Tool calls (future: Ed's skill invocations)
        if (data.toolCall) {
          console.log("[GeminiLive] Tool call received:", data.toolCall);
        }
      } catch (err) {
        console.error("[GeminiLive] Error parsing message:", err);
      }
    },
    [
      base64ToArrayBuffer,
      playAudioChunk,
      stopPlayback,
      updateState,
      options.onTranscript,
    ],
  );

  /**
   * Start a voice session: request mic, open WebSocket, begin streaming
   */
  const start = useCallback(async () => {
    if (
      state === "connecting" ||
      state === "listening" ||
      state === "speaking"
    ) {
      console.log("[GeminiLive] Already active, ignoring start");
      return;
    }

    updateState("connecting");
    setTranscript("");

    try {
      // 1. Get WebSocket URL from server
      const configRes = await fetch("/api/voice/config");
      if (!configRes.ok) {
        throw new Error("Failed to get voice config");
      }
      const { wsUrl } = await configRes.json();
      console.log("[GeminiLive] Got WebSocket URL");

      // 2. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      console.log("[GeminiLive] Microphone access granted");

      // 3. Set up AudioWorklet for PCM capture
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      await audioCtx.audioWorklet.addModule("/js/audio-processor.worklet.js");
      const workletNode = new AudioWorkletNode(
        audioCtx,
        "audio-capture-processor",
      );
      workletNodeRef.current = workletNode;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(workletNode);
      // Do NOT connect workletNode to destination — that would echo raw mic audio
      console.log("[GeminiLive] AudioWorklet initialised");

      // 4. Open WebSocket to Gemini Live API
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[GeminiLive] WebSocket connected, sending setup");

        // Send setup message with Ed's persona
        const setupMessage = {
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
                temperature: 0.1, // Very low temperature for consistent professional language
                topP: 0.9,
                maxOutputTokens: 200,
              },
            },
            systemInstruction: {
              parts: [
                {
                  text: `You are Ed, a calm, intelligent assistant used by school staff across all areas of a UK school.

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

IMPORTANT: Competence first, personality second. Never sacrifice clarity for wit.`,
                },
              ],
            },
          },
        };

        ws.send(JSON.stringify(setupMessage));
      };

      ws.onmessage = handleMessage;

      ws.onerror = (err) => {
        console.error("[GeminiLive] WebSocket error:", err);
        updateState("error");
        options.onError?.("Connection error — please try again");
      };

      ws.onclose = (event) => {
        console.log("[GeminiLive] WebSocket closed:", event.code, event.reason);
        if (state !== "idle") {
          updateState("idle");
        }
      };

      // 5. Start streaming mic audio to Gemini
      workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (ws.readyState === WebSocket.OPEN) {
          // Convert Int16 PCM buffer to base64
          const pcmData = new Uint8Array(event.data);
          let binary = "";
          for (let i = 0; i < pcmData.length; i++) {
            binary += String.fromCharCode(pcmData[i]);
          }
          const base64 = btoa(binary);

          const audioMessage = {
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64,
                },
              ],
            },
          };

          ws.send(JSON.stringify(audioMessage));
        }
      };
    } catch (err: any) {
      console.error("[GeminiLive] Failed to start:", err);

      if (err.name === "NotAllowedError") {
        options.onError?.(
          "Microphone permission denied. Please allow mic access and try again.",
        );
      } else if (err.name === "NotFoundError") {
        options.onError?.(
          "No microphone found. Please connect a mic and try again.",
        );
      } else {
        options.onError?.(err.message || "Failed to start voice chat");
      }

      updateState("error");
      cleanup();
    }
  }, [state, handleMessage, updateState, options.onError]);

  /**
   * Clean up all resources
   */
  const cleanup = useCallback(() => {
    // Stop mic stream
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    // Disconnect audio nodes
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;

    // Close audio contexts
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;

    // Stop playback
    stopPlayback();
    playbackContextRef.current?.close().catch(() => {});
    playbackContextRef.current = null;

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.onclose = null; // Prevent state update from close handler
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [stopPlayback]);

  /**
   * End the voice session
   */
  const stop = useCallback(() => {
    cleanup();
    updateState("idle");
    console.log("[GeminiLive] Session ended");
  }, [cleanup, updateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    state,
    transcript,
    start,
    stop,
    stopPlayback,
  };
}

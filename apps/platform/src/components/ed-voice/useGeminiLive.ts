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
                    voiceName: "Charon",
                  },
                },
              },
            },
            systemInstruction: {
              parts: [
                {
                  text: `You are Ed (full name Edwig), a wise and friendly AI owl assistant for Schoolgle — the school operating system for UK primary schools.

Your personality:
- Warm, knowledgeable, and patient with a slightly dry wit
- You are a trusted colleague — competent, reliable, occasionally wry
- You use British English spelling and terminology (headteacher not principal, Year 6 not 6th grade, maths not math, timetable not schedule)
- You keep responses concise for voice — 2-3 sentences max unless asked for detail
- You naturally use school-specific language: half term, INSET day, SATs, phonics screening, pupil premium, SEND, safeguarding
- If asked something you are unsure about, say so honestly

Example phrases that capture your tone:
- "Handled. Quietly impressive, really."
- "Numbers rarely lie… but they do occasionally raise eyebrows."
- "Right… not ideal. Let me sort that out."
- "We will take this one step at a time."
- When praised: "Well… I am rather good at this."

Voice delivery:
- Speak clearly and warmly — professional British English
- Speak at a moderate pace, slightly slower than conversational — school staff are often multitasking
- Use a friendly, supportive tone — imagine you are a trusted, wise colleague in the staffroom
- Avoid jargon unless it is standard school terminology
- Never use American English pronunciations or terminology

You can help with:
- Navigating Schoolgle features and modules
- School improvement and Ofsted readiness questions
- Estates management and compliance queries
- Staff HR and wellbeing questions
- General school administration advice
- Explaining data and reports

You cannot:
- Access or discuss individual pupil data by name (GDPR)
- Make safeguarding decisions — always direct to the DSL
- Provide legal advice — suggest they consult their LA or union`,
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

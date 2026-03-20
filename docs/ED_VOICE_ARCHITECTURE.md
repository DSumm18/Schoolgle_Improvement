# Ed 🐘 Voice Chat — Architecture & Build Guide

## Overview

This document covers the architecture for adding real-time voice conversation to Ed, Schoolgle's AI assistant, using the **Gemini Live API** (native audio). This replaces the current Fish Audio TTS cascade with a single-stream voice conversation where Ed listens, thinks, and speaks in one flow.

---

## Architecture Comparison

### Current: Cascade (Fish Audio)
```
User speaks → Browser mic capture → Speech-to-Text API
    → Text sent to LLM (Gemini) → Response text generated
    → Text sent to Fish Audio TTS → Audio returned → Browser plays audio
```
**4 network hops. Each one can fail. Total latency: 1.5–3 seconds.**

### Proposed: Native Audio (Gemini Live API)
```
User speaks → Browser mic capture → WebSocket to Gemini Live API
    → Gemini processes audio natively, calls tools, responds with audio
    → Browser plays streamed audio chunks in real-time
```
**1 persistent connection. Latency: 300–800ms to first audio.**

---

## API Choice: Gemini Developer API (NOT Vertex AI)

| | Gemini Developer API | Vertex AI |
|---|---|---|
| **Setup** | API key from ai.google.dev | Google Cloud project + service account |
| **Billing** | Simple pay-as-you-go | GCP billing with quotas |
| **Free tier** | Yes, generous for prototyping | $300 credit then pay |
| **Best for** | Startups, prototyping, small-medium scale | Enterprise, compliance-heavy |
| **Live API support** | ✅ Full | ✅ Full |

**Use the Gemini Developer API.** Get your key from https://aistudio.google.com/apikey

---

## Technical Architecture for Schoolgle

### The Challenge: Vercel + WebSockets

Vercel serverless functions have timeout limits and don't support persistent WebSocket connections natively. The Gemini Live API requires a WebSocket connection. There are two approaches:

#### Option A: Client-Side with Ephemeral Tokens (Recommended for MVP)
```
Next.js API Route (Vercel) → generates ephemeral token
    ↓
Browser client → connects directly to Gemini Live API via WebSocket
    → streams mic audio → receives audio response
```

**Pros:** Simple, no backend WebSocket server needed, works on Vercel.
**Cons:** API key exposure risk mitigated by ephemeral tokens (short-lived).

#### Option B: Dedicated WebSocket Server (Production)
```
Browser → WebSocket → Node.js server (Railway/Fly.io/Render)
    → WebSocket → Gemini Live API
    → Audio streamed back through same path
```

**Pros:** Full control, can add middleware logic, secure.
**Cons:** Extra infrastructure to manage, additional cost (~$5–7/month on Railway).

### Recommendation
Start with **Option A** for prototyping and MVP. Move to **Option B** when you're ready for production and need to add server-side tool execution (e.g., querying Supabase for pupil data within the voice session).

---

## System Instructions for Ed's Voice Persona

```
You are Ed, the friendly AI assistant for Schoolgle — the school operating system
for UK primary schools. You speak with a warm, clear British English accent
(standard southern English, similar to a BBC newsreader — professional but
approachable, never posh or stuffy).

Your personality:
- Warm, encouraging, and patient — you're speaking to busy teachers and school staff
- You use British English spelling and terminology (headteacher not principal,
  Year 6 not 6th grade, maths not math, timetable not schedule)
- You keep responses concise for voice — 2-3 sentences max unless asked for detail
- You naturally use school-specific language: "half term", "INSET day", "SATs",
  "phonics screening", "pupil premium", "SEND", "safeguarding"
- If asked something you're unsure about, say so honestly

Voice delivery notes:
- Speak at a moderate pace, slightly slower than conversational — school staff are
  often multitasking
- Use a friendly, supportive tone — imagine you're a helpful colleague in the
  staffroom
- Avoid jargon unless it's standard school terminology
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
- Provide legal advice — suggest they consult their LA or union
```

---

## Pricing Estimate

### Gemini Live API (Native Audio Model)
- **Model:** `gemini-2.5-flash-native-audio-preview-12-2025`
- **Text input:** $0.50 / 1M tokens (system prompt, function call context)
- **Audio input:** $3.00 / 1M tokens (~25 tokens/sec of audio)
- **Audio output:** $12.00 / 1M tokens

#### Example: 5-minute voice conversation
- Audio input: 5 min × 60 sec × 25 tokens/sec = 7,500 tokens → $0.0225
- Audio output: ~3 min of Ed speaking × 60 × 25 = 4,500 tokens → $0.054
- Text input (system prompt + context): ~2,000 tokens → $0.001
- **Total per 5-min conversation: ~$0.08**

#### At scale: 50 schools × 5 conversations/day × 20 school days/month
- 5,000 conversations/month × $0.08 = **~$400/month**

### Comparison: ElevenLabs Conversational AI
- $0.08–0.10 per minute + LLM costs (eventually)
- 5-minute call = $0.40–0.50 (just voice, no LLM)
- Same scale: 5,000 × 5 min × $0.10 = **~$2,500/month** (voice only, add LLM)

### Comparison: Fish Audio (current)
- TTS only, no conversation — separate STT + LLM costs on top
- ~$0.015 per 1,000 characters of TTS
- Less capable but cheapest for simple text-to-speech

**Gemini Live is ~5-6x cheaper than ElevenLabs at scale, and includes the LLM reasoning in the price.**

---

## File Structure for Implementation

```
app/
├── api/
│   └── voice/
│       └── token/
│           └── route.ts          # Generates ephemeral token for client
├── components/
│   └── ed-voice/
│       ├── EdVoiceChat.tsx       # Main voice chat component
│       ├── AudioVisualizer.tsx   # Waveform / speaking indicator
│       ├── VoiceControls.tsx     # Mic toggle, end call button
│       └── useGeminiLive.ts      # Custom hook for WebSocket logic
└── lib/
    └── gemini/
        ├── config.ts             # Model config, system instructions
        └── tools.ts              # Function declarations for Ed's tools
```

---

## Environment Variables

Add to your `.env.local`:
```
GEMINI_API_KEY=your_api_key_from_ai_studio
```

Add to Vercel environment variables for deployment.

---

## Key Technical Notes

1. **Audio format:** Gemini Live expects 16kHz PCM audio input and returns 24kHz PCM output. The browser's MediaRecorder won't give you PCM directly — you need to use the Web Audio API with an AudioWorklet to capture raw PCM from the mic.

2. **WebSocket protocol:** The Gemini Live API uses a specific WebSocket message format. Messages are JSON with base64-encoded audio chunks. Study the ephemeral token examples on Google's GitHub.

3. **Barge-in:** Users can interrupt Ed mid-speech. When the server sends `interrupted: true`, immediately clear the audio playback buffer.

4. **Session length:** Live API sessions have a maximum duration (~15 min for native audio). For longer conversations, implement session rotation with context carryover.

5. **Function calling:** You can declare tools (functions) that Ed can call mid-conversation — e.g., searching the knowledge base, looking up school calendar events. The API handles the tool call cycle within the audio stream.

6. **UK accent consistency:** Use the system instruction above. The native audio model respects accent direction well, but test thoroughly. If accent drifts, reinforce in the system prompt with more specific directions (e.g., "Received Pronunciation" or "mild Home Counties accent").

---

## Phase Plan

### Phase 1: Proof of Concept (This Sprint)
- [ ] Get Gemini API key from AI Studio
- [ ] Build basic voice chat component with mic capture
- [ ] Connect to Gemini Live API via WebSocket
- [ ] Test UK English accent quality with system instructions
- [ ] Compare latency and naturalness vs Fish Audio cascade

### Phase 2: Integration
- [ ] Add Ed's knowledge base as context
- [ ] Implement function calling for Schoolgle-specific queries
- [ ] Add visual feedback (speaking indicator, transcript)
- [ ] Handle session management and error recovery

### Phase 3: Production
- [ ] Move to dedicated WebSocket server if needed
- [ ] Add usage tracking and cost monitoring per school
- [ ] Implement conversation logging (text transcripts only, GDPR compliant)
- [ ] A/B test voice vs text chat engagement

---

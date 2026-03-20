# Ed Voice Chat — Cursor/Claude Code Prompt

Paste this entire prompt into Cursor or Claude Code to build the prototype.

---

## THE PROMPT

```
I need to build a real-time voice chat component for my Next.js 14+ App Router application. This is a proof-of-concept for "Ed", an AI assistant chatbot for a UK school management platform called Schoolgle. Ed already exists as a text chatbot — I'm adding a voice conversation mode using the Gemini Live API (native audio).

## Stack
- Next.js 14+ App Router (TypeScript)
- Tailwind CSS
- Deployed on Vercel
- Environment variable: GEMINI_API_KEY (Gemini Developer API key from ai.google.dev)

## What I Need Built

### 1. API Route: `/app/api/voice/token/route.ts`
Create a Next.js API route that:
- Uses the GEMINI_API_KEY from environment variables
- Returns a short-lived session configuration the client needs to connect to the Gemini Live API
- The client will connect directly to the Gemini Live API WebSocket

### 2. React Component: `EdVoiceChat.tsx`
A voice chat interface component that:
- Shows a large circular "Talk to Ed" button in the centre
- When pressed, requests microphone permission and starts a session
- Captures microphone audio using the Web Audio API (AudioWorklet) at 16kHz mono PCM
- Opens a WebSocket connection to the Gemini Live API endpoint:
  `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`
- Sends the setup message with this configuration:
  ```json
  {
    "setup": {
      "model": "models/gemini-2.5-flash-native-audio-preview-12-2025",
      "generationConfig": {
        "responseModalities": ["AUDIO"],
        "speechConfig": {
          "voiceConfig": {
            "prebuiltVoiceConfig": {
              "voiceName": "Kore"
            }
          }
        }
      },
      "systemInstruction": {
        "parts": [{
          "text": "You are Ed, the friendly AI assistant for Schoolgle — the school operating system for UK primary schools. You speak with a warm, clear British English accent (standard southern English, similar to a BBC newsreader — professional but approachable, never posh or stuffy). Your personality: Warm, encouraging, and patient — you are speaking to busy teachers and school staff. You use British English spelling and terminology (headteacher not principal, Year 6 not 6th grade, maths not math, timetable not schedule). You keep responses concise for voice — 2-3 sentences max unless asked for detail. You naturally use school-specific language: half term, INSET day, SATs, phonics screening, pupil premium, SEND, safeguarding. If asked something you are unsure about, say so honestly. Voice delivery: Speak at a moderate pace. Use a friendly, supportive tone — imagine you are a helpful colleague in the staffroom. Avoid jargon unless it is standard school terminology. Never use American English pronunciations or terminology."
        }]
      }
    }
  }
  ```
- Streams mic audio to the API as base64-encoded PCM chunks in `realtimeInput` messages:
  ```json
  {
    "realtimeInput": {
      "mediaChunks": [{
        "mimeType": "audio/pcm;rate=16000",
        "data": "<base64 encoded PCM data>"
      }]
    }
  }
  ```
- Receives audio responses and plays them back using the Web Audio API (24kHz PCM)
- Handles the `interrupted` flag — when the user speaks while Ed is talking, stop playback immediately
- Shows visual state: "idle" (pulsing circle), "listening" (animated mic waves), "speaking" (animated speaker waves)
- Has a "hang up" button to end the session and close the WebSocket
- Includes a small text transcript area that shows what Ed is saying (from the `serverContent` text parts if available)
- Clean error handling: if mic permission denied, WebSocket fails, etc — show friendly error messages

### 3. Styling
- Use Tailwind CSS
- The component should be a floating overlay/modal that appears over the existing chat interface
- Schoolgle brand colours: primary blue #2563EB, secondary green #10B981
- The main button should be an elephant emoji 🐘 or elephant icon
- Dark overlay background when active
- Smooth animations for state transitions
- Mobile-responsive

### 4. Important Technical Details
- The Gemini Live API WebSocket sends JSON messages. Audio data is base64-encoded PCM.
- Input audio: 16-bit PCM, 16kHz, mono
- Output audio: 16-bit PCM, 24kHz, mono
- For the AudioWorklet, you'll need to create a processor file. Create it as a separate file that gets loaded.
- The API key should NOT be exposed to the client in production. For this prototype, pass it via an API route that the client calls to get the connection URL. In production, we'll move to ephemeral tokens or a server proxy.
- Handle WebSocket reconnection gracefully

### 5. API Route for Key: `/app/api/voice/config/route.ts`
Simple route that returns the WebSocket URL with the API key embedded. This keeps the key server-side.
```typescript
// Returns { wsUrl: "wss://..." } to the client
// Only the server knows GEMINI_API_KEY
```

### File Structure
```
app/
├── api/
│   └── voice/
│       └── config/
│           └── route.ts
├── components/
│   └── ed-voice/
│       ├── EdVoiceChat.tsx
│       ├── AudioProcessor.worklet.ts  (or .js)
│       └── useGeminiLive.ts
```

Please build all of these files with complete, working code. Make sure the AudioWorklet processor is handled correctly for Next.js (it needs to be a separate file that can be loaded via `new URL()`). Use TypeScript throughout. Add console.log statements at key points so I can debug in the browser console.

Do NOT use any third-party libraries for the WebSocket or audio handling — use native browser APIs (WebSocket, Web Audio API, AudioWorklet). The only dependencies should be React, Next.js, and Tailwind.
```

---

## NOTES FOR DAVID

### Before Running This Prompt

1. **Get your API key:** Go to https://aistudio.google.com/apikey and create a key
2. **Add to .env.local:** `GEMINI_API_KEY=your_key_here`
3. **Add to Vercel:** Settings → Environment Variables → add GEMINI_API_KEY
4. **Test in AI Studio first:** Go to https://aistudio.google.com, select "Stream" mode, pick the native audio model, and test the voice chat there to hear what the voices sound like before building

### Voice Options to Try

Replace `voiceName` in the setup message to test different voices:
- **Kore** — clear, professional female (good starting point)
- **Puck** — default, neutral
- **Charon** — deeper male voice
- **Fenrir** — male, warm
- **Aoede** — female, expressive

Test these in AI Studio first to find the best fit for Ed.
The native audio model also responds to accent direction in the system prompt,
so the "British English accent" instruction should steer the output.

### Testing Checklist

Once built, test these scenarios:
- [ ] Basic: "Hello Ed, what can you help me with?"
- [ ] UK English: "What should I prepare for an Ofsted inspection?"
- [ ] Interruption: Start talking while Ed is speaking — does it stop?
- [ ] Latency: How long from finishing your question to hearing Ed respond?
- [ ] Accent: Does Ed sound British? Any American pronunciation slipping through?
- [ ] Error: Deny mic permission — does it show a friendly error?
- [ ] Mobile: Test on iPhone — does the mic work in the browser?

### Cost Tracking

Monitor your API usage at https://aistudio.google.com — the dashboard shows token consumption. Each 5-minute conversation should cost roughly $0.08. If you're on the free tier, you get rate-limited but not charged, which is perfect for prototyping.

### If the Accent Isn't Good Enough

Fall back to the "half-cascade" approach:
1. Keep Gemini Live API for LISTENING (speech-to-text + reasoning)
2. Set `responseModalities` to `["TEXT"]` instead of `["AUDIO"]`
3. Route the text response through Fish Audio or ElevenLabs for speech
4. This adds ~200-400ms latency but gives you full control over the voice

To do this, change the setup config:
```json
{
  "setup": {
    "model": "models/gemini-2.5-flash-preview-native-audio-dialog",
    "generationConfig": {
      "responseModalities": ["TEXT"]
    }
  }
}
```
Then send the text response to your existing Fish Audio TTS pipeline.

### Next Steps After Prototype

1. **Add Ed's knowledge base:** Use function calling in the Live API to let Ed query Schoolgle docs
2. **Add Supabase context:** Declare tools that Ed can call to look up non-PII school data
3. **Usage metering:** Log conversation duration per school for billing
4. **Production security:** Move to ephemeral tokens or a WebSocket proxy server (Railway ~$5/month)

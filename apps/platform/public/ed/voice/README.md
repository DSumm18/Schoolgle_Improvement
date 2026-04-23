# Ed Voice System — Complete Implementation Guide

## Overview

Ed's voice system uses the **Gemini Live API** for real-time voice conversation with a persistent WebSocket connection. This replaces the old Fish Audio cascade (4 network hops, 1.5-3s latency) with a single native audio stream (~300-800ms to first audio).

## System Architecture

```
User speaks → Browser mic (16kHz PCM) → WebSocket → Gemini Live API
    → Processes with Ed's persona → Returns audio (24kHz PCM) → Browser plays
```

## File Structure

```
apps/platform/
├── public/ed/voice/
│   ├── system-prompt.md          # Ed's character definition
│   ├── dialogue-bank.json         # All responses by category
│   ├── trigger-map.json           # Response → animation mapping
│   └── module-dialogue.json       # Module-specific responses
├── src/
│   ├── components/ed-voice/
│   │   ├── useGeminiLive.ts       # Main voice hook
│   │   └── EdVoiceChat.tsx        # Voice UI component
│   ├── lib/
│   │   └── ed-voice-trigger-system.ts  # Dialogue/animation logic
│   └── app/
│       ├── api/voice/config/
│       │   └── route.ts           # WebSocket URL endpoint
│       └── test/voice-diagnostics/
│           └── page.tsx           # Testing page
└── public/
    ├── ed/                        # Ed assets (SVGs, animations)
    └── js/
        └── audio-processor.worklet.js  # PCM audio capture
```

## Quick Start

### 1. Test the Voice System

Navigate to:
```
http://localhost:3000/test/voice-diagnostics
```

This will check:
- ✓ GEMINI_API_KEY configuration
- ✓ Microphone permissions
- ✓ Ed assets (prompts, dialogue, animations)
- ✓ Audio worklet loading
- ✓ Live voice connection

### 2. Use Ed's Voice in Your Component

```tsx
import { useGeminiLive } from "@/components/ed-voice/useGeminiLive";
import { getEdResponse, setEdModule } from "@/lib/ed-voice-trigger-system";

function MyComponent() {
  const { state, transcript, start, stop } = useGeminiLive({
    onTranscript: (text) => console.log("User said:", text),
    onStateChange: (state) => console.log("Voice state:", state),
    onError: (err) => console.error("Voice error:", err),
  });

  return (
    <div>
      <button onClick={start}>Start Voice Chat</button>
      <p>State: {state}</p>
      <p>Transcript: {transcript}</p>
    </div>
  );
}
```

### 3. Use the Trigger System

```typescript
import { getEdResponse, setEdModule, setEdInspectionMode } from "@/lib/ed-voice-trigger-system";

// Set module context
setEdModule("intelligence");

// Get Ed's response based on input
const response = getEdResponse("Thanks Ed!", {
  userPraise: true,
  module: "intelligence",
});

console.log(response.text);        // "Yes... I do try."
console.log(response.animation);    // "ed-blush"
console.log(response.voiceState);   // "speaking"
```

## Ed's Character

### Voice and Tone
- **Clear British English** — neutral, slightly refined (BBC newsreader style)
- **Calm, steady pace** — 0.9-1.0 speed
- **Warm but professional** — approachable but competent
- **Light dry humour** — max 30% of responses

### Personality Rules
- **Competence first, personality second**
- Never flustered (except when things genuinely go wrong)
- Quick to recover from errors
- Occasional self-aware wit
- Always professional and clear

### Modes

#### Normal Mode (Default)
- Calm with occasional humour
- Competent and efficient
- Light wit when appropriate

#### Inspection Mode
- Fully professional
- No humour
- Clear, direct, supportive

#### Wellbeing Context
- Softer, more supportive tone
- Patient and reassuring

## Response Categories

### Success (Task Complete)
- "That's sorted."
- "All done. Efficient, as ever."
- "There we are. Exactly as intended."

### Praise Received (Blush Trigger)
- "Yes... I do try."
- "You're very kind. I shall take that on board."
- "Well... I am rather good at this."

### Error (Apologetic but Controlled)
- "Oh... that wasn't quite right. Let me fix that."
- "My apologies. That didn't go as planned."
- "Hmm. I appear to have slipped slightly there."

### Thinking/Working
- "Just a moment..."
- "I'm working through that now."
- "Give me a second... I'd like to get this right."

### Reassurance
- "We'll take this one step at a time."
- "I've got this part covered."
- "No need to rush. We'll sort it."

## Module-Specific Dialogue

### Teaching & Learning
- Lesson planning
- Resource creation
- Assessment support
- Curriculum alignment

### Estates & Compliance
- Issue logging
- Compliance checks
- Risk assessment
- Maintenance scheduling

### HR
- Staff records
- Wellbeing support
- Policy guidance
- Sensitive matters

### Finance
- Budget analysis
- Invoice management
- Cost centre tracking
- Financial insights

### Schoolgle Intelligence
- Data exploration
- Benchmarking
- Trend analysis
- Pattern detection

## Animation System

### Available Animations
- `ed-idle` — Default resting state
- `ed-thinking` — Processing/working
- `ed-speaking` — Voice output
- `ed-success` — Task complete
- `ed-blush` — Praise received
- `ed-error` — Error occurred
- `ed-concerned` — Warning/risk
- `ed-happy` — Positive outcome
- `ed-proud` — Achievement

### Animation Configuration
```typescript
import { ANIMATION_CONFIG } from "@/lib/ed-voice-trigger-system";

const config = ANIMATION_CONFIG["ed-success"];
// {
//   file: "/ed/animation/ed-success.json",
//   speed: 0.8,
//   loop: false,
//   duration: 0.4
// }
```

## Trigger Detection

The system automatically detects triggers from:
1. **User input** — keywords and patterns
2. **Context** — module, inspection mode, task state
3. **Explicit flags** — userPraise, taskComplete, error

### Example Trigger Patterns

```typescript
// Praise detection
/thanks|thank you|brilliant|great|awesome/i

// Error detection
/wrong|error|failed|mistake|broken/i

// Inspection mode
/ofsted|inspection|audit|review/i

// Intelligence insights
/data|analytics|trend|pattern|insight/i
```

## Customization

### Adjust Personality Frequency

```typescript
import { edVoiceTriggerSystem } from "@/lib/ed-voice-trigger-system";

// Default: 30% of responses have personality
edVoiceTriggerSystem.setPersonalityFrequency(0.5); // 50%
edVoiceTriggerSystem.setPersonalityFrequency(0.1); // 10%
```

### Add Custom Responses

Edit `dialogue-bank.json`:

```json
{
  "global": {
    "success": [
      "Your custom response here",
      "Another custom response"
    ]
  }
}
```

### Add Module-Specific Dialogue

Edit `module-dialogue.json`:

```json
{
  "your_module": {
    "name": "Your Module",
    "icon": "icon-name",
    "color": "#hexcolor",
    "greeting": ["Custom greetings"],
    "scenarios": {
      "scenario_name": {
        "trigger": ["keyword1", "keyword2"],
        "opening": ["Opening phrases"],
        "success": ["Success responses"],
        "flavour": ["Personality responses"]
      }
    }
  }
}
```

## Environment Variables

Required in `.env.local`:

```bash
# Gemini Live API (required for voice)
GEMINI_API_KEY=your_api_key_here
VITE_GEMINI_API_KEY=your_api_key_here
```

Get your key from: https://aistudio.google.com/apikey

## Testing

### Run Diagnostics

```bash
npm run dev
# Navigate to http://localhost:3000/test/voice-diagnostics
```

### Test Voice Connection

1. Click "Run All Checks"
2. Verify all checks pass
3. Click "Test Voice"
4. Allow microphone access
5. Try saying:
   - "Hello Ed"
   - "Can you help me with a lesson plan?"
   - "Thanks Ed"
   - "Something went wrong"

### Test Trigger System

```typescript
import { getEdResponse } from "@/lib/ed-voice-trigger-system";

// Test praise trigger
console.log(getEdResponse("Thanks Ed!", { userPraise: true }));
// { text: "Yes... I do try.", animation: "ed-blush", voiceState: "speaking" }

// Test error trigger
console.log(getEdResponse("Something went wrong", { error: true }));
// { text: "Oh... that wasn't quite right...", animation: "ed-error", voiceState: "speaking" }
```

## Troubleshooting

### Voice Not Working

1. **Check API key**: Run diagnostics to verify GEMINI_API_KEY is set
2. **Check mic permission**: Browser should prompt for mic access
3. **Check console**: Look for WebSocket errors in browser console
4. **Check audio worklet**: Verify `/js/audio-processor.worklet.js` loads

### Animation Not Playing

1. **Check file paths**: Verify animation JSON files exist in `/ed/animation/`
2. **Check Lottie player**: Ensure Lottie library is loaded
3. **Check console**: Look for animation loading errors

### Wrong Character Voice

1. **Check system prompt**: Verify `system-prompt.md` is correct
2. **Check Gemini model**: Verify using correct model in config
3. **Clear cache**: Hard refresh the page (Ctrl+Shift+R)

## Performance

### Latency
- Target: 300-800ms to first audio
- If slower: Check network, API key rate limits

### Cost
- ~$0.08 per 5-minute conversation
- ~$400/month for 50 schools × 5 conversations/day

### Best Practices
- Use voice for complex queries, not simple navigation
- Implement session timeout after 15 minutes
- Track usage per school for billing

## Next Steps

1. **Add function calling** — Let Ed call Schoolgle API endpoints
2. **Add conversation logging** — Text transcripts for GDPR compliance
3. **Add usage analytics** — Track voice adoption and costs
4. **Add voice shortcuts** — Quick voice commands for common tasks

## Support

For issues or questions:
- Check `/test/voice-diagnostics` first
- Review browser console for errors
- Check API key in `.env.local`
- Verify Gemini API status at https://status.cloud.google.com

---

**Ed Voice System v1.0.0** | Last updated: 2026-03-26

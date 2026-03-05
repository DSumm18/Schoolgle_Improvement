# Ed Form Helper - Handover & Control Mechanisms

## User Story

> "How does Ed handle handover with the user and retake control? What if the user moves the mouse and stops Ed? If that makes sense, I'm just worried about the handoff - it could get messy. Ed needs to explain what he's doing so the user knows not to touch the mouse or anything - 'I'll take over, just watch and talk to me.'"

**Answer:** Ed uses intelligent control transfer with clear visual and verbal cues.

---

## Table of Contents

1. [Control States](#control-states)
2. [Handoff Detection](#handoff-detection)
3. [Visual Indicators](#visual-indicators)
4. [Voice & Communication](#voice--communication)
5. [Reactivation Mechanisms](#reactivation-mechanisms)
6. [Deployment Options](#deployment-options)
7. [User Experience Detection](#user-experience-detection)

---

## Control States

Ed operates in four distinct states, each with clear visual indicators:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CONTROL STATES                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  IDLE                   GUIDING                   ACTIVE            │
│  (Waiting)              (Co-pilot)               (Auto-pilot)        │
│  ────────               ─────────                ────────            │
│  ┌─────┐                ┌─────┐                 ┌─────┐             │
│  │  Ed │                │  Ed │                 │  Ed │             │
│  │  💤 │                │  👁️ │                 │  🎯 │             │
│  └─────┘                └─────┘                 └─────┘             │
│  Grey badge             Blue badge             Green badge          │
│  "Ed ready"             "Ed guiding"           "Ed filling..."     │
│                                                                     │
│  User has full         User controls         Ed controls           │
│  control               mouse, Ed watches     mouse automatically   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### State Transitions

```
                    START_FORM_SESSION
                           │
                           ▼
┌─────────┐   USER_GIVES_PERMISSION   ┌─────────┐
│  IDLE   │ ────────────────────────> │ GUIDING │
└─────────┘                           └─────────┘
   ▲                                         │
   │                                         │ User asks Ed to fill
   │                                         ▼
   │                                    ┌─────────┐
   │        USER_MOVES_MOUSE            │ ACTIVE  │
   │ <───────────────────────────────── │         │
   │  (interrupt, ask to resume?)       └─────────┘
   │                                         │
   │                                         │ COMPLETED / CANCELLED
   │                                         ▼
   └───────────────────────────────────── ┌─────────┐
                                         │  IDLE   │
                                         └─────────┘
```

---

## Handoff Detection

### How Ed Detects User Interrupt

The `MouseWatcher` class (already implemented in `packages/ed-extension/src/content/automation/mouse-watcher.ts`) monitors:

1. **Mouse Movement**
   - Threshold: 5 pixels of movement
   - First movement records position (ignored)
   - Second movement beyond threshold triggers interrupt

2. **Keyboard Input**
   - Any key press except Shift/Ctrl/Alt/Meta
   - Escape key = immediate stop

3. **Click Events**
   - User clicks anywhere (except on Ed's own elements)

### Interrupt Flow

```
USER MOVES MOUSE (beyond threshold)
        │
        ▼
Ed: [stops immediately]
        │
        ▼
Ed: "I noticed you moved the mouse. Do you want to take over?"
        │
        ├─────────────────┬─────────────────┐
        ▼                 ▼                 ▼
    USER: YES         USER: NO          USER: [silence]
        │                 │                 │
        ▼                 ▼                 ▼
    Ed: "OK, I'll    Ed: "Great,     [After 10s]
    step aside.     continuing..."   Ed: "Should I
    You can call                        continue?"
    me back when
    you're ready."
```

### Reactivation Options

After user takes control, Ed can be reactivated via:

1. **Voice Command**: "Ed, continue" or "Ed, help me"
2. **Keyboard Shortcut**: Ctrl+Shift+E (configurable)
3. **UI Button**: "Ed, resume" button in the panel
4. **Automatic**: Ed asks after 30 seconds of inactivity

---

## Visual Indicators

### Badge System

A floating badge shows Ed's current state:

```
┌──────────────────────────────────────────────┐
│  ┌────────────────────────────────────────┐  │
│  │  🟢 Ed is filling this form...        │  │  ← ACTIVE state
│  │  Field 2 of 5: Email Address          │  │
│  │  ⚠️ Don't move your mouse             │  │
│  │  [Pause]                              │  │
│  └────────────────────────────────────────┘  │
│           ▲                                   │
│           │ Positioned at bottom-right       │
└──────────────────────────────────────────────┘
```

### State Badges

| State | Badge Style | Message |
|-------|-------------|---------|
| **IDLE** | Grey pill | "Ed ready" |
| **GUIDING** | Blue pill | "Ed guiding - you control" |
| **ACTIVE** | Green pulsing pill | "Ed filling... Don't move mouse!" |
| **PAUSED** | Yellow pill | "Ed paused - [Resume]" |
| **INTERRUPTED** | Orange pill | "You took control - [Ask Ed to continue?]" |

### Field Highlighting

When Ed is actively filling, each field is highlighted:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Your Name: ┌─────────────────────────────────────────┐    │
│             │ Ahmed Ali                                │    │  ← Green glow
│             └─────────────────────────────────────────┘    │
│                                                             │
│  ✓ Filled  ────>  Next: Email Address                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Is that correct?                                    │  │  ← Verification bubble
│  │  [Yes] [No, change it]                              │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Progress Bar

```
Ed's Progress:
┌──────────────────────────────────────────────────────┐
│ Name │ Email │ Phone │ Concern │ Submit              │
│  ✓    │  ➤   │       │          │                     │
└──────────────────────────────────────────────────────┘
```

---

## Voice & Communication

### Spoken Prompts (when voice enabled)

| Situation | English | Urdu | Polish |
|-----------|---------|------|--------|
| **Starting** | "I'll take over now. Just watch and talk to me. I'll fill in the form for you." | "Mein ab control karunga. Bas dekhtay rahiye aur baat kijiye." | "Przejmę kontrolę. Po prostu obserwuj i rozmawiaj ze mną." |
| **Each field** | "Now I'll fill in your name. Is 'Ahmed Ali' correct?" | "Ab mein bharna hai. Kya ye sahi hai?" | "Teraz wypełnię imię. Czy 'Ahmed Ali' jest poprawne?" |
| **Interrupted** | "I noticed you moved the mouse. Do you want to take over, or should I continue?" | "Maine dekha aap mouse move kar rahe hain. Kya aap khud karenge?" | "Zauważyłem, że przesunąłeś mysz. Chcesz przejąć kontrolę?" |
| **Resuming** | "Great! I'll continue from where we left off." | "Achha! Mein wahi se continue karunga." | "Świetnie! Kontynuuję od momentu, w którym skończyliśmy." |
| **Complete** | "All done! Please review the form and click Submit when ready." | "Ho gaya! Form check karke submit kar dijiye." | "Gotowe! Sprawdź formularz i kliknij Wyślij." |

### Non-Verbal Cues

For users who prefer not to use voice:

```
┌─────────────────────────────────────────────────────────────┐
│  📢 Ed is about to fill the "Name" field                    │
│                                                             │
│  [Let Ed do it]  [No, I'll do it myself]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Reactivation Mechanisms

### Option 1: UI Button

After interrupt, show a reactivation button:

```
┌─────────────────────────────────────────────────────────────┐
│  Ed was interrupted while filling the form                  │
│                                                             │
│  [ Ask Ed to continue filling where he left off ]           │
│                                                             │
│  Progress: 2 of 5 fields completed                          │
└─────────────────────────────────────────────────────────────┘
```

### Option 2: Keyboard Shortcut

Default: `Ctrl+Shift+E`

Configurable in user preferences.

### Option 3: Voice Commands

- "Ed, continue"
- "Ed, resume"
- "Ed, take over"
- "Ed, help me fill this"

### Option 4: Natural Conversation

Ed listens for phrases like:
- "Can you help me again?"
- "I'm stuck"
- "What do I do next?"
- "Continue please"

---

## Deployment Options

### Comparison Matrix

| Feature | Browser Extension | Dashboard Widget | Bookmarklet | Native App |
|---------|-------------------|------------------|-------------|------------|
| **Fill any website form** | ✅ Yes | ❌ CORS blocks | ⚠️ Maybe | ❌ No |
| **Fill school MIS (Arbor, etc.)** | ✅ Yes | ❌ CORS blocks | ⚠️ Maybe | ❌ No |
| **Chrome Android** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| **iOS Safari** | ❌ No extensions | ✅ Yes | ⚠️ Manual | ✅ Yes |
| **Installation friction** | ⚠️ Medium | ✅ None | ✅ None | ❌ High |
| **School deployment** | ✅ Group Policy | ✅ Enable feature | ❌ Not practical | ❌ MDM required |
| **Privacy boundary** | ✅ Local processing | ✅ School servers | ✅ Local processing | ✅ Local processing |

### Recommended Deployment: **Hybrid Approach**

```
┌─────────────────────────────────────────────────────────────────┐
│                    HYBRID DEPLOYMENT                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DESKTOP (Chrome/Edge)          MOBILE (Android/iOS)          │
│  ──────────────────             ──────────────────             │
│  Browser Extension              Dashboard Widget               │
│  ├─ Fill ANY form               ├─ Schoolgle dashboard        │
│  ├─ MIS systems (Arbor, etc.)   ├─ Form helper embedded       │
│  └─ Full automation             └─ Limited to allowed sites   │
│                                                                 │
│  SCHOOL SIDE                    PARENT SIDE                    │
│  ────────────                   ────────────                   │
│  Dashboard Widget               Browser Extension              │
│  ├─ Staff logged in             ├─ Parent installs             │
│  ├─ Fill school forms           ├─ Fill public forms           │
│  └─ MIS integration             └─ Safeguarding reports        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Extension Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTENSION COMPONENTS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │   Content   │    │ Background  │    │    Popup    │        │
│  │   Script    │◄──►│   Worker    │◄──►│    Panel    │        │
│  │             │    │             │    │             │        │
│  │ • Form      │    │ • Auth      │    │ • Settings  │        │
│  │   detection │    │ • AI calls  │    │ • Status    │        │
│  │ • Fill      │    │ • Storage   │    │ • Controls  │        │
│  │   fields    │    │ • Skills    │    │             │        │
│  │ • Mouse     │    │             │    │             │        │
│  │   watcher   │    │             │    │             │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│         │                                      │               │
│         └──────────────────┬───────────────────┘               │
│                            ▼                                   │
│                   ┌───────────────┐                            │
│                   │    Ed API     │                            │
│                   │  /ed/chat     │                            │
│                   │  /skills/     │                            │
│                   │  invoke       │                            │
│                   └───────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### School Deployment via Group Policy

For Windows/Chrome schools, deploy via:
```json
{
  "ExtensionSettings": {
    "pkcfafcdbdkhdohepkeopehffmbpnnpko": {
      "installation_mode": "force_installed",
      "update_url": "https://clients2.google.com/service/update2/crx"
    }
  }
}
```

### Parent Deployment

1. **Web Store**: Install from Chrome Web Store
2. **School provides link**: "Get help with forms - install Ed"
3. **One-click install**: No account needed for basic features
4. **Premium features**: Require school subscription

---

## User Experience Detection

### First-Time vs. Experienced User

Ed adapts his communication based on user's experience level:

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXPERIENCE LEVEL DETECTION                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DETECTION METHOD:                                              │
│  ─────────────────                                               │
│  1. Check localStorage for session count                        │
│  2. Ask: "Is this your first time using Ed to fill forms?"      │
│  3. Observe user behavior (do they interrupt quickly?)          │
│  4. Check their profile (if logged in)                          │
│                                                                 │
│  RESPONSE ADAPTATION:                                           │
│  ────────────────────                                            │
│                                                                 │
│  FIRST-TIMER                    EXPERIENCED                    │
│  ───────────                    ────────────                    │
│  "I'll take over now.           "Filling name field..."        │
│   Just watch and talk to                                        │
│   me. I'll move the mouse                                         │
│   for you and fill in                                             │
│   each field. Just tell                                          │
│   me your answers."                                               │
│                                                                 │
│  • Longer explanations           • Concise updates              │
│  • More confirmations            • Fewer interruptions          │
│  • Slower pace                   • Normal pace                  │
│  • Verbal warnings               • Visual indicators only       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Confidence Score

Ed maintains a confidence score for each user (0-100):

```typescript
interface UserConfidence {
  sessionsCompleted: number;
  averageInterruptions: number;
  successfulCompletions: number;
  needsHelpRequests: number;
  score: number; // 0-100
}

// Example scores:
// 0-20: Beginner - lots of hand-holding
// 21-50: Learning - moderate guidance
// 51-80: Competent - minimal interference
// 81-100: Expert - get out of the way
```

### Adaptive Behavior

```typescript
function getCommunicationLevel(confidence: number): CommunicationLevel {
  if (confidence < 20) return 'verbose';
  if (confidence < 50) return 'guided';
  if (confidence < 80) return 'concise';
  return 'minimal';
}

function getPacing(confidence: number): Pacing {
  return {
    fieldDelay: confidence < 50 ? 1500 : 500,
    confirmationRequired: confidence < 70,
    explainNextStep: confidence < 40,
    showProgress: true,
  };
}
```

---

## Edge Cases & Fallbacks

### What if Ed can't find a field?

```
Ed: "I can't find the 'Phone Number' field. Can you click it for me?"
     ┌─────────────────────────────────────┐
     │  [Show me where it should be]       │
     │  [Skip this field]                  │
     │  [I'll fill it myself]              │
     └─────────────────────────────────────┘
```

### What if the page navigation changes?

```
Ed: "The page has changed. I need to re-scan the form."
     [Scanning...] → "Found 4 fields. Continue?"
```

### What if the form has validation errors?

```
Ed: "The form shows an error on the email field.
     Would you like me to fix it, or will you handle it?"
```

### What if Ed gets stuck?

```
Ed: "I'm not sure what to do next. Would you like to:
     1. Take over yourself
     2. Try a different approach
     3. Start over"
```

---

## Privacy & Security Considerations

### What Ed NEVER Does

- ❌ Reads password fields
- ❌ Fills credit card forms
- ❌ Stores form data after submission
- ❌ Sends data to AI without consent
- ❌ Fills forms on banking sites
- ❌ Accesses browser history

### What Ed ALWAYS Does

- ✅ Shows privacy notice before starting
- ✅ Deletes session data immediately
- ✅ Logs only anonymous metrics
- ✅ Asks for confirmation before sensitive fields
- ✅ Stops immediately on user interrupt
- ✅ Works offline for basic validation

---

## Code Architecture

### Extension Message Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Content Script              Background Worker          Ed API  │
│  ──────────────              ─────────────────          ───────  │
│                                                                 │
│  [Detect Form]     →     [Get Auth]      →    [Start Session]   │
│  [Show Consent]    →     [Log Analytics]  ←    [Return Fields]  │
│  [Start Fill]      →     [Call AI Skill]  →    [Get Answers]    │
│  [Mouse Interrupt] ←     [Watch State]    ←    [Processing...]  │
│  [Pause Fill]      →     [Update State]   →    [Cancel? No]     │
│  [Resume Fill]     →     [Resume AI]      →    [Continue]       │
│  [Complete]        →     [Delete Session] →    [Log Metrics]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### State Machine

```typescript
type ControlState =
  | 'IDLE'       // Waiting for user
  | 'ASKING'     // Ed is asking a question
  | 'LISTENING'  // Ed is waiting for response
  | 'FILLING'    // Ed is actively filling
  | 'PAUSED'     // Ed was interrupted
  | 'COMPLETE';  // Form is done

interface ControlMachine {
  state: ControlState;
  fieldIndex: number;
  confidence: number;
  userLevel: 'beginner' | 'learning' | 'competent' | 'expert';

  transition(event: Event): void;
  canInterrupt(): boolean;
  shouldVerbalize(): boolean;
}
```

---

## Testing Checklist

### Handoff Testing
- [ ] Mouse movement stops Ed immediately
- [ ] Keyboard input stops Ed immediately
- [ ] Click outside Ed's UI stops Ed
- [ ] Pause button works
- [ ] Resume after interrupt works
- [ ] Reactivation button appears

### Communication Testing
- [ ] First-time user sees verbose prompts
- [ ] Experienced user sees minimal prompts
- [ ] Voice commands work
- [ ] Multilingual support works
- [ ] Error messages are clear

### Cross-Platform Testing
- [ ] Chrome Desktop
- [ ] Edge Desktop
- [ ] Chrome Android
- [ ] Safari iOS (dashboard only)
- [ ] Firefox Desktop

### Form Type Testing
- [ ] Simple contact form
- [ ] Multi-page form
- [ ] File upload form
- [ ] Dynamic fields
- [ ] Validation errors

---

## Next Steps

1. **Implement ControlStateMachine** - Core state transitions
2. **Add UI Components** - Badge, progress bar, pause button
3. **Integrate Voice** - Web Speech API for commands
4. **Build Confidence Tracker** - Adaptive responses
5. **Create Deployment Guide** - For schools and parents

---

## Related Documents

- [PRIVACY_GUARDRAILS.md](./PRIVACY_GUARDRAILS.md) - Privacy requirements
- [ED_FORM_HELPER_EDIT_MODE.md](./ED_FORM_HELPER_EDIT_MODE.md) - Correction flow
- [.agent/skills/ed-form-helper/SKILL.md](../.agent/skills/ed-form-helper/SKILL.md) - User-facing docs

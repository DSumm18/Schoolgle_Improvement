# Fix Ed Chat: Voice Transcript + Smart Navigation + Confirmation Cards

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three Ed widget issues — suppress Gemini thinking text in voice chat, add smart navigation with confirmation buttons, and implement a reusable action confirmation card pattern.

**Architecture:** All changes are in the ed-widget vanilla TS package (`packages/ed-widget/src/`). Problem 1 modifies `voice/gemini-live.ts` and `Ed.ts`. Problem 2 adds a navigation matcher utility and modifies `Ed.ts`. Problem 3 adds a confirmation card renderer to `components/Chat.ts`. The confirmation pattern is reusable for future actions (create, update, delete).

**Tech Stack:** Vanilla TypeScript (no React), DOM manipulation, Gemini Live WebSocket API, module registry for navigation targets.

---

## Root Cause Analysis

### Problem 1: Voice transcript shows thinking text
- **Root cause:** `gemini-live.ts:286-316` — Gemini 2.5 Flash native audio model is configured with `responseModalities: ["AUDIO"]`, so text parts are ALL internal reasoning (e.g. "Establishing a Tone", "Offering a Greeting"). The heuristic filter at turnComplete tries to extract "dialogue" but there IS no dialogue text — only thinking text.
- **Fix:** Stop trying to extract dialogue from thinking. Instead: (1) suppress all thinking text, (2) show user's spoken question in chat, (3) show "Ed responded via voice" as the assistant message after turnComplete.

### Problem 2: Auto-navigation without consent
- **Root cause:** `Ed.ts:1972-2002` — `handleAutoNavigation()` does keyword matching ("take me to", "go to") and navigates after 1.5s delay without asking. No permission check. No confirmation.
- **Fix:** Replace with a confirmation-based flow. Match user intent to APPS registry entries, check role permissions, show a confirmation card with Yes/No buttons.

### Problem 3: No confirmation UI pattern
- **Root cause:** Chat.ts has `quickReplies` but no structured confirmation card with action context. Need a distinct visual card with description text + Yes/No buttons.
- **Fix:** Add a `ConfirmationCard` type to the Message system and render it in Chat.ts.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/ed-widget/src/types.ts` | Modify | Add `confirmation` field to Message type |
| `packages/ed-widget/src/voice/gemini-live.ts` | Modify | Suppress thinking text, emit voice-response signal |
| `packages/ed-widget/src/components/Chat.ts` | Modify | Render confirmation cards with Yes/No buttons |
| `packages/ed-widget/src/Ed.ts` | Modify | Voice transcript handling, navigation with confirmation, action confirmations |
| `packages/ed-widget/src/nav/nav-matcher.ts` | Create | Match user questions to APPS registry, permission checking |

---

### Task 1: Add confirmation type to Message

**Files:**
- Modify: `packages/ed-widget/src/types.ts:48-56`

- [ ] **Step 1: Add ConfirmationAction and update Message interface**

In `packages/ed-widget/src/types.ts`, add after the `Message` interface:

```typescript
export interface ConfirmationAction {
  id: string;
  description: string;          // "I can take you to the Energy Dashboard"
  confirmLabel?: string;        // "Yes, take me there" (default: "Yes")
  declineLabel?: string;        // "No thanks" (default: "No thanks")
  action: string;               // serialized action type: "navigate:/dashboard/estates/energy"
  resolved?: boolean;           // true once user responds
  choice?: 'confirmed' | 'declined';
}
```

Add `confirmation?: ConfirmationAction` to the existing `Message` interface:

```typescript
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  language?: string;
  translation?: string;
  quickReplies?: string[];
  confirmation?: ConfirmationAction;  // <-- add this line
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/ed-widget/src/types.ts
git commit -m "feat(ed-widget): add ConfirmationAction type to Message"
```

---

### Task 2: Fix voice transcript — suppress thinking text

**Files:**
- Modify: `packages/ed-widget/src/voice/gemini-live.ts:53-54,66-67,260-320`

- [ ] **Step 1: Add a turnComplete callback to GeminiLiveCallbacks**

In `gemini-live.ts`, update the `GeminiLiveCallbacks` interface (line ~17-21):

```typescript
export interface GeminiLiveCallbacks {
  onStateChange?: (state: GeminiLiveState) => void;
  onTranscript?: (text: string) => void;
  onTurnComplete?: () => void;    // <-- add: fires when Ed finishes speaking
  onError?: (error: string) => void;
}
```

- [ ] **Step 2: Remove the thinking-text filter and emit turnComplete signal instead**

Replace the entire `turnTextParts` accumulation and filtering system. In the class properties (~line 66-67), remove `turnTextParts`:

```typescript
// DELETE this line:
// private turnTextParts: string[] = [];
```

In `handleMessage()`, replace the `content.turnComplete` block (~line 286-318) with:

```typescript
        if (content.turnComplete) {
          console.log("[GeminiLive] Turn complete");
          this.callbacks.onTurnComplete?.();
          return;
        }
```

In the `parts` loop (~line 322-334), remove the text accumulation — only handle audio:

```typescript
        const parts = content.modelTurn?.parts;
        if (parts) {
          for (const part of parts) {
            // Suppress all text parts — Gemini native audio sends only
            // thinking/reasoning text, not dialogue. The response IS audio.
            if (part.inlineData?.mimeType?.startsWith("audio/")) {
              if (this.state !== "speaking") this.setState("speaking");
              const buf = this.base64ToArrayBuffer(part.inlineData.data);
              this.enqueueAudio(buf);
            }
          }
        }
```

- [ ] **Step 3: Commit**

```bash
git add packages/ed-widget/src/voice/gemini-live.ts
git commit -m "fix(ed-widget): suppress Gemini thinking text from voice chat"
```

---

### Task 3: Update Ed.ts voice callbacks — show "Ed responded via voice"

**Files:**
- Modify: `packages/ed-widget/src/Ed.ts:272-325`

- [ ] **Step 1: Replace onTranscript with onTurnComplete in Gemini Live callbacks**

In `Ed.ts`, find the `this.geminiLive.on({...})` block (~line 273-324). Replace the `onTranscript` callback with `onTurnComplete`:

```typescript
      this.geminiLive.on({
        onStateChange: (state) => {
          console.log("[Ed] Gemini Live state:", state);
          if (state === "listening") {
            this.isListening = true;
            this.dock?.setListening(true);
            this.statusPill?.setState("listening");
            this.particle3D?.morphTo("lightbulb");
          } else if (state === "speaking") {
            this.isListening = false;
            this.dock?.setListening(false);
            this.statusPill?.setState("ready");
            this.particle3D?.morphTo("speech");
          } else if (state === "idle" || state === "error") {
            this.isListening = false;
            this.dock?.setListening(false);
            this.statusPill?.setState("ready");
            this.particle3D?.morphTo("sphere");
          }
        },
        onTurnComplete: () => {
          // Ed finished speaking via voice — add a simple chat record
          // Don't show thinking text; the audio IS the response
          this.addMessage({
            id: `gemini-${crypto.randomUUID()}`,
            role: "assistant",
            content: "Ed responded via voice",
            timestamp: new Date(),
          });
        },
        onError: (err) => {
          console.error("[Ed] Gemini Live error:", err);
          this.addMessage({
            id: crypto.randomUUID(),
            role: "system",
            content: `\uD83C\uDF99 ${err}`,
            timestamp: new Date(),
          });
        },
      });
```

Note: The user's spoken question is already captured by the Web Speech API fallback (`this.voice.onResult`), but during Gemini Live mode the user speaks directly into the WebSocket — their words are not transcribed locally. For now, this is acceptable per the brief ("simplest approach").

- [ ] **Step 2: Commit**

```bash
git add packages/ed-widget/src/Ed.ts
git commit -m "fix(ed-widget): show 'Ed responded via voice' instead of thinking text"
```

---

### Task 4: Create navigation matcher utility

**Files:**
- Create: `packages/ed-widget/src/nav/nav-matcher.ts`

- [ ] **Step 1: Create the nav matcher**

This utility matches user questions to platform apps using keyword matching against the APPS registry. It's a lightweight client-side matcher — not AI-powered (that comes later via the orchestrator).

Create `packages/ed-widget/src/nav/nav-matcher.ts`:

```typescript
/**
 * Nav Matcher — matches user questions to platform navigation targets.
 * Uses keyword matching against a built-in app directory.
 */

export interface NavTarget {
  id: string;
  name: string;
  route: string;
  description: string;
  requiredRoles: string[];
  keywords: string[];
}

export interface NavMatch {
  target: NavTarget;
  score: number;
  reason: string;
}

/**
 * Built-in app directory — subset of APPS from registry.ts.
 * We inline this rather than importing from the platform package because
 * ed-widget is a standalone vanilla TS package with no platform dependency.
 */
const APP_DIRECTORY: NavTarget[] = [
  { id: "governance-home", name: "Governance Portal", route: "/dashboard/governance", description: "Governor directory, meetings and oversight", requiredRoles: ["admin", "headteacher", "slt", "governor"], keywords: ["governance", "governor", "board", "trustee", "director"] },
  { id: "ofsted-readiness", name: "Ofsted Readiness", route: "/dashboard/ofsted-readiness", description: "Track framework compliance", requiredRoles: ["admin", "headteacher", "slt", "teacher"], keywords: ["ofsted", "inspection", "readiness", "framework", "judgement"] },
  { id: "sef-builder", name: "SEF Builder", route: "/dashboard/sef", description: "Draft self-evaluation reports", requiredRoles: ["admin", "headteacher", "slt"], keywords: ["sef", "self-evaluation", "self evaluation"] },
  { id: "sdp-builder", name: "SDP Builder", route: "/dashboard/sdp", description: "Manage development plans", requiredRoles: ["admin", "headteacher", "slt"], keywords: ["sdp", "development plan", "school development"] },
  { id: "action-plan", name: "Action Plan", route: "/dashboard/action-plan", description: "Track strategic tasks", requiredRoles: ["admin", "headteacher", "slt", "teacher"], keywords: ["action plan", "actions", "strategic"] },
  { id: "siams-readiness", name: "SIAMS Readiness", route: "/dashboard/siams", description: "Church school inspection preparation", requiredRoles: ["admin", "headteacher", "slt", "teacher", "governor"], keywords: ["siams", "church school", "church inspection", "diocese"] },
  { id: "evidence-vault", name: "My Evidence", route: "/evidence", description: "Central evidence library", requiredRoles: ["admin", "headteacher", "slt", "teacher"], keywords: ["evidence", "documents", "proof", "files"] },
  { id: "estates-home", name: "Estates", route: "/dashboard/estates", description: "Premises, maintenance and contractor management", requiredRoles: ["admin", "headteacher", "slt", "caretaker"], keywords: ["estates", "building", "premises", "maintenance", "contractor", "repair", "facility"] },
  { id: "estates-energy", name: "Energy Dashboard", route: "/dashboard/estates/energy", description: "Energy usage and sustainability tracking", requiredRoles: ["admin", "headteacher", "slt", "caretaker"], keywords: ["energy", "electricity", "gas", "utility", "utilities", "carbon", "sustainability"] },
  { id: "estates-helpdesk", name: "Helpdesk", route: "/dashboard/estates/helpdesk", description: "Report and track maintenance issues", requiredRoles: ["admin", "headteacher", "slt", "teacher", "caretaker"], keywords: ["helpdesk", "report issue", "broken", "fix", "repair request", "maintenance request"] },
  { id: "compliance-home", name: "Compliance", route: "/dashboard/compliance", description: "Statutory policy management and training compliance", requiredRoles: ["admin", "headteacher", "slt", "governor"], keywords: ["compliance", "policy", "policies", "statutory", "gdpr", "training compliance"] },
  { id: "hr-people", name: "Staff Directory", route: "/dashboard/hr/people", description: "Manage school staff", requiredRoles: ["admin", "headteacher", "slt"], keywords: ["staff", "hr", "people", "employee", "teacher list", "staff directory"] },
  { id: "safeguarding-home", name: "Safeguarding", route: "/dashboard/safeguarding", description: "Concern logging and DSL triage", requiredRoles: ["admin", "headteacher", "slt"], keywords: ["safeguarding", "concern", "dsl", "welfare", "child protection"] },
  { id: "attendance-home", name: "Attendance", route: "/dashboard/attendance", description: "Registration and persistent absence tracking", requiredRoles: ["admin", "headteacher", "slt", "teacher"], keywords: ["attendance", "absence", "register", "persistent absence", "late"] },
  { id: "send-home", name: "SEND", route: "/modules/send", description: "SEN register and EHCP management", requiredRoles: ["admin", "headteacher", "slt", "teacher"], keywords: ["send", "sen", "ehcp", "special needs", "inclusion", "senco"] },
  { id: "intelligence-home", name: "School Intelligence", route: "/dashboard/intelligence", description: "Data analysis, cohort tracking, EEF research", requiredRoles: ["admin", "headteacher", "slt"], keywords: ["intelligence", "data", "cohort", "attainment", "progress", "eef", "analysis", "gap"] },
  { id: "risk-register", name: "Risk Register", route: "/dashboard/risk", description: "Enterprise risk management", requiredRoles: ["admin", "headteacher", "slt", "governor"], keywords: ["risk", "risk register", "heatmap", "mitigation"] },
  { id: "meetings", name: "Meetings", route: "/dashboard/meetings", description: "Meeting companion with agendas and minutes", requiredRoles: ["admin", "headteacher", "slt", "teacher", "governor"], keywords: ["meeting", "meetings", "agenda", "minutes", "minute"] },
  { id: "documents", name: "Documents", route: "/dashboard/documents", description: "Document production and templates", requiredRoles: ["admin", "headteacher", "slt"], keywords: ["document", "documents", "template", "letter", "newsletter"] },
  { id: "surveys", name: "Surveys", route: "/dashboard/surveys", description: "Survey builder and analysis", requiredRoles: ["admin", "headteacher", "slt"], keywords: ["survey", "surveys", "questionnaire", "feedback", "poll"] },
  { id: "website-home", name: "Website Builder", route: "/dashboard/website", description: "School website design and publishing", requiredRoles: ["admin", "headteacher", "slt"], keywords: ["website", "web", "site", "publish", "page", "homepage"] },
  { id: "tasks", name: "Tasks", route: "/dashboard/tasks", description: "Unified task management", requiredRoles: ["admin", "headteacher", "slt", "teacher", "governor", "caretaker"], keywords: ["task", "tasks", "todo", "to-do", "to do"] },
];

/**
 * Match a user question to a navigation target.
 * Returns the best match above threshold, or null.
 */
export function matchNavigation(question: string): NavMatch | null {
  const lower = question.toLowerCase();
  let bestMatch: NavMatch | null = null;
  let bestScore = 0;

  for (const target of APP_DIRECTORY) {
    let score = 0;
    let matchedKeyword = "";

    for (const keyword of target.keywords) {
      if (lower.includes(keyword)) {
        // Longer keyword matches = higher confidence
        const keywordScore = keyword.length;
        if (keywordScore > score) {
          score = keywordScore;
          matchedKeyword = keyword;
        }
      }
    }

    // Also match against the app name
    if (lower.includes(target.name.toLowerCase())) {
      score = Math.max(score, target.name.length);
      matchedKeyword = target.name;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        target,
        score,
        reason: `Matched keyword "${matchedKeyword}"`,
      };
    }
  }

  // Threshold: at least 3 chars matched (avoids "hr" false positives on "where")
  return bestScore >= 3 ? bestMatch : null;
}

/**
 * Check if a user role has permission to access a nav target.
 */
export function hasPermission(target: NavTarget, userRole: string | undefined): boolean {
  if (!userRole) return false;
  return target.requiredRoles.includes(userRole.toLowerCase());
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/ed-widget/src/nav/nav-matcher.ts
git commit -m "feat(ed-widget): add navigation matcher utility"
```

---

### Task 5: Render confirmation cards in Chat.ts

**Files:**
- Modify: `packages/ed-widget/src/components/Chat.ts:52-114`

- [ ] **Step 1: Add onConfirmation callback to Chat constructor**

Update the Chat class to accept a confirmation callback:

```typescript
export class Chat {
  private container: HTMLElement;
  private messagesContainer: HTMLElement;
  private messages: Message[] = [];
  private onQuickReply?: (text: string) => void;
  private onConfirmation?: (confirmationId: string, choice: 'confirmed' | 'declined') => void;

  constructor(
    container: HTMLElement,
    onQuickReply?: (text: string) => void,
    onConfirmation?: (confirmationId: string, choice: 'confirmed' | 'declined') => void,
  ) {
    this.container = container;
    this.messagesContainer = document.createElement("div");
    this.onQuickReply = onQuickReply;
    this.onConfirmation = onConfirmation;
    this.render();
  }
```

- [ ] **Step 2: Add confirmation card rendering in renderMessage()**

After the `quickReplies` block in `renderMessage()` (~line 68-89), add confirmation card rendering:

```typescript
    // Render confirmation card
    if (message.confirmation && !message.confirmation.resolved) {
      const card = document.createElement("div");
      card.className = "ed-confirmation-card";
      card.innerHTML = `
        <div class="ed-confirmation-buttons">
          <button class="ed-confirm-btn ed-confirm-yes">${message.confirmation.confirmLabel || "Yes"}</button>
          <button class="ed-confirm-btn ed-confirm-no">${message.confirmation.declineLabel || "No thanks"}</button>
        </div>
      `;

      const confirmId = message.confirmation.id;
      const yesBtn = card.querySelector(".ed-confirm-yes") as HTMLButtonElement;
      const noBtn = card.querySelector(".ed-confirm-no") as HTMLButtonElement;

      yesBtn.addEventListener("click", () => {
        this.resolveConfirmation(message, "confirmed", card);
      });
      noBtn.addEventListener("click", () => {
        this.resolveConfirmation(message, "declined", card);
      });

      messageEl.appendChild(card);
    }

    // Show resolved confirmation state
    if (message.confirmation?.resolved) {
      const resolved = document.createElement("div");
      resolved.className = "ed-confirmation-resolved";
      resolved.textContent = message.confirmation.choice === "confirmed"
        ? "\u2705 Confirmed"
        : "\u274C Declined";
      messageEl.appendChild(resolved);
    }
```

- [ ] **Step 3: Add resolveConfirmation helper method to Chat class**

```typescript
  private resolveConfirmation(
    message: Message,
    choice: 'confirmed' | 'declined',
    card: HTMLElement,
  ): void {
    if (message.confirmation) {
      message.confirmation.resolved = true;
      message.confirmation.choice = choice;
    }

    // Replace buttons with resolution text
    card.innerHTML = `<div class="ed-confirmation-resolved">${
      choice === "confirmed" ? "\u2705 Confirmed" : "\u274C Declined"
    }</div>`;

    this.onConfirmation?.(message.confirmation?.id || "", choice);
  }
```

- [ ] **Step 4: Commit**

```bash
git add packages/ed-widget/src/components/Chat.ts
git commit -m "feat(ed-widget): add confirmation card rendering to Chat"
```

---

### Task 6: Wire up smart navigation with confirmation in Ed.ts

**Files:**
- Modify: `packages/ed-widget/src/Ed.ts` — multiple locations

- [ ] **Step 1: Import nav matcher and update Chat initialization**

Add import at top of Ed.ts:

```typescript
import { matchNavigation, hasPermission } from "./nav/nav-matcher";
```

Find where `this.chat` is constructed (search for `new Chat(`) and add the confirmation callback as the third argument:

```typescript
this.chat = new Chat(
  chatContainer,
  (text) => this.handleUserInput(text),
  (confirmationId, choice) => this.handleConfirmation(confirmationId, choice),
);
```

- [ ] **Step 2: Replace handleAutoNavigation with handleSmartNavigation**

Replace the existing `handleAutoNavigation` method (~line 1972-2002) with:

```typescript
  /**
   * Smart navigation — check if user's question relates to a platform area,
   * then show a confirmation card instead of auto-navigating.
   */
  private handleSmartNavigation(userQuestion: string): void {
    const match = matchNavigation(userQuestion);
    if (!match) return;

    const { target } = match;

    // Check user role permissions
    const userRole = (this.config as any).userRole;
    if (!hasPermission(target, userRole)) {
      this.addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: `I can see the **${target.name}** might be relevant, but you don't currently have access to that area. You may want to speak to your headteacher or admin about permissions.`,
        timestamp: new Date(),
      });
      return;
    }

    // Show confirmation card
    this.addMessage({
      id: crypto.randomUUID(),
      role: "assistant",
      content: `I can see information about that. Would you like me to take you to the **${target.name}**? ${target.description}.`,
      timestamp: new Date(),
      confirmation: {
        id: `nav-${crypto.randomUUID()}`,
        description: `Navigate to ${target.name}`,
        confirmLabel: "Yes, take me there",
        declineLabel: "No thanks",
        action: `navigate:${target.route}`,
      },
    });
  }
```

- [ ] **Step 3: Update the call site — replace handleAutoNavigation with handleSmartNavigation**

In `handleUserInput()` (~line 1531), replace:

```typescript
    this.handleAutoNavigation(text, response);
```

with:

```typescript
    this.handleSmartNavigation(text);
```

- [ ] **Step 4: Add handleConfirmation method**

Add after `handleSmartNavigation`:

```typescript
  /**
   * Handle user's response to a confirmation card.
   */
  private handleConfirmation(confirmationId: string, choice: 'confirmed' | 'declined'): void {
    // Log the decision in chat
    this.addMessage({
      id: crypto.randomUUID(),
      role: "system",
      content: choice === "confirmed"
        ? "\u2705 Action confirmed"
        : "\u274C Action declined",
      timestamp: new Date(),
    });

    if (choice !== "confirmed") return;

    // Find the confirmation in message history
    const msg = this.messages.find(
      (m) => m.confirmation?.id === confirmationId,
    );
    if (!msg?.confirmation) return;

    const action = msg.confirmation.action;

    // Handle action types
    if (action.startsWith("navigate:")) {
      const route = action.replace("navigate:", "");
      // Navigate after brief delay so user sees the confirmation
      setTimeout(() => {
        window.location.href = route;
      }, 500);
    }
    // Future: handle "create:", "update:", "delete:" action types here
  }
```

- [ ] **Step 5: Handle voice "yes"/"no" during active confirmation**

In `handleUserInput()`, add an early check at the very beginning of the method (before form fill check, ~line 935):

```typescript
    // Check for voice yes/no response to active confirmation
    const lowerInput = text.toLowerCase().trim();
    if (lowerInput === "yes" || lowerInput === "no" || lowerInput === "no thanks" || lowerInput === "yeah" || lowerInput === "nah") {
      const pendingConfirmation = this.messages
        .filter((m) => m.confirmation && !m.confirmation.resolved)
        .pop();

      if (pendingConfirmation?.confirmation) {
        const choice = (lowerInput === "yes" || lowerInput === "yeah") ? "confirmed" : "declined";
        // Add user message showing their spoken choice
        this.addMessage({
          id: crypto.randomUUID(),
          role: "user",
          content: text,
          timestamp: new Date(),
          language: this.currentLanguage.code,
        });
        // Resolve the confirmation
        pendingConfirmation.confirmation.resolved = true;
        pendingConfirmation.confirmation.choice = choice;
        this.handleConfirmation(pendingConfirmation.confirmation.id, choice);
        return;
      }
    }
```

- [ ] **Step 6: Commit**

```bash
git add packages/ed-widget/src/Ed.ts
git commit -m "feat(ed-widget): smart navigation with confirmation cards and voice support"
```

---

### Task 7: Add confirmation card CSS

**Files:**
- Modify: The CSS file for ed-widget (inline styles or the main stylesheet)

- [ ] **Step 1: Find and update the widget CSS**

The ed-widget uses inline styles and a CSS file. Add these styles for confirmation cards. Find the widget's CSS (likely in `packages/ed-widget/src/styles/` or injected inline).

Add these styles:

```css
.ed-confirmation-card {
  margin-top: 8px;
  padding: 0;
}

.ed-confirmation-buttons {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.ed-confirm-btn {
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: all 150ms ease;
  font-family: inherit;
}

.ed-confirm-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.ed-confirm-yes {
  background: rgba(45, 212, 191, 0.2);
  border-color: rgba(45, 212, 191, 0.4);
  color: #2dd4bf;
}

.ed-confirm-yes:hover {
  background: rgba(45, 212, 191, 0.35);
}

.ed-confirm-no {
  opacity: 0.7;
}

.ed-confirmation-resolved {
  font-size: 12px;
  opacity: 0.6;
  margin-top: 4px;
  padding: 2px 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/ed-widget/src/
git commit -m "style(ed-widget): add confirmation card styles"
```

---

### Task 8: Build and verify

- [ ] **Step 1: Build the ed-widget package**

```bash
cd packages/ed-widget && npm run build
```

Verify no TypeScript errors. Fix any import issues.

- [ ] **Step 2: Manual verification**

Open the dev server (port 3001), open Ed widget:
1. Start voice chat — verify no thinking text appears, "Ed responded via voice" shows after speaking
2. Type "show me the energy dashboard" — verify confirmation card appears with Yes/No buttons
3. Click "No thanks" — verify it resolves with declined state
4. Type "take me to governance" — verify confirmation with correct route
5. Click "Yes, take me there" — verify navigation occurs

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(ed-widget): complete voice transcript fix + smart navigation with confirmations"
```

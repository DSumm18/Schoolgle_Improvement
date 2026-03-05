# Ed: "The Go-To Person in the Office"

## The Concept

> "Ed is that person in the office who knows how to do everything, but you can never find when you need them. Now you can."

---

## Making Ed Always Accessible

### The Problem: Where IS Ed?

Currently Ed is hidden in various places:
- Dashboard chat widget (when on dashboard pages)
- Extension (when installed)
- Individual feature pages

**Users shouldn't have to hunt for Ed.**

---

## Solution: Ed is EVERYWHERE

```
┌─────────────────────────────────────────────────────────────────┐
│                    ED OMNIPRESENCE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. GLOBAL FLOATING BUTTON                                     │
│     ┌─────┐                                                     │
│     │  Ed │  ← Bottom-right, ALWAYS VISIBLE                   │
│     │  💬 │     Click for instant help                         │
│     └─────┘                                                     │
│                                                                 │
│  2. KEYBOARD SHORTCUT                                         │
│     Ctrl + Shift + E (or Cmd + Shift + E)                     │
│     Opens Ed anywhere                                         │
│                                                                 │
│  3. CONTEXT MENU                                             │
│     Right-click any form → "Ask Ed to help fill this"        │
│                                                                 │
│  4. SMART DETECTION                                            │
│     Ed detects you're struggling → "I can help!"              │
│                                                                 │
│  5. SLASH COMMAND                                             │
│     Type /ed or /help in any search box                      │
│                                                                 │
│  6. DASHBOARD HUB                                              │
│     Central "Ask Ed" widget on dashboard                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Global Floating Button

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    [Your Page Content]                          │
│                                                                 │
│  ┌─────────────┐                                               │
│  │  ┌─────┐    │  Floating button ALWAYS visible:                 │
│  │  │ Ed │    │  • Bottom-right corner                                │
│  │  │ 💬 │    │  • Z-index: 9999 (always on top)                  │
│  │  └─────┘    │  • Pulsing dot when new help available         │
│  │             │  • Click: Opens Ed chat panel                    │
│  └─────────────┘                                               │
│                                                                 │
│  Badge variations:                                              │
│  🔴 3 unread messages                                           │
│  🟢 Ready to help                                              │
│  🟡 Working on something                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Positioning logic:**
- On dashboard: Moves to avoid blocking key UI
- On forms: Moves near the active form
- On scroll: Stays in viewport
- Mobile: Bottom center (thumb-friendly)

---

## 2. Keyboard Shortcut: The Panic Button

```
Press Ctrl + Shift + E (or Cmd + Shift + E on Mac)

┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💬 Ed                                                 │   │
│  │                                                      │   │
│  │  How can I help? I can assist with:                    │   │
│  │                                                      │   │
│  │  📝 Fill forms                                        │   │
│  │  🔍 Search school knowledge                            │   │
│  │  📊 Check data/compliance                              │   │
│  │  📧 Draft communications                              │   │
│  │  📋 Complete tasks                                     │   │
│  │  💡 Explain something                                  │   │
│  │                                                      │   │
│  │  Or just ask me anything!                             │   │
│  │                                                      │   │
│  │  [─────────────────────────]                        │   │
│  │  │ Type your question...     │                        │   │
│  │  └─────────────────────────┘                        │   │
│  │                                                      │   │
│  │  Recent:                                            │   │
│  │  • How do I report a safeguarding issue?              │   │
│  │  • What's the deadline for free school meals?         │   │
│  │  • Where do I find the risk assessment template?       │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                             │
│  [Close with ESC]                                           │
│                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Right-Click Context Menu

```
When user right-clicks on any element:

┌─────────────────────────────────────┐
│  Back                               │
│  Reload                             │
│  ─────────────────────────────────  │
│  Save as...                         │
│  Print...                           │
│  ─────────────────────────────────  │
│  🤖 Ask Ed to explain this         │  ← NEW
│  📝 Ask Ed to fill this form       │  ← NEW
│  💡 Ask Ed how to complete this    │  ← NEW
│  🔍 Ask Ed about [text]           │  ← NEW
│  ─────────────────────────────────  │
│  Inspect                            │
└─────────────────────────────────────┘
```

**Smart menu items:**
- Highlight text → "Ask Ed about [text]"
- Click form → "Ask Ed to fill this form"
- Click button → "Ask Ed what this does"
- Click file → "Ask Ed how to use this"

---

## 4. Smart Detection: "I Can Help!"

Ed notices when users are struggling:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Ed noticed you might need help                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  I see you've been on this page for 5 minutes                 │
│  and haven't submitted. This is a common issue with          │
│  RIDDOR reporting - would you like guidance?                  │
│                                                                 │
│  [Tell me how]  [No thanks, I've got this]                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Triggers for help offer:**
- Spent >5 min on a form page without submitting
- Repeated failed submissions
- Searching for same term 3+ times
- On pages with known complexity (RIDDOR, SEND, etc.)
- Time of day (e.g., Friday afternoon when people rush)

---

## 5. Slash Commands: /ed Anywhere

```
In any search box (Unified Search, help search, etc.):

User types: /ed how do I report sickness
     OR /ed riddor
     OR /ed help with forms

Result: Opens Ed with the answer loaded
```

---

## 6. Dashboard Hub: The "Ask Ed" Center

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   DASHBOARD                             │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  ┌─────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
│  │  │ Ed  │  │ Actions │  │ Tasks   │  │ Reports │   │   │
│  │  │ Hub │  │         │  │         │  │         │   │   │
│  │  └─────┘  └─────────┘  └─────────┘  └─────────┘   │   │
│  │                                                          │   │
│  │              ASK ED - I'm here to help                   │   │
│  │              ═───────────────╡                          │   │
│  │              ║ What do you need? ║                          │   │
│  │              ╚═════════════════╝                          │   │
│  │                       or                                   │   │
│  │              ═───────────────────╡                       │   │
│  │              ║ "How do I...?"      ║                       │   │
│  │              ╚═════════════════════╝                       │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Ed Hub features:**
- Quick actions (common tasks)
- Recent questions from this school
- What others are asking right now
- School-specific shortcuts

---

## Implementation: Floating Button

```typescript
// packages/ed-extension/src/content/floating-ed-button.ts

class FloatingEdButton {
  private button: HTMLDivElement | null = null;
  private badge: HTMLDivElement | null = null;
  private panel: HTMLDivElement | null = null;

  attach() {
    // Create floating button
    this.button = document.createElement('div');
    this.button.id = 'ed-floating-button';
    this.button.innerHTML = `
      <div class="ed-avatar">
        <span class="ed-face">🎓</span>
      </div>
      <div class="ed-badge-count" style="display: none;">0</div>
    `;

    // Create slide-out panel
    this.panel = document.createElement('div');
    this.panel.id = 'ed-panel';
    this.panel.innerHTML = this.getPanelContent();

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #ed-floating-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      #ed-floating-button:hover {
        transform: scale(1.1);
      }

      .ed-avatar {
        width: 56px;
        height: 56px;
        border-radius: 28px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ed-face {
        font-size: 24px;
      }

      .ed-badge-count {
        position: absolute;
        top: 0;
        right: 0;
        background: #ef4444;
        color: white;
        font-size: 11px;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 18px;
        text-align: center;
      }

      #ed-panel {
        position: fixed;
        bottom: 90px;
        right: 24px;
        width: 320px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      #ed-panel.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.panel);
    document.body.appendChild(this.button);

    // Event listeners
    this.button.addEventListener('click', () => this.togglePanel());
  }

  togglePanel() {
    const isOpen = this.panel?.classList.contains('open');
    if (isOpen) {
      this.panel?.classList.remove('open');
    } else {
      this.panel?.classList.add('open');
      // Focus input
      setTimeout(() => {
        const input = this.panel?.querySelector('#ed-search-input');
        input?.focus();
      }, 300);
    }
  }
}
```

---

## Ed's Identity: Personality & Positioning

### Who Ed Is

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Ed is your helpful, knowledgeable colleague who:                 │
│                                                                 │
│  • Knows where everything is                                    │
│  • Can explain complex processes simply                         │
│  • Helps with forms, reports, compliance                       │
│  • Knows the right people to talk to                            │
│  • Is always friendly, never judges                              │
│  • Handles the boring admin so you don't have to                 │
│                                                                 │
│  Ed is NOT:                                                     │
│  • A replacement for you                                        │
│  • Someone who will make decisions for you                      │
│  • A robot who blindly follows orders                           │
│  • Available 24/7 (needs sleep too!)                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Sample Conversations

```
TEACHER: "Ed, how do I report a safeguarding issue?"

ED: "Great question. Safeguarding reports are important.
    I can walk you through it.

    First, do you have the concern details?
    - Name of the child
    - What happened
    - When it happened
    - Who else was involved

    Once you tell me, I can help you fill in the online form
    or I can show you how to do it yourself. Which would you prefer?"

TEACHER: "Fill it in for me please."

ED: "Of course. I'll ask you a few questions, then show you what
    I'll fill before submitting. Sound good?"
```

---

## Accessibility Points

```
Multiple ways to reach Ed:

┌─────────────────────────────────────────────────────────────────┐
│  │                                                               │
│  MOUSE USERS        │    KEYBOARD USERS    │    VOICE USERS    │
│  │                   │                      │    │                   │
│  Click floating     │    Ctrl+Shift+E      │    "Hey Ed"        │
│  button (always     │                      │    │                   │
│  visible)           │    OR type /ed       │    │                   │
│  │                   │    in search          │    │                   │
│  Right-click →      │    → Ed opens        │    │                   │
│  "Ask Ed"           │                        │    │                   │
│  │                   │                        │    │                   │
│  Dashboard →        │    Cmd+Shift+E       │    │                   │
│  "Ask Ed" widget    │    (Mac)              │    │                   │
│  │                   │                        │    │                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mobile Considerations

```
Mobile view:

┌─────────────────────────┐
│                         │
│  [Your page content]    │
│                         │
│         💬 Ed           │  ← Bottom center, thumb-friendly
│                         │     Easy to reach with one hand
│                         │
└─────────────────────────┘

Swipe up from Ed → Full panel
Tap Ed → Quick actions menu
```

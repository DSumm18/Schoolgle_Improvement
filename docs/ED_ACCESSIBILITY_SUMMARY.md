# Ed: Always There When You Need Help

## The Concept

> "Ed is that person in the office who knows how to do everything, but you can never find when you need them. Now you can."

---

## The Problem: Where IS Ed?

Currently:
- ❌ Ed is hidden in dashboard (only works on dashboard pages)
- ❌ Extension needs to be installed first
- ❌ No obvious way to "just ask Ed"
- ❌ User has to remember where Ed lives

**The Solution: Ed is EVERYWHERE**

---

## Access Points: "Where do I go to get Ed?"

### 1. Floating Button (Always Visible)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    [Your Page]                                 │
│                                                                 │
│                                                    ┌─────┐        │
│                                                    │ Ed │         │
│                                                    │ 💬 │         │
│                                                    └─────┘         │
│                                              Bottom-right corner   │
│                                              Always visible          │
│                                              Click for help          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- **Position**: Bottom-right corner (on desktop) or bottom-center (mobile)
- **Always visible**: Z-index 9999, never hidden by other content
- **Pulsing badge**: Shows unread messages or help available
- **Click**: Opens Ed chat panel with quick actions

### 2. Keyboard Shortcut: Panic Button

```
Press: Ctrl + Shift + E (Windows/Linux)
       Cmd + Shift + E (Mac)

Result: Ed panel opens instantly, anywhere on the site
```

This is the panic button for "I don't know what I'm doing!"

### 3. Right-Click Context Menu

```
Right-click anywhere → "Ask Ed to explain this"
Right-click a form → "Ask Ed to fill this form"
Highlight text → "Ask Ed about [selection]"
```

### 4. Slash Commands

```
In any search box (Unified Search, help search):

Type: /ed how do I report sickness
Type: /ed riddor help
Type: /ed fill forms

Result: Ed opens with the answer loaded
```

### 5. Dashboard Widget

```
Dashboard → Ask Ed Widget

┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   ASK ED                                │   │
│  │              ═───────────────╡                             │   │
│  │              ║ What do you need? ║                             │   │
│  │              ╚═════════════════╝                             │   │
│  │                                                          │   │
│  │  💬 "I don't know how to report a safeguarding issue"       │   │
│  │  💬 "Where do I find the risk assessment template?"       │   │
│  │  💬 "Help me fill in this RIDDOR form"                     │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 6. Smart Detection: Ed Notices You're Struggling

```
Ed notices:
- You've been on a page for 5+ minutes without submitting
- You've attempted to submit 3+ times (validation errors)
- You're searching for the same thing repeatedly
- You're on a page with known complexity (RIDDOR, SEND, etc.)

→ Ed pops up: "I can help with that. Want me to guide you?"
```

---

## When You Click Ed

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💬 Ed                                             │   │
│  │  ┌────────────────────────────────────────────────┐    │   │
│  │  │  Hi! I'm Ed. How can I help?                   │    │   │
│  │  │                                            │    │   │
│  │  │  Quick Actions:                             │    │   │
│  │  │  ┌─────────────────────────────────────┐    │   │
│  │  │  │ 📝 Fill a form      │ │  │  │    │   │
│  │  │  │ 🔍 Search knowledge │  │  │  │    │   │
│  │  │  │ ✉️ Draft email       │  │  │  │    │   │
│  │  │  │ ✅ Check compliance  │  │  │  │    │   │
│  │  │  │  💡 I don't know how │  │  │  │    │   │
│  │  │  │     to...            │  │  │  │    │   │
│  │  │  └─────────────────────────────────────┘    │   │
│  │  │                                            │    │   │
│  │  │  Or just ask me anything!                  │    │   │
│  │  │  ┌─────────────────────────────────────┐    │   │
│  │  │  │ "How do I report sickness absence?" │    │   │
│  │  │  │ ══════════════════════════════════════╡ │    │   │
│  │  │  └─────────────────────────────────────┘    │   │
│  │  │                                            │    │   │
│  │  │  Recent:                                   │    │   │
│  │  │  • How do I report a safeguarding issue?    │    │   │
│  │  │  • Where's the free school meals form?    │    │   │
│  │  │  • RIDDOR reporting deadline              │    │   │
│  │  │                                            │    │   │
│  │  └────────────────────────────────────────┘    │   │
│  │                                                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                     │
│  [Close with ESC]                                   │
│                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Ed's Personality: The Helpful Colleague

```
WHO ED IS:

  The person everyone goes to when they're stuck:
  • "Ed, how do I report a safeguarding issue?"
  • "Ed, where's the RIDDOR form?"
  • "Ed, can you help me with this free school meals application?"
  • "Ed, I don't know how to word this email..."

  Characteristics:
  • Friendly and approachable
  • Knowledgeable about school processes
  • Explains things simply, no jargon
  • Never judges stupid questions
  • Happy to help with anything, no matter how small
  • Knows the right people to talk to
  • Handles boring admin so you don't have to

  NOT:
  • A replacement for you
  • Someone who makes decisions for you
  • A robot who blindly follows orders
```

---

## Examples of Ed in Action

### Example 1: The Struggling SBM

```
SBM: [Staring at RIDDOR form, confused]

ED: [Pops up] "I see you're on the RIDDOR form. This can be
     confusing. Want me to guide you through it?"

SBM: "Yes please"

ED: "Great. First, I need to know when the incident happened.
     Do you have the date and time?"

SBM: "It was this morning, around 10am"

ED: "Got it. Now, what type of incident is this?
     Is it an injury, or something else?"
     [Shows helpful options with explanations]

... continues until form complete ...

ED: "All done. Please review before submitting.
     I'll be here if you need anything else!"
```

### Example 2: The Worried Parent

```
PARENT: [On safeguarding page, doesn't know what to write]

ED: "I can help with this. First, tell me what's
     worrying you in your own words."

PARENT: "My son comes home from school sad every day"

ED: "I understand. Let me help you phrase this for the form.
     Instead of what you said, try this:

     'My child appears unhappy when returning from school.
     He has expressed that he finds reading stressful and
     wants to avoid attending school in the mornings.'

     This is better because:
     • It describes what you observe, not what you assume
     • It's factual without being accusatory
     • It's more likely to get the right support

     Shall I use this wording?"

PARENT: "Yes that sounds better"

ED: [Fills the form with the better wording]
```

### Example 3: The Confused Teacher

```
TEACHER: [Searches "how to report sickness" 3 times]

ED: "I notice you're looking for sickness reporting.
     Would you like me to help?"

TEACHER: "Yes please"

ED: "I can do this two ways:
     1. I can explain the process step by step
     2. I can help you fill in the form right now

     Which would you prefer?"

TEACHER: "Help me fill it"

ED: "Let me open the Bradford Council portal...
     [Navigates to the form]
     First, I need to pull the sickness data from Arbor.
     Do you have the export, or should I walk through it?"

TEACHER: "I have the export"

ED: "Great! Uploading...
     Found 3 sickness records this week:
     - John Smith (Teacher, 2 days)
     - Sarah Jones (TA, 3 days)
     - Ahmed Ali (Site Manager, 5 days)

     I've filled in the form. Please review before submitting.
     [Shows side-by-side comparison]

TEACHER: [Reviews and clicks "Approve & Submit"]

ED: "Done! I've logged this for your records.
     Same time next week? 😊"
```

---

## Implementation Checklist

### Core Components
- [x] Floating button component
- [x] Keyboard shortcut handler (Ctrl+Shift+E)
- [x] Hub API endpoint
- [x] Quick actions system
- [x] Recent questions tracking

### Still Needed
- [ ] Context menu integration
- [ ] Smart detection (struggle detection)
- [ ] Slash command handler
- [ ] Mobile app floating button
- [ ] Voice activation ("Hey Ed")

---

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/ed/hub` | Main hub content |
| `POST /api/ed/hub?action=chat` | Chat with Ed |
| `GET /api/ed/hub?action=search` | Search help |
| `POST /api/ed/hub?action=execute_shortcut` | Run automation |

---

## Summary: Ed is Where You Need Him

| Access Method | When to Use |
|---------------|--------------|
| **Floating button** | Always visible, click anytime |
| **Ctrl+Shift+E** | Panic button, don't know what to do |
| **Right-click** | Context help on specific element |
| **/ed command** | Quick search for help |
| **Dashboard widget** | When logged into dashboard |
| **Smart detection** | Ed notices you're struggling |

**The key: Ed is always one click away, no hunting required!**

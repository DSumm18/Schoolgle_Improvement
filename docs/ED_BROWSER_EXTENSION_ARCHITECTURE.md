# Ed Browser Extension Architecture

## Vision

A Chrome/Edge browser extension that brings Ed (Schoolgle's AI assistant) to any webpage, providing contextual help while users work in third-party school tools.

## Core Features

### 1. Floating Ed Button
- Persistent button in corner of any webpage
- Click to open Ed chat panel
- Draggable position (saves preference)

### 2. Context-Aware Assistance
Ed can:
- Read current page URL and title
- Extract page content (with user permission)
- Detect which tool the user is on (e.g., "You're on Every Budget Builder")
- Offer tool-specific guidance

### 3. Quick Actions
- "Explain this page"
- "Help me fill this form"
- "What should I check before submitting?"
- "Is this GDPR compliant?"

### 4. Schoolgle Integration
- Link back to Toolbox
- Sync conversation history
- Access user's school context (if logged in)

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Extension                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Popup     │    │  Content    │    │ Background  │     │
│  │   (React)   │    │  Script     │    │  Service    │     │
│  │             │    │             │    │  Worker     │     │
│  │ - Settings  │    │ - Inject Ed │    │ - API calls │     │
│  │ - Auth      │    │ - Read DOM  │    │ - Auth      │     │
│  │ - History   │    │ - Chat UI   │    │ - Storage   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                            │                   │            │
│                            ▼                   ▼            │
│                     ┌─────────────────────────────┐        │
│                     │     Schoolgle API           │        │
│                     │  - /api/ed/chat             │        │
│                     │  - /api/ed/context          │        │
│                     │  - /api/auth/extension      │        │
│                     └─────────────────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
packages/ed-extension/
├── manifest.json           # Extension manifest (v3)
├── src/
│   ├── background/
│   │   └── service-worker.ts   # Background service worker
│   ├── content/
│   │   ├── inject.ts           # Content script entry
│   │   ├── EdWidget.tsx        # Floating Ed UI
│   │   └── PageReader.ts       # DOM reading utilities
│   ├── popup/
│   │   ├── Popup.tsx           # Extension popup
│   │   └── Settings.tsx        # User settings
│   ├── shared/
│   │   ├── api.ts              # Schoolgle API client
│   │   ├── storage.ts          # Chrome storage wrapper
│   │   └── types.ts            # Shared types
│   └── styles/
│       └── ed-widget.css       # Injected styles
├── public/
│   ├── icons/                  # Extension icons
│   └── popup.html              # Popup HTML
├── webpack.config.js           # Build config
└── package.json
```

---

## Manifest.json (v3)

```json
{
  "manifest_version": 3,
  "name": "Ed - Schoolgle Assistant",
  "version": "1.0.0",
  "description": "Your AI assistant for school operations tools",
  "permissions": [
    "activeTab",
    "storage",
    "identity"
  ],
  "host_permissions": [
    "https://*.schoolgle.co.uk/*",
    "https://schoolgle.co.uk/*"
  ],
  "optional_host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["ed-widget.css"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/ed-16.png",
      "48": "icons/ed-48.png",
      "128": "icons/ed-128.png"
    }
  },
  "icons": {
    "16": "icons/ed-16.png",
    "48": "icons/ed-48.png",
    "128": "icons/ed-128.png"
  }
}
```

---

## Content Script: Page Context Extraction

```typescript
// content/PageReader.ts

export interface PageContext {
  url: string;
  hostname: string;
  title: string;
  headings: string[];
  forms: FormContext[];
  selectedText: string;
  visibleText: string; // First ~2000 chars of visible text
}

export interface FormContext {
  id: string;
  action: string;
  fields: { name: string; type: string; label?: string }[];
}

export function extractPageContext(): PageContext {
  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .slice(0, 10)
    .map(h => h.textContent?.trim() || '');

  const forms = Array.from(document.querySelectorAll('form'))
    .slice(0, 5)
    .map(form => ({
      id: form.id,
      action: form.action,
      fields: Array.from(form.querySelectorAll('input, select, textarea'))
        .map(field => ({
          name: (field as HTMLInputElement).name,
          type: (field as HTMLInputElement).type,
          label: document.querySelector(`label[for="${field.id}"]`)?.textContent?.trim()
        }))
    }));

  const visibleText = document.body.innerText.slice(0, 2000);

  return {
    url: window.location.href,
    hostname: window.location.hostname,
    title: document.title,
    headings,
    forms,
    selectedText: window.getSelection()?.toString() || '',
    visibleText
  };
}
```

---

## Ed Widget Component

```typescript
// content/EdWidget.tsx

import React, { useState, useEffect } from 'react';
import { extractPageContext, PageContext } from './PageReader';

export function EdWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pageContext, setPageContext] = useState<PageContext | null>(null);

  useEffect(() => {
    // Extract context when widget opens
    if (isOpen) {
      setPageContext(extractPageContext());
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);

    // Send to Schoolgle API with page context
    const response = await fetch('https://schoolgle.co.uk/api/ed/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        context: pageContext,
        conversationId: getConversationId()
      })
    });

    const data = await response.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
  };

  return (
    <div id="ed-widget-root">
      {/* Floating button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="ed-floating-button"
      >
        <EdIcon />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="ed-chat-panel">
          <EdHeader onClose={() => setIsOpen(false)} />
          <EdMessages messages={messages} />
          <EdInput onSend={sendMessage} />
        </div>
      )}
    </div>
  );
}
```

---

## API Endpoint: Ed Chat with Context

```typescript
// apps/platform/src/app/api/ed/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateEdResponse } from '@/lib/ed-ai';

export async function POST(request: NextRequest) {
  const { message, context, conversationId } = await request.json();

  // Build system prompt with page context
  const systemPrompt = buildContextualPrompt(context);

  // Generate response
  const reply = await generateEdResponse({
    systemPrompt,
    userMessage: message,
    conversationId
  });

  return NextResponse.json({ reply });
}

function buildContextualPrompt(context: PageContext | null): string {
  if (!context) {
    return 'You are Ed, a helpful assistant for school staff.';
  }

  return `You are Ed, a helpful assistant for school staff.

The user is currently viewing:
- URL: ${context.hostname}
- Page title: ${context.title}
- Main headings: ${context.headings.join(', ')}

Help them with tasks related to this page. Be concise and practical.
If they're filling a form, offer to explain fields or suggest best practices.
Always consider GDPR and safeguarding when relevant.`;
}
```

---

## Privacy & Security Considerations

### User Consent
- First install: Explain what data Ed can see
- Optional permission: "Allow Ed to read page content"
- Without permission: Ed only sees URL and title

### Data Handling
- Page content is NOT stored
- Sent only when user actively asks Ed a question
- Encrypted in transit (HTTPS)
- No third-party analytics

### Sensitive Site Detection
```typescript
const SENSITIVE_PATTERNS = [
  /bank/i,
  /payment/i,
  /login.*password/i,
  /cpoms/i,  // Safeguarding system
  /myconcern/i
];

function isSensitivePage(url: string): boolean {
  return SENSITIVE_PATTERNS.some(p => p.test(url));
}

// If sensitive, Ed shows reduced context mode
```

---

## Development Roadmap

### Phase 1: MVP (2-3 weeks)
- [ ] Basic extension scaffold
- [ ] Floating button injection
- [ ] Simple chat UI
- [ ] URL-only context (no DOM reading)
- [ ] Connect to existing Ed API

### Phase 2: Context-Aware (2-3 weeks)
- [ ] Page content extraction
- [ ] Form detection
- [ ] Tool-specific prompts (Every, Key, etc.)
- [ ] Chrome storage for preferences

### Phase 3: Deep Integration (4+ weeks)
- [ ] Schoolgle auth sync
- [ ] Conversation history
- [ ] Quick actions based on page type
- [ ] Voice input (reuse Fish Audio)

---

## Distribution

### Chrome Web Store
- Requires developer account ($5 one-time)
- Review process: 1-3 days
- Auto-updates

### Edge Add-ons
- Same codebase (Manifest v3)
- Separate submission
- Good for schools on Microsoft ecosystem

### Direct Install (Development)
- Load unpacked extension
- Useful for pilot schools

---

## Next Steps

1. **Validate demand**: Ask pilot schools if they'd install an extension
2. **Build MVP**: Focus on URL-aware Ed first
3. **Test with real tools**: Try on Every, Key, CPOMS
4. **Gather feedback**: What context is actually useful?
5. **Iterate**: Add features based on real usage

---

## Questions to Answer

- Do schools allow browser extensions?
- IT admin approval process?
- Which browsers do schools use most?
- Privacy policy requirements for Chrome Web Store?


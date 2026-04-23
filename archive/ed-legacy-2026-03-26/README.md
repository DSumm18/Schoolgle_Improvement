# Legacy Ed Chatbot Implementation

**Archived on:** 2026-03-26

## Overview

This archive contains the complete legacy Ed chatbot implementation that was used in the Schoolgle platform prior to the redesign. The code is preserved for reference — some components and patterns may be reused in the new implementation.

## What's Archived

### Components (`/components`)
- **EdChatbot.tsx** — Main chatbot UI component
- **EdChatbotProvider.tsx** — React context provider for Ed state
- **EdWidgetWrapper.tsx** — Wrapper for embedding Ed widget
- **EdShapeParticles.tsx** — Animated orbital particle effects (planet dots)
- **EdAnalysisPanel.tsx** — Analysis panel component
- **/ed-voice** — Voice chat components and Gemini Live integration
- **/ed** — Ed sidebar chat component
- **/browser** — Mobile browser chatbot components
- **/estates-compliance** — Estates-specific Ed controls (EdBrowserControlWrapper, EdChatButton, EdDomainApproval)
- **/assistant** — Global assistant component

### API Routes (`/api`)
- **/ed/chat** — Main chat endpoint
- **/ed/proactive** — Proactive messaging endpoint
- **/ed/embed** — Widget embedding endpoint
- **/ed/website-chat** — Website chat integration
- **/ed/form-*** — Various form-related endpoints
- **/ed/automate** — Automation endpoints
- **/ed/knowledge** — Knowledge base endpoints
- And many more Ed-related API routes

### Packages
- **/packages/ed-widget-src** — Standalone Ed widget package source
  - Chat components
  - Voice integration (Fish Audio, ElevenLabs, Gemini Live, Azure)
  - AI client integration (Gemini, OpenRouter)
  - Feature modules (calendar, form fill, page scan, proactive, website scanner)
  - Themes and styling

- **/packages/ed-agents-src** — AI agents package source
  - 13 specialist agents (estates, hr, send, data, curriculum, it-tech, procurement, governance, communications, form, intelligence, risk, canvas)
  - Orchestrator and intent classifier
  - Skills system
  - Guardrails pipeline
  - Knowledge base integration

### Brand (`/brand`)
- **SchoolglePlanetMark.tsx** — Orbital planet animation component (7 planets orbiting Ed)

## Key Integration Points

### AI Backend
- Uses OpenRouter for model routing
- Primary model: Gemini 2.0 Flash
- Specialist agent system for module-specific queries

### Voice System
- Fish Audio API for Ed's voice
- Gemini Live API for real-time voice interaction
- ElevenLabs as fallback

### State Management
- React Context (EdChatbotProvider)
- Module context awareness based on router path

## Migration Notes

When building the new Ed implementation:

1. **Keep:** The AI agent routing system from `ed-agents` is well-designed
2. **Keep:** The API structure at `/api/ed/chat` — can be reused
3. **Keep:** The orbital animation concept from `SchoolglePlanetMark.tsx`
4. **Refactor:** The chat UI — replace with conventional chatbot interface
5. **Refactor:** The voice system — will be reintegrated with Gemini Live
6. **Preserve:** The module context awareness pattern

## Files NOT Archived

- `node_modules` — Can be restored via `npm install`
- `dist` directories — Can be rebuilt
- Build artifacts — Can be regenerated

---

**Archived by:** Claude Code
**Reason:** Complete redesign of Ed chatbot with new asset pack and inspection mode

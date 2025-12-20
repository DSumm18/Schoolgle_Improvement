# Ed Widget Home Page Integration

## Summary
Replaced the placeholder `EdChatbot` component on the home page with the real `EdWidgetWrapper` component, enabling the full Ed experience (orb, voice, morphing) for both logged-in and logged-out users.

## Changes Made

### 1. Updated `apps/platform/src/app/page.tsx`
- **Replaced**: `EdChatbot` (placeholder) → `EdWidgetWrapper` (real Ed widget)
- **Added**: Auth state detection using `useAuth()` hook
- **Added**: State management for Ed widget (`edOpen`, `edMinimized`)
- **Behavior**: Ed starts open (`edOpen={true}`) to showcase the system on the home page
- **Mode Selection**: 
  - `mode='demo'` when user is **not logged in** (explains system, shows off features)
  - `mode='user'` when user **is logged in** (full functionality)

### 2. Updated `apps/platform/src/components/EdWidgetWrapper.tsx`
- **Added**: `mode` prop (`'demo'` | `'user'`)
- **Demo Mode**: 
  - Disables user-specific features (admissions, policies, calendar, formFill)
  - Keeps voice enabled
  - Ready for custom knowledge/prompts (TODO: when user provides rules)
- **User Mode**: 
  - Full functionality with all features enabled
  - Access to user data and organization context

## Current Behavior

### Logged-Out Users (Demo Mode)
- Ed appears on home page (open by default)
- Voice enabled (Fish Audio)
- Orb animation and morphing enabled
- **Limited features**: No admissions, policies, calendar, or form filling
- **Purpose**: Explain the system, showcase features, prepare for demo

### Logged-In Users (User Mode)
- Ed appears on home page (open by default)
- Voice enabled (Fish Audio)
- Orb animation and morphing enabled
- **Full features**: All functionality including admissions, policies, calendar, form filling
- **Purpose**: Full AI assistant with access to user's organization data

## Next Steps (When User Provides Rules)

The structure is ready for custom demo mode behavior. When you provide the rules for what Ed should do on the home page when not logged in, we can:

1. **Add Custom Knowledge**: 
   ```typescript
   customKnowledge: mode === 'demo' ? [
     "Schoolgle is an AI-powered platform for UK schools...",
     "Key features include...",
     // etc.
   ] : undefined
   ```

2. **Custom Prompts**: Update the Ed widget's AI prompts to be in "demo/marketing mode" when `mode === 'demo'`

3. **Demo-Specific Responses**: Configure Ed to proactively explain features, answer common questions about Schoolgle, etc.

## Files Modified

1. `apps/platform/src/app/page.tsx` - Replaced placeholder with real Ed widget
2. `apps/platform/src/components/EdWidgetWrapper.tsx` - Added mode support

## Testing

1. **Home Page (Not Logged In)**:
   - Visit `/` (home page)
   - Ed widget should appear in bottom-right corner
   - Should be open by default
   - Should have voice, orb, and chat interface
   - Console should show: `[EdWidgetWrapper] 🎭 Demo mode enabled`

2. **Home Page (Logged In)**:
   - Visit `/` while logged in
   - Ed widget should appear with full functionality
   - Console should show: `[EdWidgetWrapper] 👤 User mode enabled`

3. **Dashboard (Logged In)**:
   - Visit `/dashboard` while logged in
   - Ed widget should appear with full functionality (existing behavior)

## Notes

- Ed widget is now consistent across home page and dashboard
- The placeholder `EdChatbot` component still exists but is no longer used
- Fish Audio integration works on home page (same as dashboard)
- The widget creates its own DOM elements (orb, dock, chat) - no React rendering needed


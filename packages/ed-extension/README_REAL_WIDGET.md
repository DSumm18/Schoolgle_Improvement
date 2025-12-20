# Real Ed Widget in Extension

## Overview

The extension now loads the **real Ed widget** (3D particle orb, voice, full AI) instead of the CSS-only approximation.

## How It Works

1. **Content script** (`inject.ts`) tries to load the real widget first
2. **Real widget loader** (`ed-real-widget.ts`):
   - Checks WebGL support
   - Verifies auth + subscription
   - Loads the widget bundle dynamically
   - Falls back to CSS widget if anything fails

3. **Widget bundle** is copied from `packages/ed-widget/dist` during build

## Building

### Prerequisites

1. Build the Ed widget first:
   ```bash
   cd packages/ed-widget
   npm run build
   ```

2. Then build the extension:
   ```bash
   cd packages/ed-extension
   npm run build
   ```

The build script will automatically build the widget if it's not already built.

## Testing

1. **Load extension in Chrome:**
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `packages/ed-extension/dist`

2. **Test auth flow:**
   - Extension should check auth on page load
   - If not logged in, shows access prompt
   - If logged in but no subscription, shows upgrade prompt

3. **Test widget:**
   - Navigate to any website
   - Real Ed orb should appear (3D particle sphere)
   - Click to open chat
   - Voice should work (if API keys configured)

4. **Test fallback:**
   - Disable WebGL in Chrome DevTools
   - Should fall back to CSS orb
   - Widget should still function

## API Keys

The widget needs API keys to function:
- **Gemini API Key** - for AI responses
- **Fish Audio API Key** - for voice synthesis

These are fetched from `/api/ed/keys` endpoint (requires active subscription).

To configure:
1. Add to `.env.local`:
   ```
   GEMINI_API_KEY=your-key
   FISH_AUDIO_API_KEY=your-key
   ```
2. The extension will fetch them automatically when user has subscription

## Troubleshooting

### Widget doesn't load
- Check browser console for errors
- Verify widget bundle exists: `dist/ed-widget/ed-widget.iife.js`
- Check WebGL support: `chrome://gpu`

### Auth fails
- Check `/api/auth/verify` endpoint works
- Verify token in extension storage: `chrome.storage.local.get('ed_auth_token')`

### Subscription check fails
- Check `/api/subscription/check` endpoint
- Verify user has active subscription in database

### Voice doesn't work
- Check mic permission granted
- Verify Fish Audio API key is set
- Check browser console for errors

### Fallback to CSS widget
- WebGL not available (check `chrome://gpu`)
- Auth/subscription check failed
- Widget bundle failed to load
- API keys missing (widget will show error but orb works)

## Files Changed

- `src/content/inject.ts` - Main entry, tries real widget first
- `src/content/ed-real-widget.ts` - Real widget loader
- `src/shared/tool-expertise.ts` - Tool expertise mapping
- `src/background/service-worker.ts` - Added GET_API_KEYS handler
- `build.js` - Copies widget bundle
- `manifest.json` - Added web_accessible_resources for widget bundle



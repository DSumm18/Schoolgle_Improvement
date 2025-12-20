# Setting Up Fish Audio with Edwina Voice

## The Problem

The Chrome extension **cannot** access `.env.local` because:
- `.env.local` is only available to the Next.js app (server-side and build-time)
- The extension runs in a **completely separate context** (browser extension, not Next.js)
- Extension code runs in the browser, not Node.js

## The Solution

You need to copy your API keys from `.env.local` to `chrome.storage.local`.

## Quick Setup (Browser Console)

1. **Open your `.env.local` file** and find these keys:
   - `FISH_AUDIO_API_KEY` (or `NEXT_PUBLIC_FISH_AUDIO_API_KEY`)
   - `OPENROUTER_API_KEY` (or `GEMINI_API_KEY` if using Gemini)

2. **Open browser console** on any website (F12)

3. **Run this command** (replace the values with your actual keys):

```javascript
chrome.storage.local.set({
  ed_config: {
    provider: 'openrouter', // or 'gemini'
    openRouterApiKey: 'your-actual-openrouter-key-from-env-local',
    geminiApiKey: 'your-actual-gemini-key-from-env-local', // if using Gemini
    fishAudioApiKey: 'your-actual-fish-audio-key-from-env-local',
    enableAI: true,
    enableTTS: true,
    ttsProvider: 'fish',
    persona: 'edwina',
    language: 'en-GB',
  }
}, () => {
  console.log('✅ Configuration saved! Reload the page.');
});
```

4. **Reload the page** (or reload the extension in `chrome://extensions/`)

## Alternative: Use the Helper Script

1. Open `packages/ed-extension/scripts/set-config-from-env.js`
2. Copy the script
3. Replace the placeholder keys with your actual keys from `.env.local`
4. Paste and run in browser console

## Verify It Worked

After reloading, check the console for:
- `[Ed Config] Provider: openrouter` (or `gemini`)
- `[Ed Config] TTS: fish`
- `[Ed Config] Keys present: {openrouter: true, gemini: false, fish: true}`

If `fish: true`, Fish Audio is configured! Edwina voice should work.

## Why This Is Necessary

- **Next.js app** → Reads from `.env.local` at build/runtime
- **Chrome extension** → Runs in browser, needs `chrome.storage.local`
- **Different contexts** → Can't share `.env.local` directly

The extension needs its own storage because it runs independently of the Next.js app.


# Copy API Keys from .env.local to Chrome Extension

## Quick Setup Script

1. **Open your `.env.local` file** and copy these values:
   - `OPENROUTER_API_KEY` (or `VITE_OPENROUTER_API_KEY`)
   - `FISH_AUDIO_API_KEY` (or `NEXT_PUBLIC_FISH_AUDIO_API_KEY`)
   - `NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_EDWINA` (optional, for Edwina voice)

2. **Open browser console** on any website (F12)

3. **Paste and run this script** (replace the `'YOUR_KEY_HERE'` values with your actual keys):

```javascript
// Copy your keys from .env.local and paste them here:
const FISH_AUDIO_KEY = 'YOUR_FISH_AUDIO_API_KEY_FROM_ENV_LOCAL';
const OPENROUTER_KEY = 'YOUR_OPENROUTER_API_KEY_FROM_ENV_LOCAL';
const EDWINA_VOICE_ID = 'YOUR_EDWINA_VOICE_ID_FROM_ENV_LOCAL'; // Optional

// Set configuration
chrome.storage.local.set({
  ed_config: {
    provider: 'openrouter',
    openRouterApiKey: OPENROUTER_KEY,
    fishAudioApiKey: FISH_AUDIO_KEY,
    enableAI: true,
    enableTTS: true,
    ttsProvider: 'fish',
    persona: 'edwina',
    language: 'en-GB',
    // Optional: Fish Audio voice IDs
    fishAudioVoiceIds: EDWINA_VOICE_ID ? {
      edwina: EDWINA_VOICE_ID,
    } : undefined,
  }
}, () => {
  console.log('✅ Configuration saved!');
  console.log('🔄 Reload the page to apply.');
  
  // Verify it was saved
  chrome.storage.local.get('ed_config', (result) => {
    console.log('📋 Saved config:', {
      provider: result.ed_config?.provider,
      ttsProvider: result.ed_config?.ttsProvider,
      persona: result.ed_config?.persona,
      hasKeys: {
        openrouter: !!result.ed_config?.openRouterApiKey,
        fish: !!result.ed_config?.fishAudioApiKey,
      },
    });
  });
});
```

4. **Reload the page** - Ed should now use Edwina voice with Fish Audio!

## Why This Is Needed

- `.env.local` is only accessible to the **Next.js app** (server/build time)
- The **Chrome extension** runs in a separate browser context
- Extension needs keys in `chrome.storage.local` (browser storage)
- They can't share `.env.local` directly

## Verify It Worked

After reloading, check console for:
- `[Ed Config] Provider: openrouter`
- `[Ed Config] TTS: fish`
- `[Ed Config] Keys present: {fish: true, ...}`

If you see `fish: true`, Fish Audio is configured! 🎉


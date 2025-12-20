# Ed Extension Configuration Setup

## Setting Up Fish Audio with Edwina Voice

To enable Fish Audio with Edwina voice, you need to set the configuration in Chrome storage.

### Method 1: Via Browser Console

1. Open any website with the extension loaded
2. Open browser console (F12)
3. Run this command:

```javascript
chrome.storage.local.set({
  ed_config: {
    provider: 'openrouter', // or 'gemini'
    openRouterApiKey: 'your-openrouter-key', // if using OpenRouter
    geminiApiKey: 'your-gemini-key', // if using Gemini
    fishAudioApiKey: 'your-fish-audio-key', // REQUIRED for Fish Audio
    enableAI: true,
    enableTTS: true,
    ttsProvider: 'fish', // Use Fish Audio instead of browser TTS
    persona: 'edwina', // Use Edwina voice
    language: 'en-GB',
  }
}, () => {
  console.log('✅ Ed configuration saved! Reload the page to apply.');
});
```

### Method 2: Via Extension Popup (Future)

A UI will be added to the extension popup to configure these settings.

## Current Configuration

The extension will:
- Default to **Edwina voice** (`persona: 'edwina'`)
- Default to **Fish Audio TTS** (`ttsProvider: 'fish'`)
- Extract **page context** (URL, title, headings, visible text) and pass it to AI
- Only initialize providers that are selected (no warnings for unselected providers)

## Testing

After setting the configuration:
1. Reload the extension (`chrome://extensions/` → reload)
2. Visit a website
3. Open Ed and ask a question
4. Ed should:
   - Use Edwina voice (Fish Audio)
   - See the current page context
   - Provide contextual answers about what you're viewing


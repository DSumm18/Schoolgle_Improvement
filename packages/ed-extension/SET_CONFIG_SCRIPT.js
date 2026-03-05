// ============================================
// COPY AND PASTE THIS ENTIRE SCRIPT INTO BROWSER CONSOLE (F12)
// NOTE: This only works in the extension popup console, NOT the page console!
// To use: Right-click extension icon → Inspect popup → Paste in console
// ============================================

chrome.storage.local.set({
  ed_config: {
    provider: 'gemini', // Changed to 'gemini' for Gemini 3 Flash
    geminiApiKey: 'YOUR_GEMINI_API_KEY_HERE', // ⚠️ ADD YOUR GEMINI API KEY
    openRouterApiKey: 'YOUR_OPENROUTER_API_KEY_HERE',
    fishAudioApiKey: '979fa335474b48d8af6bbe56cc171ec6',
    enableAI: true,
    enableTTS: true,
    ttsProvider: 'fish',
    persona: 'edwina',
    language: 'en-GB',
    fishAudioVoiceIds: {
      ed: '400b2a2c4aa44afc87b6d14adf0dd13c',
      edwina: '72e3a3135204461ba041df787dc5c834',
      santa: '2e56aeff1a7a4cc9b904971cd5bd9794',
      elf: 'd66de7f0c2c9468b924120fdf1a4aae7',
    },
  },
  ed_dev_mode: true, // Enable dev mode to use localhost:3000
}, () => {
  console.log('✅ Ed configuration saved!');
  console.log('🔄 Reload the page to apply.');
  
  // Verify it was saved
  chrome.storage.local.get(['ed_config', 'ed_dev_mode'], (result) => {
    console.log('📋 Saved config:', {
      provider: result.ed_config?.provider,
      ttsProvider: result.ed_config?.ttsProvider,
      persona: result.ed_config?.persona,
      devMode: result.ed_dev_mode,
      hasKeys: {
        gemini: !!result.ed_config?.geminiApiKey,
        openrouter: !!result.ed_config?.openRouterApiKey,
        fish: !!result.ed_config?.fishAudioApiKey,
      },
      voiceIds: Object.keys(result.ed_config?.fishAudioVoiceIds || {}),
    });
  });
});














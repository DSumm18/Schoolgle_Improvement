// ============================================
// COPY AND PASTE THIS ENTIRE SCRIPT INTO BROWSER CONSOLE (F12)
// ============================================

chrome.storage.local.set({
  ed_config: {
    provider: 'openrouter',
    openRouterApiKey: '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',
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
  }
}, () => {
  console.log('✅ Ed configuration saved!');
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
      voiceIds: Object.keys(result.ed_config?.fishAudioVoiceIds || {}),
    });
  });
});

